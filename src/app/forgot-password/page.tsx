'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Status = { kind: 'idle' | 'sent' | 'error'; message: string; googleOnly?: boolean };

export default function ForgotPasswordPage() {
  const [query, setQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSending(true);
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const body = await response.json().catch(() => ({}));
    setIsSending(false);

    setStatus({
      kind: body.success ? 'sent' : 'error',
      message: body.message || 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่',
      googleOnly: body.data?.googleOnly,
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-white">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <Image src="/logo-mark.png" alt="" width={470} height={462} className="h-9 w-auto" />
        <span className="text-lg font-bold tracking-tight">
          NEO <span className="text-neutral-400">APP</span>
        </span>
      </Link>

      <div className="w-full max-w-sm border border-neutral-200 rounded-md p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-lg font-bold tracking-tight">ลืมรหัสผ่าน</h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            กรอกอีเมลหรือชื่อผู้ใช้ที่ใช้สมัคร ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลของบัญชีนั้น
          </p>
        </div>

        {status.kind === 'sent' ? (
          <div className="space-y-4">
            <div className="border-l-2 border-neutral-900 pl-3 text-xs text-neutral-700 leading-relaxed">
              {status.message}
            </div>

            {status.googleOnly && (
              <p className="text-xs text-neutral-500 leading-relaxed border border-neutral-200 rounded-md p-3">
                บัญชีนี้สมัครผ่าน Google จึงยังไม่เคยมีรหัสผ่าน — ลิงก์ที่ส่งไปคือการตั้งรหัสผ่านครั้งแรก
                หลังตั้งแล้วจะเข้าสู่ระบบได้ทั้งสองวิธี
              </p>
            )}

            <Link
              href="/login"
              className="block text-center h-10 leading-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs rounded-md transition-colors"
            >
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-xs font-medium text-neutral-700 mb-1.5">
                อีเมล หรือ ชื่อผู้ใช้
              </label>
              <div className="relative">
                <Input
                  id="query"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="name@example.com หรือชื่อที่ใช้สมัคร"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 pl-9 bg-white border-neutral-300 rounded-md text-xs"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {status.kind === 'error' && (
              <p className="text-xs text-neutral-900 border-l-2 border-neutral-900 pl-3 leading-relaxed">
                {status.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSending}
              className="w-full h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs rounded-md border-0 disabled:opacity-50"
            >
              {isSending ? 'กำลังส่ง...' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
            </Button>
          </form>
        )}
      </div>

      <Link
        href="/login"
        className="mt-6 flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        กลับไปหน้าเข้าสู่ระบบ
      </Link>
    </div>
  );
}
