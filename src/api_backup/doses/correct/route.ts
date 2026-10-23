import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DoseCorrectionSchema } from '@/lib/validation/dose';
import { logAuditEvent } from '@/lib/security/auth-guard';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const body = await req.json();
    const validation = DoseCorrectionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { dose_event_id, corrected_status, correction_reason } = validation.data;

    // Fetch existing event
    const { data: existing, error: fetchErr } = await supabase
      .from('dose_events')
      .select('*')
      .eq('id', dose_event_id)
      .eq('patient_id', user.id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'खुराक रिकॉर्ड नहीं मिला' }, { status: 404 });
    }

    // Apply correction
    const { data: updated, error: updateErr } = await supabase
      .from('dose_events')
      .update({
        status: corrected_status,
        notes: `सुधार: ${correction_reason} (पहले: ${existing.status})`,
        confirmed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dose_event_id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Record audit event with prior status and reason
    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: 'DOSE_CORRECTION_APPLIED',
      resourceType: 'dose_events',
      resourceId: dose_event_id,
      details: {
        previous_status: existing.status,
        new_status: corrected_status,
        reason: correction_reason,
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
