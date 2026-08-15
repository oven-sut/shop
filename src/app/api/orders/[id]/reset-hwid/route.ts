import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { dbError, serverError } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * รีเซ็ต HWID ของบัญชีที่ร้านลงเอง (Rockstar, บอท ฯลฯ) — กดเองได้ทันที ไม่ต้องรออนุมัติ
 * ไม่จำกัดจำนวนครั้งตามที่ตกลงไว้ เก็บแค่ตัวนับ/เวลาล่าสุดไว้แสดงผล ไม่ใช่ตัวจำกัดสิทธิ์
 *
 * เฉพาะ supplier = 'manual' เพราะบัญชีฝั่งซัพพลายเออร์ (499k) ไม่ใช่ของที่ร้านคุมการล็อกเครื่องเอง
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;

    // อ่านผ่าน session ของผู้ใช้ RLS จึงกันไม่ให้รีเซ็ตของคำสั่งซื้อคนอื่น
    const supabase = await createRouteClient();
    const { data: fulfillment, error } = await supabase
      .from('order_fulfillments')
      .select('id, supplier, status, hwid_reset_count')
      .eq('order_id', id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) return dbError(error);

    if (!fulfillment || fulfillment.supplier !== 'manual') {
      return NextResponse.json(
        { success: false, error: 'not_found', message: 'ไม่พบบัญชีที่รีเซ็ต HWID ได้ในคำสั่งซื้อนี้' },
        { status: 404 }
      );
    }

    const nextCount = (fulfillment.hwid_reset_count ?? 0) + 1;
    const resetAt = new Date().toISOString();

    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from('order_fulfillments')
      .update({ hwid_reset_count: nextCount, hwid_reset_last_at: resetAt })
      .eq('id', fulfillment.id)
      .eq('user_id', user.id);

    if (updateError) return dbError(updateError);

    return NextResponse.json({
      success: true,
      message: 'รีเซ็ต HWID เรียบร้อยแล้ว',
      data: { hwidResetCount: nextCount, hwidResetLastAt: resetAt },
    });
  } catch (error) {
    return serverError(error);
  }
}
