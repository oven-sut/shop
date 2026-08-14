import { NextResponse } from 'next/server';

/** 401 body shared by proxy.ts and every route handler. */
export function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: 'unauthorized',
      message: 'กรุณาเข้าสู่ระบบก่อนเรียกใช้งาน API',
    },
    { status: 401 }
  );
}

/** 403 body shared by every admin-only handler. */
export function forbidden(message = 'เฉพาะผู้ดูแลระบบเท่านั้น') {
  return NextResponse.json({ success: false, error: 'forbidden', message }, { status: 403 });
}

export function badRequest(message: string, code = 'bad_request') {
  return NextResponse.json({ success: false, error: code, message }, { status: 400 });
}

/**
 * A short id that ties the response the caller sees to the line in the server
 * log. It carries no information on its own, so it is safe to show.
 */
const traceId = () => crypto.randomUUID().slice(0, 8);

/**
 * 500 wrapper for the `catch` block of a route handler.
 *
 * The thrown message never reaches the client. Exceptions here quote whatever
 * blew up — Postgres constraint and column names, Supabase URLs, the names of
 * env vars that are missing — which hands an attacker a free map of the schema
 * and the deployment. The full error goes to the server log instead, and the
 * caller gets a trace id to quote when reporting the problem.
 */
export function serverError(error: unknown) {
  const ref = traceId();
  console.error(`[api:${ref}]`, error);

  return NextResponse.json(
    {
      success: false,
      error: 'internal_error',
      message: `เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง (อ้างอิง: ${ref})`,
    },
    { status: 500 }
  );
}

/**
 * A failed database call. Same reasoning as `serverError`: PostgREST errors
 * spell out table names, column names and policy names, so they are logged
 * rather than returned.
 *
 * `status` stays a parameter because the meaning differs by call site — an
 * insert refused by RLS is a 403, a malformed filter is a 400.
 */
export function dbError(error: { message: string; code?: string }, status = 400) {
  const ref = traceId();
  console.error(`[db:${ref}]`, error.code ?? '', error.message);

  return NextResponse.json(
    {
      success: false,
      error: 'database_error',
      message: `ทำรายการกับฐานข้อมูลไม่สำเร็จ (อ้างอิง: ${ref})`,
    },
    { status }
  );
}

/**
 * PostgREST reads `or=(...)` as a filter expression, so a raw value can close
 * the current condition and append its own — `%x%,is_featured.eq.true` becomes
 * a second filter rather than part of the search term. Double quotes make the
 * value a literal; the inner quotes and backslashes have to be escaped first so
 * the value cannot break back out.
 */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
