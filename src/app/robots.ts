import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/auth';

/**
 * หน้าที่มีข้อมูลของผู้ใช้หรือของหลังบ้านไม่ควรถูกจัดทำดัชนี ต่อให้บอตเข้าไม่ได้อยู่แล้ว
 * (proxy.ts เด้งไป /login) การประกาศไว้ตรงนี้ทำให้ URL เหล่านั้นไม่ไปโผล่ในผลค้นหา
 * ในรูปแบบ "ไม่มีคำอธิบายเพราะ robots.txt" ซึ่งดูแย่กว่าไม่มีเลย
 */
const siteUrl = siteOrigin('http://localhost:3000');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/orders', '/wallet', '/docs', '/auth/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
