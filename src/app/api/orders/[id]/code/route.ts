import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { requestSupplierCode, SupplierError } from '@/lib/supplier';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/server';

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

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    if (!fulfillment?.supplier_order_no) {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'ไม่พบบัญชีเกมของคำสั่งซื้อนี้' },
        { status: 404 }
      );
    }

    const result = await requestSupplierCode(
      fulfillment.supplier_order_no,
      typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : undefined
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
