import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/security/auth-guard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const { data: medicine, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('id', id)
      .eq('patient_id', user.id)
      .single();

    if (error || !medicine) {
      return NextResponse.json({ error: 'दवा नहीं मिली' }, { status: 404 });
    }

    return NextResponse.json({ medicine });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const body = await req.json();

    const { data: updated, error } = await supabase
      .from('medicines')
      .update({
        name: body.name,
        prescribed_dose: body.prescribed_dose,
        route: body.route,
        instructions: body.instructions,
        is_archived: body.is_archived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('patient_id', user.id)
      .select()
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: error?.message || 'अपडेट विफल' }, { status: 500 });
    }

    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: 'MEDICINE_UPDATED',
      resourceType: 'medicines',
      resourceId: id,
      details: { name: updated.name, is_archived: updated.is_archived },
    });

    return NextResponse.json({ success: true, medicine: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
