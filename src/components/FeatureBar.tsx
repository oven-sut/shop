'use client';

import React from 'react';
import { Truck, ShieldCheck, CreditCard, Headphones } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const FeatureBar: React.FC = () => {
  const features = [
    {
      icon: Truck,
      title: 'จัดส่งฟรีทั่วประเทศ',
      desc: 'เมื่อสั่งซื้อสินค้า ฿500 ขึ้นไป'
    },
    {
      icon: ShieldCheck,
      title: 'รับประกันศูนย์ไทย 100%',
      desc: 'สินค้าแท้ มือหนึ่ง เคลมง่าย'
    },
    {
      icon: CreditCard,
      title: 'ชำระเงินปลอดภัย',
      desc: 'รองรับ PromptPay, บัตร และ COD'
    },
    {
      icon: Headphones,
      title: 'บริการลูกค้า 24/7',
      desc: 'ทีมงานพร้อมตอบข้อสงสัยทันที'
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
