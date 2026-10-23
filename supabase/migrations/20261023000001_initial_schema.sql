-- ====================================================================
-- MedRemind Initial Database Schema
-- Migration: 20261023000001_initial_schema.sql
-- Description: Core tables, foreign keys, constraints, and audit trails
-- ====================================================================

-- 1. PROFILES TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'caregiver', 'admin')) DEFAULT 'patient',
    display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) >= 2),
    phone_number TEXT,
    language_pref TEXT NOT NULL CHECK (language_pref IN ('hi', 'en')) DEFAULT 'hi',
    high_contrast_mode BOOLEAN NOT NULL DEFAULT FALSE,
    text_size TEXT NOT NULL CHECK (text_size IN ('normal', 'large', 'extra-large')) DEFAULT 'large',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    emergency_sharing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index on role for quick lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. MEDICINES TABLE
CREATE TABLE IF NOT EXISTS public.medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 1),
    prescribed_dose TEXT NOT NULL,
    route TEXT NOT NULL DEFAULT 'oral' CHECK (route IN ('oral', 'injection', 'inhalation', 'topical', 'drops', 'other')),
    instructions TEXT NOT NULL, -- Stored exactly as written on prescription
    is_prn BOOLEAN NOT NULL DEFAULT FALSE, -- As-needed medicine flag
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    color_tag TEXT DEFAULT 'green',
    shape_tag TEXT DEFAULT 'round',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_medicines_patient_active ON public.medicines(patient_id, is_archived);

-- 3. MEDICATION SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('once_daily', 'multiple_daily', 'weekday_selected', 'interval_days', 'as_needed')),
    times_of_day TEXT[] NOT NULL DEFAULT '{}', -- E.g. ARRAY['08:00', '20:00'] in patient timezone
    days_of_week INTEGER[] NOT NULL DEFAULT '{}', -- E.g. ARRAY[1, 3, 5] for Mon, Wed, Fri
    interval_days INTEGER CHECK (interval_days IS NULL OR interval_days > 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE CHECK (end_date IS NULL OR end_date >= start_date),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deduplication_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_patient_schedule_hash UNIQUE (patient_id, deduplication_hash)
);

CREATE INDEX IF NOT EXISTS idx_schedules_patient_active ON public.medication_schedules(patient_id, is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_medicine ON public.medication_schedules(medicine_id);

-- 4. DOSE EVENTS TABLE (Deterministic event tracking)
CREATE TABLE IF NOT EXISTS public.dose_events (
    id TEXT PRIMARY KEY, -- Deterministic ID: dose_{patient_id}_{schedule_id}_{occurrence_timestamp_epoch}
    schedule_id UUID REFERENCES public.medication_schedules(id) ON DELETE SET NULL,
    medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'taken', 'skipped', 'missed', 'pending_confirmation')) DEFAULT 'scheduled',
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    confirmation_source TEXT CHECK (confirmation_source IN ('patient', 'caregiver', 'offline_sync', 'system')),
    notes TEXT,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_dose_events_patient_schedule ON public.dose_events(patient_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_dose_events_status ON public.dose_events(status);

-- 5. CAREGIVER RELATIONSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.caregiver_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    caregiver_phone TEXT,
    caregiver_name TEXT NOT NULL,
    invitation_token_hash TEXT NOT NULL UNIQUE,
    invitation_status TEXT NOT NULL CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'revoked')) DEFAULT 'pending',
    permissions JSONB NOT NULL DEFAULT '{"can_view_medicines": true, "can_edit_schedules": false, "can_receive_missed_dose_alerts": true}'::jsonb,
    token_expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_caregivers_patient ON public.caregiver_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_caregiver ON public.caregiver_relationships(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_token ON public.caregiver_relationships(invitation_token_hash);

-- 6. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failure_count INTEGER NOT NULL DEFAULT 0,
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_push_user_active ON public.push_subscriptions(user_id, is_active);

-- 7. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
    ocr_status TEXT NOT NULL CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    raw_ocr_text TEXT,
    extracted_medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_verified_by_user BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);

-- 8. EMERGENCY CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL CHECK (char_length(trim(contact_name)) >= 2),
    relationship TEXT NOT NULL,
    phone_number TEXT NOT NULL CHECK (phone_number ~ '^\+?[0-9]{10,14}$'),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    consent_granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_emergency_patient ON public.emergency_contacts(patient_id);

-- 9. NOTIFICATION JOBS TABLE (Concurrency-safe queue)
CREATE TABLE IF NOT EXISTS public.notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dose_event_id TEXT REFERENCES public.dose_events(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'delivered', 'failed', 'cancelled')) DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    error_log TEXT,
    deduplication_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notif_jobs_due ON public.notification_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notif_jobs_patient ON public.notification_jobs(patient_id);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address_redacted TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_patient ON public.audit_logs(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id, created_at DESC);
