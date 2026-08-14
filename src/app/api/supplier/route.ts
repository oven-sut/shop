import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { toProduct } from '@/lib/mappers';
import { fetchSupplierAccount, fetchSupplierProducts, SupplierError } from '@/lib/supplier';
import { createRouteClient } from '@/lib/supabase/server';

const forbidden = () =>
  NextResponse.json(
    { success: false, error: 'forbidden', message: 'เฉพาะผู้ดูแลระบบเท่านั้น' },
    { status: 403 }
  );

/** แคตตาล็อกของซัพพลายเออร์ พร้อมบอกว่าชิ้นไหนนำเข้ามาในร้านแล้ว */
export async function GET() {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;
  if (user.role !== 'admin') return forbidden();

  try {
    const supabase = await createRouteClient();

    const [account, products, imported] = await Promise.all([
      fetchSupplierAccount(),
      fetchSupplierProducts(),
      supabase.from('products').select('supplier_product_id').eq('supplier', '499k'),
    ]);

    const importedIds = new Set(
      (imported.data ?? []).map((row) => row.supplier_product_id as string)
    );

    return NextResponse.json({
      success: true,
      data: {
        account,
        products: products.map((product) => ({
          ...product,
          imported: importedIds.has(product.productId),
        })),
      },
    });
  } catch (error) {
    if (error instanceof SupplierError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return serverError(error);
  }
}

/**
 * นำสินค้าจากซัพพลายเออร์เข้ามาขายในร้าน
 *
 * ราคาขายตั้งเองได้ ถ้าไม่ระบุจะใช้ราคาแนะนำ (web_price) ส่วน `supplier_cost`
 * เก็บต้นทุนไว้เพื่อดูกำไร นำเข้าซ้ำจะอัปเดตของเดิมด้วย unique index
 */
export async function POST(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;
  if (user.role !== 'admin') return forbidden();

  try {
    const body = await request.json();
    const productIds: string[] = Array.isArray(body.productIds)
      ? body.productIds.map(String)
      : body.productId
        ? [String(body.productId)]
        : [];

    if (!productIds.length) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ productId ที่ต้องการนำเข้า' },
        { status: 400 }
      );
    }

    const catalogue = await fetchSupplierProducts();
    const selected = catalogue.filter((product) => productIds.includes(product.productId));

    if (!selected.length) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบสินค้านี้ในแคตตาล็อกของซัพพลายเออร์' },
        { status: 404 }
      );
    }

    const rows = selected.map((product) => ({
      name: product.name,
      category: product.genres[0] || (product.type === 'rental' ? 'ไอดีเช่า' : 'เกม'),
      price: Number(body.price) > 0 ? Number(body.price) : product.webPrice,
      stock: product.stock,
      description: product.description,
      image: product.image,
      specs: {
        แพลตฟอร์ม: product.platform,
        ประเภท: product.type === 'rental' ? 'ไอดีเช่า' : 'ซื้อขาด',
        Denuvo: product.denuvo ? 'มี' : 'ไม่มี',
        ...(product.genres.length ? { หมวดเกม: product.genres.join(', ') } : {}),
      },
      supplier: '499k',
      supplier_product_id: product.productId,
      supplier_type: product.type,
      supplier_cost: product.cost,
      // price/webPrice ด้านบนเป็นราคาของช่วงที่สั้นที่สุด จึงต้องเก็บจำนวนวัน
      // ของช่วงเดียวกันไว้ ให้ตอนสั่งซื้อส่ง duration_days ตรงกับที่ตั้งราคาไว้
      supplier_duration_days: product.type === 'rental' ? product.defaultDurationDays ?? 1 : null,
      is_featured: Boolean(body.isFeatured),
    }));

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('products')
      .upsert(rows, { onConflict: 'supplier,supplier_product_id' })
      .select('*');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `นำเข้าสินค้า ${data.length} รายการแล้ว`,
        data: data.map(toProduct),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SupplierError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return serverError(error);
  }
}
