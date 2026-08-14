'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonRegion } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

interface ProductCode {
  id: string;
  code: string;
  label?: string;
  note?: string;
  orderId?: string;
  claimedAt?: string;
  createdAt: string;
}

interface Props {
  productId: string;
  /** Lets the modal disable its stock field once the pool is in charge of it. */
  onStockChange?: (info: { available: number; managed: boolean }) => void;
}

/**
 * คลังรหัสของสินค้าหนึ่งชิ้น
 *
 * หนึ่งบรรทัดคือของหนึ่งชิ้นที่ขายได้หนึ่งครั้ง พอมีรหัสอยู่ในคลัง สต็อกของสินค้า
 * จะถูกคำนวณจากจำนวนรหัสที่ยังไม่ถูกขายโดยอัตโนมัติ (ทริกเกอร์ในฐานข้อมูล)
 * แอดมินจึงไม่ต้องมาไล่แก้ตัวเลขสต็อกเอง และเลขสองตัวนี้ไม่มีทางไม่ตรงกัน
 */
export const AdminProductCodes: React.FC<Props> = ({ productId, onStockChange }) => {
  const { showToast, refreshProducts } = useShop();

  const [codes, setCodes] = useState<ProductCode[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSold, setShowSold] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/products/${productId}/codes`);
    const body = await response.json().catch(() => ({}));

    setIsLoading(false);
    if (!body.success) return;

    const list = body.data.codes as ProductCode[];
    setCodes(list);
    onStockChange?.({ available: body.data.available, managed: list.length > 0 });
  }, [productId, onStockChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const add = async () => {
    if (!input.trim()) return;

    setIsSaving(true);
    const response = await fetch(`/api/products/${productId}/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    const body = await response.json().catch(() => ({}));
    setIsSaving(false);

    if (!body.success) {
      showToast(body.message || 'เพิ่มรหัสไม่สำเร็จ', 'warning');
      return;
    }

    setInput('');
    showToast(body.message, 'success');
    await Promise.all([load(), refreshProducts()]);
  };

  const remove = async (code: ProductCode) => {
    const response = await fetch(`/api/products/${productId}/codes?codeId=${code.id}`, {
      method: 'DELETE',
    });
    const body = await response.json().catch(() => ({}));

    if (!body.success) {
      showToast(body.message || 'ลบรหัสไม่สำเร็จ', 'warning');
      return;
    }

    await Promise.all([load(), refreshProducts()]);
  };

  const available = codes.filter((code) => !code.claimedAt);
  const sold = codes.filter((code) => code.claimedAt);
  const visible = showSold ? sold : available;

  return (
    <div className="border-t border-neutral-100 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-semibold text-neutral-700">คลังรหัสสำหรับขาย</label>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            หนึ่งบรรทัดต่อหนึ่งชิ้น · ใส่ <code className="font-mono">ชื่อผู้ใช้|รหัสผ่าน</code>{' '}
            ถ้าเป็นไอดีเกม หรือใส่รหัสอย่างเดียวก็ได้
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          {[
            { key: false, label: `พร้อมขาย ${available.length}` },
            { key: true, label: `ขายแล้ว ${sold.length}` },
          ].map((tab) => (
            <button
              key={String(tab.key)}
              type="button"
              onClick={() => setShowSold(tab.key)}
              className={`px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                showSold === tab.key
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200 text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={'user1|pass1\nuser2|pass2\nXXXX-YYYY-ZZZZ'}
          className="w-full bg-neutral-50 border border-neutral-200 rounded-md p-3 font-mono text-neutral-900 focus:outline-none focus:border-neutral-900"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-neutral-400">
            รหัสที่มีอยู่แล้วในสินค้าชิ้นนี้จะถูกข้าม ไม่นับซ้ำ
          </span>
          <Button
            type="button"
            onClick={add}
            disabled={isSaving || !input.trim()}
            className="h-9 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs px-4 rounded-md border-0 disabled:opacity-40"
          >
            {isSaving && <Spinner className="mr-1.5" />}
            {isSaving ? 'กำลังเพิ่ม...' : 'เพิ่มเข้าคลัง'}
          </Button>
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto border border-neutral-200 rounded-md divide-y divide-neutral-100">
        {isLoading && (
          <SkeletonRegion label="กำลังโหลดคลังรหัส" className="divide-y divide-neutral-100">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="p-2.5">
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            ))}
          </SkeletonRegion>
        )}

        {!isLoading && visible.length === 0 && (
          <p className="p-3 text-[11px] text-neutral-400">
            {showSold ? 'ยังไม่มีรหัสที่ถูกขายไป' : 'ยังไม่มีรหัสในคลัง'}
          </p>
        )}

        {visible.map((code) => (
          <div key={code.id} className="flex items-center gap-2 p-2.5">
            <div className="min-w-0 flex-1">
              <code className="font-mono text-neutral-900 truncate block">
                {code.label ? `${code.label} | ${code.code}` : code.code}
              </code>
              {code.claimedAt && (
                <span className="text-[10px] text-neutral-400">
                  คำสั่งซื้อ #{code.orderId} · {new Date(code.claimedAt).toLocaleString('th-TH')}
                </span>
              )}
            </div>

            {/* ขายไปแล้วลบไม่ได้ — เป็นหลักฐานว่ารหัสใบไหนไปอยู่กับคำสั่งซื้อไหน */}
            {!code.claimedAt && (
              <button
                type="button"
                onClick={() => remove(code)}
                className="text-neutral-400 hover:text-neutral-900 p-1 shrink-0"
                aria-label="ลบรหัสนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
