/**
 * Desktop API Middleware
 * 
 * This middleware redirects API calls to Tauri commands when running in desktop mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDesktopBuild } from '@/lib/desktop-config';

export function middleware(request: NextRequest) {
  // Skip middleware for desktop builds (static export)
  if (isDesktopBuild) {
    return NextResponse.next();
  }

  // Handle API routes for web builds
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow API routes in web builds
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
