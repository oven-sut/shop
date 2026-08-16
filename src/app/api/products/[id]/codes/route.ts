import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { badRequest, dbError, serverError } from '@/lib/api-response';
import { createRouteClient } from '@/lib/supabase/server';

/** One paste should be able to stock a product, not the whole shop. */
const MAX_PER_REQUEST = 500;
const MAX_CODE_LENGTH = 500;

type Row = Record<string, unknown>;

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const toCode = (row: Row) => ({
  id: str(row.id),
  code: str(row.code),
  label: str(row.label) || undefined,
  note: str(row.note) || undefined,
  orderId: str(row.order_id) || undefined,
  claimedAt: str(row.claimed_at) || undefined,
  createdAt: str(row.created_at),
});

/**
 * Splits a pasted block into entries, one per line.
 *
 * `label|code` keeps the two halves apart — for a game account that is the
 * username and its password. A line with no `|` is taken whole as the code,
 * which is what a bare product key looks like.
 */
function parseCodes(input: unknown): { label: string | null; code: string }[] {
  let lines: string[] = [];
  if (Array.isArray(input)) {
    lines = input.filter((value) => typeof value === 'string');
  } else if (typeof input === 'string') {
    lines = input.split(/\r?\n/);
  }

  const parsed: { label: string | null; code: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const separator = trimmed.indexOf('|');
    const label = separator === -1 ? null : trimmed.slice(0, separator).trim() || null;
    const code = (separator === -1 ? trimmed : trimmed.slice(separator + 1).trim()).slice(
      0,
      MAX_CODE_LENGTH
    );

    // Repeats are kept, not collapsed. A line is a unit of stock, so pasting the
    // same key ten times is how a shop stocks ten sales of it — the pool used to
    // refuse that and silently hand back one.
    if (!code) continue;

    parsed.push({ label: label?.slice(0, MAX_CODE_LENGTH) ?? null, code });
  }

  return parsed;
}

/** คลังรหัสของสินค้าชิ้นนี้ — แอดมินเท่านั้น */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createRouteClient();

    const { data, error } = await supabase
      .from('product_codes')
      .select('*')
      .eq('product_id', id)
      // ยังไม่ขายขึ้นก่อน แล้วเรียงตามที่เพิ่มเข้ามา
      .order('claimed_at', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true })
      .limit(1000);

    if (error) return dbError(error);

    const codes = (data as Row[]).map(toCode);

    return NextResponse.json({
      success: true,
      data: {
        codes,
        available: codes.filter((code) => !code.claimedAt).length,
        sold: codes.filter((code) => code.claimedAt).length,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * เติมรหัสเข้าคลัง
 *
 * ไม่ต้องแตะสต็อกเอง — ทริกเกอร์ `product_codes_sync_stock` ตั้งสต็อกของสินค้า
 * ให้เท่ากับจำนวนรหัสที่ยังไม่ถูกขายทุกครั้งที่คลังเปลี่ยน
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();
    const entries = parseCodes(body.codes ?? body.text);

    if (!entries.length) {
      return badRequest('กรุณาใส่รหัสอย่างน้อยหนึ่งบรรทัด');
    }

    if (entries.length > MAX_PER_REQUEST) {
      return badRequest(`ใส่ได้ครั้งละไม่เกิน ${MAX_PER_REQUEST} รหัส`);
    }

    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) || null : null;

    // insert ตรง ๆ ไม่ใช่ upsert: รหัสซ้ำไม่ใช่ความขัดแย้งอีกต่อไป หนึ่งบรรทัด
    // คือของหนึ่งชิ้น วางรหัสเดิมสิบบรรทัดก็คือมีของสิบชิ้นที่ขายได้สิบครั้ง
    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('product_codes')
      .insert(
        entries.map((entry) => ({ product_id: id, code: entry.code, label: entry.label, note }))
      )
      .select('id');

    if (error) return dbError(error, 403);

    const added = data?.length ?? 0;

    return NextResponse.json(
      {
        success: true,
        message: `เพิ่มรหัสเข้าคลัง ${added} รายการแล้ว`,
        data: { added, skipped: 0 },
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}

/**
 * ลบรหัสที่ยังไม่ถูกขายออกจากคลัง
 *
 * รหัสที่ขายไปแล้วลบไม่ได้ เพราะเป็นหลักฐานว่าของชิ้นไหนไปอยู่กับคำสั่งซื้อไหน
 * และเป็นสิ่งที่ลูกค้าเห็นอยู่ในประวัติการซื้อ
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const codeId = new URL(request.url).searchParams.get('codeId');

    if (!codeId) return badRequest('กรุณาระบุ codeId ที่ต้องการลบ');

    const supabase = await createRouteClient();
    const { data, error } = await supabase
      .from('product_codes')
      .delete()
      .eq('id', codeId)
      .eq('product_id', id)
      .is('claimed_at', null)
      .select('id')
      .maybeSingle();

    if (error) return dbError(error, 403);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'not_found',
          message: 'ไม่พบรหัสนี้ในคลัง หรือถูกขายไปแล้วจึงลบไม่ได้',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'ลบรหัสออกจากคลังแล้ว' });
  } catch (error) {
    return serverError(error);
  }
}
