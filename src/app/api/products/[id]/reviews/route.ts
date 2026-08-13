import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { toReview } from '@/lib/mappers';
import { createRouteClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json();
    const rating = Number(body.rating);

    if (!body.comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุ rating (1-5) และ comment' },
        { status: 400 }
      );
    }

    const supabase = await createRouteClient();

    // One review per product per account: re-posting edits the existing one.
    const { data, error } = await supabase
      .from('product_reviews')
      .upsert(
        {
          product_id: id,
          user_id: user.id,
          // Attributed to the signed-in account, never to a client-supplied name.
          user_name: user.name,
          rating: Math.trunc(rating),
          comment: String(body.comment),
        },
        { onConflict: 'product_id,user_id' }
      )
      .select('*')
      .single();

    if (error) {
      // 23503 = the product id does not exist
      const status = error.code === '23503' ? 404 : 400;
      const message = status === 404 ? `ไม่พบสินค้า ID: ${id}` : error.message;
      return NextResponse.json({ success: false, error: message }, { status });
    }

    return NextResponse.json(
      { success: true, message: 'ส่งรีวิวสำเร็จ', data: toReview(data) },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}
