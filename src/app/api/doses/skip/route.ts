import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DoseActionSchema } from '@/lib/validation/dose';
import { logAuditEvent } from '@/lib/security/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const body = await req.json();
    const validation = DoseActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { dose_event_id, action } = validation.data;
    const targetStatus = action === 'miss' ? 'missed' : 'skipped';

    const { data: event, error } = await supabase
      .from('dose_events')
      .upsert(
        {
          id: dose_event_id,
          patient_id: user.id,
          medicine_id: body.medicine_id || '00000000-0000-0000-0000-000000000001',
          scheduled_for: body.scheduled_for || new Date().toISOString(),
          status: targetStatus,
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id,
          confirmation_source: 'patient',
          notes: body.notes || 'दवा छूट गई दर्ज की गई',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: `DOSE_MARKED_${targetStatus.toUpperCase()}`,
      resourceType: 'dose_events',
      resourceId: dose_event_id,
    });

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
