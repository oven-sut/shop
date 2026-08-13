'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'neo_cookie_consent';

/** Bump when the policy changes materially — everyone is asked again. */
const POLICY_VERSION = '2026-08-14';

export interface ConsentRecord {
  version: string;
  analytics: boolean;
  decidedAt: string;
}

export function readConsent(): ConsentRecord | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const record = JSON.parse(saved) as ConsentRecord;
    return record.version === POLICY_VERSION ? record : null;
  } catch {
    return null;
  }
}

/**
 * Cookie notice.
 *
 * The login session cookie is strictly necessary — the site cannot work without
 * it — so it is not offered as a choice; only optional analytics are. Nothing is
 * blocked before a decision because nothing optional is loaded yet.
 */
export const CookieConsent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  /* localStorage is unavailable during the server render, so the banner can only
     be decided after mount. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(readConsent() === null);
  }, []);

  const decide = (analytics: boolean) => {
    const record: ConsentRecord = {
      version: POLICY_VERSION,
      analytics,
      decidedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Private mode with storage disabled: just close the notice for this visit.
    }

    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="การใช้คุกกี้"
      className="fixed inset-x-0 bottom-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-1">
          <h2 className="text-sm font-bold text-slate-900">เว็บไซต์นี้ใช้คุกกี้</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            เราใช้คุกกี้ที่จำเป็นเพื่อให้ระบบเข้าสู่ระบบและตะกร้าสินค้าทำงานได้ ซึ่งปิดไม่ได้
            ส่วนคุกกี้เพื่อการวิเคราะห์การใช้งานจะเก็บก็ต่อเมื่อคุณกดยอมรับเท่านั้น อ่านเพิ่มเติมที่{' '}
            <Link href="/cookies" className="text-indigo-600 font-semibold hover:underline">
              นโยบายคุกกี้
            </Link>{' '}
            และ{' '}
            <Link href="/privacy" className="text-indigo-600 font-semibold hover:underline">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => decide(false)}
            className="flex-1 sm:flex-none bg-white hover:bg-slate-50 text-slate-700 border-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl"
          >
            เฉพาะที่จำเป็น
          </Button>
          <Button
            onClick={() => decide(true)}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 border-0"
          >
            ยอมรับทั้งหมด
          </Button>
        </div>
      </div>
    </div>
  );
};
