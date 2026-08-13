'use client';

import React from 'react';
import { useShop } from '../context/ShopContext';
import { ShoppingBag, Flame, Sparkles, Shield, Truck } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { setSelectedCategory, setIsCartOpen } = useShop();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl my-6 border border-slate-800 shadow-2xl">
      {/* Background Decorative Glow Effects */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column Text */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span>นวัตกรรมไอทีประจำปี 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-100">
            ยกระดับทุกประสบการณ์ด้วย <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              อุปกรณ์ไอที & แกดเจ็ตระดับพรีเมียม
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-light">
            คัดสรรเฉพาะหูฟังไร้สาย คีย์บอร์ดกลไก สมาร์ทวอทช์ และอุปกรณ์ตั้งโต๊ะคุณภาพสูง รับประกันศูนย์ไทย 1 ปีเต็ม พร้อมบริการจัดส่งด่วนฟรีทั่วประเทศ
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setSelectedCategory('ทั้งหมด')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>เลือกช้อปสินค้าทั้งหมด</span>
            </button>

            <a
              href="#products-section"
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ดูลดราคาพิเศษ</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-slate-300">
            <div>
              <span className="block text-xl font-extrabold text-white">100%</span>
              <span className="text-xs text-slate-400">ของแท้ประกันศูนย์</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white">24 ชม.</span>
              <span className="text-xs text-slate-400">จัดส่งไวถึงบ้าน</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-white">4.9 ★</span>
              <span className="text-xs text-slate-400">คะแนนพึงพอใจลูกค้า</span>
            </div>
          </div>
        </div>

        {/* Right Column Featured Banner Graphic */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 group">
            {/* Main Featured Image */}
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
              alt="AuraSound Pro Headphones"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            
            {/* Floating Tag Badge */}
            <div className="absolute top-4 right-4 bg-red-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>HOT DEAL -23%</span>
            </div>

            {/* Bottom Graphic Overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-indigo-400 font-bold tracking-wide uppercase">สินค้าแนะนำประจำสัปดาห์</span>
              <h3 className="text-base font-bold text-white mt-0.5">AuraSound Pro Wireless</h3>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-amber-400">฿4,990</span>
                  <span className="text-xs text-slate-500 line-through">฿6,500</span>
                </div>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  ใส่ตะกร้า
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
