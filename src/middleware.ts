/**
 * Middleware Configuration
 * 
 * Safe crawling protection for private content without breaking the site
 */

import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only process private routes
  if (pathname.startsWith('/private/')) {
    // Add noindex, nofollow meta tags for private content
    const response = NextResponse.next();
    
    // Add headers to prevent crawling
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    
    return response;
  }
  
  // Pass through for all other routes
  return NextResponse.next();
}

// Only match private routes to avoid breaking the main site
export const config = {
  matcher: [
    '/private/:path*'
  ],
};