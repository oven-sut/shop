import type { Metadata, Viewport } from "next";
import { Sarabun } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { CookieConsent } from "../components/CookieConsent";
import { Analytics } from "../components/Analytics";
import { JsonLd } from "../components/JsonLd";
import {
  OG_BASE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  TWITTER_BASE,
  siteSchema,
} from "../lib/seo";
import { getSessionUser } from "../lib/supabase/session";
import "./globals.css";

/**
 * Sarabun is the web-served descendant of TH Sarabun (same Cadson Demak
 * lineage) and the only one of the family that next/font can self-host, so it
 * carries both Thai and Latin here — no second face to keep in step.
 */
const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  // Without this, every relative URL below — the share image included —
  // resolves against localhost:3000, and previews point at a machine nobody
  // else can reach.
  metadataBase: new URL(SITE_URL),
  // `template` lets each page name only itself; the brand is appended here.
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  // ผู้เขียนกับผู้เผยแพร่เป็นร้านเดียวกัน แต่ต้องประกาศทั้งคู่ — ตัวรวมข่าวและ
  // โปรแกรมอ่านหน้าเว็บอ่านคนละช่อง
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "shopping",
  // ปิดการเดาเอง: iOS ชอบแปลงเลขคำสั่งซื้อกับรหัสสินค้าเป็นลิงก์โทรออก
  formatDetection: { telephone: false, address: false, email: false },
  // The icons come from src/app/icon.png and src/app/apple-icon.png — Next
  // fingerprints those, which the old hand-written paths to a 300 KB logo in
  // /public did not get.
  alternates: { canonical: "/" },
  // รูปการ์ดมาจาก src/app/opengraph-image.tsx (และ twitter-image.tsx ที่ใช้ใบเดียวกัน)
  // ส่วน OG_BASE/TWITTER_BASE คือชุดที่หน้าลูกต้องประกาศซ้ำ — ดูเหตุผลใน lib/seo.ts
  openGraph: {
    ...OG_BASE,
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    ...TWITTER_BASE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    // ให้ Google แสดงรูปใหญ่และข้อความย่อเต็มความยาว — ค่าเริ่มต้นของบางบอท
    // คือย่อจนเหลือบรรทัดเดียว
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/**
 * แถบ URL ของเบราว์เซอร์บนมือถือจะย้อมตามค่านี้ — ขาวเท่ากับพื้นหลังร้าน
 * (`themeColor` ย้ายออกจาก metadata มาอยู่ที่ viewport ตั้งแต่ Next 14)
 */
export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read once on the server from the cookie session so the first paint already
  // knows who is signed in (no logged-out flash, no localStorage).
  const user = await getSessionUser();

  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
        {/* ตัวร้านและตัวเว็บไซต์ — หน้าอื่นเติมของตัวเองต่อโดยอ้าง @id เดียวกัน */}
        <JsonLd data={siteSchema()} />
        <AuthProvider initialUser={user}>{children}</AuthProvider>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
