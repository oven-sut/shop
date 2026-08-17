import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { badRequest, dbError, quoteFilterValue, serverError } from '@/lib/api-response';
import { fulfillOrder, recordFailure } from '@/lib/fulfillment';
import { toOrder } from '@/lib/mappers';
import { enforceRateLimit } from '@/lib/rate-limit';
import { SupplierError } from '@/lib/supplier';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/server';

/** Each accepted order can place a real supplier order, so cap the rate. */
const ORDER_LIMIT = { name: 'order-create', limit: 10, windowMs: 60_000 };

const MAX_SEARCH_LENGTH = 100;
const MAX_ITEMS = 50;

/**
 * `customer` lands in a jsonb column, so whatever is posted is what gets stored
 * and later rendered in the admin order list. Keep the known fields, cap their
 * length, and drop everything else — the browser has no business writing
 * arbitrary keys into the order record.
 */
const CUSTOMER_FIELDS = ['name', 'phone', 'email', 'address', 'note'] as const;

const trimmedString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 100);
  }
  return null;
};

function sanitiseCustomer(input: unknown): Record<string, string> | null {
  if (typeof input !== 'object' || input === null) return null;

  const source = input as Record<string, unknown>;
  const customer: Record<string, string> = {};

  for (const field of CUSTOMER_FIELDS) {
    const value = source[field];
    if (typeof value === 'string' && value.trim()) {
      customer[field] = value.trim().slice(0, 500);
    }
  }

  return customer.name ? customer : null;
}

export async function GET(request: NextRequest) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // RLS decides the rows: customers see their own orders, admins see every order.
    const supabase = await createRouteClient();
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (status && status !== 'ทั้งหมด') query = query.eq('status', status);
    if (search) {
      // Quoted so the term cannot close the filter and append its own.
      const term = quoteFilterValue(`%${search.slice(0, MAX_SEARCH_LENGTH)}%`);
      query = query.or(`id.ilike.${term},customer->>name.ilike.${term},customer->>phone.ilike.${term}`);
    }

    const { data, error } = await query.limit(500);

    if (error) return dbError(error);

    return NextResponse.json({ success: true, count: data.length, data: data.map(toOrder) });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * Places an order paid from the wallet.
 *
 * Everything that decides the price — unit prices, the coupon, the shipping rule,
 * the stock check and the debit — happens inside the `place_order` function in
 * one transaction. The browser only says which products and how many.
 */
export async function POST(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const limited = enforceRateLimit(ORDER_LIMIT, user.id);
  if (limited) return limited;

  try {
    const body = await request.json();
    const customer = sanitiseCustomer(body.customer);

    if (!customer || !Array.isArray(body.items) || body.items.length === 0) {
      return badRequest('ข้อมูลคำสั่งซื้อไม่สมบูรณ์ (ต้องมี customer และ items)');
    }

    if (body.items.length > MAX_ITEMS) {
      return badRequest(`สั่งซื้อได้ครั้งละไม่เกิน ${MAX_ITEMS} รายการ`);
    }

    // Quantities are clamped to a sane integer range here as well as in
    // place_order — a negative or fractional quantity must never reach the
    // pricing arithmetic.
    const items = body.items.map((item: Record<string, unknown>) => ({
      product_id: item.productId ?? item.product_id,
      quantity: Math.min(Math.max(Math.trunc(Number(item.quantity) || 0), 0), 100),
      selected_color: trimmedString(item.selectedColor, item.selected_color),
    }));

    const supabase = await createRouteClient();
    const { data, error } = await supabase.rpc('place_order', {
      p_customer: customer,
      p_items: items,
      p_coupon_code:
        typeof body.couponCode === 'string' ? body.couponCode.trim().slice(0, 64) : null,
    });

    if (error) {
      // describe() only ever echoes the function's own tagged exceptions, which
      // are written to be read by the shopper.
      return NextResponse.json(
        { success: false, error: 'order_failed', message: describe(error.message) },
        { status: 400 }
      );
    }

    const order = toOrder(data);

    // ── ส่งมอบสินค้าที่มาจากซัพพลายเออร์ ────────────────────────────────────
    const { data: sourced } = await supabase
      .from('products')
      .select('id, name, supplier, supplier_product_id, supplier_type, supplier_duration_days')
      .in('id', order.items.map((item) => item.productId))
      .not('supplier', 'is', null);

    const lines = (sourced ?? []).flatMap((product) => {
      const line = order.items.find((item) => item.productId === product.id);
      if (!line) return [];

      // สั่งซื้อทีละชิ้น: ซัพพลายเออร์ให้หนึ่งบัญชีต่อหนึ่งคำสั่งซื้อ
      return Array.from({ length: line.quantity }, () => ({
        productId: product.id as string,
        supplierProductId: product.supplier_product_id as string,
        supplierType: (product.supplier_type as string) || 'offline',
        name: (product.name as string) ?? line.name,
        // ราคาที่ลูกค้าจ่ายผูกกับช่วงเช่าที่บันทึกไว้ตอนนำเข้า จึงต้องสั่งด้วย
        // จำนวนวันเดียวกัน ไม่งั้นจะขายราคา 7 วันแต่สั่งของมาแค่ 1 วัน
        durationDays: (product.supplier_duration_days as number | null) ?? undefined,
      }));
    });

    if (lines.length === 0) {
      return NextResponse.json(
        { success: true, message: 'สร้างคำสั่งซื้อสำเร็จ', data: order },
        { status: 201 }
      );
    }

    const admin = createAdminClient();

    try {
      const accounts = await fulfillOrder(admin, { ...order, userId: user.id }, lines);

      return NextResponse.json(
        { success: true, message: 'สั่งซื้อสำเร็จ ระบบส่งมอบบัญชีให้แล้ว', data: order, accounts },
        { status: 201 }
      );
    } catch (fulfilmentError) {
      // จ่ายเงินไปแล้วแต่ของส่งไม่ได้ — คืนเงินและคืนสต็อกทันที ไม่ปล่อยค้าง
      const message = await recordFailure(admin, order, user.id, fulfilmentError);
      await admin.rpc('refund_order', {
        p_order_id: order.id,
        p_reason: `คืนเงินอัตโนมัติ: ส่งมอบไม่สำเร็จ (${message})`,
      });

      const status = fulfilmentError instanceof SupplierError ? fulfilmentError.status : 502;

      return NextResponse.json(
        {
          success: false,
          error: 'fulfillment_failed',
          message:
            fulfilmentError instanceof SupplierError
              ? `${fulfilmentError.message} — คืนเงินเข้ากระเป๋าเรียบร้อยแล้ว`
              : 'ส่งมอบสินค้าไม่สำเร็จ คืนเงินเข้ากระเป๋าเรียบร้อยแล้ว',
        },
        { status }
      );
    }
  } catch (error) {
    return serverError(error);
  }
}

/** Turns the function's machine-readable exceptions into something a shopper can act on. */
function describe(message: string): string {
  if (message.includes('insufficient_balance')) {
    const [, balance, total] = message.split(':');
    return `ยอดเงินในกระเป๋าไม่พอ (มี ฿${Number(balance).toLocaleString()} ต้องใช้ ฿${Number(total).toLocaleString()}) กรุณาเติมเงินก่อน`;
  }
  if (message.includes('out_of_stock')) {
    return `สินค้า "${message.split('out_of_stock:')[1]?.trim()}" มีไม่พอในสต็อก`;
  }
  if (message.includes('product_not_found')) return 'มีสินค้าในตะกร้าที่ถูกลบไปแล้ว กรุณาตรวจสอบตะกร้าอีกครั้ง';
  if (message.includes('store_closed')) return 'ขณะนี้ร้านปิดรับคำสั่งซื้อชั่วคราว';

  if (message.includes('app_sales_closed')) {
    // ตะกร้าค้างในเบราว์เซอร์ยังมีของที่เพิ่งถูกปิดขายได้ บอกให้รู้ว่าเป็นชิ้นไหน
    return `ตอนนี้ร้านปิดขาย "${message.split('app_sales_closed:')[1]?.trim()}" ชั่วคราว กรุณาเอาออกจากตะกร้าแล้วลองใหม่`;
  }
  if (message.includes('empty_cart')) return 'ตะกร้าว่าง';

  // Anything else is a Postgres error rather than one of the function's own
  // tagged exceptions, and quoting it would describe the schema to the caller.
  console.error('[place_order]', message);
  return 'สั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}
