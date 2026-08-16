'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { ToastContainer } from '../../components/ToastContainer';
import { safeRedirectPath } from '../../lib/auth';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

/** Google's mark, drawn in a single ink so it sits inside the monochrome palette. */
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z" />
      <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.05.01 12c0 1.95.45 3.8 1.26 5.42l4.01-3.15z" />
      <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
    </svg>
  );
}

const FIELD_CLASS =
  'h-11 pl-10 bg-white border-neutral-300 rounded-md text-neutral-900 text-sm focus-visible:border-neutral-900 focus-visible:ring-0';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup, loginWithGoogle, user } = useAuth();
  const { showToast } = useShop();

  // Where to land after a successful sign-in (set by proxy.ts when /admin is blocked).
  const next = safeRedirectPath(searchParams.get('next'));

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup form
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Errors handed back by /auth/callback end up in the query string.
  const callbackError = searchParams.get('error');
  useEffect(() => {
    if (callbackError) {
      showToast(`เข้าสู่ระบบไม่สำเร็จ: ${callbackError}`, 'warning');
    }
  }, [callbackError, showToast]);

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    showToast(res.message, res.success ? 'success' : 'warning');
    if (res.success) {
      router.push(next);
    }
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !regEmail || !regPassword) {
      showToast('กรุณากรอกข้อมูลลงทะเบียนให้ครบถ้วน', 'warning');
      return;
    }

    if (!acceptedTerms) {
      showToast('กรุณายอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัวก่อน', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await signup(name, regEmail, regPassword);
    setIsSubmitting(false);

    showToast(res.message, res.success ? 'success' : 'warning');
    if (res.success && !res.needsEmailConfirmation) {
      router.push(next);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    showToast('กำลังเชื่อมต่อ Google OAuth...', 'info');

    const res = await loginWithGoogle(next);

    // On success the browser is redirected to Google, so we never get here.
    if (!res.success) {
      setIsGoogleLoading(false);
      showToast(res.message, 'warning');
    }
  };

  return (
    <div className="min-h-dvh bg-white text-neutral-900 flex flex-col justify-center items-center p-4 font-sans selection:bg-neutral-900 selection:text-white">
      <ToastContainer />

      {/* Header Logo */}
      <Link href="/" className="flex items-center gap-3 mb-10">
        <Image
          src="/logo-mark.png"
          alt=""
          width={470}
          height={462}
          priority
          className="h-12 w-auto"
        />
        <div className="leading-none">
          <span className="text-xl font-bold tracking-tight text-neutral-900">NEO APP</span>
          <span className="block text-[10px] text-neutral-400 tracking-[0.2em] uppercase mt-1.5">
            Authentication
          </span>
        </div>
      </Link>

      {/* Login / Register Card Container */}
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-md overflow-hidden">

        {/* Already logged in banner indicator */}
        {user && (
          <div className="bg-neutral-900 text-white p-3 text-center text-xs">
            เข้าสู่ระบบอยู่แล้วในชื่อ <strong className="font-semibold">{user.name}</strong> (
            {user.role === 'admin' ? 'ADMIN' : 'MEMBER'})
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          {/* `line` keeps the switch to a rule under the active label — no pill, no fill. */}
          <div className="px-6 pt-5 border-b border-neutral-200">
            {/* h-auto! overrides the primitive's fixed 2rem list height — Thai
                labels need the extra room. */}
            <TabsList variant="line" className="w-full gap-6 h-auto! p-0">
              <TabsTrigger value="login" className="flex-none h-auto px-0 pb-3 text-sm">
                เข้าสู่ระบบ
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-none h-auto px-0 pb-3 text-sm">
                สมัครสมาชิก
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">

            {/* TAB 1: CUSTOMER LOGIN */}
            <TabsContent value="login" className="space-y-4">
              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                disabled={isGoogleLoading}
                onClick={handleGoogleLogin}
                className="w-full h-11 bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 font-medium text-sm rounded-md flex items-center justify-center gap-2.5"
              >
                {isGoogleLoading ? <Spinner /> : <GoogleIcon />}
                <span>{isGoogleLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white px-3 text-neutral-400">หรือเข้าสู่ระบบด้วยอีเมล</span>
                </div>
              </div>

              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    อีเมลผู้ใช้งาน
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={FIELD_CLASS}
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <label className="block text-xs font-medium text-neutral-700">รหัสผ่าน</label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-neutral-400 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                    >
                      ลืมรหัสผ่าน
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={FIELD_CLASS}
                    />
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md transition-colors border-0 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {/* เดิมปุ่มแค่จางลงตอนกด ไม่มีอะไรบอกว่ากำลังทำงานอยู่ */}
                  {isSubmitting && <Spinner />}
                  <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>
            </TabsContent>

            {/* TAB 2: CUSTOMER SIGNUP */}
            <TabsContent value="signup" className="space-y-4">
              {/* Google Signup Button */}
              <Button
                type="button"
                variant="outline"
                disabled={isGoogleLoading}
                onClick={handleGoogleLogin}
                className="w-full h-11 bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 font-medium text-sm rounded-md flex items-center justify-center gap-2.5"
              >
                {isGoogleLoading ? <Spinner /> : <GoogleIcon />}
                <span>{isGoogleLoading ? 'กำลังเชื่อมต่อ Google...' : 'สมัครสมาชิกด้วย Google'}</span>
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="bg-white px-3 text-neutral-400">หรือกรอกข้อมูลสมัครสมาชิก</span>
                </div>
              </div>

              <form onSubmit={handleCustomerSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    ชื่อ-นามสกุล
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      required
                      placeholder="คุณสมชาย ใจดี"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={FIELD_CLASS}
                    />
                    <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">อีเมล</label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      placeholder="somchai@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={FIELD_CLASS}
                    />
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                    ตั้งรหัสผ่าน
                  </label>
                  <div className="relative">
                    <Input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={FIELD_CLASS}
                    />
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-[11px] text-neutral-500 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded-sm border-neutral-300 accent-neutral-900 shrink-0"
                  />
                  <span>
                    ข้าพเจ้ายอมรับ{' '}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-neutral-900 font-medium underline underline-offset-2"
                    >
                      ข้อกำหนดการใช้งาน
                    </Link>{' '}
                    และ{' '}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-neutral-900 font-medium underline underline-offset-2"
                    >
                      นโยบายความเป็นส่วนตัว
                    </Link>
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={isSubmitting || !acceptedTerms}
                  className="w-full h-11 bg-neutral-900 hover:bg-neutral-700 text-white font-semibold text-sm rounded-md transition-colors border-0 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting && <Spinner />}
                  <span>{isSubmitting ? 'กำลังสมัครสมาชิก...' : 'ยืนยันสมัครสมาชิก'}</span>
                  {!isSubmitting && <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>
            </TabsContent>

          </div>
        </Tabs>
      </div>

      <div className="mt-8 text-xs text-neutral-400 text-center">
        <Link href="/" className="hover:text-neutral-900 transition-colors">
          ← ย้อนกลับสู่หน้าร้านค้า
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    // ไม่ต้องมีแผ่นคลุม: ฟอร์มล็อกอินใช้ได้ทันทีโดยไม่ต้องรอ API และคนที่ยังไม่ล็อกอิน
    // จะได้ 401 จากทุกเส้นอยู่แล้ว บังไว้ก็มีแต่ทำให้ช้า
    <ShopProvider splash={false}>
      <Suspense>
        <LoginContent />
      </Suspense>
    </ShopProvider>
  );
}
