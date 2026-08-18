import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import {
  SITE_NAME,
  WEBSITE_ID,
  absoluteUrl,
  breadcrumbSchema,
  graph,
  pageMetadata,
} from '@/lib/seo';

/**
 * หน้าหมวดหมู่เป็น client component (ต้องอ่านตะกร้าและคำค้นหา) จึงประกาศ metadata
 * เองไม่ได้ — layout ฝั่งเซิร์ฟเวอร์ตัวนี้ทำแทน
 *
 * ชื่อหมวดหมู่มาจากพาธ ไม่ได้มาจากฐานข้อมูล: หน้านี้อยู่หลังหน้า login (ดู
 * PUBLIC_PATHS ใน proxy.ts) การยิงคิวรีเพิ่มเพื่อทำ metadata ให้บอตที่อย่างไรก็โดน
 * เด้งไป /login จึงไม่คุ้ม ที่ต้องมีคือ canonical กับชื่อหน้าที่ไม่ซ้ำกัน — ตอนนี้ช่วย
 * เรื่องลิงก์ที่คนแชร์กันภายใน และพร้อมใช้ทันทีถ้าวันหนึ่งเปิดหน้าร้านให้ดูได้โดยไม่ต้องล็อกอิน
 */
type CategoryParams = { params: Promise<{ slug: string }> };

/** พาธเดิมของหมวดหมู่ — เข้ารหัสกลับ เพราะ Next ถอดรหัส params ให้แล้ว */
const categoryPath = (name: string) => `/category/${encodeURIComponent(name)}`;

export async function generateMetadata({ params }: CategoryParams): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug).trim();

  if (!name) {
    return pageMetadata({
      title: 'หมวดหมู่สินค้า',
      description: `หมวดหมู่สินค้าทั้งหมดของ ${SITE_NAME}`,
      path: '/category',
    });
  }

  return pageMetadata({
    title: name,
    description:
      `สินค้าหมวด ${name} ทั้งหมดที่ ${SITE_NAME} มีขาย ` +
      'พร้อมราคา จำนวนคงเหลือ และรีวิวจากคนที่ซื้อไปแล้ว จ่ายจากกระเป๋าแล้วรับของทันที',
    path: categoryPath(name),
  });
}

export default async function CategoryLayout({
  children,
  params,
}: CategoryParams & { children: React.ReactNode }) {
  const { slug } = await params;
  const name = decodeURIComponent(slug).trim();
  const path = categoryPath(name);

  return (
    <>
      <JsonLd
        data={graph(
          {
            '@type': 'CollectionPage',
            '@id': `${absoluteUrl(path)}#page`,
            url: absoluteUrl(path),
            name,
            inLanguage: 'th-TH',
            isPartOf: { '@id': WEBSITE_ID },
          },
          breadcrumbSchema([
            { name: 'หน้าแรก', path: '/' },
            { name, path },
          ])
        )}
      />
      {children}
    </>
  );
}
