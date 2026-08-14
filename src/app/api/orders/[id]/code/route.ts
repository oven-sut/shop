import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { dbError, serverError } from '@/lib/api-response';
import { enforceRateLimit } from '@/lib/rate-limit';
import { requestSupplierCode, SupplierError } from '@/lib/supplier';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * The supplier allows three code rounds per order and each one calls out to
 * them. Capping the requests here keeps a stuck client from spending those
 * rounds — and the shop's API quota — in a retry loop.
 */
const CODE_LIMIT = { name: 'guard-code', limit: 10, windowMs: 60_000 };

/**
 * ขอรหัส Steam Guard ของบัญชีที่ซื้อไป
 *
 * ซัพพลายเออร์ให้ขอได้ 3 รอบต่อคำสั่งซื้อ แต่ละรอบเปิดหน้าต่าง 60 วินาที
 * ภายในหน้าต่างเดิมขอรหัสซ้ำได้โดยไม่นับรอบใหม่ (ไม่ต้องส่ง reason)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const limited = enforceRateLimit(CODE_LIMIT, user.id);
  if (limited) return limited;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // อ่านผ่าน session ของผู้ใช้ RLS จึงกันไม่ให้เห็นคำสั่งซื้อของคนอื่น
    const supabase = await createRouteClient();
    const { data: fulfillment, error } = await supabase
      .from('order_fulfillments')
      .select('id, supplier_order_no, code_requests_max, status')
      .eq('order_id', id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) return dbError(error);

    if (!fulfillment?.supplier_order_no) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'ไม่พบบัญชีเกมของคำสั่งซื้อนี้' },
        { status: 404 }
      );
    }

    const result = await requestSupplierCode(
      fulfillment.supplier_order_no,
      typeof body.reason === 'string' && body.reason.trim()
        ? body.reason.trim().slice(0, 200)
        : undefined
    );

    // จำนวนครั้งที่ใช้ไปมาจากซัพพลายเออร์ เก็บไว้เพื่อแสดงผลเท่านั้น
    const admin = createAdminClient();
    await admin
      .from('order_fulfillments')
      .update({
        code_requests_used: result.codeRequests.used,
        code_requests_max: result.codeRequests.max,
      })
      .eq('id', fulfillment.id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof SupplierError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return serverError(error);
  }
}
