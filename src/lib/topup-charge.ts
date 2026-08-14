import { ChargeStatus, GatewayCharge, GatewayError } from './gateway';
import { createAdminClient } from './supabase/admin';

/**
 * เติมเงินจากรายการที่เกตเวย์ยืนยันแล้ว
 *
 * Called from two places that must behave identically: the gateway's webhook and
 * the page polling its own charge. Either may arrive first, both may arrive at
 * once, and neither is allowed to credit twice — which is why the charge id is
 * the `trans_ref` and the unique index on it is the real guard, not the checks
 * around it.
 *
 * `charge` must have come from the gateway's API in this same request. A charge
 * assembled from a webhook body would let anyone claim any amount was paid.
 */
export interface SettledCharge {
  status: ChargeStatus;
  amount: number;
  /** ยอดคงเหลือหลังเติม — มีเฉพาะรอบที่เติมเข้าจริง */
  balance?: number;
  /** true = เคยเติมจากรายการนี้ไปแล้ว (webhook กับหน้าเว็บชนกัน) */
  alreadyCredited?: boolean;
}

export async function settleCharge(
  charge: GatewayCharge,
  gatewayName: string
): Promise<SettledCharge> {
  if (charge.status !== 'paid') {
    return { status: charge.status, amount: charge.amount };
  }

  if (!charge.userId) {
    // Paid, but nothing says whose it is. Only a human can place this money, so
    // it is logged with the charge id rather than credited to a guess.
    console.error(
      '[topup:charge] PAID WITH NO OWNER IN METADATA',
      JSON.stringify({ gateway: gatewayName, chargeId: charge.id, amount: charge.amount })
    );
    throw new GatewayError(
      'charge_no_owner',
      'ชำระเงินสำเร็จแต่ระบบไม่ทราบว่าเป็นรายการของใคร กรุณาแจ้งผู้ดูแลระบบ',
      500
    );
  }

  if (!(charge.amount > 0)) {
    console.error(
      '[topup:charge] PAID WITH UNUSABLE AMOUNT',
      JSON.stringify({ gateway: gatewayName, chargeId: charge.id, amount: charge.amount })
    );
    throw new GatewayError('charge_bad_amount', 'อ่านยอดที่ชำระไม่ได้ กรุณาแจ้งผู้ดูแลระบบ', 500);
  }

  const paidAt = typeof charge.raw.paid_at === 'string' ? charge.raw.paid_at : null;

  // The history and the ledger must say which way the money actually came in —
  // every gateway charge reading "PromptPay QR" would be untrue half the time.
  const channel = charge.method === 'truemoney' ? 'TrueMoney Wallet' : 'PromptPay QR';
  const note =
    charge.method === 'truemoney'
      ? 'เติมเงินด้วยทรูวอลเล็ต (ชำระผ่านระบบรับชำระเงิน)'
      : 'เติมเงินด้วย QR (ชำระผ่านระบบรับชำระเงิน)';

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('credit_topup', {
    p_user_id: charge.userId,
    p_amount: charge.amount,
    // Namespaced like the voucher refs, so gateway ids and bank slip references
    // can never collide in the one unique column.
    p_trans_ref: `${gatewayName}:${charge.id}`,
    p_sending_bank: channel,
    p_receiving_bank: gatewayName,
    p_sender_name: null,
    p_receiver_name: null,
    p_transferred_at: paidAt,
    p_raw: charge.raw,
    p_note: note,
  });

  if (error) {
    if (error.code === '23505') {
      // The other caller got there first — the correct outcome, not a failure.
      return { status: 'paid', amount: charge.amount, alreadyCredited: true };
    }

    // Money is with the shop and the customer has nothing. Nothing retries this
    // safely, so everything needed to settle it by hand goes in the log.
    console.error(
      '[topup:charge] PAID BUT NOT CREDITED',
      JSON.stringify({
        gateway: gatewayName,
        chargeId: charge.id,
        userId: charge.userId,
        amount: charge.amount,
        dbError: error.message,
      })
    );
    throw new GatewayError('charge_credit_failed', 'ชำระเงินสำเร็จแต่เติมเข้ากระเป๋าไม่สำเร็จ กรุณาแจ้งผู้ดูแลระบบ', 500);
  }

  const balance = Number((data as { balance: string | number } | null)?.balance ?? 0);

  return { status: 'paid', amount: charge.amount, balance };
}
