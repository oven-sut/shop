import { NextResponse, type NextRequest } from 'next/server';
import { getProductByIdStore, updateProductStore, deleteProductStore } from '@/lib/apiStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = getProductByIdStore(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: `ไม่พบสินค้า ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
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

    const updated = updateProductStore(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `ไม่พบสินค้า ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลสินค้าสำเร็จ',
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = deleteProductStore(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `ไม่พบสินค้า ID: ${id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `ลบสินค้า ID: ${id} สำเร็จ`
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
