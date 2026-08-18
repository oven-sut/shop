import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE_HOST, SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

/**
 * The card that appears when the URL is pasted into LINE, Facebook, X, Discord
 * or Slack.
 *
 * Drawn here rather than shipped as a flat file so the wording stays in step
 * with the site — and because the previous setup pointed at `logo-mark.png`,
 * a square transparent PNG, which the platforms letterbox onto whatever
 * background they please. 1200×630 is the size every one of them crops to.
 */
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  // Inlined as a data URI: the renderer fetches nothing, so this works the same
  // at build time and behind the auth gate.
  const mark = await readFile(join(process.cwd(), 'public', 'logo-mark.png'));
  const markSrc = `data:image/png;base64,${mark.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '72px 80px',
          // Matches the monochrome storefront: a hairline frame, no gradients.
          border: '2px solid #171717',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} alt="" width={96} height={94} />
          <div style={{ fontSize: 64, fontWeight: 700, color: '#171717', letterSpacing: -1 }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 52, fontWeight: 600, color: '#171717', lineHeight: 1.25 }}>
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 34, color: '#525252', lineHeight: 1.4 }}>
            เติมเงินด้วยสลิป · ระบบตรวจกับธนาคารอัตโนมัติ
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 28,
            color: '#737373',
            borderTop: '1px solid #e5e5e5',
            paddingTop: 28,
          }}
        >
          <span>จ่ายแล้วรับสินค้าทันที ตลอด 24 ชั่วโมง</span>
          {/* โดเมนมาจาก env เดียวกับที่ทำ canonical — ไม่ต้องแก้สองที่เวลาย้ายโดเมน */}
          <span>{SITE_HOST}</span>
        </div>
      </div>
    ),
    size
  );
}
