import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { buildPromptPayQr } from '@/lib/promptpay';
import {
  pickPromptPayTarget,
  PROMPTPAY_KIND_LABEL,
  PROMPTPAY_SHAPE_HINT,
} from '@/lib/promptpay-id';
import { enforceRateLimit } from '@/lib/rate-limit';
import { loadSettings } from '@/lib/settings';
import { channelClosedMessage, isChannelEnabled } from '@/lib/topup-channels';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * Drawing a QR costs nothing but CPU, so this is far looser than the slip
 * check next door — it only stops a loop from pinning a core.
 */
const QR_LIMIT = { name: 'topup-qr', limit: 60, windowMs: 60_000 };

/**
 * GET /api/topups/qr?amount=500
 *
 * Returns the shop's PromptPay QR with the amount pre-filled. No amount is
 * allowed too: banking apps then let the payer type it in themselves.
 *
 * The target always comes from store settings, never from the query — a QR
 * built from a caller-supplied number would let anyone hand a stranger's
 * payment page out under the shop's name.
 */
export async function GET(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const fail = (message: string, status = 400, code = 'promptpay_failed') =>
    NextResponse.json({ success: false, error: code, message }, { status });

  const limited = enforceRateLimit(QR_LIMIT, user.id);
  if (limited) return limited;

  try {
    const supabase = await createRouteClient();
    const settings = await loadSettings(supabase);

    if (!isChannelEnabled(settings, 'qr')) {
      return fail(channelClosedMessage('qr'), 503, 'channel_disabled');
    }

    const target = pickPromptPayTarget(settings.topupPromptpayId, settings.topupReceiverAccount);
    if (!target) {
      return fail(
        settings.topupPromptpayId.trim()
          ? `เลขพร้อมเพย์ที่ร้านตั้งไว้ไม่ถูกต้อง (${PROMPTPAY_SHAPE_HINT}) — โอนตามเลขบัญชีที่แสดงไว้แล้วอัปโหลดสลิปได้ตามปกติ`
          : 'ร้านยังไม่ได้ตั้งค่าพร้อมเพย์ กรุณาให้ผู้ดูแลระบบตั้งค่าที่หน้าแอดมิน → ตั้งค่าร้านค้า',
        503,
        'promptpay_not_configured'
      );
    }

    // An empty `amount` is a static QR on purpose; a malformed one is a mistake.
    const raw = request.nextUrl.searchParams.get('amount');
    let amount: number | null = null;

    if (raw !== null && raw.trim() !== '') {
      amount = Number(raw);

      if (!Number.isFinite(amount) || amount <= 0) {
        return fail('จำนวนเงินไม่ถูกต้อง');
      }

      // Same bounds the slip check enforces. Handing out a QR for an amount that
      // would be refused afterwards would take the customer's money first and
      // explain the problem second.
      if (amount < settings.topupMinAmount || amount > settings.topupMaxAmount) {
        return fail(
          `เติมเงินได้ครั้งละ ฿${settings.topupMinAmount.toLocaleString()} – ฿${settings.topupMaxAmount.toLocaleString()}`
        );
      }
    }

    const qr = await buildPromptPayQr(target, amount);

    return NextResponse.json({
      success: true,
      data: {
        payload: qr.payload,
        image: qr.image,
        amount: qr.amount,
        kind: qr.kind,
        kindLabel: PROMPTPAY_KIND_LABEL[qr.kind],
        // Echoed as the admin typed it — separators and all — so the customer can
        // read the QR back against the account details shown beside it.
        account: settings.topupPromptpayId.trim() || settings.topupReceiverAccount,
        receiverName: settings.topupReceiverName,
        bankName: settings.topupBankName,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}
