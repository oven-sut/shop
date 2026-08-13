'use client';

import React from 'react';
import Link from 'next/link';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Heart, Search, ShieldCheck, Zap, Sparkles, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar: React.FC = () => {
  const {
    cart,
    wishlist,
    searchQuery,
    setSearchQuery,
    setIsCartOpen,
    cartTotal,
    selectedCategory,
    setSelectedCategory
  } = useShop();

  const { user, isAdmin, logout } = useAuth();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = [
    'ทั้งหมด',
    'หูฟัง & แอคเซสซอรี',
    'สมาร์ทวอทช์ & แกดเจ็ต',
    'เกมมิ่ง & ไอที',
    'ไลฟ์สไตล์ & เดสก์ท็อป'
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-sm">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-semibold py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>โปรโมชันพิเศษฉลองเปิดร้านใหม่! ใส่โค้ด <span className="bg-white/20 px-1.5 py-0.5 rounded font-mono text-amber-300">DISCOUNT500</span> ลด 15% ทันที</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                NEO <span className="text-indigo-600">TECH</span>
              </span>
              <span className="block text-[10px] text-slate-500 tracking-widest font-medium uppercase">
                Premium Store
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Input
                type="text"
                placeholder="ค้นหาสินค้า เช่น หูฟัง, คีย์บอร์ด, สมาร์ทวอทช์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/80 border-slate-200 rounded-full py-2 pl-11 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ล้าง
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                title="รายการโปรด"
                className="rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 hover:text-pink-600 border-slate-200"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full p-0 flex items-center justify-center border-2 border-white shadow">
                    {wishlist.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Cart Button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 border-0"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="font-semibold text-sm hidden sm:inline">
                ฿{cartTotal.toLocaleString()}
              </span>
            </Button>

            {/* User Auth Profile Dropdown */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-indigo-500/40">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white border-slate-200 text-slate-900 shadow-xl" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-slate-900">{user.name}</p>
                      <p className="text-xs leading-none text-slate-500 truncate">{user.email}</p>
                      <div className="pt-1">
                        <Badge variant="outline" className={isAdmin ? "bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]" : "bg-slate-100 text-slate-700 border-slate-200 text-[10px]"}>
                          {user.role === 'admin' ? '⚡ ADMIN' : '👤 MEMBER'}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  {isAdmin && (
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href="/admin" className="flex items-center gap-2 text-indigo-600 font-semibold w-full">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>ระบบหลังบ้าน (Admin)</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold"
                >
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  <span>เข้าสู่ระบบ</span>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="ค้นหาสินค้าไอที..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Category Navigation Pills */}
        <nav className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-200/80">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <Button
                key={cat}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border-0'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200'
                }`}
              >
                {cat}
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
