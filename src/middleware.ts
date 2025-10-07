import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Simple middleware that just passes through all requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*'
  ],
};