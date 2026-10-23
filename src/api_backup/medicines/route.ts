import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MedicineSchema } from '@/lib/validation/medicine';
import { MedicationScheduleSchema, generateScheduleDedupHash } from '@/lib/validation/schedule';
import { logAuditEvent } from '@/lib/security/auth-guard';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश (Unauthorized)' }, { status: 401 });
    }

    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ medicines });
  } catch (err: any) {
    return NextResponse.json({ error: 'आंतरिक सर्वर त्रुटि' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश (Unauthorized)' }, { status: 401 });
    }

    const body = await req.json();

    // Validate medicine fields with Zod
    const medValidation = MedicineSchema.safeParse(body);
    if (!medValidation.success) {
      return NextResponse.json({ error: medValidation.error.errors[0].message }, { status: 400 });
    }

    const { name, prescribed_dose, route, instructions, is_prn, color_tag, shape_tag } = medValidation.data;

    // 1. Insert Medicine
    const { data: insertedMed, error: medError } = await supabase
      .from('medicines')
      .insert({
        patient_id: user.id,
        name,
        prescribed_dose,
        route,
        instructions,
        is_prn,
        color_tag,
        shape_tag,
      })
      .select()
      .single();

    if (medError || !insertedMed) {
      return NextResponse.json({ error: medError?.message || 'दवा जोड़ने में विफल' }, { status: 500 });
    }

    // 2. Insert schedule if provided (and not PRN)
    if (!is_prn && body.schedule_type) {
      const times = body.times_of_day || ['08:00'];
      const days = body.days_of_week || [0, 1, 2, 3, 4, 5, 6];
      const dedupHash = generateScheduleDedupHash(insertedMed.id, body.schedule_type, times, days);

      const schedValidation = MedicationScheduleSchema.safeParse({
        medicine_id: insertedMed.id,
        schedule_type: body.schedule_type,
        times_of_day: times,
        days_of_week: days,
        start_date: body.start_date || new Date().toISOString().split('T')[0],
        end_date: body.end_date || null,
      });

      if (schedValidation.success) {
        await supabase.from('medication_schedules').insert({
          medicine_id: insertedMed.id,
          patient_id: user.id,
          schedule_type: schedValidation.data.schedule_type,
          times_of_day: schedValidation.data.times_of_day,
          days_of_week: schedValidation.data.days_of_week,
          start_date: schedValidation.data.start_date,
          end_date: schedValidation.data.end_date,
          deduplication_hash: dedupHash,
        });
      }
    }

    // Log audit event
    await logAuditEvent({
      patientId: user.id,
      actorId: user.id,
      action: 'MEDICINE_CREATED',
      resourceType: 'medicines',
      resourceId: insertedMed.id,
      details: { name: insertedMed.name, dose: insertedMed.prescribed_dose },
    });

    return NextResponse.json({ success: true, medicine: insertedMed }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'आंतरिक सर्वर त्रुटि' }, { status: 500 });
  }
}
