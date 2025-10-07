import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip all middleware for now to isolate the issue
  console.log(`🔓 [MIDDLEWARE] Processing: ${pathname}`);
  return NextResponse.next();
}

/**
 * Check if the endpoint is an authentication endpoint that should be excluded
 */
function isAuthEndpoint(pathname: string): boolean {
  const authEndpoints = [
    '/api/auth/sign-in',
    '/api/auth/sign-out',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/refresh-token',
    '/api/auth/unified'
  ];
  
  return authEndpoints.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Extract workspaceId from request (query params or body)
 */
function getWorkspaceIdFromRequest(request: NextRequest): string | null {
  // Check query parameters
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspaceId');
  
  if (workspaceId) {
    return workspaceId;
  }
  
  // For POST/PUT requests, we could also check the body
  // but that would require parsing the body which is expensive
  // The endpoint should handle workspace validation from the authenticated user
  
  return null;
}

// Protect all API routes
export const config = {
  matcher: [
    '/api/:path*',
    '/private/:path*'
  ],
};
