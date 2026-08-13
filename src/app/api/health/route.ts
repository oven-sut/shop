import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/api-auth';

export async function GET() {
  const { response: unauthorized } = await requireApiUser();
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'NEO APP API',
    version: '1.0.0',
    env: {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  });
}
