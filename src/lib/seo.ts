import type { Metadata } from 'next';
import { siteOrigin } from './auth';

/**
 * ต้นทางเดียวของข้อความและโครงสร้างข้อมูลที่ใช้ทำ SEO ทั้งไซต์
 *
 * ก่อนหน้านี้ชื่อร้าน คำโปรย และคำอธิบายถูกพิมพ์ซ้ำอยู่ใน root layout, หน้า login,
 * การ์ด OG และ sitemap แยกกันคนละชุด แก้ที่หนึ่งอีกที่จึงค้างเป็นข้อความเก่า —
 * ซึ่งคนอ่านไม่เห็น แต่ผลค้นหากับลิงก์พรีวิวเห็น
 */

export const SITE_NAME = 'NEO APP';

/** ทุก URL ที่ส่งให้บอตต้องเป็น absolute ไม่งั้นมันชี้กลับ localhost */
export const SITE_URL = siteOrigin('http://localhost:3000');

/** โดเมนล้วน ๆ ไว้แสดงบนการ์ดแชร์ */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '').replace(/\/+$/, '');

/**
 * ~50 ตัวอักษร เพื่อไม่ให้ Google ตัดกลางคำ และวางคำที่คนค้นจริงไว้ต้นประโยค
 * ("แอป", "ไอดีเกม") ไม่ใช่ชื่อแบรนด์ที่ยังไม่มีใครรู้จัก
 */
export const SITE_TITLE = `${SITE_NAME} — ร้านแอปพรีเมียม ไอดีเกม และบริการดิจิทัล`;

/**
 * ~140 ตัวอักษร: สั้นพอที่ผลค้นหาจะไม่ตัดท้าย และบอกครบสามอย่างที่คนลังเลอยากรู้
 * ก่อนกด — ขายอะไร จ่ายยังไง ได้ของเมื่อไหร่
 */
export const SITE_DESCRIPTION =
  'ซื้อแอปพรีเมียม ไอดีเกม และบริการดิจิทัลได้ตลอด 24 ชั่วโมง ' +
  'เติมเงินด้วยสลิปที่ระบบตรวจกับธนาคารให้อัตโนมัติ จ่ายแล้วรับสินค้าทันที ไม่ต้องรอแอดมิน';

/** คำโปรยสั้นสำหรับที่แคบ ๆ อย่างการ์ด OG และ alt ของรูป */
export const SITE_TAGLINE = 'ร้านแอปพรีเมียม ไอดีเกม และบริการดิจิทัล';

/**
 * Google เลิกใช้ meta keywords ไปนานแล้ว แต่ Bing กับเครื่องมือในบ้านเรายังอ่าน
 * และมันมีค่าในฐานะรายการคำที่ทั้งเว็บควรพูดให้ตรงกัน
 */
export const SITE_KEYWORDS = [
  'ร้านขายแอป',
  'แอปพรีเมียม',
  'ไอดีเกม',
  'ไอดีเช่า',
  'บริการดิจิทัล',
  'เติมเงินด้วยสลิป',
  'ตรวจสลิปอัตโนมัติ',
  'ส่งสินค้าอัตโนมัติ',
  SITE_NAME,
];

/**
 * ฐานร่วมของการ์ดแชร์
 *
 * ต้องประกาศซ้ำในทุกหน้าที่แตะ `openGraph` หรือ `twitter` เพราะ Next รวม metadata
 * แบบตื้น — หน้าลูกที่ตั้ง og:title อย่างเดียวจะลบ og:type, og:site_name และรูปการ์ด
 * ของ root ทิ้งทั้งชุด (ผลคือการ์ดไม่มีรูป และ X ถอยไปใช้ summary รูปเล็ก)
 */
export const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};

export const OG_BASE = {
  type: 'website' as const,
  siteName: SITE_NAME,
  locale: 'th_TH',
  images: [OG_IMAGE],
};

export const TWITTER_BASE = {
  card: 'summary_large_image' as const,
  images: [OG_IMAGE],
};

/** `/terms` → `https://…/terms` — ใช้กับ JSON-LD ที่รับแต่ URL เต็มเท่านั้น */
export function absoluteUrl(path = '/'): string {
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return normalised === '/' ? `${SITE_URL}/` : `${SITE_URL}${normalised}`;
}

interface PageMetaInput {
  /** ชื่อหน้าอย่างเดียว ไม่ต้องมีชื่อร้าน — template ใน root layout ต่อให้เอง */
  title: string;
  description: string;
  /** พาธของหน้านี้ ใช้ทั้ง canonical และ og:url */
  path: string;
  /** หน้าที่ไม่ควรอยู่ในผลค้นหา (ฟอร์มรีเซ็ตรหัสผ่าน ฯลฯ) */
  noIndex?: boolean;
}

/**
 * Metadata ของหน้าหนึ่ง ๆ ให้ครบชุดในการเรียกครั้งเดียว
 *
 * ที่ต้องมีตัวช่วย เพราะสามอย่างนี้ลืมกันบ่อยและลืมแล้วไม่มีอะไรฟ้อง: canonical
 * (ไม่มี = `?next=` แต่ละแบบกลายเป็นคนละหน้าในสายตา Google), og:url และ og:title
 * ที่ต้องเป็นชื่อเต็มพร้อมแบรนด์เพราะ template ใช้กับ <title> เท่านั้น
 */
export function pageMetadata({ title, description, path, noIndex }: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OG_BASE,
      title: `${title} · ${SITE_NAME}`,
      description,
      url: path,
    },
    twitter: {
      ...TWITTER_BASE,
      title: `${title} · ${SITE_NAME}`,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

/* ------------------------------------------------------------------ *
 * Structured data
 *
 * ผูกกันด้วย @id ทุกก้อน: หน้าหนึ่งอาจฝัง JSON-LD หลายชิ้น (ทั้งของ root layout
 * และของหน้านั้นเอง) การอ้าง @id เดียวกันบอก Google ว่าทั้งหมดพูดถึงร้านเดียว
 * ไม่ใช่คนละองค์กรที่บังเอิญชื่อซ้ำ
 * ------------------------------------------------------------------ */

/**
 * ห่อหลายก้อนเป็นชุดเดียว
 *
 * ก้อนย่อยจึงไม่ต้องมี `@context` ของตัวเอง — และเอาไปประกอบกันได้อิสระ เช่น
 * หน้าติดต่อที่ประกาศทั้งตัวร้าน หน้าเว็บ และทางเดินของหน้าในสคริปต์เดียว
 */
export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

interface OrganizationExtras {
  email?: string;
  telephone?: string;
  /** โปรไฟล์ทางการช่องอื่นของร้าน — Facebook, Discord, LINE */
  sameAs?: string[];
}

/**
 * `OnlineStore` เป็นชนิดย่อยของ Organization ที่ Google ใช้แยกร้านค้าออนไลน์ออก
 * จากองค์กรทั่วไป ประกาศเป็นคู่ไว้ ตัวอ่านที่รู้จักแค่ Organization จะได้ไม่ตกหล่น
 */
export function organizationSchema(extras: OrganizationExtras = {}) {
  const sameAs = extras.sameAs?.filter(Boolean);

  return {
    '@type': ['Organization', 'OnlineStore'],
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icon.png'),
    image: absoluteUrl('/opengraph-image'),
    description: SITE_DESCRIPTION,
    areaServed: 'TH',
    ...(extras.email || extras.telephone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            availableLanguage: ['th'],
            ...(extras.email ? { email: extras.email } : {}),
            ...(extras.telephone ? { telephone: extras.telephone } : {}),
          },
        }
      : {}),
    ...(sameAs?.length ? { sameAs } : {}),
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'th-TH',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/**
 * โครงสร้างข้อมูลที่ติดไปกับทุกหน้า
 *
 * ไม่มี `SearchAction`: sitelinks search box จะเกิดได้ก็ต่อเมื่อบอตเข้าไปค้นใน
 * ไซต์ได้จริง แต่ช่องค้นหาของร้านอยู่หลังหน้า login ประกาศไปก็เป็นการบอกสิ่งที่
 * ตรวจสอบไม่ได้ (โค้ดเดิมมีคอมเมนต์ว่าประกาศไว้ ทั้งที่ไม่เคยมีในโครงสร้างจริง)
 */
export function siteSchema() {
  return graph(organizationSchema(), websiteSchema());
}

/** ทางเดินของหน้า — Google เอาไปแสดงแทน URL ดิบใต้หัวข้อผลค้นหา */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: absoluteUrl(step.path),
    })),
  };
}
