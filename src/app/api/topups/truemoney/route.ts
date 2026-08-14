import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { dbError, serverError } from '@/lib/api-response';
import { enforceRateLimit } from '@/lib/rate-limit';
import { loadSettings } from '@/lib/settings';
import { channelClosedMessage, isChannelEnabled } from '@/lib/topup-channels';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/server';
import { readVoucherHash, redeemVoucher, VoucherError } from '@/lib/truemoney';

/**
 * POST /api/topups/truemoney — เติมเงินด้วยซองอังเปาทรูมันนี่
 *
 * Unlike the slip route, the money moves *inside* this request: TrueMoney hands
 * the voucher to the shop's wallet and the customer is credited for what
 * arrived. There is no second opinion to ask afterwards and no way to give it
 * back, which shapes every decision below.
 */

/**
 * Each attempt asks TrueMoney to move real money, and a loop of guessed hashes
 * is exactly what an abuser would try. Kept as tight as topping up honestly needs.
 */
const VOUCHER_LIMIT = { name: 'topup-voucher', limit: 10, windowMs: 60_000 };

/** ยาวกว่านี้ไม่ใช่ลิงก์ซอง */
const MAX_INPUT_LENGTH = 512;

export async function POST(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const fail = (message: string, status = 400, code = 'voucher_failed') =>
    NextResponse.json({ success: false, error: code, message }, { status });

  const limited = enforceRateLimit(VOUCHER_LIMIT, user.id);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const input = typeof body.voucher === 'string' ? body.voucher.slice(0, MAX_INPUT_LENGTH) : '';

    const hash = readVoucherHash(input);
    if (!hash) {
      return fail('ลิงก์ซองอังเปาไม่ถูกต้อง — วางลิงก์เต็ม ๆ ที่ได้จากทรูวอลเล็ต');
    }

    const supabase = await createRouteClient();
    const settings = await loadSettings(supabase);

    // Before anything is sent to TrueMoney: a closed channel must not redeem a
    // voucher it is then unable to credit.
    if (!isChannelEnabled(settings, 'voucher')) {
      return fail(channelClosedMessage('voucher'), 503, 'channel_disabled');
    }

    // Namespaced so a voucher hash can never collide with a bank slip's
    // reference in the same unique column.
    const transRef = `truemoney:${hash}`;
    const admin = createAdminClient();

    // Asking first costs one indexed lookup and saves burning a redeem attempt on
    // a voucher we have already paid for. The unique index below is still the
    // thing that makes double-crediting impossible.
    const { data: existing, error: lookupError } = await admin
      .from('topups')
      .select('id')
      .eq('trans_ref', transRef)
      .maybeSingle();

    if (lookupError) return dbError(lookupError);
    if (existing) return fail('ซองอังเปาใบนี้ถูกใช้เติมเงินไปแล้ว', 409, 'voucher_already_used');

    // ── ไถ่ซองกับทรู — หลังบรรทัดนี้เงินเข้าวอลเล็ตร้านแล้ว ──────────────────
    const voucher = await redeemVoucher(hash, settings.topupTruemoneyPhone);

    const { data, error } = await admin.rpc('credit_topup', {
      p_user_id: user.id,
      p_amount: voucher.amount,
      p_trans_ref: transRef,
      p_sending_bank: 'TrueMoney Wallet',
      p_receiving_bank: 'TrueMoney Wallet',
      p_sender_name: voucher.ownerName ?? null,
      p_receiver_name: settings.topupReceiverName || null,
      p_transferred_at: voucher.redeemedAt,
      p_raw: voucher.raw,
      p_note: 'เติมเงินด้วยซองอังเปาทรูมันนี่',
    });

    if (error) {
      if (error.code === '23505') {
        // Two requests raced with the same voucher; the loser must not credit again.
        return fail('ซองอังเปาใบนี้ถูกใช้เติมเงินไปแล้ว', 409, 'voucher_already_used');
      }

      // The worst case in this file: the shop has the money and the customer does
      // not. Nothing can retry it safely, so it is logged with everything needed
      // to settle it by hand.
      console.error(
        '[topup:truemoney] REDEEMED BUT NOT CREDITED',
        JSON.stringify({ userId: user.id, transRef, amount: voucher.amount })
      );
      return dbError(error, 500);
    }

    const balance = Number((data as { balance: string | number } | null)?.balance ?? 0);

    return NextResponse.json(
      {
        success: true,
        message: `เติมเงิน ฿${voucher.amount.toLocaleString()} จากซองอังเปาสำเร็จ`,
        data: { amount: voucher.amount, transRef, balance },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof VoucherError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return serverError(error);
  }
}
