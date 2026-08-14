'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CONSENT_EVENT, ConsentRecord, readConsent } from './CookieConsent';

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics (gtag.js)
 *
 * โหลดก็ต่อเมื่อผู้ใช้กด "ยอมรับทั้งหมด" ในแถบคุกกี้เท่านั้น ตรงตามที่เขียนไว้ใน
 * นโยบายคุกกี้ว่าคุกกี้เพื่อการวิเคราะห์จะเก็บเมื่อได้รับความยินยอม — ถ้าฝัง
 * สคริปต์ไว้เฉย ๆ GA จะตั้งคุกกี้ _ga ทันทีที่โหลดหน้า ก่อนที่ใครจะได้ตอบ
 *
 * ตั้งค่า ID ที่ NEXT_PUBLIC_GA_MEASUREMENT_ID ไม่มีค่า = ไม่โหลดอะไรเลย
 */
export const Analytics: React.FC = () => {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = (record: ConsentRecord | null) => setAllowed(Boolean(record?.analytics));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    sync(readConsent());

    // กดยอมรับแล้วให้เริ่มเก็บทันที และถ้าเปลี่ยนใจในแท็บอื่นก็ตามให้ตรงกัน
    const onDecision = (event: Event) => sync((event as CustomEvent<ConsentRecord>).detail);
    const onStorage = () => sync(readConsent());

    window.addEventListener(CONSENT_EVENT, onDecision);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(CONSENT_EVENT, onDecision);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!MEASUREMENT_ID || !allowed) return null;

  return (
    <>
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
