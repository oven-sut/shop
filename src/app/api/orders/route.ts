import { NextResponse, type NextRequest } from 'next/server';
import { getOrdersStore, createOrderStore } from '@/lib/apiStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let orders = getOrdersStore();

    if (status && status !== 'ทั้งหมด') {
      orders = orders.filter((o) => o.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.phone.includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders
    });
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

    if (!body.customer || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลคำสั่งซื้อไม่สมบูรณ์ (ต้องมี customer และ items)' },
        { status: 400 }
      );
    }

    const newOrder = createOrderStore({
      customer: body.customer,
      items: body.items,
      subtotal: Number(body.subtotal || 0),
      discount: Number(body.discount || 0),
      shippingFee: Number(body.shippingFee || 0),
      totalAmount: Number(body.totalAmount || 0),
      status: 'รอดำเนินการ',
      paymentMethod: body.paymentMethod || 'promptpay',
      isPaid: body.paymentMethod === 'promptpay' || body.paymentMethod === 'credit_card',
      couponCode: body.couponCode
    });

    return NextResponse.json(
      { success: true, message: 'สร้างคำสั่งซื้อสำเร็จ', data: newOrder },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
