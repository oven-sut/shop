'use client';

import React from 'react';
import { Zap, ShieldCheck, Wallet, Headphones } from 'lucide-react';

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

  /* Divided by hairlines rather than boxed in cards — fewer edges, same grouping. */
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-neutral-200">
      {features.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.title}
            className="flex items-start gap-3.5 p-5 border-b border-r border-neutral-200"
          >
            <IconComponent className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <h4 className="text-sm font-semibold text-neutral-900">{item.title}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
