import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { dbError, serverError } from '@/lib/api-response';
import { createRouteClient } from '@/lib/supabase/server';

type Row = Record<string, unknown>;

const str = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;

/**
 * สิ่งที่ลูกค้าซื้อไปแล้ว — RLS จำกัดให้เห็นเฉพาะของตัวเอง
 *
 * `order_fulfillments` มีแถวเฉพาะสินค้าที่สั่งต่อจากซัพพลายเออร์เท่านั้น
 * ถ้าอ่านจากตารางนั้นตารางเดียว คำสั่งซื้อสินค้าที่ร้านลงเองจะไม่โผล่ที่หน้านี้เลย
 * ทั้งที่จ่ายเงินสำเร็จแล้ว จึงไล่จากรายการคำสั่งซื้อเป็นหลัก แล้วแนบบัญชีเกม
 * เข้าไปเฉพาะรายการที่มี
 */
export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createRouteClient();

    const [fulfilments, orders] = await Promise.all([
      supabase
        .from('order_fulfillments')
        .select(
          'id, order_id, supplier, game_title, account_username, account_password, code_requests_used, code_requests_max, status, error_message, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('orders')
        .select('id, items, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    const error = fulfilments.error ?? orders.error;
    if (error) return dbError(error);

    const byOrder = new Map<string, Row[]>();
    for (const row of (fulfilments.data ?? []) as Row[]) {
      const key = str(row.order_id);
      const bucket = byOrder.get(key);
      if (bucket) bucket.push(row);
      else byOrder.set(key, [row]);
    }

    const toAccount = (row: Row) => ({
      id: str(row.id),
      orderId: str(row.order_id),
      gameTitle: str(row.game_title),
      username: str(row.account_username),
      password: str(row.account_password),
      codeRequests: {
        used: typeof row.code_requests_used === 'number' ? row.code_requests_used : 0,
        max: typeof row.code_requests_max === 'number' ? row.code_requests_max : 3,
      },
      // Codes the shop stocked itself have no supplier behind them, so there is
      // no Steam Guard round to ask for — the client needs to know which card
      // to draw.
      source: str(row.supplier) === 'manual' ? ('manual' as const) : ('supplier' as const),
      status: str(row.status, 'delivered'),
      errorMessage: str(row.error_message) || undefined,
      createdAt: str(row.created_at),
    });

    const data = ((orders.data ?? []) as Row[]).flatMap((order) => {
      const id = str(order.id);
      const attached = byOrder.get(id);
      byOrder.delete(id);

      if (attached?.length) return attached.map(toAccount);

      // ไม่มีบัญชีเกมผูกไว้ — เป็นสินค้าที่ไม่ได้สั่งต่อจากซัพพลายเออร์
      const items = Array.isArray(order.items) ? (order.items as Row[]) : [];
      return [
        {
          id: `order-${id}`,
          orderId: id,
          gameTitle: items.map((item) => str(item.name)).filter(Boolean).join(', '),
          username: '',
          password: '',
          codeRequests: { used: 0, max: 0 },
          source: 'supplier' as const,
          status: 'no_account' as const,
          errorMessage: undefined,
          createdAt: str(order.created_at),
        },
      ];
    });

    // แถวที่คำสั่งซื้อหลุดออกจากช่วง 100 รายการล่าสุด ยังต้องแสดงอยู่ดี
    for (const rows of byOrder.values()) data.push(...rows.map(toAccount));

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error) {
    return serverError(error);
  }
}
