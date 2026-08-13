import type { Metadata } from "next";
import { Prompt, Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { CookieConsent } from "../components/CookieConsent";
import { getSessionUser } from "../lib/supabase/session";
import "./globals.css";

const promptFont = Prompt({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
});

const interFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "NEO APP - ร้านขายแอปพลิเคชัน พร้อมระบบเติมเงินและหลังบ้าน",
  description: "ร้านขายแอปพลิเคชัน เติมเงินด้วยสลิปโอน ตรวจสอบกับธนาคารอัตโนมัติ พร้อมระบบจัดการหลังบ้าน",
  icons: { icon: "/logo-mark.png", apple: "/logo-mark.png" },
  openGraph: {
    title: "NEO APP",
    description: "ร้านขายแอปพลิเคชัน เติมเงินเข้ากระเป๋าแล้วซื้อได้ทันที",
    // The mark, not the full lockup: its "NEO APP" wordmark is white and would
    // disappear on the light background social platforms composite onto.
    images: ["/logo-mark.png"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read once on the server from the cookie session so the first paint already
  // knows who is signed in (no logged-out flash, no localStorage).
  const user = await getSessionUser();

  return (
    <html
      lang="th"
      className={`${promptFont.variable} ${interFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
        <AuthProvider initialUser={user}>{children}</AuthProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
