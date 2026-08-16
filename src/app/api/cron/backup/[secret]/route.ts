import { NextResponse, type NextRequest } from 'next/server';
import { serverError } from '@/lib/api-response';
import { runBackup } from '@/lib/backup';
import { enforceRateLimit } from '@/lib/rate-limit';

/**
 * GET|POST /api/cron/backup/[secret] — สำรองข้อมูลหนึ่งรอบ
 *
 * Open to anonymous callers (see PUBLIC_PATHS in proxy.ts) because a scheduler
 * has no session: Vercel Cron, GitHub Actions, or a `curl` line in crontab all
 * work the same way. The secret in the path is what separates them from a
 * stranger — and unlike the payment webhook, that secret is the *only* guard
 * here, since this endpoint does real work rather than re-reading someone
 * else's record. Treat it like a password.
 *
 * GET is allowed as well as POST because several schedulers only send GET.
 */
const CRON_LIMIT = { name: 'cron-backup', limit: 6, windowMs: 60 * 60_000 };

/** Compared without leaking length or position through timing. */
function secretMatches(given: string): boolean {
  const expected = process.env.BACKUP_CRON_SECRET ?? '';
  if (!expected || given.length !== expected.length) return false;

  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= given.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}

async function handle(request: NextRequest, params: Promise<{ secret: string }>) {
  // Everything a stranger can reach answers the same way.
  const notFound = () => new NextResponse('Not found', { status: 404 });

  try {
    const { secret } = await params;
    if (!secretMatches(secret)) return notFound();

    // A backup reads every table; letting it be triggered in a loop is a way to
    // make the database crawl. Six an hour is far above one a day.
    const limited = enforceRateLimit(CRON_LIMIT, 'cron');
    if (limited) return limited;

    const result = await runBackup();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // A failed backup must be loud: nobody is watching this endpoint, and the
    // failure is only discovered when someone needs the file that is not there.
    console.error('[backup] FAILED', error);
    return serverError(error);
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ secret: string }> }) {
  return handle(request, ctx.params);
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ secret: string }> }) {
  return handle(request, ctx.params);
}
