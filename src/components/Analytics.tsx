'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { CONSENT_EVENT, ConsentRecord, readConsent } from './CookieConsent';

/** Measurement ID ของ Google Analytics — ค่านี้เปิดเผยอยู่แล้วในหน้าเว็บ ไม่ใช่ความลับ */
const MEASUREMENT_ID = 'G-93ELQ3L1KZ';

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** ส่งคำสั่งเข้า dataLayer ตรง ๆ ไม่ต้องรอให้ gtag.js โหลดเสร็จ เพราะมันอ่านคิวย้อนหลังอยู่แล้ว */
function pushConsent(granted: boolean) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push([
    'consent',
    'update',
    {
      analytics_storage: granted ? 'granted' : 'denied',
    },
  ]);
}

/**
 * Google Analytics (gtag.js) + Consent Mode v2
 *
 * แท็กถูกโหลดทุกครั้งเพื่อให้ Google ตรวจพบ แต่ตั้ง `analytics_storage: 'denied'`
 * ไว้ก่อนตั้งแต่ต้น GA จึงยังไม่เขียนคุกกี้ `_ga` และไม่ส่งข้อมูลที่ระบุตัวตน
 * จนกว่าผู้ใช้จะกด "ยอมรับทั้งหมด" ในแถบคุกกี้ ซึ่งจะสั่ง consent update ทันที
 *
 * ถ้ารอโหลดสคริปต์จนกว่าจะกดยอมรับ (แบบเดิม) เครื่องมือตรวจของ Google จะไม่เห็น
 * แท็กเลย เพราะมันไม่ได้กดปุ่มอะไร
 */
export const Analytics: React.FC = () => {
  useEffect(() => {
    const sync = (record: ConsentRecord | null) => pushConsent(Boolean(record?.analytics));

    sync(readConsent());

    const onDecision = (event: Event) => sync((event as CustomEvent<ConsentRecord>).detail);
    const onStorage = () => sync(readConsent());

    window.addEventListener(CONSENT_EVENT, onDecision);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(CONSENT_EVENT, onDecision);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <>
      {/* ต้องรันก่อน gtag.js เสมอ ไม่งั้น GA จะตั้งคุกกี้ไปแล้วก่อนรู้ว่าถูกปฏิเสธ */}
      <Script id="google-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
        `}
      </Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />

      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
};
