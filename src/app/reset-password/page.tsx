'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MIN_LENGTH = 8;

/**
 * ตั้งรหัสผ่านใหม่หลังกดลิงก์จากอีเมล
 *
 * ลิงก์พาไป /auth/callback ก่อน ซึ่งแลก code เป็น session แล้วส่งต่อมาที่นี่ —
 * ถึงหน้านี้แปลว่าล็อกอินอยู่ชั่วคราวแล้ว จึงเปลี่ยนรหัสผ่านได้ทันที
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getClaims().then(({ data }) => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSession(Boolean(data?.claims?.sub));
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_LENGTH) {
      setError(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_LENGTH} ตัวอักษร`);
      return;
    }
    if (password !== confirm) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/');
    router.refresh();
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
          <h1 className="text-lg font-bold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-xs text-neutral-500 leading-relaxed">
            ตั้งรหัสผ่านใหม่ให้บัญชีของคุณ ใช้ได้ทันทีหลังบันทึก
          </p>
        </div>

        {hasSession === false ? (
          <div className="space-y-4">
            <p className="text-xs text-neutral-700 border-l-2 border-neutral-900 pl-3 leading-relaxed">
              ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง
            </p>
            <Link
              href="/forgot-password"
              className="block text-center h-10 leading-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs rounded-md transition-colors"
            >
              ขอลิงก์ใหม่
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: 'password', label: 'รหัสผ่านใหม่', value: password, set: setPassword },
              { id: 'confirm', label: 'ยืนยันรหัสผ่านใหม่', value: confirm, set: setConfirm },
            ].map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="block text-xs font-medium text-neutral-700 mb-1.5">
                  {field.label}
                </label>
                <div className="relative">
                  <Input
                    id={field.id}
                    type="password"
                    required
                    minLength={MIN_LENGTH}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="h-10 pl-9 bg-white border-neutral-300 rounded-md text-xs"
                  />
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            ))}

            {error && (
              <p className="text-xs text-neutral-900 border-l-2 border-neutral-900 pl-3 leading-relaxed">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSaving || hasSession === null}
              className="w-full h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs rounded-md border-0 disabled:opacity-50"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
