import type { MetadataRoute } from 'next';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

/**
 * แบ่งงานกับ metadata ให้ชัด ไม่ใช้ทั้งสองอย่างกับหน้าเดียวกัน:
 *
 *   - หลังบ้านและหน้าที่มีข้อมูลผู้ใช้ → ห้ามที่นี่ ประหยัดโควตาคลานของบอต
 *     (ยังไงก็เข้าไม่ได้ proxy.ts เด้งไป /login อยู่แล้ว)
 *   - หน้าที่เปิดสาธารณะแต่ไม่ควรอยู่ในผลค้นหา (ลืมรหัสผ่าน, ตั้งรหัสใหม่) →
 *     ปล่อยให้คลานได้ แล้วสั่ง `noindex` ใน metadata ของหน้านั้น
 *
 * สลับกันไม่ได้ เพราะบอตที่ถูกห้ามคลานจะไม่เห็นคำสั่ง noindex — แล้ว URL นั้น
 * อาจไปโผล่ในผลค้นหาแบบ "ไม่มีคำอธิบายเพราะ robots.txt" ซึ่งดูแย่กว่าไม่โผล่เลย
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/auth/',
          '/docs',
          '/openapi.json',
          '/orders',
          '/wallet',
          '/reset-hwid',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
