import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { toProduct, toProductRow } from '@/lib/mappers';
import { createRouteClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const limit = Number(searchParams.get('limit'));

    const supabase = await createRouteClient();
    // The reviews have to be embedded here, not just on /api/products/[id]: the
    // storefront renders the quick-view straight off this list, so a bare
    // select('*') leaves every product with `reviews: undefined` and the review
    // tab looks empty even when rows exist.
    let query = supabase
      .from('products')
      .select('*, product_reviews(*)')
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'product_reviews', ascending: false });

    if (category && category !== 'ทั้งหมด') query = query.eq('category', category);
    if (featured === 'true') query = query.eq('is_featured', true);
    if (search) {
      const term = `%${search}%`;
      query = query.or(`name.ilike.${term},category.ilike.${term},description.ilike.${term}`);
    }
    if (Number.isFinite(limit) && limit > 0) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      data: data.map(toProduct),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.name || body.price === undefined || body.stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูล name, price, stock ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Only admins get past the products RLS policy; a customer's insert fails here.
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('products')
      .insert(toProductRow(body))
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { success: true, message: 'เพิ่มสินค้าสำเร็จ', data: toProduct(data) },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}
