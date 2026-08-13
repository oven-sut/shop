import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { toOrder } from '@/lib/mappers';
import { createRouteClient } from '@/lib/supabase/server';

const ORDER_STATUSES = ['รอดำเนินการ', 'กำลังจัดเตรียม', 'จัดส่งแล้ว', 'สำเร็จ', 'ยกเลิก'];

const notFound = (id: string) =>
  NextResponse.json({ success: false, error: `ไม่พบคำสั่งซื้อ ID: ${id}` }, { status: 404 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    // Someone else's order is invisible under RLS, so it reads as not found.
    if (!data) return notFound(id);

    return NextResponse.json({ success: true, data: toOrder(data) });
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
    const body = await request.json();

    if (!body.status || !ORDER_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `status ต้องเป็นหนึ่งใน: ${ORDER_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = { status: body.status };
    if (body.trackingNumber !== undefined) patch.tracking_number = body.trackingNumber || null;

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    if (!data) return notFound(id);

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะคำสั่งซื้อ #${id} เป็น ${body.status} แล้ว`,
      data: toOrder(data),
    });
  } catch (error) {
    return serverError(error);
  }
}
