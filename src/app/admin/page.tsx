'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShopProvider, useShop } from '../../context/ShopContext';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { AdminHeader } from '../../components/Admin/AdminHeader';
import { AdminOverview } from '../../components/Admin/AdminOverview';
import { AdminProductList } from '../../components/Admin/AdminProductList';
import { AdminOrderList } from '../../components/Admin/AdminOrderList';
import { AdminAnalytics } from '../../components/Admin/AdminAnalytics';
import { ToastContainer } from '../../components/ToastContainer';
import { Settings, Save, RefreshCw, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function AdminContent() {
  const { showToast } = useShop();
  const { isAdmin, loginAsAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'analytics' | 'settings'>('overview');

  // Passcode gate state
  const [passcode, setPasscode] = useState('');

  // Settings State
  const [storeName, setStoreName] = useState('NEO TECH Store');
  const [freeShipMin, setFreeShipMin] = useState(500);
  const [taxRate, setTaxRate] = useState(7);
  const [storeStatus, setStoreStatus] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('บันทึกการตั้งค่าร้านค้าสำเร็จแล้ว', 'success');
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginAsAdmin(passcode);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'warning');
    }
  };

  // Route Guard if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
        <ToastContainer />
        <Card className="max-w-md w-full bg-white border-slate-200 shadow-xl rounded-3xl p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">พื้นที่ผู้ดูแลระบบ (Admin Only)</h2>
            <p className="text-xs text-slate-500 mt-1">
              กรุณายืนยันรหัสผ่าน Passcode เพื่อเข้าสู่หน้าจัดการหลังบ้าน (ทดสอบกรอก <strong className="font-mono text-indigo-600">1234</strong>)
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-3 pt-2">
            <div className="relative">
              <Input
                type="password"
                required
                placeholder="กรอก 1234"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs font-mono text-center"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg border-0 flex items-center justify-center gap-2"
            >
              <span>ยืนยันเข้าสู่ระบบ Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              ← ย้อนกลับสู่หน้าร้านค้า
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <ToastContainer />
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Tab Switcher Content */}
        {activeTab === 'overview' && (
          <AdminOverview
            onNavigateToProducts={() => setActiveTab('products')}
            onNavigateToOrders={() => setActiveTab('orders')}
          />
        )}

        {activeTab === 'products' && <AdminProductList />}

        {activeTab === 'orders' && <AdminOrderList />}

        {activeTab === 'analytics' && <AdminAnalytics />}

        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <Settings className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">ตั้งค่าระบบร้านค้า (Store Settings)</h2>
                <p className="text-xs text-slate-500">ปรับแต่งชื่อร้าน อัตราภาษี และเงื่อนไขการจัดส่ง</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อร้านค้า (Store Name)</label>
                <Input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ยอดขั้นต่ำสำหรับจัดส่งฟรี (฿)</label>
                <Input
                  type="number"
                  value={freeShipMin}
                  onChange={(e) => setFreeShipMin(Number(e.target.value))}
                  className="w-full bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">อัตราภาษีมูลค่าเพิ่ม VAT (%)</label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border-slate-200 text-slate-900"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">สถานะเปิด/ปิดรับคำสั่งซื้อ</span>
                  <span className="text-slate-500 text-[11px]">เปิดไว้เพื่อให้ลูกค้าทำการสั่งซื้อสินค้าหน้าร้านตามปกติ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStoreStatus(!storeStatus)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    storeStatus
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {storeStatus ? 'เปิดร้านปกติ' : 'ปิดปรับปรุง'}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="text-red-600 hover:text-red-700 font-semibold text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้น</span>
                </button>

                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 border-0"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </Button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <ShopProvider>
        <AdminContent />
      </ShopProvider>
    </AuthProvider>
  );
}
