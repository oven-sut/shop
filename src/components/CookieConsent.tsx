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

/** ประกาศตอนผู้ใช้เพิ่งเลือก เพื่อให้สคริปต์วิเคราะห์เริ่ม/ไม่เริ่มได้ทันทีโดยไม่ต้องรีเฟรช */
export const CONSENT_EVENT = 'neo:cookie-consent';

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

    window.dispatchEvent(new CustomEvent<ConsentRecord>(CONSENT_EVENT, { detail: record }));
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
      <div className="max-w-4xl mx-auto bg-white border border-neutral-900 rounded-md p-5 flex flex-col sm:flex-row items-start gap-4">
        <Cookie className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" strokeWidth={1.5} />

        <div className="flex-1 space-y-1">
          <h2 className="text-sm font-semibold text-neutral-900">เว็บไซต์นี้ใช้คุกกี้</h2>
          <p className="text-xs text-neutral-500 leading-relaxed">
            เราใช้คุกกี้ที่จำเป็นเพื่อให้ระบบเข้าสู่ระบบและตะกร้าสินค้าทำงานได้ ซึ่งปิดไม่ได้
            ส่วนคุกกี้เพื่อการวิเคราะห์การใช้งานจะเก็บก็ต่อเมื่อคุณกดยอมรับเท่านั้น อ่านเพิ่มเติมที่{' '}
            <Link
              href="/cookies"
              className="text-neutral-900 font-medium underline underline-offset-2"
            >
              นโยบายคุกกี้
            </Link>{' '}
            และ{' '}
            <Link
              href="/privacy"
              className="text-neutral-900 font-medium underline underline-offset-2"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => decide(false)}
            className="flex-1 sm:flex-none h-10 bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300 font-medium text-xs px-4 rounded-md"
          >
            เฉพาะที่จำเป็น
          </Button>
          <Button
            onClick={() => decide(true)}
            className="flex-1 sm:flex-none h-10 bg-neutral-900 hover:bg-neutral-700 text-white font-medium text-xs px-5 rounded-md border-0"
          >
            ยอมรับทั้งหมด
          </Button>
        </div>
      </div>
    </div>
  );
};
