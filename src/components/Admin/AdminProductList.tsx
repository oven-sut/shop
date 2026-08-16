'use client';

import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product } from '../../types/ecommerce';
import { AdminProductModal } from './AdminProductModal';
import { Plus, Search, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminProductList: React.FC = () => {
  const { products, isLoading, deleteProduct, updateProduct } = useShop();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ทั้งหมด');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Whatever categories the catalogue actually uses.
  const categories = ['ทั้งหมด', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ทั้งหมด' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleStockAdjustment = (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    updateProduct({ ...product, stock: newStock });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-neutral-200 p-4 rounded-md shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Input
              type="text"
              placeholder="ค้นหาชื่อสินค้าในคลัง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-50 border-neutral-200 rounded-md py-2 pl-9 pr-4 text-xs text-neutral-900 placeholder-neutral-400"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 rounded-md px-3 py-2 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Add Product Button */}
        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="bg-neutral-900 hover:bg-neutral-700 text-white font-bold text-xs px-4 py-2.5 rounded-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 border-0"
        >
          <Plus className="w-4 h-4" />
          <span className="sm:hidden">เพิ่มสินค้าใหม่</span>
          <span className="hidden sm:inline">เพิ่มสินค้าใหม่ (Add Product)</span>
        </Button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm">
        {/* Below lg: one card per product, so the stock steppers and the edit and
            delete buttons stay on screen instead of past the right edge. */}
        <ul className="lg:hidden divide-y divide-neutral-100">
          {isLoading ? (
            Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="p-4 flex gap-3">
                <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </li>
            ))
          ) : filteredProducts.length === 0 ? (
            <li className="p-8 text-center text-neutral-400">ไม่พบรายการสินค้าที่ค้นหา</li>
          ) : (
            filteredProducts.map((p) => (
              <li key={p.id} className="p-4 space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-12 h-12 object-cover rounded-lg border border-neutral-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-neutral-900 block truncate">{p.name}</span>
                    <span className="text-[10px] text-neutral-400 block">
                      {p.category || 'ไม่มีหมวดหมู่'} · คะแนน {p.rating} ({p.reviewsCount})
                    </span>
                  </div>
                  {p.badge && (
                    <Badge
                      variant="outline"
                      className="shrink-0 bg-neutral-100 text-neutral-700 border-neutral-300 px-2 py-0.5 text-[10px] font-bold"
                    >
                      {p.badge}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
                  <span className="font-bold text-neutral-900">
                    ฿{p.price.toLocaleString()}
                    {p.originalPrice && (
                      <span className="ml-2 text-[10px] text-neutral-400 line-through font-normal">
                        ฿{p.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`font-bold px-2 py-0.5 rounded text-[11px] border-0 ${
                        !p.isUnlimited && p.stock <= 5
                          ? 'bg-neutral-50 text-neutral-900 border border-neutral-400'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {p.isUnlimited ? 'ไม่จำกัด' : `${p.stock} ชิ้น`}
                    </Badge>
                    {/* ของที่ขายไม่จำกัดไม่มีตัวเลขให้บวกลบ */}
                    {!p.isUnlimited && (
                      <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded">
                        <button
                          onClick={() => handleStockAdjustment(p, -1)}
                          className="px-2 py-1 hover:bg-neutral-200 text-neutral-600"
                          aria-label={`ลดสต็อก ${p.name}`}
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleStockAdjustment(p, 1)}
                          className="px-2 py-1 hover:bg-neutral-200 text-neutral-600 border-l border-neutral-200"
                          aria-label={`เพิ่มสต็อก ${p.name}`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct(p);
                      setIsModalOpen(true);
                    }}
                    className="bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200 text-[10px] font-bold"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    แก้ไข
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`ยืนยันการลบสินค้า "${p.name}" จากร้านค้าใช่หรือไม่?`)) {
                        deleteProduct(p.id);
                      }
                    }}
                    className="bg-neutral-50 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-neutral-200"
                    aria-label={`ลบสินค้า ${p.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>

        {/* Product Table using shadcn Table */}
        <div className="hidden lg:block overflow-x-auto">
          <Table className="w-full text-left text-xs text-neutral-700">
            <TableHeader className="bg-neutral-50 text-neutral-600 uppercase font-semibold">
              <TableRow className="border-b border-neutral-200 hover:bg-transparent">
                <TableHead className="p-3.5 text-neutral-600">สินค้า</TableHead>
                <TableHead className="p-3.5 text-neutral-600">หมวดหมู่</TableHead>
                <TableHead className="p-3.5 text-neutral-600">ราคาขาย</TableHead>
                <TableHead className="p-3.5 text-neutral-600">สต็อกคงเหลือ</TableHead>
                <TableHead className="p-3.5 text-neutral-600">ป้ายกำกับ</TableHead>
                <TableHead className="p-3.5 text-neutral-600">คะแนนรีวิว</TableHead>
                <TableHead className="p-3.5 text-right text-neutral-600">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-neutral-100">
              {/* Loading first — otherwise an admin opening the tab is told the
                  search found nothing while the catalogue is still in flight. */}
              {isLoading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index} className="border-b border-neutral-100">
                    {Array.from({ length: 7 }, (_, cell) => (
                      <TableCell key={cell} className="p-3.5">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-8 text-center text-neutral-400">
                    ไม่พบรายการสินค้าที่ค้นหา
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => (
                  <TableRow key={p.id} className="hover:bg-neutral-50 border-b border-neutral-100">
                    <TableCell className="p-3.5 flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border border-neutral-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-neutral-900 block">{p.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">ID: {p.id}</span>
                      </div>
                    </TableCell>

                    <TableCell className="p-3.5 text-neutral-500">{p.category}</TableCell>

                    <TableCell className="p-3.5 font-bold text-neutral-900">
                      ฿{p.price.toLocaleString()}
                      {p.originalPrice && (
                        <span className="block text-[10px] text-neutral-400 line-through">
                          ฿{p.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </TableCell>

                    {/* Stock with quick buttons */}
                    <TableCell className="p-3.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`font-bold px-2 py-0.5 rounded text-[11px] border-0 ${
                            p.isUnlimited
                              ? 'bg-neutral-100 text-neutral-700'
                              : p.stock <= 0
                              ? 'bg-neutral-50 text-neutral-900 border border-neutral-400'
                              : p.stock <= 5
                              ? 'bg-neutral-50 text-neutral-700 border border-neutral-400'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {p.isUnlimited ? 'ไม่จำกัด' : `${p.stock} ชิ้น`}
                        </Badge>
                        
                        {!p.isUnlimited && (
                          <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded">
                            <button
                              onClick={() => handleStockAdjustment(p, -1)}
                              className="px-1.5 py-0.5 hover:bg-neutral-200 text-neutral-600"
                              title="ลดสต็อก 1"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleStockAdjustment(p, 1)}
                              className="px-1.5 py-0.5 hover:bg-neutral-200 text-neutral-600 border-l border-neutral-200"
                              title="เพิ่มสต็อก 1"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="p-3.5">
                      {p.badge ? (
                        <Badge variant="outline" className="bg-neutral-100 text-neutral-700 border-neutral-300 px-2 py-0.5 text-[10px] font-bold">
                          {p.badge}
                        </Badge>
                      ) : (
                        <span className="text-neutral-400 text-[10px]">-</span>
                      )}
                    </TableCell>

                    <TableCell className="p-3.5 font-bold text-neutral-900">
                      {p.rating} <span className="text-neutral-400 text-[10px] font-normal">({p.reviewsCount})</span>
                    </TableCell>

                    <TableCell className="p-3.5 text-right space-x-2">
                      <Button
                        size="icon-xs"
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(p);
                          setIsModalOpen(true);
                        }}
                        className="bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border-neutral-200"
                        title="แก้ไขสินค้า"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="icon-xs"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`ยืนยันการลบสินค้า "${p.name}" จากร้านค้าใช่หรือไม่?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="bg-neutral-50 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 border-neutral-200"
                        title="ลบสินค้า"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal — mounted only while open and keyed by product, so the form always
          starts from the right values without a reset effect. */}
      {isModalOpen && (
        <AdminProductModal
          key={editingProduct?.id ?? 'new'}
          isOpen
          onClose={() => setIsModalOpen(false)}
          editingProduct={editingProduct}
        />
      )}

    </div>
  );
};
