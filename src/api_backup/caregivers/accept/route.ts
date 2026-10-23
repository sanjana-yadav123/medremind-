import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AcceptCaregiverInviteSchema } from '@/lib/validation/caregiver';
import { hashInvitationToken, logAuditEvent } from '@/lib/security/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'स्वीकार करने के लिए कृपया पहले लॉग इन करें' }, { status: 401 });
    }

    const body = await req.json();
    const validation = AcceptCaregiverInviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const tokenHash = hashInvitationToken(validation.data.token);

    // Look up pending valid invitation
    const { data: relation, error: findError } = await supabase
      .from('caregiver_relationships')
      .select('*')
      .eq('invitation_token_hash', tokenHash)
      .eq('invitation_status', 'pending')
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (findError || !relation) {
      return NextResponse.json({ error: 'यह आमंत्रण लिंक अमान्य है या समाप्त (Expired) हो चुका है।' }, { status: 400 });
    }

    // Prevent patient from accepting their own invitation
    if (relation.patient_id === user.id) {
      return NextResponse.json({ error: 'मरीज़ स्वयं का देखभालकर्ता नहीं बन सकता।' }, { status: 400 });
    }

    // Update relationship to accepted
    const { data: updated, error: updateError } = await supabase
      .from('caregiver_relationships')
      .update({
        caregiver_id: user.id,
        invitation_status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', relation.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await logAuditEvent({
      patientId: relation.patient_id,
      actorId: user.id,
      action: 'CAREGIVER_INVITE_ACCEPTED',
      resourceType: 'caregiver_relationships',
      resourceId: relation.id,
    });

    return NextResponse.json({ success: true, message: 'देखभालकर्ता संबंध सफलतापूर्वक स्थापित हो गया।' });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
