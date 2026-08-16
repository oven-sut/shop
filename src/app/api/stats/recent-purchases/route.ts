import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/stats/recent-purchases — แถบ "รายการสั่งซื้อล่าสุด" หน้าร้าน
 *
 * Shows what other people just bought, which is other customers' activity — so
 * only three things leave this endpoint per line: the product, a masked buyer
 * handle, and when. No order id, no amount, no email, nothing that ties two
 * lines to the same person beyond the first letters of a name they chose to show.
 *
 * Read with the service key because RLS scopes `orders` to the caller's own
 * rows, and the point of this bar is precisely everyone else's.
 */
const LIMIT = 12;

/** เอาไว้ตัดคำสั่งซื้อเก่าที่ทำให้แถบดูเหมือนร้านร้าง */
const MAX_AGE_DAYS = 30;

/**
 * `bas***` — เผยพอให้รู้ว่าเป็นคนละคน แต่ไม่พอให้รู้ว่าใคร
 *
 * ตัดที่ 3 ตัวแรกเสมอ ไม่อิงความยาวชื่อจริง เพราะจำนวนดาวที่ต่างกันก็บอกความยาวชื่อ
 */
function maskName(raw: unknown): string {
  const name = typeof raw === 'string' ? raw.trim() : '';
  if (!name) return 'ลูกค้า***';

  const head = [...name].slice(0, 3).join('');
  return `${head}***`;
}

export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString();

    const { data, error } = await admin
      .from('orders')
      .select('id, items, customer, created_at')
      .eq('is_paid', true)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    if (error) throw error;

    // หนึ่งคำสั่งซื้ออาจมีหลายรายการ — แถบนี้พูดถึง "ของที่เพิ่งถูกซื้อ" จึงกาง items ออก
    //
    // `id` เป็นเลขลำดับในคำตอบนี้เท่านั้น ไม่ใช่เลขคำสั่งซื้อจริง: มันมีไว้ให้ React ใช้
    // เป็น key เฉย ๆ และเลขคำสั่งซื้อของคนอื่นไม่ใช่ของที่หน้าร้านต้องรู้
    let sequence = 0;
    const purchases = (data ?? []).flatMap((order) => {
      const items = Array.isArray(order.items) ? (order.items as Record<string, unknown>[]) : [];
      const customer = (order.customer ?? {}) as Record<string, unknown>;
      const buyer = maskName(customer.name ?? customer.full_name);

      return items.map((item) => ({
        id: `p${(sequence += 1)}`,
        name: String(item.name ?? 'สินค้า'),
        image: typeof item.image === 'string' ? item.image : '',
        buyer,
        purchasedAt: order.created_at as string,
      }));
    });

    return NextResponse.json({
      success: true,
      count: purchases.length,
      data: purchases.slice(0, LIMIT),
    });
  } catch (error) {
    return serverError(error);
  }
}
