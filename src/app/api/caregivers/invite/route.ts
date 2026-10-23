import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CaregiverInviteSchema } from '@/lib/validation/caregiver';
import { generateInvitationToken, hashInvitationToken, logAuditEvent } from '@/lib/security/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const body = await req.json();
    const validation = CaregiverInviteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { caregiver_name, caregiver_phone, permissions } = validation.data;

    // Generate high-entropy token and hash it
    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);

    // 48-hour expiration
    const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: relation, error } = await supabase
      .from('caregiver_relationships')
      .insert({
        patient_id: user.id,
        caregiver_name,
        caregiver_phone: caregiver_phone || null,
        invitation_token_hash: tokenHash,
        invitation_status: 'pending',
        permissions,
        token_expires_at: tokenExpiresAt,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${origin}/caregivers/accept?token=${rawToken}`;

    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: 'CAREGIVER_INVITE_GENERATED',
      resourceType: 'caregiver_relationships',
      resourceId: relation.id,
      details: { caregiver_name, expires_at: tokenExpiresAt },
    });

    return NextResponse.json({
      success: true,
      invitation_url: invitationUrl,
      expires_at: tokenExpiresAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
