'use client';

import React from 'react';
import { useShop } from '../../context/ShopContext';
import { PieChart, Tag, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AdminAnalytics: React.FC = () => {
  const { products, coupons } = useShop();

  // Category counts
  const categoryCounts: Record<string, number> = {};
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const totalProds = products.length || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category breakdown */}
        <Card className="bg-white border-neutral-200 p-6 rounded-md space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-neutral-900" />
            <h3 className="text-base font-bold text-neutral-900">สัดส่วนสินค้าแยกตามหมวดหมู่</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalProds) * 100);
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-neutral-600">
                    <span>{cat}</span>
                    <span className="font-bold text-neutral-900">{count} รายการ ({pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-neutral-900 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Coupons active */}
        <Card className="bg-white border-neutral-200 p-6 rounded-md space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-neutral-900" />
            <h3 className="text-base font-bold text-neutral-900">คูปองโปรโมชันที่กำลังใช้งาน</h3>
          </div>

          <div className="space-y-3">
            {coupons.length === 0 && (
              <p className="text-xs text-neutral-400 py-6 text-center">
                ยังไม่มีคูปองในระบบ — เพิ่มได้ที่ตาราง coupons ในฐานข้อมูล
              </p>
            )}

            {coupons.map((c) => (
              <div key={c.code} className="p-3.5 bg-neutral-50 rounded-md border border-neutral-200 text-xs flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="font-mono font-bold text-neutral-700 bg-neutral-100 border-neutral-300">
                    {c.code}
                  </Badge>
                  <p className="text-neutral-500 mt-1">{c.description}</p>
                </div>
                <Badge
                  className={
                    c.isActive
                      ? 'bg-neutral-200 text-neutral-900 font-bold border-0 text-[10px]'
                      : 'bg-neutral-200 text-neutral-600 font-bold border-0 text-[10px]'
                  }
                >
                  {c.isActive ? 'ใช้งานได้' : 'ปิดใช้งาน'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Top rated products card */}
      <Card className="bg-white border-neutral-200 p-6 rounded-md space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-neutral-900" />
          <h3 className="text-base font-bold text-neutral-900">สินค้าระดับ 5 ดาวได้รับความนิยมสูงสุด</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {products.slice(0, 3).map((p) => (
            <div key={p.id} className="p-4 bg-neutral-50 rounded-md border border-neutral-200 flex items-center gap-3">
              <img src={p.image} alt="" className="w-12 h-12 object-cover rounded-md border border-neutral-200 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-neutral-900 text-xs truncate block">{p.name}</span>
                <span className="text-neutral-900 text-xs font-bold block mt-0.5">{p.rating} ({p.reviewsCount} รีวิว)</span>
                <span className="text-neutral-900 text-xs font-bold">฿{p.price.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};
