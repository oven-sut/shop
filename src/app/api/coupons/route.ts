import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireApiUser } from '@/lib/api-auth';
import { badRequest, dbError, serverError } from '@/lib/api-response';
import { toCoupon } from '@/lib/mappers';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * Guessing a discount code is cheap when you can try continuously, so cap the
 * attempts. Legitimate use is a handful of tries at checkout.
 */
const REDEEM_LIMIT = { name: 'coupon-redeem', limit: 20, windowMs: 60_000 };

/**
 * The full list is admin-only.
 *
 * The RLS policy lets any signed-in account read every active coupon, which is
 * correct for the admin dashboard — the only place the list is rendered — but
 * over the API it handed each customer the complete set of live discount codes.
 * Customers do not need to browse codes; POST below still validates one they
 * were given.
 */
export async function GET() {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('coupons').select('*').order('code');

    if (error) return dbError(error);

    return NextResponse.json({ success: true, data: data.map(toCoupon) });
  } catch (error) {
    return serverError(error);
  }
}

/** Checks a code against a cart subtotal. The real discount is recomputed at checkout. */
export async function POST(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const limited = enforceRateLimit(REDEEM_LIMIT, user.id);
  if (limited) return limited;

  try {
    const body = await request.json();

    if (!body.code) {
      return badRequest('กรุณากรอกรหัสคูปอง');
    }

    // Bounded before it reaches the query — a megabyte-long "code" is not one.
    const code = String(body.code).trim().slice(0, 64).toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return dbError(error);

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'รหัสส่วนลดไม่ถูกต้องหรือหมดอายุ' },
        { status: 400 }
      );
    }

    const coupon = toCoupon(data);

    if (subtotal < coupon.minSpend) {
      return NextResponse.json(
        {
          success: false,
          message: `รหัสนี้ใช้ได้เมื่อยอดขั้นต่ำ ฿${coupon.minSpend.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ใช้รหัสส่วนลดสำเร็จ!',
      data: coupon,
    });
  } catch (error) {
    return serverError(error);
  }
}
