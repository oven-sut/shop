'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Heart,
  Search,
  Home,
  Store,
  Package,
  Wallet as WalletIcon,
  RotateCcw,
  MessageCircle,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar: React.FC = () => {
  const {
    cart,
    wishlist,
    balance,
    searchQuery,
    setSearchQuery,
    setIsCartOpen,
    cartTotal,
  } = useShop();

  const { user, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const pageLinks = [
    { href: '/', label: 'หน้าแรก', icon: Home },
    { href: '/#products-section', label: 'ร้านค้า', icon: Store },
    { href: '/orders', label: 'บัญชีเกมที่ซื้อไว้', icon: Package },
    { href: '/wallet', label: 'กระเป๋าเงิน', icon: WalletIcon },
    { href: '/orders', label: 'Reset HWID', icon: RotateCcw },
    { href: '/contact', label: 'ติดต่อเรา', icon: MessageCircle },
    ...(isAdmin ? [{ href: '/admin', label: 'ระบบหลังบ้าน (Admin)', icon: LayoutDashboard }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Notice strip — inverted rather than coloured. */}
      <div className="bg-neutral-900 text-white text-xs py-2 px-4 text-center tracking-wide">
        เติมเงินเข้ากระเป๋า แล้วซื้อแอปได้ทันทีในคลิกเดียว
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo-mark.png"
              alt=""
              width={470}
              height={462}
              priority
              className="h-9 w-auto"
            />
            <div className="leading-none">
              <span className="text-lg font-bold tracking-tight text-neutral-900">
                NEO APP
              </span>
              <span className="block text-[10px] text-neutral-400 tracking-[0.2em] uppercase mt-1">
                App Store
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Input
                type="text"
                placeholder="ค้นหาแอปที่ต้องการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-neutral-50 border-neutral-200 rounded-md pl-10 pr-14 text-sm text-neutral-900 placeholder-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-0 focus:bg-white transition-colors"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-900"
                >
                  ล้าง
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                title="รายการโปรด"
                className="size-10 rounded-md bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200"
              >
                <Heart className="w-[18px] h-[18px]" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[10px] font-semibold w-5 h-5 rounded-full p-0 flex items-center justify-center ring-2 ring-white">
                    {wishlist.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Cart Button */}
            <Button
              onClick={() => setIsCartOpen(true)}
              className="h-10 flex items-center gap-2.5 bg-neutral-900 hover:bg-neutral-700 text-white px-4 rounded-md transition-colors border-0"
            >
              <div className="relative">
                <ShoppingBag className="w-[18px] h-[18px]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-neutral-900 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
                {/* The trigger already renders a <button>; nesting another one
                    inside it would be invalid HTML. */}
                <DropdownMenuTrigger
                  aria-label={`บัญชีของ ${user.name}`}
                  className="relative h-10 w-10 rounded-full p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                >
                  <Avatar className="h-10 w-10 border border-neutral-200">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-neutral-100 text-neutral-700 font-semibold">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 bg-white border-neutral-200 text-neutral-900 rounded-md shadow-lg" align="end">
                  {/* Base UI requires GroupLabel to sit inside a Group. */}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-semibold leading-none text-neutral-900">{user.name}</p>
                        <p className="text-xs leading-none text-neutral-500 truncate">{user.email}</p>
                        <div className="pt-1">
                          <Badge
                            className={
                              isAdmin
                                ? 'bg-neutral-900 text-white border-0 text-[10px] tracking-wider rounded-sm'
                                : 'bg-neutral-100 text-neutral-600 border-0 text-[10px] tracking-wider rounded-sm'
                            }
                          >
                            {user.role === 'admin' ? 'ADMIN' : 'MEMBER'}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-neutral-100" />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-neutral-500 focus:text-neutral-900">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button
                  variant="outline"
                  className="h-10 flex items-center gap-2 bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-200 px-4 rounded-md text-sm font-medium"
                >
                  <UserIcon className="w-4 h-4" />
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
              placeholder="ค้นหาแอปที่ต้องการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-neutral-50 border-neutral-200 rounded-md pl-10 pr-4 text-sm text-neutral-900 placeholder-neutral-400"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Page Navigation — site sections plus the account pages pulled out of the profile dropdown */}
        {user && (
          <nav className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar border-t border-neutral-100">
            {pageLinks.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === '/' : pathname === href;
              return (
                <Link key={label} href={href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-9 px-4 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-900 font-medium'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                    {href === '/wallet' && (
                      <span className={isActive ? 'font-semibold' : 'font-semibold text-neutral-900'}>
                        ฿{balance.toLocaleString()}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
