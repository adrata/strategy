/**
 * UNIVERSAL AUTHENTICATION MIDDLEWARE
 * 
 * Protects ALL API endpoints with enterprise-grade authentication
 * while maintaining performance and user experience.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUnifiedAuthUser } from "@/platform/api-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle private routes (existing functionality)
  if (pathname.startsWith('/private/')) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');                                                                            
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');                                                                      
    return response;
  }
  
  // Skip authentication for auth endpoints
  if (isAuthEndpoint(pathname)) {
    console.log(`🔓 [MIDDLEWARE] Skipping authentication for auth endpoint: ${pathname}`);
    return NextResponse.next();
  }
  
  // Protect all API endpoints with authentication
  if (pathname.startsWith('/api/')) {
    try {
      console.log(`🔐 [MIDDLEWARE] Protecting API endpoint: ${pathname}`);
      
      // No development bypass - require proper authentication
      
      // 1. Authenticate user
      const authUser = await getUnifiedAuthUser(request);
      
      if (!authUser) {
        console.log(`❌ [MIDDLEWARE] Authentication failed for ${pathname}`);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          },
          { status: 401 }
        );
      }

      // 2. Basic workspace access validation (lightweight for middleware)
      const workspaceId = getWorkspaceIdFromRequest(request);
      if (workspaceId && workspaceId !== authUser.workspaceId) {
        console.log(`🔍 [MIDDLEWARE] Workspace mismatch: user workspace ${authUser.workspaceId} vs requested ${workspaceId}`);
        
        // For now, allow the request to pass through to the endpoint
        // The endpoint will handle detailed workspace access control with Prisma
        console.log(`⚠️ [MIDDLEWARE] Workspace mismatch detected - endpoint will handle detailed validation`);
      }

      // 3. Add authenticated user context to request headers
      const response = NextResponse.next();
      response.headers.set('x-user-id', authUser.id);
      response.headers.set('x-user-email', authUser.email);
      response.headers.set('x-workspace-id', authUser.workspaceId || '');
      response.headers.set('x-user-name', authUser.name || '');
      
      console.log(`✅ [MIDDLEWARE] Authentication successful for user ${authUser.email} on ${pathname}`);
      return response;

    } catch (error) {
      console.error(`❌ [MIDDLEWARE] Authentication error for ${pathname}:`, error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed',
          code: 'AUTH_ERROR'
        },
        { status: 401 }
      );
    }
  }
  
  // Pass through for all other routes
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
    '/api/health',
    '/api/webhooks'
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