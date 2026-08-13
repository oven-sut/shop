'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 mt-20 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <span className="text-lg font-extrabold text-slate-900">
                NEO <span className="text-indigo-600">TECH</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-500">
              ศูนย์รวมอุปกรณ์ไอที แกดเจ็ต และสินค้าไลฟ์สไตล์ระดับพรีเมียม การันตีของแท้ศูนย์ไทย 100% บริการรวดเร็ว ประทับใจ
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>รับประกันสินค้า 1 ปีเต็มทุกชิ้น</span>
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">หมวดหมู่สินค้า</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-indigo-600 transition-colors">หูฟังไร้สาย & ลำโพงบลูทูธ</Link></li>
              <li><Link href="/" className="hover:text-indigo-600 transition-colors">สมาร์ทวอทช์ & แกดเจ็ตสุขภาพ</Link></li>
              <li><Link href="/" className="hover:text-indigo-600 transition-colors">คีย์บอร์ดกลไก & เมาส์เกมมิ่ง</Link></li>
              <li><Link href="/" className="hover:text-indigo-600 transition-colors">อุปกรณ์ตกแต่งโต๊ะทำงาน (Desk Setup)</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">ติดต่อเรา</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>99/123 อาคารนีโอเทค ชั้น 15 ถนนสุขุมวิท กรุงเทพฯ 10110</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>02-999-8888 (09:00 - 20:00 น.)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>support@neotech-store.th</span>
              </li>
            </ul>
          </div>

          {/* Newsletter & Admin quick access */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">รับข่าวสาร & โค้ดส่วนลด</h4>
            <p className="text-xs text-slate-500">สมัครรับอีเมลข่าวสารเพื่อไม่พลาดโปรโมชันลดสูงสุด 50%</p>
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
          <p>© 2026 NEO TECH Store. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>สร้างด้วยความตั้งใจเพื่อประสบการณ์ช้อปปิ้งที่ดีที่สุด</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
