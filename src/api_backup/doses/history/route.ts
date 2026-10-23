import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const { data: events, error } = await supabase
      .from('dose_events')
      .select(`
        id,
        scheduled_for,
        status,
        confirmed_at,
        confirmation_source,
        notes,
        medicines (
          name,
          prescribed_dose
        )
      `)
      .eq('patient_id', user.id)
      .order('scheduled_for', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format events for client
    const formatted = (events || []).map((e: any) => ({
      id: e.id,
      medicine_name: e.medicines?.name ? `${e.medicines.name} (${e.medicines.prescribed_dose})` : 'दवा',
      scheduled_for: e.scheduled_for,
      status: e.status,
      confirmed_at: e.confirmed_at,
      confirmation_source: e.confirmation_source,
      notes: e.notes,
    }));

    return NextResponse.json({ events: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
