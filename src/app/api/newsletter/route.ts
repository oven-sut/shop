import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireApiUser } from '@/lib/api-auth';
import { badRequest, dbError, serverError } from '@/lib/api-response';
import { enforceRateLimit } from '@/lib/rate-limit';
import { loadSettings } from '@/lib/settings';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * รับข่าวสาร — สมัคร ยกเลิก และรายชื่อสำหรับแอดมิน
 *
 * ตารางนี้ไม่มี RLS policy ให้ client เลย เพราะข้างในคือรายชื่ออีเมลของลูกค้าทั้งร้าน
 * ทุกอย่างจึงผ่าน route นี้ด้วย service key แล้วกรองสิทธิ์ตรงนี้: ใครก็สมัครได้ (ถ้าล็อกอิน)
 * แต่ **อ่านรายชื่อได้เฉพาะแอดมิน**
 */

/** กันคนเดียวยิงรัวจนตารางบวมด้วยอีเมลปลอม */
const SUBSCRIBE_LIMIT = { name: 'newsletter-subscribe', limit: 5, windowMs: 60_000 };

const MAX_EMAIL_LENGTH = 254;

/** พอสำหรับกันพิมพ์ผิด — ตัวตัดสินจริงคือเมลตีกลับตอนส่ง ไม่ใช่ regex */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const limited = enforceRateLimit(SUBSCRIBE_LIMIT, user.id);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH) : '';

    if (!EMAIL_SHAPE.test(email)) return badRequest('กรุณากรอกอีเมลให้ถูกต้อง');

    const admin = createAdminClient();

    // สมัครซ้ำ = อัปเดตแถวเดิม ไม่ใช่แถวใหม่ — ไม่งั้นตอนส่งจริงคนเดิมได้เมลสองฉบับ
    // และการสมัครใหม่หลังเคยยกเลิก ต้องล้าง unsubscribed_at ทิ้งด้วย
    const { data, error } = await admin
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          user_id: user.id,
          source: typeof body.source === 'string' ? body.source.slice(0, 40) : 'footer',
          unsubscribed_at: null,
        },
        { onConflict: 'email' }
      )
      .select('created_at')
      .single();

    if (error) return dbError(error);

    // โค้ดต้อนรับเป็นของที่แอดมินตั้งเอง ไม่ใช่ของที่ระบบสร้างขึ้น — ถ้ายังไม่ตั้งก็ไม่สัญญา
    const supabase = await createRouteClient();
    const settings = await loadSettings(supabase);
    const welcomeCoupon = settings.newsletterWelcomeCoupon.trim().toUpperCase();

    return NextResponse.json({
      success: true,
      message: welcomeCoupon
        ? `สมัครรับข่าวสารแล้ว — ใช้โค้ด ${welcomeCoupon} ได้เลย`
        : 'สมัครรับข่าวสารเรียบร้อย ขอบคุณครับ',
      data: { email, coupon: welcomeCoupon || null, subscribedAt: data.created_at },
    });
  } catch (error) {
    return serverError(error);
  }
}

/** ยกเลิกรับข่าว — ของตัวเอง (ล็อกอินอยู่) หรือด้วย token จากลิงก์ท้ายอีเมล */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const admin = createAdminClient();

    if (token) {
      const { error } = await admin
        .from('newsletter_subscribers')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('unsubscribe_token', token);

      if (error) return dbError(error);
      // ตอบเหมือนกันทั้ง token จริงและปลอม ไม่งั้นกลายเป็นเครื่องมือเดา token
      return NextResponse.json({ success: true, message: 'ยกเลิกรับข่าวสารแล้ว' });
    }

    const { user, response: unauthorized } = await requireApiUser();
    if (unauthorized) return unauthorized;

    const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();

    let query = admin
      .from('newsletter_subscribers')
      .update({ unsubscribed_at: new Date().toISOString() });

    // แอดมินถอดอีเมลไหนก็ได้ ส่วนคนทั่วไปถอดได้เฉพาะที่ตัวเองสมัครไว้
    query = user.role === 'admin' && email ? query.eq('email', email) : query.eq('user_id', user.id);

    const { error } = await query;
    if (error) return dbError(error);

    return NextResponse.json({ success: true, message: 'ยกเลิกรับข่าวสารแล้ว' });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * GET — รายชื่อผู้รับข่าว (แอดมินเท่านั้น)
 *
 * `?format=csv` ดาวน์โหลดเป็นไฟล์ เอาไปวางในตัวส่งเมลเจ้าไหนก็ได้ ระบบนี้ยังไม่ส่งเมลเอง
 */
export async function GET(request: NextRequest) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const includeInactive = request.nextUrl.searchParams.get('all') === '1';
    const admin = createAdminClient();

    let query = admin
      .from('newsletter_subscribers')
      .select('email, source, created_at, unsubscribed_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (!includeInactive) query = query.is('unsubscribed_at', null);

    const { data, error } = await query;
    if (error) return dbError(error);

    const rows = data ?? [];

    if (request.nextUrl.searchParams.get('format') === 'csv') {
      // ขึ้นต้นด้วย = + - @ คือสูตรใน Excel/Sheets — นำหน้าด้วย ' กัน CSV injection
      const escape = (value: string) => {
        const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
        return `"${safe.replace(/"/g, '""')}"`;
      };

      const csv = [
        'email,source,created_at,unsubscribed_at',
        ...rows.map((row) =>
          [row.email, row.source, row.created_at, row.unsubscribed_at ?? '']
            .map((value) => escape(String(value)))
            .join(',')
        ),
      ].join('\n');

      return new NextResponse(`﻿${csv}`, {
        headers: {
          // BOM ข้างบนเพื่อให้ Excel อ่านภาษาไทยไม่เป็นตัวยึกยือ
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        email: row.email,
        source: row.source,
        createdAt: row.created_at,
        unsubscribedAt: row.unsubscribed_at,
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}
