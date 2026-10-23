-- ====================================================================
-- MedRemind Private Storage Bucket Setup
-- Migration: 20261023000003_storage_buckets.sql
-- Description: Private 'prescriptions' storage bucket with strict RLS
-- ====================================================================

-- Create private bucket for prescription scans/PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'prescriptions',
    'prescriptions',
    false, -- STRICTLY PRIVATE
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS: SELECT (download/view signed url)
-- File path convention: {patient_id}/{random_uuid}.{ext}
CREATE POLICY "prescriptions_storage_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'prescriptions'
        AND (
            -- User owns the directory folder
            (storage.foldername(name))[1] = auth.uid()::text
            -- Or user is an authorized caregiver
            OR public.has_caregiver_permission((storage.foldername(name))[1]::uuid, auth.uid(), 'can_view_medicines')
        )
    );

-- Storage RLS: INSERT (upload)
CREATE POLICY "prescriptions_storage_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'prescriptions'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage RLS: DELETE
CREATE POLICY "prescriptions_storage_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'prescriptions'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
