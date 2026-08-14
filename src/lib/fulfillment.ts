import { SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types/ecommerce';
import { createSupplierOrder, SupplierError } from './supplier';

export interface FulfilledAccount {
  productName: string;
  gameTitle: string;
  username: string;
  password: string;
  supplierOrderNo: string;
  codeRequests: { used: number; max: number };
}

/**
 * ส่งมอบสินค้าที่มาจากซัพพลายเออร์ หลังจากตัดเงินในกระเป๋าสำเร็จแล้ว
 *
 * ตัดเงิน (ฐานข้อมูล) กับสั่งซื้อ (HTTP) อยู่คนละระบบ จึงรวมเป็นทรานแซกชันเดียวไม่ได้
 * ถ้าขั้นสั่งซื้อล้ม ผู้เรียกต้องคืนเงินด้วย `refund_order` — ดู POST /api/orders
 *
 * `ref` ผูกกับหมายเลขคำสั่งซื้อของเราและลำดับรายการ ทำให้ยิงซ้ำแล้วซัพพลายเออร์
 * ตัดซ้ำให้เอง ไม่เกิดการซื้อซ้ำซ้อน
 */
export async function fulfillOrder(
  admin: SupabaseClient,
  order: Order & { userId: string },
  lines: {
    productId: string;
    supplierProductId: string;
    supplierType: string;
    name: string;
    /** เฉพาะสินค้าเช่า: จำนวนวันที่ราคาขายอ้างถึง */
    durationDays?: number;
  }[]
): Promise<FulfilledAccount[]> {
  const delivered: FulfilledAccount[] = [];

  for (const [index, line] of lines.entries()) {
    const ref = `${order.id}-${index + 1}`;

    const supplierOrder = await createSupplierOrder({
      productId: line.supplierProductId,
      type: line.supplierType,
      ref,
      // สินค้าเช่าต้องมีทั้งจำนวนวันและเวลาเริ่ม (start_at จัดรูปแบบใน createSupplierOrder)
      durationDays: line.durationDays,
    });

    await admin.from('order_fulfillments').upsert(
      {
        order_id: order.id,
        user_id: order.userId,
        supplier: '499k',
        supplier_ref: ref,
        supplier_order_no: supplierOrder.orderNo,
        game_title: supplierOrder.gameTitle || line.name,
        account_username: supplierOrder.account?.username ?? null,
        account_password: supplierOrder.account?.password ?? null,
        code_requests_used: supplierOrder.codeRequests.used,
        code_requests_max: supplierOrder.codeRequests.max,
        status: 'delivered',
        raw: supplierOrder.raw,
      },
      { onConflict: 'supplier_ref' }
    );

    delivered.push({
      productName: line.name,
      gameTitle: supplierOrder.gameTitle || line.name,
      username: supplierOrder.account?.username ?? '',
      password: supplierOrder.account?.password ?? '',
      supplierOrderNo: supplierOrder.orderNo,
      codeRequests: supplierOrder.codeRequests,
    });
  }

  return delivered;
}

/** บันทึกไว้ว่าทำไมส่งมอบไม่สำเร็จ เพื่อให้แอดมินตามได้ว่าเกิดอะไรขึ้น */
export async function recordFailure(
  admin: SupabaseClient,
  order: Order,
  userId: string,
  error: unknown
) {
  const message =
    error instanceof SupplierError
      ? `${error.code}: ${error.message}`
      : error instanceof Error
        ? error.message
        : 'unknown error';

  await admin.from('order_fulfillments').upsert(
    {
      order_id: order.id,
      user_id: userId,
      supplier: '499k',
      supplier_ref: `${order.id}-failed`,
      status: 'failed',
      error_message: message,
    },
    { onConflict: 'supplier_ref' }
  );

  return message;
}
