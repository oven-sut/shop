'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Store, LayoutDashboard, Package, Boxes, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type AdminTab = 'overview' | 'products' | 'supplier' | 'orders' | 'analytics' | 'settings';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'ภาพรวม (Overview)', icon: LayoutDashboard },
    { id: 'products', label: 'จัดการสินค้า (Products)', icon: Package },
    { id: 'supplier', label: 'ซัพพลายเออร์', icon: Boxes },
    { id: 'orders', label: 'คำสั่งซื้อ (Orders)', icon: ShoppingCart },
    { id: 'analytics', label: 'วิเคราะห์ & รายงาน', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่าร้านค้า', icon: Settings }
  ];

  return (
    <header className="bg-white border-b border-neutral-200 text-neutral-900 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Badge */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-mark.png"
              alt=""
              width={470}
              height={462}
              priority
              className="h-10 w-auto"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-neutral-900">
                  NEO APP
                </span>
                <Badge variant="outline" className="bg-neutral-100 text-neutral-700 text-[10px] font-bold border-neutral-300">
                  BACKOFFICE
                </Badge>
              </div>
              <span className="text-xs text-neutral-500">ระบบบริหารจัดการหลังบ้าน</span>
            </div>
          </div>

          {/* Switch to Storefront Button */}
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200 px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
            >
              <Store className="w-4 h-4 text-neutral-900" />
              <span>กลับสู่หน้าร้าน (Storefront)</span>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white border-0'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
