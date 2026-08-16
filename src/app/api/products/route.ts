import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireApiUser } from '@/lib/api-auth';
import { recordAudit } from '@/lib/audit';
import { badRequest, dbError, quoteFilterValue, serverError } from '@/lib/api-response';
import { toProduct, toProductRow } from '@/lib/mappers';
import { createRouteClient } from '@/lib/supabase/server';

/** Long enough for any real product name, short enough to keep `ilike` cheap. */
const MAX_SEARCH_LENGTH = 100;

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
      // Quoted, so a term containing a comma or a dot stays a search term
      // instead of becoming an extra PostgREST filter.
      const term = quoteFilterValue(`%${search.slice(0, MAX_SEARCH_LENGTH)}%`);
      query = query.or(`name.ilike.${term},category.ilike.${term},description.ilike.${term}`);
    }
    // Capped: an unbounded limit lets one request pull the whole table.
    query = query.limit(Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 200);

    const { data, error } = await query;

    if (error) return dbError(error);

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
  // Admin twice over: here, and again in the products RLS policy.
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();

    if (!body.name || body.price === undefined || body.stock === undefined) {
      return badRequest('กรุณากรอกข้อมูล name, price, stock ให้ครบถ้วน');
    }

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('products')
      .insert(toProductRow(body))
      .select('*')
      .single();

    if (error) return dbError(error, 403);

    await recordAudit({
      action: 'product.create',
      actor: user,
      targetType: 'product',
      targetId: String(data.id),
      summary: `เพิ่มสินค้า ${data.name} — ฿${Number(data.price).toLocaleString()} สต็อก ${data.stock}`,
      meta: { price: data.price, stock: data.stock },
      request,
    });

    return NextResponse.json(
      { success: true, message: 'เพิ่มสินค้าสำเร็จ', data: toProduct(data) },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}
