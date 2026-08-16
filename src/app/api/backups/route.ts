import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { serverError } from '@/lib/api-response';
import { BACKUP_BUCKET, runBackup } from '@/lib/backup';
import { enforceRateLimit } from '@/lib/rate-limit';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * ไฟล์สำรองข้อมูล — ดูรายการ ขอลิงก์ดาวน์โหลด และสั่งสำรองเดี๋ยวนี้
 *
 * Admin only, and the bucket is private: links are signed and short-lived, since
 * one of these files is the whole shop in a single download.
 */

/** ลิงก์ดาวน์โหลดอยู่ได้แค่พอกดโหลด ไม่ใช่พอเอาไปแปะที่อื่น */
const SIGNED_URL_TTL_SECONDS = 120;

const MANUAL_LIMIT = { name: 'backup-manual', limit: 3, windowMs: 60 * 60_000 };

export async function GET(request: NextRequest) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(BACKUP_BUCKET)
      .list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } });

    if (error) {
      // The bucket is created by schema.sql; saying so beats a bare 500.
      console.error('[backups] list failed', error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'bucket_unavailable',
          message: 'อ่านรายการไฟล์สำรองไม่ได้ — ตรวจว่ารัน supabase/schema.sql ล่าสุดแล้วหรือยัง',
        },
        { status: 503 }
      );
    }

    const files = data ?? [];
    const wanted = request.nextUrl.searchParams.get('download');

    // ขอลิงก์เฉพาะไฟล์ที่ระบุ ไม่เซ็นทุกไฟล์ทิ้งไว้เฉย ๆ
    let downloadUrl: string | null = null;
    if (wanted && files.some((file) => file.name === wanted)) {
      const { data: signed } = await admin.storage
        .from(BACKUP_BUCKET)
        .createSignedUrl(wanted, SIGNED_URL_TTL_SECONDS);
      downloadUrl = signed?.signedUrl ?? null;
    }

    return NextResponse.json({
      success: true,
      data: {
        files: files.map((file) => ({
          name: file.name,
          bytes: (file.metadata as { size?: number } | null)?.size ?? null,
          createdAt: file.created_at ?? file.updated_at ?? null,
        })),
        downloadUrl,
        expiresInSeconds: downloadUrl ? SIGNED_URL_TTL_SECONDS : null,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

/** สำรองเดี๋ยวนี้ — ตัวเดียวกับที่ cron เรียก ต่างแค่คนกด */
export async function POST() {
  const { user, response: denied } = await requireAdmin();
  if (denied) return denied;

  const limited = enforceRateLimit(MANUAL_LIMIT, user.id);
  if (limited) return limited;

  try {
    const result = await runBackup();

    return NextResponse.json({
      success: true,
      message: `สำรองข้อมูลแล้ว ${(result.bytes / 1024).toFixed(0)} KB`,
      data: result,
    });
  } catch (error) {
    console.error('[backup] manual run failed', error);
    return serverError(error);
  }
}
