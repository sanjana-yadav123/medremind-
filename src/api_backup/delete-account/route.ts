import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'अनधिकृत प्रवेश' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Delete patient profile (Foreign keys with ON DELETE CASCADE will clean medicines, schedules, etc.)
    await admin.from('profiles').delete().eq('id', user.id);

    // 2. Delete user auth record
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ success: true, message: 'खाता एवं संपूर्ण स्वास्थ्य डेटा हटा दिया गया।' });
  } catch (err: any) {
    return NextResponse.json({ error: 'खाता हटाने में समस्या आई' }, { status: 500 });
  }
}
