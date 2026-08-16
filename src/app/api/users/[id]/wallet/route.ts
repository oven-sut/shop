import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { badRequest, serverError } from '@/lib/api-response';
import { createAdminClient } from '@/lib/supabase/admin';

/** A hand-typed adjustment this large is a slipped keyboard, not a decision. */
const MAX_ADJUSTMENT = 1_000_000;

/**
 * Adds to or takes from a customer's wallet by hand.
 *
 * Compensation for a failed delivery, a refund the shop agreed to over chat, or
 * correcting a top-up that arrived twice. The balance and the ledger entry are
 * written in one transaction inside `admin_adjust_wallet()`, so the money in the
 * wallet is always explained by a row the customer can see in their history.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Two decimals because the column is numeric(12,2) — a third would be
    // rounded away by Postgres and the note would no longer match the movement.
    const amount = Math.round(Number(body.amount) * 100) / 100;
    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : '';

    if (!Number.isFinite(amount) || amount === 0) {
      return badRequest('ระบุจำนวนเงินที่ต้องการปรับ (ติดลบ = หักออก)');
    }
    if (Math.abs(amount) > MAX_ADJUSTMENT) {
      return badRequest(`ปรับได้ครั้งละไม่เกิน ฿${MAX_ADJUSTMENT.toLocaleString()}`);
    }

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('admin_adjust_wallet', {
      p_user_id: id,
      p_amount: amount,
      // Who did it belongs in the ledger — the customer sees this line, and so
      // does the next admin wondering where the money came from.
      p_note: note ? `${note} (โดย ${user.email})` : `ปรับยอดโดยแอดมิน ${user.email}`,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: 'adjust_failed', message: describe(error.message) },
        { status: 400 }
      );
    }

    const balance = Number((data as { balance: string | number } | null)?.balance ?? 0);

    return NextResponse.json({
      success: true,
      message:
        amount > 0
          ? `เพิ่มเงิน ฿${amount.toLocaleString()} แล้ว ยอดคงเหลือ ฿${balance.toLocaleString()}`
          : `หักเงิน ฿${Math.abs(amount).toLocaleString()} แล้ว ยอดคงเหลือ ฿${balance.toLocaleString()}`,
      data: { balance },
    });
  } catch (error) {
    return serverError(error);
  }
}

/** Only the function's own tagged exceptions are echoed back. */
function describe(message: string): string {
  if (message.includes('insufficient_balance')) {
    const [, balance, needed] = message.split(':');
    return `หักไม่ได้ ยอดในกระเป๋ามีแค่ ฿${Number(balance).toLocaleString()} (จะหัก ฿${Number(needed).toLocaleString()})`;
  }
  if (message.includes('user_not_found')) return 'ไม่พบบัญชีผู้ใช้นี้';
  if (message.includes('invalid_amount')) return 'จำนวนเงินไม่ถูกต้อง';

  console.error('[admin_adjust_wallet]', message);
  return 'ปรับยอดเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
}
