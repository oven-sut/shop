'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '../../types/ecommerce';
import { useShop } from '../../context/ShopContext';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

const PRESET_IMAGES = [
  { label: 'หูฟัง AuraSound', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop' },
  { label: 'สมาร์ทวอทช์ OLED', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop' },
  { label: 'คีย์บอร์ดกลไก RGB', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800&auto=format&fit=crop' },
  { label: 'เมาส์เกมมิ่งไร้สาย', url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800&auto=format&fit=crop' },
  { label: 'โคมไฟตั้งโต๊ะ LED', url: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=800&auto=format&fit=crop' },
  { label: 'ลำโพงมอนิเตอร์ Studio', url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800&auto=format&fit=crop' },
  { label: 'เว็บแคม 4K Streaming', url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800&auto=format&fit=crop' },
  { label: 'แท่นชาร์จไร้สาย Fast Charge', url: 'https://images.unsplash.com/photo-1622445268465-84385d410d9f?q=80&w=800&auto=format&fit=crop' }
];

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct
}) => {
  const { addProduct, updateProduct } = useShop();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('หูฟัง & แอคเซสซอรี');
  const [price, setPrice] = useState<number | ''>(2990);
  const [originalPrice, setOriginalPrice] = useState<number | ''>(3990);
  const [stock, setStock] = useState<number | ''>(10);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(PRESET_IMAGES[0].url);
  const [badge, setBadge] = useState<'HOT' | 'NEW' | 'SALE' | 'LIMITED' | undefined>(undefined);
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>([
    { key: 'การเชื่อมต่อ', val: 'Bluetooth 5.3' },
    { key: 'การรับประกัน', val: '1 ปี ศูนย์ไทย' }
  ]);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setPrice(editingProduct.price);
      setOriginalPrice(editingProduct.originalPrice || '');
      setStock(editingProduct.stock);
      setDescription(editingProduct.description);
      setImage(editingProduct.image);
      setBadge(editingProduct.badge);
      if (editingProduct.specs) {
        setSpecs(Object.entries(editingProduct.specs).map(([k, v]) => ({ key: k, val: v })));
      }
    } else {
      setName('');
      setCategory('หูฟัง & แอคเซสซอรี');
      setPrice(1990);
      setOriginalPrice(2590);
      setStock(15);
      setDescription('รายละเอียดสินค้านวัตกรรมไอทีรุ่นใหม่ ประสิทธิภาพสูง ตอบโจทย์ทุกการใช้งาน');
      setImage(PRESET_IMAGES[0].url);
      setBadge('NEW');
      setSpecs([
        { key: 'การเชื่อมต่อ', val: 'Bluetooth 5.3' },
        { key: 'การรับประกัน', val: '1 ปี ศูนย์ไทย' }
      ]);
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '' || stock === '') return;

    const specsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.val.trim()) {
        specsObj[s.key.trim()] = s.val.trim();
      }
    });

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name,
        category,
        price: Number(price),
        originalPrice: originalPrice !== '' ? Number(originalPrice) : undefined,
        stock: Number(stock),
        description,
        image,
        badge,
        specs: specsObj
      });
    } else {
      addProduct({
        name,
        category,
        price: Number(price),
        originalPrice: originalPrice !== '' ? Number(originalPrice) : undefined,
        stock: Number(stock),
        description,
        image,
        badge,
        specs: specsObj,
        isFeatured: true
      });
    }

    onClose();
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
              {[undefined, 'HOT', 'NEW', 'SALE', 'LIMITED'].map((b) => (
                <button
                  type="button"
                  key={b || 'none'}
                  onClick={() => setBadge(b as any)}
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

          {/* Image Selection with Presets */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">
              รูปภาพสินค้า (URL หรือเลือกภาพตัวอย่าง)
            </label>
            <Input
              type="text"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-slate-50 border-slate-200 text-slate-900"
            />
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
              <span className="text-slate-500 shrink-0">เลือกรูปตัวอย่าง:</span>
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImage(preset.url)}
                  className={`px-2.5 py-1 rounded-lg border shrink-0 text-[10px] transition-all ${
                    image === preset.url
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all border-0"
            >
              {editingProduct ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มสินค้า'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
