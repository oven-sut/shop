'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export const Footer: React.FC = () => {
  const { isAdmin } = useAuth();
  const { showToast } = useShop();

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [coupon, setCoupon] = useState<string | null>(null);

  /**
   * สมัครรับข่าวสารจริง — เดิมฟอร์มนี้ `preventDefault()` เฉย ๆ แล้วไม่ทำอะไรต่อ
   *
   * สมัครซ้ำด้วยอีเมลเดิมไม่เป็นไร ฝั่งเซิร์ฟเวอร์ upsert ให้เป็นแถวเดียวเสมอ
   */
  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'footer' }),
    });
    const body = await response.json().catch(() => ({}));
    setIsSending(false);

    showToast(body.message || (body.success ? 'สมัครรับข่าวสารแล้ว' : 'สมัครไม่สำเร็จ'), body.success ? 'success' : 'warning');

    if (body.success) {
      setEmail('');
      setCoupon(body.data?.coupon ?? null);
    }
  };

  return (
    <footer className="bg-white border-t border-neutral-200 text-neutral-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-mark.png"
                alt=""
                width={470}
                height={462}
                className="h-8 w-auto"
              />
              <span className="text-base font-bold tracking-tight text-neutral-900">
                NEO APP
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-neutral-500 max-w-sm">
              ร้านขายแอปพลิเคชันและบริการดิจิทัล เติมเงินเข้ากระเป๋าแล้วซื้อได้ทันที
              ตรวจสลิปโอนกับธนาคารอัตโนมัติ
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-neutral-900" strokeWidth={1.5} />
              <span>ตรวจสลิปกับธนาคารทุกครั้งที่เติมเงิน</span>
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-neutral-900 uppercase tracking-[0.2em]">
              เมนูลัด
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-neutral-900 transition-colors">
                  แอปทั้งหมด
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-neutral-900 transition-colors">
                  เติมเงิน &amp; ประวัติการเติม
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-neutral-900 transition-colors">
                  ติดต่อเรา
                </Link>
              </li>
              {isAdmin && (
                <li>
                  <Link href="/admin" className="hover:text-neutral-900 transition-colors">
                    หน้าจัดการหลังบ้าน
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-neutral-900 uppercase tracking-[0.2em]">
              รับข่าวสาร &amp; โค้ดส่วนลด
            </h4>
            <p className="text-xs text-neutral-500">ใส่อีเมลเพื่อรับข่าวแอปใหม่และโปรโมชัน</p>
            <form onSubmit={subscribe} className="flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
                placeholder="อีเมลของคุณ..."
                className="h-10 w-full bg-white border-neutral-300 rounded-md text-xs text-neutral-900 placeholder-neutral-400"
              />
              <Button
                type="submit"
                disabled={isSending}
                className="h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs px-5 rounded-md transition-colors shrink-0 border-0 disabled:opacity-50"
              >
                {isSending && <Spinner className="mr-1.5" />}
                สมัคร
              </Button>
            </form>

            {/* โค้ดต้อนรับโผล่ก็ต่อเมื่อแอดมินตั้งไว้จริง — ไม่สัญญาสิ่งที่ยังไม่มี */}
            {coupon && (
              <p className="text-xs text-neutral-900">
                โค้ดส่วนลดของคุณ:{' '}
                <span className="font-mono font-bold bg-neutral-100 border border-neutral-200 rounded-md px-2 py-0.5">
                  {coupon}
                </span>
              </p>
            )}
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-3">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <p>© 2026 NEO APP</p>
            <Link href="/contact" className="hover:text-neutral-900 transition-colors">
              ติดต่อเรา
            </Link>
            <Link href="/terms" className="hover:text-neutral-900 transition-colors">
              ข้อกำหนดการใช้งาน
            </Link>
            <Link href="/privacy" className="hover:text-neutral-900 transition-colors">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="/cookies" className="hover:text-neutral-900 transition-colors">
              นโยบายคุกกี้
            </Link>
          </div>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
