import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactField, filledContacts } from '@/lib/contact';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'ติดต่อเรา',
  description: 'ช่องทางติดต่อทีมงาน NEO APP — LINE, อีเมล, โทรศัพท์ และเวลาทำการ',
  alternates: { canonical: '/contact' },
};

/** คอลัมน์ที่หน้านี้อ่านได้ ไม่มีคอลัมน์การเงินอยู่ในชุดนี้ */
const COLUMNS: Record<ContactField, string> = {
  contactLine: 'contact_line',
  contactEmail: 'contact_email',
  contactPhone: 'contact_phone',
  contactFacebook: 'contact_facebook',
  contactHours: 'contact_hours',
  contactNote: 'contact_note',
};

/**
 * Read with the service key, listing the contact columns by name.
 *
 * The page is public (see PUBLIC_PATHS in proxy.ts) but RLS only lets signed-in
 * users read store_settings — and that row also holds the shop's bank account and
 * PromptPay id. Naming the columns keeps this page unable to leak them even if it
 * is changed carelessly later.
 */
async function loadContacts(): Promise<Record<ContactField, string>> {
  const empty = Object.fromEntries(
    Object.keys(COLUMNS).map((field) => [field, ''])
  ) as Record<ContactField, string>;

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('store_settings')
      .select(Object.values(COLUMNS).join(','))
      .maybeSingle();

    if (!data) return empty;

    // ผ่าน unknown เพราะ select() ที่ประกอบชื่อคอลัมน์ตอนรันทำให้ชนิดที่ได้เป็น union
    // กับ error object ของ PostgREST
    const row = data as unknown as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(COLUMNS).map(([field, column]) => [
        field,
        typeof row[column] === 'string' ? (row[column] as string) : '',
      ])
    ) as Record<ContactField, string>;
  } catch {
    // A contact page that 500s is worse than one that shows the fallback text.
    return empty;
  }
}

export default async function ContactPage() {
  const contacts = await loadContacts();
  const channels = filledContacts(contacts);

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">ติดต่อเรา</h1>
      <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
        มีคำถามเรื่องสินค้า การสั่งซื้อ หรือการเติมเงิน ทักมาได้ตามช่องทางด้านล่าง
      </p>

      {channels.length === 0 ? (
        <p className="mt-8 border-l-2 border-neutral-900 pl-3 text-sm text-neutral-600 leading-relaxed">
          ร้านยังไม่ได้ระบุช่องทางติดต่อ — ผู้ดูแลระบบกรอกได้ที่{' '}
          <Link href="/admin" className="underline underline-offset-2 font-medium text-neutral-900">
            หน้าแอดมิน → ตั้งค่าร้านค้า
          </Link>
        </p>
      ) : (
        <dl className="mt-8 divide-y divide-neutral-100 border-t border-neutral-100">
          {channels.map((channel) => (
            <div
              key={channel.field}
              className="py-4 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6"
            >
              <dt className="text-xs font-medium text-neutral-500 sm:w-32 sm:shrink-0">
                {channel.label}
              </dt>
              <dd className="text-sm text-neutral-900 break-words min-w-0">
                {channel.href ? (
                  <a
                    href={channel.href}
                    target={channel.href.startsWith('http') ? '_blank' : undefined}
                    rel={channel.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="font-medium underline underline-offset-2 hover:text-neutral-500 transition-colors"
                  >
                    {channel.value}
                  </a>
                ) : (
                  <span className={channel.multiline ? 'whitespace-pre-line leading-relaxed' : ''}>
                    {channel.value}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="mt-8 text-xs text-neutral-400 leading-relaxed">
        แจ้งปัญหาคำสั่งซื้อ กรุณาแจ้งเลขที่คำสั่งซื้อมาด้วย จะตรวจสอบให้เร็วขึ้น ·
        ดูสถานะคำสั่งซื้อได้ที่หน้า{' '}
        <Link href="/orders" className="underline underline-offset-2 hover:text-neutral-900">
          ประวัติการซื้อ
        </Link>
      </p>
    </>
  );
}
