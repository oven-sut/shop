'use client';

import React from 'react';
import { Zap, ShieldCheck, Wallet, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const FeatureBar: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'ได้รับทันทีหลังชำระ',
      desc: 'ไม่ต้องรอ ไม่มีค่าจัดส่ง'
    },
    {
      icon: Wallet,
      title: 'เติมเงินด้วยสลิปโอน',
      desc: 'ระบบตรวจสลิปกับธนาคารอัตโนมัติ'
    },
    {
      icon: ShieldCheck,
      title: 'ตรวจสลิปกันปลอม',
      desc: 'ใช้สลิปซ้ำหรือสลิปปลอมไม่ได้'
    },
    {
      icon: Headphones,
      title: 'ดูแลหลังการขาย',
      desc: 'ติดต่อทีมงานได้ตลอดเวลา'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
      {features.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <Card
            key={idx}
            className="flex items-center gap-4 bg-white border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <IconComponent className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
