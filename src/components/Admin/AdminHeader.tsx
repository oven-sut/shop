'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Store, LayoutDashboard, Package, Boxes, ShoppingCart, Users, BarChart3, ScrollText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type AdminTab = 'overview' | 'products' | 'supplier' | 'orders' | 'users' | 'analytics' | 'audit' | 'settings';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, setActiveTab }) => {
  /**
   * `short` is what a phone shows. Seven tabs scroll sideways either way, but
   * the English half of each label doubles how far the thumb has to travel to
   * reach the last one.
   */
  const tabs: { id: AdminTab; label: string; short: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'ภาพรวม (Overview)', short: 'ภาพรวม', icon: LayoutDashboard },
    { id: 'products', label: 'จัดการสินค้า (Products)', short: 'สินค้า', icon: Package },
    { id: 'supplier', label: 'ซัพพลายเออร์', short: 'ซัพพลาย', icon: Boxes },
    { id: 'orders', label: 'คำสั่งซื้อ (Orders)', short: 'คำสั่งซื้อ', icon: ShoppingCart },
    { id: 'users', label: 'ผู้ใช้งาน (Users)', short: 'ผู้ใช้งาน', icon: Users },
    { id: 'analytics', label: 'วิเคราะห์ & รายงาน', short: 'วิเคราะห์', icon: BarChart3 },
    { id: 'audit', label: 'บันทึกระบบ (Log)', short: 'บันทึก', icon: ScrollText },
    { id: 'settings', label: 'ตั้งค่าร้านค้า', short: 'ตั้งค่า', icon: Settings }
  ];

  return (
    <header className="bg-white border-b border-neutral-200 text-neutral-900 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-4">

          {/* Logo & Badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image
              src="/logo-mark.png"
              alt=""
              width={470}
              height={462}
              priority
              className="h-8 sm:h-10 w-auto"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">
                  NEO APP
                </span>
                <Badge variant="outline" className="hidden sm:inline-flex bg-neutral-100 text-neutral-700 text-[10px] font-bold border-neutral-300">
                  BACKOFFICE
                </Badge>
              </div>
              {/* The strapline is the first thing to go: on a phone the row has
                  only enough width for the name and the way out. */}
              <span className="hidden sm:block text-xs text-neutral-500">
                ระบบบริหารจัดการหลังบ้าน
              </span>
            </div>
          </div>

          {/* Switch to Storefront Button */}
          <Link href="/" className="shrink-0">
            <Button
              variant="outline"
              aria-label="กลับสู่หน้าร้าน"
              className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200 px-3 sm:px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
            >
              <Store className="w-4 h-4 text-neutral-900" />
              <span className="hidden sm:inline">กลับสู่หน้าร้าน (Storefront)</span>
            </Button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar border-t border-neutral-100">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 shrink-0 px-3 sm:px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white border-0'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span className="sm:hidden">{tab.short}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
