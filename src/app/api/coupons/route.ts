import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { toCoupon } from '@/lib/mappers';
import { createRouteClient } from '@/lib/supabase/server';

export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    // RLS hides deactivated coupons from customers and shows them to admins.
    const supabase = await createRouteClient();
    const { data, error } = await supabase.from('coupons').select('*').order('code');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data.map(toCoupon) });
  } catch (error) {
    return serverError(error);
  }
}

/** Checks a code against a cart subtotal. The real discount is recomputed at checkout. */
export async function POST(request: NextRequest) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.code) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกรหัสคูปอง' }, { status: 400 });
    }

    const code = String(body.code).trim().toUpperCase();
    const subtotal = Number(body.subtotal) || 0;

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

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
