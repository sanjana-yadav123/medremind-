import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EmergencyContactSchema } from '@/lib/validation/emergency';
import { logAuditEvent } from '@/lib/security/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const body = await req.json();
    const validation = EmergencyContactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { contact_name, relationship, phone_number, is_primary } = validation.data;

    // If new contact is primary, reset previous primary flags
    if (is_primary) {
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('patient_id', user.id);
    }

    const { data: contact, error } = await supabase
      .from('emergency_contacts')
      .insert({
        patient_id: user.id,
        contact_name,
        relationship,
        phone_number,
        is_primary,
        consent_granted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: 'EMERGENCY_CONTACT_ADDED',
      resourceType: 'emergency_contacts',
      resourceId: contact.id,
      details: { contact_name, is_primary },
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
