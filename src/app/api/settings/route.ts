import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireApiUser } from '@/lib/api-auth';
import { badRequest, dbError, serverError } from '@/lib/api-response';
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
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const patch = toSettingsRow(await request.json());

    if (!Object.keys(patch).length) {
      return badRequest('ไม่มีข้อมูลที่จะบันทึก');
    }

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('store_settings')
      .update(patch)
      .eq('id', true)
      .select('*')
      .single();

    if (error) return dbError(error);

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าร้านค้าแล้ว',
      data: toSettings(data),
    });
  } catch (error) {
    return serverError(error);
  }
}
