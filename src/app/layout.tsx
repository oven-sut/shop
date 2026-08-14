import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { CookieConsent } from "../components/CookieConsent";
import { siteOrigin } from "../lib/auth";
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

const DESCRIPTION =
  "ร้านขายแอปพลิเคชันและบริการดิจิทัล เติมเงินเข้ากระเป๋าแล้วซื้อได้ทันที " +
  "ตรวจสลิปโอนกับธนาคารอัตโนมัติ ส่งมอบสินค้าให้ทันทีตลอด 24 ชั่วโมง";

export const metadata: Metadata = {
  // Without this, every relative URL below — the share image included —
  // resolves against localhost:3000, and previews point at a machine nobody
  // else can reach.
  metadataBase: new URL(siteOrigin("http://localhost:3000")),
  // `template` lets each page name only itself; the brand is appended here.
  title: {
    default: "NEO APP — ร้านขายแอปพลิเคชันและบริการดิจิทัล",
    template: "%s · NEO APP",
  },
  description: DESCRIPTION,
  applicationName: "NEO APP",
  keywords: [
    "ร้านขายแอป",
    "เติมเงินด้วยสลิป",
    "ตรวจสลิปอัตโนมัติ",
    "ไอดีเกม",
    "ไอดีเช่า",
    "บริการดิจิทัล",
  ],
  // The icons come from src/app/icon.png and src/app/apple-icon.png — Next
  // fingerprints those, which the old hand-written paths to a 300 KB logo in
  // /public did not get.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "NEO APP",
    locale: "th_TH",
    title: "NEO APP — ร้านขายแอปพลิเคชันและบริการดิจิทัล",
    description: DESCRIPTION,
    // The image itself is src/app/opengraph-image.tsx; Next wires up the tags,
    // including width, height and the absolute URL.
  },
  twitter: {
    card: "summary_large_image",
    title: "NEO APP — ร้านขายแอปพลิเคชันและบริการดิจิทัล",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read once on the server from the cookie session so the first paint already
  // knows who is signed in (no logged-out flash, no localStorage).
  const user = await getSessionUser();

  return (
    <html lang="th" className={`${sarabun.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
