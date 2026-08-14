import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { activeGateway, GatewayError } from '@/lib/gateway';
import { enforceRateLimit } from '@/lib/rate-limit';
import { settleCharge } from '@/lib/topup-charge';

/**
 * GET /api/topups/charges/[id] — สถานะรายการ และเติมเงินให้เลยถ้าจ่ายแล้ว
 *
 * The page polls this while the QR is on screen. It is not merely a status
 * read: it credits, exactly like the webhook does. That is deliberate — a
 * webhook that never arrives (misconfigured URL, downtime) would otherwise
 * leave a paid customer with nothing, and this makes the page itself the
 * fallback rather than a support ticket.
 */

/** พอลลิงทุก 4 วินาที = 15 ครั้ง/นาที ปล่อยเผื่อไว้เท่าตัว */
const STATUS_LIMIT = { name: 'topup-charge-status', limit: 40, windowMs: 60_000 };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const limited = enforceRateLimit(STATUS_LIMIT, user.id);
  if (limited) return limited;

  try {
    const { id } = await params;
    const gateway = activeGateway();

    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'gateway_not_configured', message: 'ร้านยังไม่ได้ต่อระบบรับชำระเงิน' },
        { status: 503 }
      );
    }

    const charge = await gateway.fetchCharge(id);

    // Someone else's charge is not theirs to see. Crediting still goes to the
    // owner in the metadata, so this only hides other people's payments — the
    // webhook covers the case where nobody is looking at the page.
    if (charge.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'charge_not_found', message: 'ไม่พบรายการชำระเงินนี้' },
        { status: 404 }
      );
    }

    const settled = await settleCharge(charge, gateway.name);

    return NextResponse.json({
      success: true,
      data: {
        id: charge.id,
        status: settled.status,
        amount: settled.amount,
        expiresAt: charge.expiresAt ?? null,
        // null while pending, and on the poll that loses the race with the
        // webhook — the page reads the balance from /api/wallet either way.
        balance: settled.balance ?? null,
      },
    });
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
