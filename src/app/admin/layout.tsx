import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { getSessionUser } from '../../lib/supabase/session';

/**
 * Server-side authorization for the whole /admin segment.
 *
 * The role comes from the verified JWT (`app_metadata.role`), which the user
 * cannot modify, so this cannot be bypassed by editing cookies or client state.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?next=/admin');
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col justify-center items-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-neutral-200 shadow-xl rounded-md p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 mx-auto flex items-center justify-center shadow">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">พื้นที่ผู้ดูแลระบบเท่านั้น</h2>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              บัญชี <strong className="text-neutral-700">{user.email}</strong> ไม่มีสิทธิ์ผู้ดูแลระบบ
              <br />
              ผู้ดูแลระบบต้องกำหนดสิทธิ์ให้บัญชีนี้ก่อน (app_metadata.role = &quot;admin&quot;)
            </p>
          </div>
          <Link
            href="/"
            className="inline-block text-xs text-neutral-400 hover:text-neutral-900 transition-colors pt-2"
          >
            ← ย้อนกลับสู่หน้าร้านค้า
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
