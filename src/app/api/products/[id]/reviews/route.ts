import { NextResponse, type NextRequest } from 'next/server';
import { addReviewStore } from '@/lib/apiStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.comment || !body.rating) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ rating และ comment' },
        { status: 400 }
      );
    }

    const review = addReviewStore(
      id,
      Number(body.rating),
      body.comment,
      body.userName || 'ลูกค้าผู้ใช้งานจริง'
    );

    if (!review) {
      return NextResponse.json(
        { success: false, error: `ไม่พบสินค้า ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'ส่งรีวิวสำเร็จ', data: review },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
