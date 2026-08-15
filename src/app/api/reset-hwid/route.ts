import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { badRequest, serverError } from '@/lib/api-response';
import { createRouteClient } from '@/lib/supabase/server';

const MAX_KEY_LENGTH = 200;

/** Turns reset_hwid()'s tagged exceptions into something a shopper can act on. */
function describe(message: string): string {
  if (message.includes('insufficient_balance')) {
    const [, balance, fee] = message.split(':');
    return `ยอดเงินในกระเป๋าไม่พอ (มี ฿${Number(balance).toLocaleString()} ต้องใช้ ฿${Number(fee).toLocaleString()}) กรุณาเติมเงินก่อน`;
  }
  if (message.includes('license_not_found')) {
    return 'ไม่พบ License Key นี้ในบัญชีของคุณ กรุณาตรวจสอบอีกครั้ง';
  }
  if (message.includes('invalid_license_key')) return 'กรุณากรอก License Key';

  console.error('[reset_hwid]', message);
  return 'รีเซ็ต HWID ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}

/**
 * รีเซ็ต HWID ด้วย License Key (username ของบัญชีที่ซื้อ) — หักเงิน 50 บาทต่อครั้ง
 * ผ่าน reset_hwid() ซึ่งทำทั้งตรวจสิทธิ์ หักเงิน และบันทึกการรีเซ็ตในทรานแซกชันเดียว
 */
export async function POST(request: NextRequest) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => ({}));
    const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';

    if (!licenseKey) return badRequest('กรุณากรอก License Key');
    if (licenseKey.length > MAX_KEY_LENGTH) return badRequest('License Key ยาวเกินไป');

    const supabase = await createRouteClient();
    const { data, error } = await supabase.rpc('reset_hwid', { p_license_key: licenseKey });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'reset_failed', message: describe(error.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `รีเซ็ต HWID เรียบร้อยแล้ว (หักจากกระเป๋าเงิน ฿50)`,
      data,
    });
  } catch (error) {
    return serverError(error);
  }
}
