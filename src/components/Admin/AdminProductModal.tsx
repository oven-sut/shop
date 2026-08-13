'use client';

import React, { useState } from 'react';
import { Product } from '../../types/ecommerce';
import { useShop } from '../../context/ShopContext';
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const { addProduct, updateProduct, uploadProductImage } = useShop();

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
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>(() =>
    editingProduct?.specs ? Object.entries(editingProduct.specs).map(([key, val]) => ({ key, val })) : []
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      category,
      price: Number(price),
      originalPrice: originalPrice !== '' ? Number(originalPrice) : undefined,
      stock: Number(stock),
      description,
      image,
      badge,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-900 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900">
            {editingProduct ? `แก้ไขสินค้า: ${editingProduct.name}` : 'เพิ่มสินค้าใหม่ลงร้านค้า'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น AuraSound Pro Wireless"
                className="w-full bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                หมวดหมู่สินค้า <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none"
              >
                <option value="หูฟัง & แอคเซสซอรี">หูฟัง & แอคเซสซอรี</option>
                <option value="สมาร์ทวอทช์ & แกดเจ็ต">สมาร์ทวอทช์ & แกดเจ็ต</option>
                <option value="เกมมิ่ง & ไอที">เกมมิ่ง & ไอที</option>
                <option value="ไลฟ์สไตล์ & เดสก์ท็อป">ไลฟ์สไตล์ & เดสก์ท็อป</option>
              </select>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ราคาขาย (฿) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                ราคาเดิมขีดฆ่า (฿)
              </label>
              <Input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                จำนวนสต็อก (ชิ้น) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                required
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border-slate-200 text-slate-900"
              />
            </div>
          </div>

          {/* Badge Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ป้ายกำกับสินค้า (Badge)</label>
            <div className="flex gap-2">
              {([undefined, 'HOT', 'NEW', 'SALE', 'LIMITED'] as ProductBadge[]).map((b) => (
                <button
                  type="button"
                  key={b || 'none'}
                  onClick={() => setBadge(b)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    badge === b
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {b || 'ไม่มี'}
                </button>
              ))}
            </div>
          </div>

          {/* Product image — uploaded to Supabase Storage */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">รูปภาพสินค้า</label>

            <div className="flex items-start gap-3">
              <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-slate-300" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  disabled={isUploading}
                  onChange={handleImageUpload}
                  className="w-full text-[11px] text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-bold file:text-[11px] hover:file:bg-indigo-100 cursor-pointer"
                />
                <Input
                  type="url"
                  required
                  placeholder="หรือวาง URL รูปภาพ"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 text-slate-900"
                />
                <p className="text-[11px] text-slate-400">
                  {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเก็บที่ Supabase Storage · ไม่เกิน 5 MB'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">รายละเอียดสินค้า</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Key Specs Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-700">ข้อมูลทางเทคนิค (Key Specs)</label>
              <button
                type="button"
                onClick={addSpecRow}
                className="text-indigo-600 hover:text-indigo-700 text-[11px] font-bold flex items-center gap-1"
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
                    className="w-1/3 bg-slate-50 border-slate-200 text-slate-900"
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
                    className="flex-1 bg-slate-50 border-slate-200 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecRow(idx)}
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold border-0"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all border-0 disabled:opacity-50"
            >
              {isSaving ? 'กำลังบันทึก...' : editingProduct ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มสินค้า'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
