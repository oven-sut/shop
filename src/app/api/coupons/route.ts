import { NextResponse, type NextRequest } from 'next/server';
import { getCouponsStore, validateCouponStore } from '@/lib/apiStore';

export async function GET() {
  try {
    const coupons = getCouponsStore();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.code) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสคูปอง' },
        { status: 400 }
      );
    }

    const subtotal = Number(body.subtotal || 0);
    const result = validateCouponStore(body.code, subtotal);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.coupon
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
