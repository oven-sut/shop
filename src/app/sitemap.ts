import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

/**
 * เฉพาะ URL ที่ตอบ 200 ให้คนที่ยังไม่ล็อกอิน
 *
 * ที่ไม่มี `/` อยู่ในนี้ไม่ใช่ความลืม: หน้าร้านอยู่หลังหน้า login (ดู PUBLIC_PATHS ใน
 * proxy.ts) บอตที่ขอ `/` ได้ 302 ไป /login — ใส่ลงไปก็ได้แค่บรรทัด "Page with
 * redirect" ใน Search Console ทางเข้าที่บอตเห็นจริงคือ /login จึงประกาศตัวนั้น
 * (หน้าหมวดหมู่ก็เหตุผลเดียวกัน — เพิ่มได้ทันทีเมื่อเปิดหน้าร้านให้ดูโดยไม่ต้องล็อกอิน)
 *
 * `lastModified` เป็นวันที่แก้เนื้อหาจริง ไม่ใช่ `new Date()` ของตอนบิลด์ — วันที่
 * ที่ขยับทุกครั้งที่ deploy คือวันที่ที่บอตเลิกเชื่อ
 */
const POLICY_UPDATED = '2026-08-14';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl('/login'),
      lastModified: POLICY_UPDATED,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/contact'),
      lastModified: POLICY_UPDATED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/terms'),
      lastModified: POLICY_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/privacy'),
      lastModified: POLICY_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/cookies'),
      lastModified: POLICY_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
