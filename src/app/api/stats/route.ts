import { NextResponse } from 'next/server';
import { getStatsStore } from '@/lib/apiStore';

export async function GET() {
  try {
    const stats = getStatsStore();
    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
