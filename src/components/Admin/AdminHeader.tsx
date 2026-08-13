'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Store, LayoutDashboard, Package, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminHeaderProps {
  activeTab: 'overview' | 'products' | 'orders' | 'analytics' | 'settings';
  setActiveTab: (tab: 'overview' | 'products' | 'orders' | 'analytics' | 'settings') => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'ภาพรวม (Overview)', icon: LayoutDashboard },
    { id: 'products', label: 'จัดการสินค้า (Products)', icon: Package },
    { id: 'orders', label: 'คำสั่งซื้อ (Orders)', icon: ShoppingCart },
    { id: 'analytics', label: 'วิเคราะห์ & รายงาน', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่าร้านค้า', icon: Settings }
  ];

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  NEO TECH
                </span>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-[10px] font-bold border-indigo-200">
                  BACKOFFICE
                </Badge>
              </div>
              <span className="text-xs text-slate-500">ระบบบริหารจัดการหลังบ้าน</span>
            </div>
          </div>

          {/* Switch to Storefront Button */}
          <Link href="/">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>กลับสู่หน้าร้าน (Storefront)</span>
            </Button>
          </Link>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar border-t border-slate-100">
          {tabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border-0'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
