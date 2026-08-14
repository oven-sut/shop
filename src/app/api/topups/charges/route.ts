import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { activeGateway, GatewayError } from '@/lib/gateway';
import { enforceRateLimit } from '@/lib/rate-limit';
import { loadSettings } from '@/lib/settings';
import { createRouteClient } from '@/lib/supabase/server';

/**
 * POST /api/topups/charges — ขอ QR ที่เติมเงินให้เองเมื่อจ่ายแล้ว
 *
 * The QR here comes from the payment gateway, not from `lib/promptpay.ts`: the
 * gateway is the party that can tell the shop the money arrived, which is what
 * makes crediting without a slip possible at all.
 *
 * Nothing is credited by this route. It only opens the charge; `/api/topups/charges/[id]`
 * and the webhook do the crediting, and both re-read the charge from the gateway
 * first.
 */
const CHARGE_LIMIT = { name: 'topup-charge', limit: 20, windowMs: 60_000 };

/**
 * GET /api/topups/charges — มีเกตเวย์ให้ใช้ไหม
 *
 * The wallet page asks before drawing the QR tab: with a gateway it offers a QR
 * that credits by itself, without one it offers the shop's own PromptPay QR and
 * says a slip is still needed. Finding out by trying to open a charge would mean
 * showing the customer a promise the shop cannot keep.
 */
export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const gateway = activeGateway();
  return NextResponse.json({
    success: true,
    data: { gateway: gateway?.name ?? null, methods: gateway?.methods ?? [] },
  });
}

export async function POST(request: NextRequest) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const fail = (message: string, status = 400, code = 'charge_failed') =>
    NextResponse.json({ success: false, error: code, message }, { status });

  const limited = enforceRateLimit(CHARGE_LIMIT, user.id);
  if (limited) return limited;

  try {
    const gateway = activeGateway();
    if (!gateway) {
      return fail(
        'ร้านยังไม่ได้ต่อระบบรับชำระเงิน — สแกน QR พร้อมเพย์แล้วอัปโหลดสลิปแทนได้',
        503,
        'gateway_not_configured'
      );
    }

    const body = await request.json().catch(() => ({}));
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return fail('กรุณาระบุจำนวนเงินที่จะเติม');
    }

    const method = body.method === 'truemoney' ? 'truemoney' : 'promptpay';

    if (!gateway.methods.includes(method)) {
      return fail(`ระบบรับชำระเงินที่ตั้งไว้ไม่รองรับช่องทางนี้`, 400, 'method_not_supported');
    }

    // The customer's own wallet number — TrueMoney sends the OTP there. Checked
    // here so a typo comes back as a form error instead of a gateway rejection.
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';

    if (method === 'truemoney' && !/^0\d{9}$/.test(phone)) {
      return fail('กรุณากรอกเบอร์ทรูวอลเล็ตของคุณให้ครบ 10 หลัก');
    }

    const supabase = await createRouteClient();
    const settings = await loadSettings(supabase);

    // Same bounds as every other channel that can be checked before the money
    // moves. Here it *can* be enforced up front, because the amount is fixed
    // into the charge before the customer pays anything.
    if (amount < settings.topupMinAmount || amount > settings.topupMaxAmount) {
      return fail(
        `เติมเงินได้ครั้งละ ฿${settings.topupMinAmount.toLocaleString()} – ฿${settings.topupMaxAmount.toLocaleString()}`
      );
    }

    // Where the customer lands after confirming with an OTP. Built from the site
    // URL when it is set, since the gateway must be given an address that works
    // from the customer's phone — not whatever host this request happened to use.
    const returnUri = new URL('/wallet', process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin)
      .toString();

    const charge = await gateway.createCharge({
      amount,
      userId: user.id,
      method,
      phone,
      returnUri,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: charge.id,
          amount: charge.amount,
          status: charge.status,
          method: charge.method,
          expiresAt: charge.expiresAt ?? null,
          gateway: gateway.name,
          // Served through the shop so the browser never talks to the gateway.
          qrPath: charge.method === 'promptpay'
            ? `/api/topups/charges/${encodeURIComponent(charge.id)}/qr`
            : null,
          // The one page the customer does have to open at the provider.
          authorizeUri: charge.authorizeUri ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof GatewayError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return serverError(error);
  }
}
