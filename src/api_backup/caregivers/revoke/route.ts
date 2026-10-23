import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RevokeCaregiverSchema } from '@/lib/validation/caregiver';
import { logAuditEvent } from '@/lib/security/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const body = await req.json();
    const validation = RevokeCaregiverSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { relationship_id } = validation.data;

    // Immediately revoke access
    const { data: updated, error } = await supabase
      .from('caregiver_relationships')
      .update({
        invitation_status: 'revoked',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', relationship_id)
      .eq('patient_id', user.id) // Only patient can revoke
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: 'अनुमति समाप्त करने में विफल' }, { status: 500 });
    }

    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: 'CAREGIVER_ACCESS_REVOKED',
      resourceType: 'caregiver_relationships',
      resourceId: relationship_id,
    });

    return NextResponse.json({ success: true, message: 'देखभालकर्ता अनुमति तुरंत समाप्त कर दी गई।' });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
