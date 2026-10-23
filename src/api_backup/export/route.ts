import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/security/auth-guard';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    // 1. Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    // 2. Medicines
    const { data: medicines } = await supabase.from('medicines').select('*').eq('patient_id', user.id);

    // 3. Schedules
    const { data: schedules } = await supabase.from('medication_schedules').select('*').eq('patient_id', user.id);

    // 4. Dose Events
    const { data: doseEvents } = await supabase.from('dose_events').select('*').eq('patient_id', user.id).order('scheduled_for', { ascending: false });

    // 5. Emergency Contacts
    const { data: emergencyContacts } = await supabase.from('emergency_contacts').select('*').eq('patient_id', user.id);

    // 6. Caregivers
    const { data: caregivers } = await supabase.from('caregiver_relationships').select('*').eq('patient_id', user.id);

    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: 'DATA_EXPORT_DOWNLOADED',
      resourceType: 'profiles',
      resourceId: user.id,
    });

    const exportBundle = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      patient_id: user.id,
      profile,
      medicines: medicines || [],
      schedules: schedules || [],
      dose_history: doseEvents || [],
      emergency_contacts: emergencyContacts || [],
      caregivers: caregivers || [],
      legal_notice: 'Generated under Indian Digital Personal Data Protection (DPDP) Act 2023 for individual data portability.',
    };

    return NextResponse.json(exportBundle);
  } catch (err: any) {
    return NextResponse.json({ error: 'डेटा निर्यात करने में त्रुटि' }, { status: 500 });
  }
}
