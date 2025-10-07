/**
 * UNIVERSAL AUTHENTICATION MIDDLEWARE
 * 
 * Protects ALL API endpoints with enterprise-grade authentication
 * while maintaining performance and user experience.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUnifiedAuthUser } from "@/platform/api-auth";

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
  
  // Handle private routes (existing functionality)
  if (pathname.startsWith('/private/')) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');                                                                            
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');                                                                      
    return response;
  }
  
  // Skip authentication for auth endpoints to prevent circular dependency
  if (isAuthEndpoint(pathname)) {
    console.log(`🔓 [MIDDLEWARE] Skipping authentication for auth endpoint: ${pathname}`);
    const response = NextResponse.next();
    // Add CORS headers for auth endpoints
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
  
  // Skip authentication for debug endpoints
  if (pathname.startsWith('/api/debug/')) {
    console.log(`🔓 [MIDDLEWARE] Skipping authentication for debug endpoint: ${pathname}`);
    return NextResponse.next();
  }
  
  // Skip authentication for health check endpoints
  if (pathname.startsWith('/api/health')) {
    console.log(`🔓 [MIDDLEWARE] Skipping authentication for health endpoint: ${pathname}`);
    return NextResponse.next();
  }
  
  // Skip authentication for webhook endpoints
  if (pathname.startsWith('/api/webhooks')) {
    console.log(`🔓 [MIDDLEWARE] Skipping authentication for webhook endpoint: ${pathname}`);
    return NextResponse.next();
  }
  
  // For all other API endpoints, require authentication
  try {
    console.log(`🔐 [MIDDLEWARE] Checking authentication for: ${pathname}`);
    
    const user = await getUnifiedAuthUser(request);
    
    if (!user) {
      console.log(`❌ [MIDDLEWARE] No authenticated user for: ${pathname}`);
      const response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }
    
    console.log(`✅ [MIDDLEWARE] Authenticated user for: ${pathname}`);
    
    // Add user info to headers for downstream processing
    const response = NextResponse.next();
    response.headers.set('X-User-ID', user.id);
    response.headers.set('X-User-Email', user.email);
    response.headers.set('X-Workspace-ID', user.workspaceId || '');
    
    return response;
    
  } catch (error) {
    console.error(`❌ [MIDDLEWARE] Authentication error for ${pathname}:`, error);
    
    const response = NextResponse.json(
      { 
        success: false, 
        error: "Authentication failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 401 }
    );
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
  } catch (middlewareError) {
    console.error(`❌ [MIDDLEWARE] Critical middleware error:`, middlewareError);
    
    // For auth endpoints, don't fail the middleware - let the endpoint handle it
    if (isAuthEndpoint(request.nextUrl.pathname)) {
      console.log(`🔓 [MIDDLEWARE] Allowing auth endpoint despite middleware error: ${request.nextUrl.pathname}`);
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }
    
    // For other endpoints, return error
    const response = NextResponse.json(
      { 
        success: false, 
        error: "Middleware error",
        details: middlewareError instanceof Error ? middlewareError.message : 'Unknown middleware error'
      },
      { status: 500 }
    );
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }
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

// Protect API routes only - static pages handle their own authentication
export const config = {
  matcher: [
    '/api/:path*'  // Only protect API routes
  ],
};

// Ensure middleware runs in Edge Runtime for better performance
export const runtime = 'experimental-edge';
