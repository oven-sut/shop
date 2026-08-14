import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/auth';

/**
 * เฉพาะหน้าที่บอตเข้าถึงได้จริง — หน้าอื่นถูก proxy.ts เด้งไป /login
 * การใส่หน้าที่ redirect ลง sitemap มีแต่ทำให้ Search Console ขึ้น error
 */
const siteUrl = siteOrigin('http://localhost:3000');

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
