'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 mt-20 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-mark.png"
                alt=""
                width={470}
                height={462}
                className="h-9 w-auto"
              />
              <span className="text-lg font-extrabold text-slate-900">
                NEO <span className="text-indigo-600">APP</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-500">
              ร้านขายแอปพลิเคชันและบริการดิจิทัล เติมเงินเข้ากระเป๋าแล้วซื้อได้ทันที ตรวจสลิปโอนกับธนาคารอัตโนมัติ
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ตรวจสลิปกับธนาคารทุกครั้งที่เติมเงิน</span>
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">เมนูลัด</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-indigo-600 transition-colors">แอปทั้งหมด</Link></li>
              <li><Link href="/wallet" className="hover:text-indigo-600 transition-colors">เติมเงิน & ประวัติการเติม</Link></li>
            </ul>
          </div>

          {/* Newsletter & Admin quick access */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">รับข่าวสาร & โค้ดส่วนลด</h4>
            <p className="text-xs text-slate-500">ใส่อีเมลเพื่อรับข่าวแอปใหม่และโปรโมชัน</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <Input
                type="email"
                placeholder="อีเมลของคุณ..."
                className="w-full bg-slate-50 border-slate-200 text-xs text-slate-900 placeholder-slate-400"
              />
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 border-0"
              >
                สมัคร
              </Button>
            </form>
            <div className="pt-2">
              <Link href="/admin" className="text-xs text-indigo-600 font-semibold hover:underline">
                → เข้าสู่หน้าจัดการหลังบ้าน (Backoffice Admin)
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <p>© 2026 NEO APP. All rights reserved.</p>
            <Link href="/terms" className="hover:text-indigo-600">ข้อกำหนดการใช้งาน</Link>
            <Link href="/privacy" className="hover:text-indigo-600">นโยบายความเป็นส่วนตัว</Link>
            <Link href="/cookies" className="hover:text-indigo-600">นโยบายคุกกี้</Link>
          </div>
          <div className="flex items-center gap-1">
            <span>สร้างด้วยความตั้งใจ</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
