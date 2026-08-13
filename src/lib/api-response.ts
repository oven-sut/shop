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

/** 500 wrapper for the `catch` block of a route handler. */
export function serverError(error: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error',
    },
    { status: 500 }
  );
}
