import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { dbError, serverError } from '@/lib/api-response';
import { toTopup } from '@/lib/mappers';
import { enforceRateLimit } from '@/lib/rate-limit';
import { SlipDetails, SlipVerifyError, verifySlip } from '@/lib/slip';
import { loadSettings, StoreSettings } from '@/lib/settings';
import { channelClosedMessage, isChannelEnabled } from '@/lib/topup-channels';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * Every attempt spends one call of a paid slip-verification quota, whether or
 * not the slip turns out to be valid, so the endpoint is capped per account.
 * Ten a minute is far above what topping up honestly takes.
 */
const TOPUP_LIMIT = { name: 'topup-verify', limit: 10, windowMs: 60_000 };

/** The providers reject anything larger anyway; refuse it before reading it. */
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const SLIP_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

/** A QR payload is a short string; anything longer is not one. */
const MAX_PAYLOAD_LENGTH = 512;

const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** Letters only, lower-cased — drops titles' punctuation and the bank's mask characters. */
const nameKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

/** Every number the shop is willing to be paid on. */
function receivingNumbers(settings: StoreSettings) {
  return [
    settings.topupReceiverAccount,
    settings.topupPromptpayId,
    settings.topupTruemoneyPhone,
  ].filter((value) => value.trim());
}

/** อย่างน้อยเท่านี้หลักถึงจะถือว่าเทียบได้ ต่ำกว่านี้ชนกันมั่ว */
const MIN_REVEALED_DIGITS = 4;

/**
 * เทียบผู้รับในสลิปกับช่องทางของร้าน
 *
 * Slips mask the destination, and *which part* they mask differs by bank. KBank
 * shows `xxx-x-x9947-x` — the middle four, with the last digit hidden — while
 * others show the last four. So neither side can be compared whole, and taking
 * the configured number's last four digits is wrong on its own: for a KBank slip
 * those digits are never the ones on display.
 *
 * The rule that survives both styles: **whatever the bank reveals must appear
 * inside the number the shop configured.** The reverse is kept as well, for the
 * providers that hand back an unmasked account.
 *
 * Any of the shop's channels counts — a customer who paid the PromptPay QR and a
 * customer who transferred to the bank account both hold a slip for the same
 * shop, and the slip says nothing about which field an admin typed the number in.
 */
function receiverMatches(slip: SlipDetails, settings: StoreSettings) {
  const expected = receivingNumbers(settings)
    .map(digitsOnly)
    .filter((digits) => digits.length >= MIN_REVEALED_DIGITS);

  const revealed = [...slip.receiverAccounts, slip.receiverName ?? '']
    .map(digitsOnly)
    .filter((digits) => digits.length >= MIN_REVEALED_DIGITS);

  if (expected.length && revealed.length) {
    return expected.some((configured) =>
      revealed.some(
        (shown) => configured.includes(shown) || shown.includes(configured.slice(-4))
      )
    );
  }

  // Nothing numeric to go on — either the shop set only a name, or the bank
  // masked every digit. The name is then the only thing left to check.
  const expectedTokens = nameKey(settings.topupReceiverName);
  if (!expectedTokens.length) return false;

  const slipTokens = nameKey(slip.receiverName ?? '');
  if (!slipTokens.length) return false;

  // Every readable part of the slip name must be the start of one of ours.
  const readable = slipTokens.filter((token) => token.length > 0);
  return readable.every((token) =>
    expectedTokens.some((expected) => expected.startsWith(token) || token.startsWith(expected))
  );
}

export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('topups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return dbError(error);

    return NextResponse.json({
      success: true,
      count: data.length,
      data: data.map(toTopup),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const fail = (message: string, status = 400, code = 'topup_failed') =>
    NextResponse.json({ success: false, error: code, message }, { status });

  const limited = enforceRateLimit(TOPUP_LIMIT, user.id);
  if (limited) return limited;

  try {
    // ── อ่านคำขอ: อัปโหลดรูปสลิป หรือส่งข้อความ QR มาก็ได้ ──────────────────
    let declaredAmount = NaN;
    let slipInput: { payload: string } | { file: File } | null = null;

    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.formData();
      declaredAmount = Number(form.get('amount'));

      const file = form.get('slip');
      const payload = form.get('payload');

      if (file instanceof File && file.size > 0) {
        // Checked here rather than left to the provider: an unbounded upload is
        // read into memory and forwarded before anyone rejects it.
        if (!SLIP_TYPES.includes(file.type)) {
          return fail('รองรับเฉพาะรูปสลิปแบบ JPG, PNG, WebP, AVIF และ GIF');
        }
        if (file.size > MAX_SLIP_BYTES) {
          return fail('รูปสลิปต้องไม่เกิน 5 MB');
        }
        slipInput = { file };
      } else if (typeof payload === 'string' && payload.trim()) {
        slipInput = { payload: payload.trim().slice(0, MAX_PAYLOAD_LENGTH) };
      }
    } else {
      const body = await request.json();
      declaredAmount = Number(body.amount);
      if (typeof body.payload === 'string' && body.payload.trim()) {
        slipInput = { payload: body.payload.trim().slice(0, MAX_PAYLOAD_LENGTH) };
      }
    }

    if (!slipInput) return fail('กรุณาแนบรูปสลิป หรือส่งข้อมูล QR ของสลิป');

    const supabase = await createRouteClient();
    const settings = await loadSettings(supabase);

    // Checked before the slip is sent anywhere: verification costs a paid call, and
    // a closed channel must not spend the shop's quota to say no.
    if (!isChannelEnabled(settings, 'slip')) {
      return fail(channelClosedMessage('slip'), 503, 'channel_disabled');
    }

    if (!receivingNumbers(settings).length && !settings.topupReceiverName.trim()) {
      // Fail closed: without a destination to compare against, a slip paid to
      // anyone at all would top this account up.
      return fail(
        'ร้านยังไม่ได้ตั้งค่าบัญชีรับเงิน กรุณาให้ผู้ดูแลระบบตั้งค่าที่หน้าแอดมิน → ตั้งค่าร้านค้า',
        503,
        'topup_not_configured'
      );
    }

    if (!Number.isFinite(declaredAmount) || declaredAmount <= 0) {
      return fail('กรุณาระบุจำนวนเงินที่โอน');
    }

    if (declaredAmount < settings.topupMinAmount || declaredAmount > settings.topupMaxAmount) {
      return fail(
        `เติมเงินได้ครั้งละ ฿${settings.topupMinAmount.toLocaleString()} – ฿${settings.topupMaxAmount.toLocaleString()}`
      );
    }

    // ── ตรวจสลิปกับธนาคารผ่าน RDCW ────────────────────────────────────────
    const slip = await verifySlip(slipInput);

    if (Math.abs(slip.amount - declaredAmount) > 0.01) {
      // A 100× gap means RDCW_AMOUNT_UNIT is set wrong — say so instead of
      // blaming the customer, and never credit the mis-scaled number.
      const offBy100 =
        Math.abs(slip.amount / 100 - declaredAmount) <= 0.01 ||
        Math.abs(slip.amount * 100 - declaredAmount) <= 0.01;

      return fail(
        offBy100
          ? 'ยอดเงินไม่ตรงแบบต่างกัน 100 เท่า — ผู้ดูแลระบบต้องสลับค่า RDCW_AMOUNT_UNIT ใน .env'
          : `ยอดในสลิปคือ ฿${slip.amount.toLocaleString()} ไม่ตรงกับที่กรอก ฿${declaredAmount.toLocaleString()}`
      );
    }

    if (!receiverMatches(slip, settings)) {
      return fail('สลิปนี้ไม่ได้โอนเข้าบัญชีของร้าน');
    }

    if (slip.transferredAt) {
      const ageDays = (Date.now() - new Date(slip.transferredAt).getTime()) / 86_400_000;
      if (ageDays > settings.topupMaxSlipAgeDays) {
        return fail(`สลิปเก่าเกิน ${settings.topupMaxSlipAgeDays} วัน ใช้เติมเงินไม่ได้`);
      }
    }

    // ── เครดิตเข้ากระเป๋าเงิน ─────────────────────────────────────────────
    // ต้องใช้ secret key: ไม่มี RLS policy ไหนให้ผู้ใช้เขียนตาราง wallets/topups ได้เลย
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('credit_topup', {
      p_user_id: user.id,
      p_amount: slip.amount,
      p_trans_ref: slip.transRef,
      p_sending_bank: slip.sendingBank ?? null,
      p_receiving_bank: slip.receivingBank ?? null,
      p_sender_name: slip.senderName ?? null,
      p_receiver_name: slip.receiverName ?? null,
      p_transferred_at: slip.transferredAt ?? null,
      p_raw: slip.raw,
    });

    if (error) {
      if (error.code === '23505') {
        return fail('สลิปนี้ถูกใช้เติมเงินไปแล้ว', 409, 'slip_already_used');
      }
      return dbError(error);
    }

    const balance = Number((data as { balance: string | number } | null)?.balance ?? 0);

    return NextResponse.json(
      {
        success: true,
        message: `เติมเงิน ฿${slip.amount.toLocaleString()} สำเร็จ`,
        data: { amount: slip.amount, transRef: slip.transRef, balance },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SlipVerifyError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return serverError(error);
  }
}
