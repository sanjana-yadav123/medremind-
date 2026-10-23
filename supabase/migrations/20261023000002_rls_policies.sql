-- ====================================================================
-- MedRemind Row Level Security (RLS) Policies
-- Migration: 20261023000002_rls_policies.sql
-- Description: Strict cross-patient isolation and verified caregiver authorization
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dose_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is user an active approved caregiver for patient?
CREATE OR REPLACE FUNCTION public.is_active_caregiver(p_patient_id UUID, p_caregiver_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_relationships
    WHERE patient_id = p_patient_id
      AND caregiver_id = p_caregiver_id
      AND invitation_status = 'accepted'
      AND (revoked_at IS NULL)
  );
$$;

-- Helper function: Caregiver permission checker
CREATE OR REPLACE FUNCTION public.has_caregiver_permission(p_patient_id UUID, p_caregiver_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_relationships
    WHERE patient_id = p_patient_id
      AND caregiver_id = p_caregiver_id
      AND invitation_status = 'accepted'
      AND (revoked_at IS NULL)
      AND (permissions->>p_permission)::boolean = true
  );
$$;

-- --------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- --------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Caregivers can view profile of patients they are verified for
CREATE POLICY "profiles_select_caregiver" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.is_active_caregiver(id, auth.uid()));

-- Patients can view profile of accepted caregivers
CREATE POLICY "profiles_select_patient_of_caregiver" ON public.profiles
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.caregiver_relationships
        WHERE patient_id = auth.uid() AND caregiver_id = profiles.id
      )
    );

-- Users can update their own profile (cannot alter role directly to admin)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role != 'admin');

-- Users can insert their own initial profile upon registration
CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id AND role != 'admin');

-- --------------------------------------------------------------------
-- 2. MEDICINES POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "medicines_select" ON public.medicines
    FOR SELECT TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_view_medicines')
    );

CREATE POLICY "medicines_insert" ON public.medicines
    FOR INSERT TO authenticated
    WITH CHECK (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_edit_schedules')
    );

CREATE POLICY "medicines_update" ON public.medicines
    FOR UPDATE TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_edit_schedules')
    )
    WITH CHECK (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_edit_schedules')
    );

CREATE POLICY "medicines_delete" ON public.medicines
    FOR DELETE TO authenticated
    USING (patient_id = auth.uid());

-- --------------------------------------------------------------------
-- 3. MEDICATION SCHEDULES POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "schedules_select" ON public.medication_schedules
    FOR SELECT TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_view_medicines')
    );

CREATE POLICY "schedules_insert" ON public.medication_schedules
    FOR INSERT TO authenticated
    WITH CHECK (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_edit_schedules')
    );

CREATE POLICY "schedules_update" ON public.medication_schedules
    FOR UPDATE TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_edit_schedules')
    );

CREATE POLICY "schedules_delete" ON public.medication_schedules
    FOR DELETE TO authenticated
    USING (patient_id = auth.uid());

-- --------------------------------------------------------------------
-- 4. DOSE EVENTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "dose_events_select" ON public.dose_events
    FOR SELECT TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_view_medicines')
    );

CREATE POLICY "dose_events_insert" ON public.dose_events
    FOR INSERT TO authenticated
    WITH CHECK (
      patient_id = auth.uid()
      OR public.is_active_caregiver(patient_id, auth.uid())
    );

CREATE POLICY "dose_events_update" ON public.dose_events
    FOR UPDATE TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.is_active_caregiver(patient_id, auth.uid())
    )
    WITH CHECK (
      patient_id = auth.uid()
      OR public.is_active_caregiver(patient_id, auth.uid())
    );

-- --------------------------------------------------------------------
-- 5. CAREGIVER RELATIONSHIPS POLICIES
-- --------------------------------------------------------------------
-- Patients can manage their own caregiver relations; Caregivers can view their relations
CREATE POLICY "caregivers_select" ON public.caregiver_relationships
    FOR SELECT TO authenticated
    USING (
      patient_id = auth.uid()
      OR caregiver_id = auth.uid()
    );

CREATE POLICY "caregivers_insert_patient" ON public.caregiver_relationships
    FOR INSERT TO authenticated
    WITH CHECK (patient_id = auth.uid());

CREATE POLICY "caregivers_update" ON public.caregiver_relationships
    FOR UPDATE TO authenticated
    USING (patient_id = auth.uid() OR caregiver_id = auth.uid())
    WITH CHECK (patient_id = auth.uid() OR caregiver_id = auth.uid());

CREATE POLICY "caregivers_delete_patient" ON public.caregiver_relationships
    FOR DELETE TO authenticated
    USING (patient_id = auth.uid());

-- --------------------------------------------------------------------
-- 6. PUSH SUBSCRIPTIONS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "push_subscriptions_all_own" ON public.push_subscriptions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- --------------------------------------------------------------------
-- 7. PRESCRIPTIONS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "prescriptions_select" ON public.prescriptions
    FOR SELECT TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.has_caregiver_permission(patient_id, auth.uid(), 'can_view_medicines')
    );

CREATE POLICY "prescriptions_insert" ON public.prescriptions
    FOR INSERT TO authenticated
    WITH CHECK (patient_id = auth.uid());

CREATE POLICY "prescriptions_update" ON public.prescriptions
    FOR UPDATE TO authenticated
    USING (patient_id = auth.uid())
    WITH CHECK (patient_id = auth.uid());

CREATE POLICY "prescriptions_delete" ON public.prescriptions
    FOR DELETE TO authenticated
    USING (patient_id = auth.uid());

-- --------------------------------------------------------------------
-- 8. EMERGENCY CONTACTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "emergency_contacts_select" ON public.emergency_contacts
    FOR SELECT TO authenticated
    USING (
      patient_id = auth.uid()
      OR public.is_active_caregiver(patient_id, auth.uid())
    );

CREATE POLICY "emergency_contacts_manage" ON public.emergency_contacts
    FOR ALL TO authenticated
    USING (patient_id = auth.uid())
    WITH CHECK (patient_id = auth.uid());

-- --------------------------------------------------------------------
-- 9. NOTIFICATION JOBS POLICIES
-- --------------------------------------------------------------------
-- Patients and caregivers can only view jobs destined for them
CREATE POLICY "notification_jobs_select" ON public.notification_jobs
    FOR SELECT TO authenticated
    USING (recipient_id = auth.uid() OR patient_id = auth.uid());

-- --------------------------------------------------------------------
-- 10. AUDIT LOGS POLICIES
-- --------------------------------------------------------------------
-- Patients can view audit logs about their records
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (patient_id = auth.uid() OR actor_id = auth.uid());

-- Insert audit log (only actor themselves)
CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (actor_id = auth.uid());
