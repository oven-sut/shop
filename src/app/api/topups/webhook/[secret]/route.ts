import { NextResponse, type NextRequest } from 'next/server';
import { serverError } from '@/lib/api-response';
import { activeGateway, GatewayError } from '@/lib/gateway';
import { enforceRateLimit } from '@/lib/rate-limit';
import { settleCharge } from '@/lib/topup-charge';

/**
 * POST /api/topups/webhook/[secret] — เกตเวย์แจ้งว่าจ่ายแล้ว
 *
 * The only endpoint in the app that answers without a session (see `PUBLIC_PATHS`
 * in `proxy.ts`), because the caller is a payment gateway and has no account here.
 *
 * That is safe for one reason: **this handler reads nothing from the body except a
 * charge id.** The amount, the status and the owner all come from a fresh,
 * authenticated read of that charge from the gateway. A forged body can therefore
 * only ask the shop to re-check a real charge, which is harmless.
 *
 * The secret in the path is not what makes it safe — it keeps strangers from
 * making the shop call its gateway in a loop. Correctness does not depend on it.
 */
const WEBHOOK_LIMIT = { name: 'topup-webhook', limit: 240, windowMs: 60_000 };

/** Compared without leaking length or position through timing. */
function secretMatches(given: string): boolean {
  const expected = process.env.TOPUP_WEBHOOK_SECRET ?? '';
  if (!expected || given.length !== expected.length) return false;

  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= given.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ secret: string }> }) {
  // Everything a stranger can reach answers the same way, so the endpoint gives
  // away nothing about whether the secret, the gateway or the event was the problem.
  const notFound = () => new NextResponse('Not found', { status: 404 });

  try {
    const { secret } = await params;
    if (!secretMatches(secret)) return notFound();

    const limited = enforceRateLimit(WEBHOOK_LIMIT, 'gateway');
    if (limited) return limited;

    const gateway = activeGateway();
    if (!gateway) return notFound();

    const body: unknown = await request.json().catch(() => null);
    const chargeId = gateway.readWebhookChargeId(body);

    // Gateways send many event types; the ones that are not about a charge are
    // acknowledged so they are not retried forever.
    if (!chargeId) return NextResponse.json({ success: true, ignored: true });

    const charge = await gateway.fetchCharge(chargeId);
    const settled = await settleCharge(charge, gateway.name);

    return NextResponse.json({ success: true, status: settled.status });
  } catch (error) {
    if (error instanceof GatewayError) {
      // A 5xx tells the gateway to deliver this event again later, which is what
      // should happen when the shop could not finish crediting a real payment.
      console.error('[topup:webhook]', error.code, error.message);
      return NextResponse.json({ success: false, error: error.code }, { status: 500 });
    }
    return serverError(error);
  }
}
