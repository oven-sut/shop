import type { Metadata } from 'next';

/**
 * The login page is a client component, which cannot export metadata itself —
 * hence this layout. It matters more than the wrapper suggests: every other
 * page redirects here for anyone without a session, so this is the only page a
 * search engine ever indexes and the one a shared link resolves to.
 */
export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ',
  description:
    'เข้าสู่ระบบหรือสมัครสมาชิก NEO APP ร้านขายแอปพลิเคชันและบริการดิจิทัล ' +
    'เติมเงินด้วยสลิปโอนที่ตรวจกับธนาคารอัตโนมัติ แล้วซื้อได้ทันที',
  alternates: { canonical: '/login' },
  openGraph: {
    title: 'เข้าสู่ระบบ · NEO APP',
    url: '/login',
  },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
