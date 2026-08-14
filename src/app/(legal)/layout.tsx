import Link from 'next/link';
import Image from 'next/image';

const LINKS = [
  { href: '/terms', label: 'ข้อกำหนดการใช้งาน' },
  { href: '/privacy', label: 'นโยบายความเป็นส่วนตัว' },
  { href: '/cookies', label: 'นโยบายคุกกี้' },
];

/** Policy pages are readable without signing in — see PUBLIC_PATHS in proxy.ts. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-mark.png" alt="" width={470} height={462} className="h-8 w-auto" />
            <span className="text-base font-bold tracking-tight">NEO APP</span>
          </Link>
          <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors">
            กลับหน้าร้าน
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        <article className="border border-neutral-200 rounded-md p-6 sm:p-10">{children}</article>

        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-400">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-neutral-900 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
