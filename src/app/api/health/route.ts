import { NextResponse } from 'next/server';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'API is working' });
}