import { NextResponse, type NextRequest } from 'next/server';
import { getOrderByIdStore, updateOrderStatusStore } from '@/lib/apiStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = getOrderByIdStore(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: `ไม่พบคำสั่งซื้อ ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ status' },
        { status: 400 }
      );
    }

    const updated = updateOrderStatusStore(id, body.status, body.trackingNumber);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `ไม่พบคำสั่งซื้อ ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะคำสั่งซื้อ #${id} เป็น ${body.status} แล้ว`,
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
