import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireApiUser } from '@/lib/api-auth';
import { recordAudit, diffFields } from '@/lib/audit';
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
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const patch = toSettingsRow(await request.json());

    if (!Object.keys(patch).length) {
      return badRequest('ไม่มีข้อมูลที่จะบันทึก');
    }

    const supabase = await createRouteClient();

    // อ่านค่าก่อนแก้ไว้เทียบ — บันทึกระบบจะได้บอกว่า "อะไรเปลี่ยนจากอะไรเป็นอะไร"
    // ไม่ใช่แค่ว่ามีคนกดบันทึก
    const { data: before } = await supabase.from('store_settings').select('*').maybeSingle();

    const { data, error } = await supabase
      .from('store_settings')
      .update(patch)
      .eq('id', true)
      .select('*')
      .single();

    if (error) return dbError(error);

    const changes = diffFields((before ?? {}) as Record<string, unknown>, patch);

    await recordAudit({
      action: 'settings.update',
      actor: user,
      targetType: 'store_settings',
      summary: `แก้ตั้งค่าร้าน: ${Object.keys(changes).join(', ') || 'ไม่มีค่าที่เปลี่ยน'}`,
      meta: { changes },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกการตั้งค่าร้านค้าแล้ว',
      data: toSettings(data),
    });
  } catch (error) {
    return serverError(error);
  }
}
