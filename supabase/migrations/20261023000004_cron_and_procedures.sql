-- ====================================================================
-- MedRemind Helper Procedures, Triggers & Concurrency Controls
-- Migration: 20261023000004_cron_and_procedures.sql
-- Description: Concurrency-safe notification claiming, audit triggers
-- ====================================================================

-- 1. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all core tables
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_medicines_updated_at ON public.medicines;
CREATE TRIGGER trg_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_schedules_updated_at ON public.medication_schedules;
CREATE TRIGGER trg_schedules_updated_at BEFORE UPDATE ON public.medication_schedules FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_dose_events_updated_at ON public.dose_events;
CREATE TRIGGER trg_dose_events_updated_at BEFORE UPDATE ON public.dose_events FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_caregivers_updated_at ON public.caregiver_relationships;
CREATE TRIGGER trg_caregivers_updated_at BEFORE UPDATE ON public.caregiver_relationships FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_push_subs_updated_at ON public.push_subscriptions;
CREATE TRIGGER trg_push_subs_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_notif_jobs_updated_at ON public.notification_jobs;
CREATE TRIGGER trg_notif_jobs_updated_at BEFORE UPDATE ON public.notification_jobs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Concurrency-safe notification claiming using FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.claim_due_notification_jobs(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id UUID,
    dose_event_id TEXT,
    patient_id UUID,
    recipient_id UUID,
    title TEXT,
    body TEXT,
    scheduled_for TIMESTAMPTZ,
    attempts INTEGER,
    deduplication_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH due_jobs AS (
        SELECT nj.id
        FROM public.notification_jobs nj
        WHERE nj.status = 'pending'
          AND nj.scheduled_for <= timezone('utc', now())
          AND nj.attempts < nj.max_attempts
        ORDER BY nj.scheduled_for ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.notification_jobs nj
    SET status = 'processing',
        attempts = nj.attempts + 1,
        last_attempt_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    FROM due_jobs
    WHERE nj.id = due_jobs.id
    RETURNING nj.id, nj.dose_event_id, nj.patient_id, nj.recipient_id, nj.title, nj.body, nj.scheduled_for, nj.attempts, nj.deduplication_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Procedure to expire past-due caregiver invitations
CREATE OR REPLACE FUNCTION public.expire_stale_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.caregiver_relationships
    SET invitation_status = 'revoked',
        revoked_at = timezone('utc', now())
    WHERE invitation_status = 'pending'
      AND token_expires_at <= timezone('utc', now());
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
