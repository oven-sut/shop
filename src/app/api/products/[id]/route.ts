import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { toProduct, toProductRow } from '@/lib/mappers';
import { createRouteClient } from '@/lib/supabase/server';

const notFound = (id: string) =>
  NextResponse.json({ success: false, error: `ไม่พบสินค้า ID: ${id}` }, { status: 404 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    const { data, error } = await supabase
      .from('products')
      .select('*, product_reviews(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (!data) return notFound(id);

    return NextResponse.json({ success: true, data: toProduct(data) });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const patch = toProductRow(await request.json());

    if (!Object.keys(patch).length) {
      return NextResponse.json({ success: false, error: 'ไม่มีข้อมูลที่จะแก้ไข' }, { status: 400 });
    }

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      // Same embed as the read paths — the client swaps this row straight into
      // state, so returning it without reviews would blank them until a reload.
      .select('*, product_reviews(*)')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    // RLS makes a forbidden update look like "no rows matched", so it lands here.
    if (!data) return notFound(id);

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลสินค้าสำเร็จ',
      data: toProduct(data),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    if (!data) return notFound(id);

    return NextResponse.json({ success: true, message: `ลบสินค้า ID: ${id} สำเร็จ` });
  } catch (error) {
    return serverError(error);
  }
}
