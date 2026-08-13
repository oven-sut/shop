'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { ToastContainer } from '../../components/ToastContainer';
import { safeRedirectPath } from '../../lib/auth';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.05.01 12c0 1.95.45 3.8 1.26 5.42l4.01-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans selection:bg-indigo-600 selection:text-white">
      <ToastContainer />

      {/* Header Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <Image
          src="/logo-mark.png"
          alt=""
          width={470}
          height={462}
          priority
          className="h-14 w-auto group-hover:scale-105 transition-transform"
        />
        <div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            NEO <span className="text-indigo-600">APP</span>
          </span>
          <span className="block text-xs text-slate-500 tracking-widest font-medium uppercase">
            Authentication Portal
          </span>
        </div>
      </Link>

      {/* Login / Register Card Container */}
      <Card className="w-full max-w-md bg-white border-slate-200 shadow-xl rounded-3xl overflow-hidden">

        {/* Already logged in banner indicator */}
        {user && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-3 text-center text-xs text-indigo-800 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>เข้าสู่ระบบอยู่แล้วในชื่อ: <strong>{user.name}</strong> ({user.role === 'admin' ? 'ADMIN' : 'MEMBER'})</span>
          </div>
        )}

        <Tabs defaultValue="login" className="w-full">
          <CardHeader className="pb-2 text-center">
            <TabsList className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg text-xs font-bold">
                เข้าสู่ระบบ
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg text-xs font-bold">
                สมัครสมาชิก
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">

            {/* TAB 1: CUSTOMER LOGIN */}
            <TabsContent value="login" className="space-y-4">
              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                disabled={isGoogleLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3 h-auto bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5"
              >
                <GoogleIcon />
                <span>{isGoogleLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">หรือเข้าสู่ระบบด้วยอีเมล</span>
                </div>
              </div>

              <form onSubmit={handleCustomerLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อีเมลผู้ใช้งาน</label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all border-0 flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="w-4 h-4" />
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
                className="w-full py-3 h-auto bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5"
              >
                <GoogleIcon />
                <span>สมัครสมาชิกด้วย Google</span>
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">หรือกรอกข้อมูลสมัครสมาชิก</span>
                </div>
              </div>

              <form onSubmit={handleCustomerSignup} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                  <div className="relative">
                    <Input
                      type="text"
                      required
                      placeholder="คุณสมชาย ใจดี"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อีเมล</label>
                  <div className="relative">
                    <Input
                      type="email"
                      required
                      placeholder="somchai@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตั้งรหัสผ่าน</label>
                  <div className="relative">
                    <Input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 shrink-0"
                  />
                  <span>
                    ข้าพเจ้ายอมรับ{' '}
                    <Link href="/terms" target="_blank" className="text-indigo-600 font-semibold hover:underline">
                      ข้อกำหนดการใช้งาน
                    </Link>{' '}
                    และ{' '}
                    <Link href="/privacy" target="_blank" className="text-indigo-600 font-semibold hover:underline">
                      นโยบายความเป็นส่วนตัว
                    </Link>
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={isSubmitting || !acceptedTerms}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all border-0 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>ยืนยันสมัครสมาชิก</span>
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>

          </CardContent>
        </Tabs>
      </Card>

      <div className="mt-8 text-xs text-slate-500 text-center">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          ← ย้อนกลับสู่หน้าร้านค้า
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ShopProvider>
      <Suspense>
        <LoginContent />
      </Suspense>
    </ShopProvider>
  );
}
