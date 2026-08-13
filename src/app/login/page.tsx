'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { ToastContainer } from '../../components/ToastContainer';
import { Zap, ShieldCheck, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
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
  const { login, signup, loginWithGoogle, loginAsAdmin, loginAsDemoCustomer, loginAsDemoGoogleUser, user } = useAuth();
  const { showToast } = useShop();

  const [, setActiveTab] = useState<'login' | 'signup' | 'admin'>('login');

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup form
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Admin Passcode
  const [passcode, setPasscode] = useState('');

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'auth_callback_failed') {
        showToast('การเข้าสู่ระบบผ่าน Google ไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง หรือใช้ 1-Click Demo', 'warning');
      }
    }
  }, [showToast]);

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน', 'warning');
      return;
    }

    const res = await login(email, password);
    showToast(res.message, res.success ? 'success' : 'warning');
    if (res.success) {
      if (email.toLowerCase().includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  const handleCustomerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !regEmail || !regPassword) {
      showToast('กรุณากรอกข้อมูลลงทะเบียนให้ครบถ้วน', 'warning');
      return;
    }

    const res = await signup(name, regEmail, regPassword);
    showToast(res.message, 'success');
    router.push('/');
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    showToast('กำลังเชื่อมต่อ Google OAuth...', 'info');

    const res = await loginWithGoogle();

    if (!res.success) {
      setIsGoogleLoading(false);
      showToast(`${res.message} (สลับใช้ Google Demo)`, 'warning');
      loginAsDemoGoogleUser();
      router.push('/');
    }
  };

  const handleAdminPasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginAsAdmin(passcode);
    if (res.success) {
      showToast(res.message, 'success');
      router.push('/admin');
    } else {
      showToast(res.message, 'warning');
    }
  };

  const handleQuickDemoAdmin = () => {
    loginAsAdmin('1234');
    showToast('เข้าสู่ระบบเป็นผู้ดูแลระบบ (Admin) สำเร็จ', 'success');
    router.push('/admin');
  };

  const handleQuickDemoCustomer = () => {
    loginAsDemoCustomer();
    showToast('เข้าสู่ระบบเป็นลูกค้าสมาชิกสำเร็จ', 'success');
    router.push('/');
  };

  const handleQuickDemoGoogle = () => {
    loginAsDemoGoogleUser();
    showToast('เข้าสู่ระบบด้วยบัญชี Google (Demo) สำเร็จ', 'success');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans selection:bg-indigo-600 selection:text-white">
      <ToastContainer />

      {/* Header Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
          <Zap className="w-7 h-7 text-white fill-white" />
        </div>
        <div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            NEO <span className="text-indigo-600">TECH</span>
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
            <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="login" onClick={() => setActiveTab('login')} className="rounded-lg text-xs font-bold">
                เข้าสู่ระบบ
              </TabsTrigger>
              <TabsTrigger value="signup" onClick={() => setActiveTab('signup')} className="rounded-lg text-xs font-bold">
                สมัครสมาชิก
              </TabsTrigger>
              <TabsTrigger value="admin" onClick={() => setActiveTab('admin')} className="rounded-lg text-xs font-bold">
                Admin
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
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all border-0 flex items-center justify-center gap-2"
                >
                  <span>ยืนยันสมัครสมาชิก</span>
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </form>
            </TabsContent>

            {/* TAB 3: ADMIN PASSCODE LOGIN */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminPasscodeLogin} className="space-y-4 text-xs">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-2.5 text-indigo-800">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold block">เข้าสู่ระบบผู้ดูแลระบบ (Backoffice)</span>
                    <span className="text-[11px] text-indigo-600">รหัสผ่านทดสอบ Passcode คือ <strong className="font-mono">1234</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสผ่าน Admin Passcode</label>
                  <div className="relative">
                    <Input
                      type="password"
                      required
                      placeholder="กรอก 1234"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs font-mono"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all border-0 flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบหลังบ้าน (Admin)</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </Button>
              </form>
            </TabsContent>

            {/* Quick Fast Demo Access Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-center">
              <span className="text-[11px] text-slate-400 font-medium block">หรือทดลองเข้าสู่ระบบด่วน 1-Click Demo</span>
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickDemoCustomer}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-semibold border-slate-200 px-1"
                >
                  ลูกค้าทั่วไป
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickDemoGoogle}
                  className="bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-semibold border-red-200 px-1 flex items-center justify-center gap-1"
                >
                  <GoogleIcon />
                  Google Demo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleQuickDemoAdmin}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold border-indigo-200 px-1"
                >
                  Admin (1234)
                </Button>
              </div>
            </div>

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
    <AuthProvider>
      <ShopProvider>
        <LoginContent />
      </ShopProvider>
    </AuthProvider>
  );
}
