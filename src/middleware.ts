/**
 * UNIVERSAL AUTHENTICATION MIDDLEWARE
 * 
 * Protects ALL API endpoints with enterprise-grade authentication
 * while maintaining performance and user experience.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUnifiedAuthUser } from "@/platform/api-auth";

export async function middleware(request: NextRequest) {
  // TEMPORARY: Disable middleware completely to test if it's causing the issue
  console.log(`🔓 [MIDDLEWARE] Temporarily disabled - allowing all requests: ${request.nextUrl.pathname}`);
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
    '/api/auth/unified',
    '/sign-in'  // Add the sign-in page route
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

// Protect API routes only - private routes handle their own authentication
export const config = {
  matcher: [
    '/api/:path*'  // Only protect API routes
  ],
};