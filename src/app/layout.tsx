import type { Metadata } from "next";
import { Prompt, Inter } from "next/font/google";
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
  title: "NEO TECH - ร้านค้าไอทีและแกดเจ็ตพรีเมียม (Admin Dashboard included)",
  description: "ศูนย์รวมหูฟัง สมาร์ทวอทช์ คีย์บอร์ด และอุปกรณ์เดสก์ท็อป รับประกันศูนย์ไทย พร้อมระบบจัดการหลังบ้าน",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} ${interFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
