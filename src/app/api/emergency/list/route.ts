import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const { data: contacts, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('patient_id', user.id)
      .order('is_primary', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: 'सर्वर त्रुटि' }, { status: 500 });
  }
}
