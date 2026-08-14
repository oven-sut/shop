import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { badRequest, dbError, serverError } from '@/lib/api-response';
import { createRouteClient } from '@/lib/supabase/server';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET || 'product-images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const extensionOf = (type: string) => (type === 'image/jpeg' ? 'jpg' : type.split('/')[1]);

/** Uploads a product image to Supabase Storage and returns its public URL. */
export async function POST(request: NextRequest) {
  const { response: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return badRequest('กรุณาเลือกไฟล์รูป');
    }

    if (!ALLOWED.includes(file.type)) {
      return badRequest('รองรับเฉพาะไฟล์ JPG, PNG, WebP, AVIF และ GIF');
    }

    if (file.size > MAX_BYTES) {
      return badRequest('ไฟล์ต้องไม่เกิน 5 MB');
    }

    // The upload runs as the signed-in admin, so the storage policy is what
    // ultimately authorises it — the check above is just a friendlier error.
    const supabase = await createRouteClient();
    const path = `products/${crypto.randomUUID()}.${extensionOf(file.type)}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) return dbError(error);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json(
      { success: true, message: 'อัปโหลดรูปสำเร็จ', data: { path, url: data.publicUrl } },
      { status: 201 }
    );
  } catch (error) {
    return serverError(error);
  }
}
