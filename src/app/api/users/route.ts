import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { badRequest, dbError, serverError } from '@/lib/api-response';
import { toAdminUser } from '@/lib/mappers';
import { createAdminClient } from '@/lib/supabase/admin';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const MAX_SEARCH_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(Math.trunc(Number.isFinite(value) ? value : min), min), max);

/**
 * A shape check, not a validity check — the mailbox either exists or the person
 * never signs in, and no pattern can tell you which. Written as string splits
 * rather than one expression because the obvious regex for this backtracks
 * quadratically on a long address that fails to match.
 */
function looksLikeEmail(value: string): boolean {
  const parts = value.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || /\s/.test(value)) return false;

  return domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.');
}

/**
 * The user list for the admin page.
 *
 * Everything here — email, sign-in times, wallet balance, lifetime spend — is
 * about *other* people, so the service-role client is used behind `requireAdmin()`
 * rather than the caller's session: no RLS policy grants a customer any of it,
 * and none should be added to make this route work.
 */
export async function GET(request: NextRequest) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get('search') ?? '').trim().slice(0, MAX_SEARCH_LENGTH);
    const role = searchParams.get('role');
    const limit = clamp(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clamp(Number(searchParams.get('offset')) || 0, 0, Number.MAX_SAFE_INTEGER);

    const admin = createAdminClient();
    const { data, error } = await admin.rpc('admin_list_users', {
      p_search: search || null,
      // Anything else means "no filter" — the function treats null as all roles.
      p_role: role === 'admin' || role === 'customer' ? role : null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) return dbError(error);

    const rows = (data ?? []) as Record<string, unknown>[];

    return NextResponse.json({
      success: true,
      count: rows.length,
      // Every row carries the same count of the whole filtered set, so the page
      // can say "showing 25 of 812" without a second query.
      total: Number(rows[0]?.total_rows ?? 0),
      limit,
      offset,
      data: rows.map((row) => toAdminUser(row)),
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * Creates an account by hand — for a customer who cannot receive the
 * confirmation email, or a second admin.
 *
 * `email_confirm: true` because an admin typing the address here *is* the
 * verification; the account would otherwise be unusable until someone opened a
 * link that was never sent.
 */
export async function POST(request: NextRequest) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';

    if (!looksLikeEmail(email)) {
      return badRequest('อีเมลไม่ถูกต้อง');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return badRequest(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { full_name: name } : {},
      // Never take the role from the request body: a new account starts as a
      // customer and is promoted through PATCH, which logs who did it.
      app_metadata: { role: 'customer' },
    });

    if (error) {
      const duplicate = /already|exists|registered/i.test(error.message);
      return NextResponse.json(
        {
          success: false,
          error: duplicate ? 'email_taken' : 'create_failed',
          message: duplicate ? 'อีเมลนี้มีบัญชีอยู่แล้ว' : 'สร้างบัญชีไม่สำเร็จ',
        },
        { status: duplicate ? 409 : 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `สร้างบัญชี ${email} เรียบร้อยแล้ว`,
        data: { id: data.user?.id ?? '', email },
      },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}
