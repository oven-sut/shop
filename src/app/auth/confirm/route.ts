import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeRedirectPath, siteOrigin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const OTP_TYPES: EmailOtpType[] = ['recovery', 'signup', 'invite', 'magiclink', 'email_change'];

/**
 * ปลายทางของลิงก์ในอีเมล (รีเซ็ตรหัสผ่าน / ยืนยันอีเมล)
 *
 * ใช้ `token_hash` + verifyOtp แทน `code` + exchangeCodeForSession เพราะ PKCE
 * ต้องมี code_verifier ที่ถูกสร้างตอนขอลิงก์และเก็บไว้ในเบราว์เซอร์เครื่องเดิม
 * แต่อีเมลรีเซ็ตรหัสผ่านถูกสั่งส่งจากฝั่งเซิร์ฟเวอร์ และผู้ใช้มักเปิดลิงก์คนละ
 * เครื่องกับที่กดขอ — verifier จึงไม่มีทางตรง และการแลก code จะล้มเสมอ
 *
 * verifyOtp ตรวจ token กับเซิร์ฟเวอร์ Supabase ตรง ๆ ไม่ต้องใช้ของที่ค้างในเบราว์เซอร์
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const tokenHash = searchParams.get('token_hash');
  const rawType = searchParams.get('type') ?? '';
  const next = safeRedirectPath(searchParams.get('next'));

  const redirectBase = siteOrigin(
    (() => {
      const forwardedHost = request.headers.get('x-forwarded-host');
      if (process.env.NODE_ENV === 'development' || !forwardedHost) return origin;
      return `https://${forwardedHost}`;
    })()
  );

  const fail = (reason: string) =>
    NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent(reason)}`);

  const providerError = searchParams.get('error_description') || searchParams.get('error');
  if (providerError) return fail(providerError);

  if (!tokenHash || !OTP_TYPES.includes(rawType as EmailOtpType)) {
    return fail('ลิงก์ไม่สมบูรณ์ กรุณาขอลิงก์ใหม่อีกครั้ง');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: rawType as EmailOtpType,
    token_hash: tokenHash,
  });

  if (error) {
    console.error('verifyOtp failed:', error.message);
    // ลิงก์ใช้ได้ครั้งเดียวและมีอายุจำกัด สองกรณีนี้พบบ่อยที่สุด
    return fail('ลิงก์หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่');
  }

  return NextResponse.redirect(`${redirectBase}${next}`);
}
