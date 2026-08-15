import { NextResponse, type NextRequest } from 'next/server';
import { serverError } from '@/lib/api-response';
import { siteOrigin } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * ค้นหาบัญชีทีละหน้าเพราะ GoTrue ไม่มี endpoint ค้นด้วยชื่อ
 * ร้านขนาดนี้ไม่กี่หน้าก็ครบ ตั้งเพดานไว้กันหลุดเป็นลูปยาว
 */
const PAGE_SIZE = 200;
const MAX_PAGES = 10;

/**
 * ลืมรหัสผ่านเป็นช่องให้ยิงเดาว่าอีเมลไหนมีบัญชีอยู่ และแต่ละครั้งคือการส่งอีเมลจริง
 * จำกัดไว้ที่ 5 ครั้งต่อ 10 นาทีต่อ IP
 */
const RESET_LIMIT = { name: 'forgot-password', limit: 5, windowMs: 10 * 60_000 };

const normalise = (value: string) => value.trim().toLowerCase();

/** ผู้ใช้ที่สมัครผ่าน Google อย่างเดียวยังไม่มีรหัสผ่าน ลิงก์นี้จะเป็นการ "ตั้ง" ครั้งแรก */
function isGoogleOnly(identities: { provider: string }[] | undefined) {
  if (!identities?.length) return false;
  return identities.every((identity) => identity.provider !== 'email');
}

export async function POST(request: NextRequest) {
  // ไม่ต้องล็อกอิน — คนที่เข้ามาใช้หน้านี้คือคนที่เข้าระบบไม่ได้อยู่แล้ว
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limited = enforceRateLimit(RESET_LIMIT, ip);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? normalise(body.query) : '';

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'missing_query', message: 'กรุณากรอกอีเมลหรือชื่อผู้ใช้' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── ค้นหาบัญชีจากอีเมลหรือชื่อที่ตั้งไว้ตอนสมัคร ──────────────────────
    let match: { email?: string; identities?: { provider: string }[] } | undefined;

    for (let page = 1; page <= MAX_PAGES && !match; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
      if (error) break;

      match = data.users.find((user) => {
        const email = normalise(user.email ?? '');
        const name = normalise(String(user.user_metadata?.full_name ?? ''));
        return email === query || (Boolean(name) && name === query);
      });

      if (data.users.length < PAGE_SIZE) break;
    }

    if (!match?.email) {
      // ตามที่ร้านกำหนด: บอกตรง ๆ ว่าไม่พบ เพื่อให้ลูกค้ารู้ว่าพิมพ์ผิดหรือยังไม่ได้สมัคร
      return NextResponse.json(
        {
          success: false,
          error: 'not_found',
          message: 'ไม่พบบัญชีที่ตรงกับอีเมลหรือชื่อผู้ใช้นี้',
        },
        { status: 404 }
      );
    }

    // ── ส่งลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล ────────────────────────────────
    const { error } = await admin.auth.resetPasswordForEmail(match.email, {
      redirectTo: `${siteOrigin('http://localhost:3000')}/auth/callback?next=/reset-password`,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'send_failed', message: error.message },
        { status: 502 }
      );
    }

    // ปิดบังอีเมลบางส่วน ยืนยันว่าส่งไปที่ไหนโดยไม่เปิดเผยที่อยู่เต็มให้คนที่เดาชื่อถูก
    const [local, domain] = match.email.split('@');
    const masked = `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;

    return NextResponse.json({
      success: true,
      message: `ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่ ${masked} แล้ว กรุณาตรวจกล่องจดหมายและอีเมลขยะ`,
      data: { email: masked, googleOnly: isGoogleOnly(match.identities) },
    });
  } catch (error) {
    return serverError(error);
  }
}
