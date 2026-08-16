'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';

/**
 * แผ่นคลุมตอนเปิดเว็บครั้งแรก จนกว่า API ชุดแรกจะโหลดเสร็จ
 *
 * Covers the page rather than replacing it: the children stay mounted underneath
 * and keep loading, so lifting the cover shows a finished page instead of
 * starting a second wave of requests.
 *
 * Two rules keep it from becoming a wall the customer is stuck behind:
 *
 * - it lifts when the first load settles, whether that load succeeded or failed
 *   (`isLoading` in ShopContext flips either way);
 * - it lifts anyway after {@link MAX_WAIT_MS}. A hung endpoint should leave the
 *   customer looking at the page's own skeletons — which say "still loading" in
 *   the right places — not at a spinner with no way forward.
 */

/** ยาวพอให้เห็นว่าจางหาย แต่ไม่ถ่วงคนที่รอมาแล้ว */
const FADE_MS = 260;

/** เพดานรอ ถึงเวลาก็เปิดหน้าเว็บให้ ไม่ว่า API จะยังค้างอยู่หรือไม่ */
const MAX_WAIT_MS = 8_000;

/**
 * เคยคลุมไปแล้วในหน้าต่างนี้หรือยัง
 *
 * Every page mounts its own ShopProvider, so without this the cover would come
 * back on every client-side navigation — the customer asked for it when the site
 * opens, not between pages. Module scope is exactly the right lifetime: it lasts
 * as long as the loaded app and resets on a real page load.
 *
 * Read only in the browser. On the server this module is shared between requests,
 * so trusting it there would hide the cover from everyone after the first render.
 */
let coveredOnce = false;

export function SplashScreen({ loading, storeName = 'NEO APP' }: { loading: boolean; storeName?: string }) {
  const [gone, setGone] = useState(() => typeof window !== 'undefined' && coveredOnce);

  useEffect(() => {
    if (gone) {
      coveredOnce = true;
      return;
    }

    // เสร็จแล้ว → รอให้จางจบค่อยถอดออกจาก DOM
    // ยังไม่เสร็จ → ตั้งเพดานรอไว้ ไม่ให้ค้างตลอดกาล
    const timer = setTimeout(() => setGone(true), loading ? MAX_WAIT_MS : FADE_MS);
    return () => clearTimeout(timer);
  }, [loading, gone]);

  /* Scrolling behind a cover just moves content the customer cannot see, and on
     iOS it leaves the page scrolled somewhere odd once the cover lifts. */
  useEffect(() => {
    if (gone) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div
      // aria-live rather than a dialog: it is a status, and it must never trap
      // focus or keep a screen reader from reaching the page once it lifts.
      role="status"
      aria-live="polite"
      aria-busy={loading}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-white transition-opacity duration-200 motion-reduce:transition-none ${
        loading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3">
        <Image
          src="/logo-mark.png"
          alt=""
          width={470}
          height={462}
          priority
          className="h-9 w-auto"
        />
        <span className="text-lg font-bold tracking-tight text-neutral-900">{storeName}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <Spinner className="size-3.5" />
        <span>กำลังโหลดข้อมูลร้าน...</span>
      </div>
    </div>
  );
}
