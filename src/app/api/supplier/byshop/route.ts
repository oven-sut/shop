import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { badRequest, serverError } from '@/lib/api-response';
import { recordAudit } from '@/lib/audit';
import {
  BYSHOP_FIX_STATUS,
  BYSHOP_REPORT_REASONS,
  buyByshopProduct,
  fetchByshopHistory,
  isByshopConfigured,
  listByshopProducts,
  reportByshopIssue,
} from '@/lib/byshop';
import { enforceRateLimit } from '@/lib/rate-limit';
import { SupplierError } from '@/lib/supplier';

/**
 * BYShop — แคตาล็อก ประวัติ สั่งซื้อ และแจ้งปัญหา (แอดมินเท่านั้น)
 *
 * ต้นทางคิดเงินจากเครดิตของร้านเรา คีย์จึงอยู่ฝั่งเซิร์ฟเวอร์เท่านั้นและทุกเส้นเป็นแอดมิน
 * ที่นี่คือที่เดียวที่เบราว์เซอร์คุยกับ BYShop ได้ — ผ่านเรา ไม่มีคีย์ออกไปข้างนอก
 */

/** สั่งซื้อคือใช้เงินจริง จำกัดให้แน่นกว่าการอ่านเฉย ๆ */
const BUY_LIMIT = { name: 'byshop-buy', limit: 10, windowMs: 60_000 };
const READ_LIMIT = { name: 'byshop-read', limit: 60, windowMs: 60_000 };

export async function GET(request: NextRequest) {
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  const limited = enforceRateLimit(READ_LIMIT, user.id);
  if (limited) return limited;

  try {
    const params = request.nextUrl.searchParams;
    const wantHistory = params.get('history') === '1';

    // แคตาล็อกไม่ต้องใช้คีย์ จึงดูได้ก่อนตั้งค่าคีย์ — ส่วนประวัติต้องมีคีย์
    const [products, history] = await Promise.all([
      listByshopProducts(),
      wantHistory && isByshopConfigured()
        ? fetchByshopHistory({
            orderId: params.get('orderId') ?? undefined,
            customerUsername: params.get('customer') ?? undefined,
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        configured: isByshopConfigured(),
        products,
        history,
        reasons: BYSHOP_REPORT_REASONS,
        fixStatus: BYSHOP_FIX_STATUS,
      },
    });
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

/**
 * POST — `{ action: 'buy' | 'report', ... }`
 *
 * `buy` ใช้เงินเครดิตของร้านจริง และชื่อฟิลด์ของเส้นนั้นยังไม่ได้ยืนยันกับต้นทาง
 * (ดูหัวไฟล์ `lib/byshop.ts`) จึงตั้งใจให้เป็นการกดของแอดมินทีละรายการ ไม่ใช่อัตโนมัติ
 * และคืน body ดิบของ BYShop กลับไปให้เห็นทั้งก้อน
 */
export async function POST(request: NextRequest) {
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === 'buy') {
      const limited = enforceRateLimit(BUY_LIMIT, user.id);
      if (limited) return limited;

      const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
      if (!productId) return badRequest('ต้องระบุ productId ของ BYShop');

      const result = await buyByshopProduct({
        productId,
        customerUsername:
          typeof body.customerUsername === 'string' ? body.customerUsername.trim() : undefined,
      });

      // เงินออกจากเครดิตร้าน ต้องมีบรรทัดในบันทึกระบบทุกครั้ง
      await recordAudit({
        action: 'supplier.buy',
        actor: user,
        targetType: 'byshop_product',
        targetId: productId,
        summary: `สั่งซื้อสินค้า BYShop id ${productId}`,
        meta: { productId, response: result },
        request,
      });

      return NextResponse.json({ success: true, message: 'ส่งคำสั่งซื้อไปที่ BYShop แล้ว', data: result });
    }

    if (action === 'report') {
      const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
      const reportId = Number(body.reportId);

      if (!orderId) return badRequest('ต้องระบุ orderId ของ BYShop');
      if (!BYSHOP_REPORT_REASONS.some((reason) => reason.id === reportId)) {
        return badRequest('เหตุผลแจ้งปัญหาไม่ถูกต้อง');
      }

      const result = await reportByshopIssue({ orderId, reportId });

      await recordAudit({
        action: 'supplier.report',
        actor: user,
        targetType: 'byshop_order',
        targetId: orderId,
        summary: `แจ้งปัญหาออเดอร์ BYShop ${orderId} (เหตุผล ${reportId})`,
        meta: { orderId, reportId, response: result },
        request,
      });

      return NextResponse.json({ success: true, message: 'แจ้งปัญหาไปที่ BYShop แล้ว', data: result });
    }

    return badRequest("action ต้องเป็น 'buy' หรือ 'report'");
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
