import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { badRequest, dbError, serverError } from '@/lib/api-response';
import { toReview } from '@/lib/mappers';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createRouteClient } from '@/lib/supabase/server';

const REVIEW_LIMIT = { name: 'review-post', limit: 15, windowMs: 60_000 };

/** Room for a real opinion, not for a payload someone wants stored for free. */
const MAX_COMMENT_LENGTH = 2000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const limited = enforceRateLimit(REVIEW_LIMIT, user.id);
  if (limited) return limited;

  try {
    const { id } = await params;
    const body = await request.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (!comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return badRequest('กรุณาระบุ rating (1-5) และ comment');
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      return badRequest(`ความคิดเห็นต้องยาวไม่เกิน ${MAX_COMMENT_LENGTH} ตัวอักษร`);
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
          comment,
        },
        { onConflict: 'product_id,user_id' }
      )
      .select('*')
      .single();

    if (error) {
      // 23503 = the product id does not exist
      if (error.code === '23503') {
        return NextResponse.json(
          { success: false, error: 'not_found', message: `ไม่พบสินค้า ID: ${id}` },
          { status: 404 }
        );
      }
      return dbError(error);
    }

    return NextResponse.json(
      { success: true, message: 'ส่งรีวิวสำเร็จ', data: toReview(data) },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}
