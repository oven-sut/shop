import { NextResponse, type NextRequest } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { activeGateway, GatewayError } from '@/lib/gateway';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/topups/charges/[id]/qr — รูป QR ของรายการ
 *
 * Proxied rather than linked: the gateway serves the image from its own API host,
 * and handing that URL to the browser would leak where the shop's payments live
 * and put a third-party host in the page's image sources. The shop fetches it
 * with its own key and passes the bytes on.
 */
const QR_IMAGE_LIMIT = { name: 'topup-charge-qr', limit: 30, windowMs: 60_000 };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  const limited = enforceRateLimit(QR_IMAGE_LIMIT, user.id);
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

    if (charge.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'charge_not_found', message: 'ไม่พบรายการชำระเงินนี้' },
        { status: 404 }
      );
    }

    const { bytes, contentType } = await gateway.fetchQrImage(charge);

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        // The QR is a payment instrument tied to one person; it must not sit in a
        // shared cache. `next.config.ts` already sends no-store for /api/*, and
        // this states it next to the bytes it applies to.
        'Cache-Control': 'private, no-store',
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
