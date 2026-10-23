-- ====================================================================
-- MedRemind Synthetic Demonstration & Test Fixtures
-- File: supabase/seed.sql
-- Description: CLEARLY MARKED SYNTHETIC TEST DATA ONLY
-- ====================================================================

-- 1. Demo Patient User ID
-- 00000000-0000-0000-0000-000000000001
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo.patient@medremind.synthetic',
    '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"रामेश्वर शर्मा (डेमो)","role":"patient"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Profile for Demo Patient
INSERT INTO public.profiles (id, role, display_name, phone_number, language_pref, high_contrast_mode, text_size, timezone, emergency_sharing_consent)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'patient',
    'रामेश्वर शर्मा (डेमो)',
    '+919876543210',
    'hi',
    false,
    'large',
    'Asia/Kolkata',
    true
) ON CONFLICT (id) DO NOTHING;

-- 2. Demo Caregiver User ID
-- 00000000-0000-0000-0000-000000000002
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'demo.caregiver@medremind.synthetic',
    '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"अमित शर्मा (पुत्र - देखभालकर्ता)","role":"caregiver"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, role, display_name, phone_number, language_pref, high_contrast_mode, text_size, timezone, emergency_sharing_consent)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'caregiver',
    'अमित शर्मा (पुत्र - देखभालकर्ता)',
    '+919876501234',
    'hi',
    false,
    'normal',
    'Asia/Kolkata',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3. Synthetic Medicines
INSERT INTO public.medicines (id, patient_id, name, prescribed_dose, route, instructions, is_prn, is_archived, color_tag, shape_tag)
VALUES
    ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', 'एम्लोडिपिन (Amlodipine)', '5mg', 'oral', 'सुबह नाश्ते के बाद 1 गोली (बीपी की दवा)', false, false, 'blue', 'round'),
    ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001', 'मेटफ़ॉर्मिन (Metformin)', '500mg', 'oral', 'रात को भोजन के तुरंत बाद 1 गोली (शुगर की दवा)', false, false, 'white', 'oval'),
    ('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000001', 'पैरासिटामोल (Paracetamol)', '650mg', 'oral', 'तेज बुखार या सिरदर्द होने पर केवल आवश्यकतानुसार (PRN)', true, false, 'green', 'round')
ON CONFLICT (id) DO NOTHING;

-- 4. Medication Schedules
INSERT INTO public.medication_schedules (id, medicine_id, patient_id, schedule_type, times_of_day, days_of_week, start_date, deduplication_hash)
VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', 'once_daily', ARRAY['08:00'], ARRAY[0,1,2,3,4,5,6], CURRENT_DATE, 'hash_amlodipine_0800'),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001', 'once_daily', ARRAY['20:30'], ARRAY[0,1,2,3,4,5,6], CURRENT_DATE, 'hash_metformin_2030')
ON CONFLICT (id) DO NOTHING;

-- 5. Emergency Contact
INSERT INTO public.emergency_contacts (id, patient_id, contact_name, relationship, phone_number, is_primary)
VALUES
    ('33333333-3333-3333-3333-333333333301', '00000000-0000-0000-0000-000000000001', 'अमित शर्मा (पुत्र)', 'बेटा (Son)', '+919876501234', true),
    ('33333333-3333-3333-3333-333333333302', '00000000-0000-0000-0000-000000000001', 'डॉ. राजेश वर्मा (पारिवारिक चिकित्सक)', 'डॉक्टर', '+919811122233', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Caregiver Relationship
INSERT INTO public.caregiver_relationships (id, patient_id, caregiver_id, caregiver_phone, caregiver_name, invitation_token_hash, invitation_status, permissions, token_expires_at, accepted_at)
VALUES
    ('44444444-4444-4444-4444-444444444401', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '+919876501234', 'अमित शर्मा', 'synthetic_hash_token_demo', 'accepted', '{"can_view_medicines": true, "can_edit_schedules": true, "can_receive_missed_dose_alerts": true}', now() + interval '30 days', now())
ON CONFLICT (id) DO NOTHING;
