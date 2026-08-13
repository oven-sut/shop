import { NextResponse, type NextRequest } from 'next/server';
import { getProductsStore, addProductStore } from '@/lib/apiStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    let result = getProductsStore();

    if (category && category !== 'ทั้งหมด') {
      result = result.filter((p) => p.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (featured === 'true') {
      result = result.filter((p) => p.isFeatured || p.badge === 'HOT');
    }

    if (limit && !isNaN(Number(limit))) {
      result = result.slice(0, Number(limit));
    }

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result
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

    if (!body.name || body.price === undefined || body.stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูล name, price, stock ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const newProduct = addProductStore({
      name: body.name,
      category: body.category || 'หูฟัง & แอคเซสซอรี',
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      stock: Number(body.stock),
      description: body.description || '',
      specs: body.specs || {},
      image: body.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
      badge: body.badge,
      isFeatured: body.isFeatured ?? true
    });

    return NextResponse.json(
      { success: true, message: 'เพิ่มสินค้าสำเร็จ', data: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
