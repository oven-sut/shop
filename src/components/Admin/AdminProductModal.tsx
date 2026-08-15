'use client';

import React, { useCallback, useState } from 'react';
import { Product } from '../../types/ecommerce';
import { useShop } from '../../context/ShopContext';
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { AdminProductCodes } from './AdminProductCodes';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

type ProductBadge = Product['badge'];

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct
}) => {
  const { products, addProduct, updateProduct, uploadProductImage } = useShop();

  /**
   * Suggestions only — the field itself is free text, so typing a name that is
   * not here creates the category the moment the product is saved. That mirrors
   * the storefront, which builds its filter strip from the categories products
   * actually carry rather than from a fixed list.
   */
  const knownCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, 'th'));

  // The form is seeded once, at mount. AdminProductList mounts this only while the
  // modal is open and keys it by product id, so switching products or reopening the
  // modal remounts it with fresh values — no reset effect needed.
  const [name, setName] = useState(editingProduct?.name ?? '');
  const [category, setCategory] = useState(editingProduct?.category ?? '');
  const [price, setPrice] = useState<number | ''>(editingProduct?.price ?? '');
  const [originalPrice, setOriginalPrice] = useState<number | ''>(
    editingProduct?.originalPrice ?? ''
  );
  const [stock, setStock] = useState<number | ''>(editingProduct?.stock ?? '');
  const [description, setDescription] = useState(editingProduct?.description ?? '');
  const [image, setImage] = useState(editingProduct?.image ?? '');
  const [badge, setBadge] = useState<ProductBadge>(editingProduct ? editingProduct.badge : undefined);
  const [isService, setIsService] = useState(editingProduct?.isService ?? false);
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>(() =>
    editingProduct?.specs ? Object.entries(editingProduct.specs).map(([key, val]) => ({ key, val })) : []
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ตั้งค่าโดยแผงคลังรหัสด้านล่าง: พอสินค้ามีรหัสอยู่ในคลัง สต็อกจะถูกคำนวณจาก
  // จำนวนรหัสที่ยังไม่ถูกขาย การให้กรอกทับได้จะทำให้สองตัวเลขนี้ขัดกันทันที
  const [codeStock, setCodeStock] = useState<{ available: number; managed: boolean }>({
    available: 0,
    managed: false,
  });

  // useCallback เพราะแผงคลังรหัสใช้ค่านี้เป็น dependency ของ effect ที่โหลดข้อมูล
  const handleStockChange = useCallback(
    (info: { available: number; managed: boolean }) => setCodeStock(info),
    []
  );

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadProductImage(file);
    setIsUploading(false);

    if (url) setImage(url);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '' || stock === '') return;

    const specsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.val.trim()) {
        specsObj[s.key.trim()] = s.val.trim();
      }
    });

    const payload = {
      name,
      // Trimmed, or a stray space would split one category into two on the
      // storefront filter strip.
      category: category.trim(),
      price: Number(price),
      originalPrice: originalPrice !== '' ? Number(originalPrice) : undefined,
      // สินค้าที่ขายจากคลังรหัสไม่ส่ง stock ไป ปล่อยให้ฐานข้อมูลคำนวณเอง
      stock: codeStock.managed ? undefined : Number(stock),
      description,
      image,
      badge,
      isService,
      specs: specsObj,
    };

    setIsSaving(true);
    const saved = editingProduct
      ? await updateProduct({ ...payload, id: editingProduct.id })
      : await addProduct({ ...payload, isFeatured: true });
    setIsSaving(false);

    // Stay open on failure so the admin does not lose what they typed.
    if (saved) onClose();
  };

  const addSpecRow = () => {
    setSpecs([...specs, { key: '', val: '' }]);
  };

  const removeSpecRow = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative bg-white border border-neutral-200 rounded-md max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-neutral-900 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900">
            {editingProduct ? `แก้ไขสินค้า: ${editingProduct.name}` : 'เพิ่มสินค้าใหม่ลงร้านค้า'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                ชื่อสินค้า <span className="text-neutral-900">*</span>
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น AuraSound Pro Wireless"
                className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                หมวดหมู่สินค้า <span className="text-neutral-900">*</span>
              </label>
              <Input
                type="text"
                required
                list="admin-product-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="เลือกจากที่มีอยู่ หรือพิมพ์หมวดใหม่"
                className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
              />
              <datalist id="admin-product-categories">
                {knownCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="mt-1 text-[11px] text-neutral-400">
                พิมพ์ชื่อใหม่ได้เลย หมวดจะถูกสร้างขึ้นตอนบันทึกสินค้า
              </p>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                ราคาขาย (฿) <span className="text-neutral-900">*</span>
              </label>
              <Input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                ราคาเดิมขีดฆ่า (฿)
              </label>
              <Input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                จำนวนสต็อก (ชิ้น) <span className="text-neutral-900">*</span>
              </label>
              <Input
                type="number"
                required={!codeStock.managed}
                disabled={codeStock.managed}
                min={0}
                value={codeStock.managed ? codeStock.available : stock}
                onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-neutral-50 border-neutral-200 text-neutral-900 disabled:opacity-60"
              />
              {codeStock.managed && (
                <p className="mt-1 text-[11px] text-neutral-400">
                  นับจากรหัสที่ยังไม่ถูกขายในคลังด้านล่าง
                </p>
              )}
            </div>
          </div>

          {/* Badge Selection */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">ป้ายกำกับสินค้า (Badge)</label>
            <div className="flex gap-2">
              {([undefined, 'HOT', 'NEW', 'SALE', 'LIMITED'] as ProductBadge[]).map((b) => (
                <button
                  type="button"
                  key={b || 'none'}
                  onClick={() => setBadge(b)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    badge === b
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {b || 'ไม่มี'}
                </button>
              ))}
            </div>
          </div>

          {/* Service flag — a custom job (e.g. รับทำเว็บไซต์) isn't stock you count */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md flex items-start justify-between gap-3">
            <div>
              <span className="font-semibold text-neutral-900 block">เป็นบริการ ไม่ใช่สินค้านับสต็อก</span>
              <span className="text-[11px] text-neutral-500">
                จะไม่แสดงในแคตาล็อกหน้าแรก และไม่นับสต็อกรวมเข้ากับสถิติของร้าน
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isService}
              aria-label="เป็นบริการ ไม่ใช่สินค้านับสต็อก"
              onClick={() => setIsService((prev) => !prev)}
              className={`shrink-0 px-3 py-1.5 rounded-md text-[11px] font-bold border transition-all ${
                isService
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-400 border-neutral-300'
              }`}
            >
              {isService ? 'ใช่' : 'ไม่ใช่'}
            </button>
          </div>

          {/* Product image — uploaded to Supabase Storage */}
          <div className="space-y-2">
            <label className="block font-semibold text-neutral-700">รูปภาพสินค้า</label>

            <div className="flex items-start gap-3">
              <div className="w-24 h-24 rounded-md border border-neutral-200 bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-neutral-300" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  disabled={isUploading}
                  onChange={handleImageUpload}
                  className="w-full text-[11px] text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:text-neutral-700 file:font-bold file:text-[11px] hover:file:bg-neutral-200 cursor-pointer"
                />
                <Input
                  type="url"
                  required
                  placeholder="หรือวาง URL รูปภาพ"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-neutral-50 border-neutral-200 text-neutral-900"
                />
                <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                  {isUploading && <Spinner className="size-3 text-neutral-900" />}
                  {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเก็บที่ Supabase Storage · ไม่เกิน 5 MB'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">รายละเอียดสินค้า</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-3 text-neutral-900 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Key Specs Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-neutral-700">ข้อมูลทางเทคนิค (Key Specs)</label>
              <button
                type="button"
                onClick={addSpecRow}
                className="text-neutral-900 hover:text-neutral-700 text-[11px] font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มหัวข้อ spec</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {specs.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="หัวข้อ (เช่น แบตเตอรี่)"
                    value={s.key}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].key = e.target.value;
                      setSpecs(copy);
                    }}
                    className="w-1/3 bg-neutral-50 border-neutral-200 text-neutral-900"
                  />
                  <Input
                    type="text"
                    placeholder="รายละเอียด (เช่น 40 ชั่วโมง)"
                    value={s.val}
                    onChange={(e) => {
                      const copy = [...specs];
                      copy[idx].val = e.target.value;
                      setSpecs(copy);
                    }}
                    className="flex-1 bg-neutral-50 border-neutral-200 text-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecRow(idx)}
                    className="text-neutral-400 hover:text-neutral-900 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/*
            มีได้เฉพาะตอนแก้ไข เพราะรหัสต้องผูกกับ product id ที่มีอยู่จริง
            สินค้าใหม่จึงต้องกดบันทึกก่อนแล้วเปิดกลับเข้ามาเติมรหัส
          */}
          {editingProduct && (
            <AdminProductCodes
              productId={editingProduct.id}
              onStockChange={handleStockChange}
            />
          )}

          <div className="pt-4 border-t border-neutral-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-5 py-2.5 rounded-md font-bold border-0"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="bg-neutral-900 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-md font-bold transition-all border-0 disabled:opacity-50"
            >
              {(isSaving || isUploading) && <Spinner className="mr-2" />}
              {isSaving ? 'กำลังบันทึก...' : editingProduct ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มสินค้า'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
