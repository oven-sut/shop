import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { loadSettings, toSettings, toSettingsRow } from '@/lib/settings';
import { createRouteClient } from '@/lib/supabase/server';

export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createRouteClient();
    return NextResponse.json({ success: true, data: await loadSettings(supabase) });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  if (user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'forbidden', message: 'เฉพาะผู้ดูแลระบบเท่านั้น' },
      { status: 403 }
    );
  }

  try {
    const patch = toSettingsRow(await request.json());

    if (!Object.keys(patch).length) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีข้อมูลที่จะบันทึก' },
        { status: 400 }
      );
    }

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('store_settings')
      .update(patch)
      .eq('id', true)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าร้านค้าแล้ว',
      data: toSettings(data),
    });
  } catch (error) {
    return serverError(error);
  }
}
