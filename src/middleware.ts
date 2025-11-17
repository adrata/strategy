/**
 * Desktop API Middleware
 * 
 * This middleware redirects API calls to Tauri commands when running in desktop mode
 * Also handles workspace path redirects to sign-in (only for unauthenticated users)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isDesktopBuild } from '@/lib/desktop-config';

// Paths that should not be redirected
const EXCLUDED_PATHS = [
  '/api',
  '/sign-in',
  '/sign-up',
  '/setup-account',
  '/workspaces',
  '/_next',
  '/favicon.ico',
];

// Known workspace slugs (normalized without hyphens for comparison)
// This handles both hyphenated (notary-everyday) and non-hyphenated (notaryeveryday) variations
const WORKSPACE_SLUGS = [
  'notaryeveryday', // matches both 'notary-everyday' and 'notaryeveryday'
  'ne',
  'adrata',
  'rps',
  'top',
  'demo',
  'cloudcaddie',
  'pinpoint',
];

/**
 * Check if a path segment matches a workspace slug pattern
 * Handles both hyphenated and non-hyphenated variations
 */
function isWorkspaceSlug(slug: string): boolean {
  // Normalize the slug by removing hyphens and converting to lowercase
  const normalized = slug.toLowerCase().replace(/-/g, '');
  
  // Check if normalized slug matches any known workspace slug
  return WORKSPACE_SLUGS.includes(normalized);
}

/**
 * Check if pathname is a workspace path (first segment matches workspace slug)
 */
function isWorkspacePath(pathname: string): boolean {
  // Remove leading slash and split
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;
  
  const firstSegment = segments[0];
  
  // Check if first segment matches a workspace slug pattern
  return isWorkspaceSlug(firstSegment);
}

/**
 * Check if user is authenticated by verifying auth token cookie
 * Uses lightweight JWT decode to avoid database calls in middleware
 */
function isAuthenticated(request: NextRequest): boolean {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return false;

    // Parse cookies
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          try {
            acc[key] = decodeURIComponent(value);
          } catch (e) {
            acc[key] = value;
          }
        }
        return acc;
      },
      {} as Record<string, string>
    );

    // Check for auth token
    const token = cookies['auth-token'] || cookies['adrata_unified_session'];
    if (!token) return false;

    // If it's the unified session cookie, extract the token
    let actualToken = token;
    try {
      const sessionData = JSON.parse(token);
      if (sessionData.accessToken) {
        actualToken = sessionData.accessToken;
      }
    } catch (e) {
      // Not JSON, use as-is
    }

    // Lightweight check: verify token exists and has valid JWT structure
    // We don't verify signature here to keep middleware fast
    // Full verification happens in RouteGuard and API routes
    const parts = actualToken.split('.');
    if (parts.length !== 3) return false;

    // Quick expiry check from payload (without full verification)
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return false; // Token expired
      }
      return true; // Token exists and not expired
    } catch (e) {
      // Invalid payload, but token exists - let RouteGuard handle it
      return true; // Assume authenticated, let RouteGuard verify
    }
  } catch (error) {
    // Error parsing cookies - assume not authenticated
    return false;
  }
}

export function middleware(request: NextRequest) {
  // Skip middleware for desktop builds (static export)
  if (isDesktopBuild) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // CRITICAL: Handle API routes with trailing slashes BEFORE any other processing
  // This must execute before Next.js trailingSlash redirect to prevent POST→GET conversion
  // Rewrite preserves HTTP method (POST stays POST), unlike redirects
  
  // Handle /api/ai-chat/ trailing slash
  if (pathname === '/api/ai-chat/') {
    const url = request.nextUrl.clone();
    url.pathname = '/api/ai-chat';
    return NextResponse.rewrite(url);
  }
  
  // Handle /api/v1/conversations/[id]/messages/ trailing slash
  // Pattern: /api/v1/conversations/{id}/messages/
  const messagesTrailingSlashMatch = pathname.match(/^\/api\/v1\/conversations\/([^\/]+)\/messages\/$/);
  if (messagesTrailingSlashMatch) {
    const conversationId = messagesTrailingSlashMatch[1];
    const url = request.nextUrl.clone();
    url.pathname = `/api/v1/conversations/${conversationId}/messages`;
    return NextResponse.rewrite(url);
  }
  
  // Handle all other API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip excluded paths
  if (EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if this is a workspace path
  if (isWorkspacePath(pathname)) {
    // Check if user is authenticated
    const authenticated = isAuthenticated(request);
    
    if (!authenticated) {
      // Unauthenticated user - redirect to sign-in
      const hostname = request.headers.get('host') || '';
      // Handle action.com -> action.adrata.com redirect
      const isActionCom = hostname === 'action.com' || hostname.startsWith('action.com');
      // Use current hostname, or redirect action.com to production
      const targetDomain = isActionCom ? 'action.adrata.com' : hostname.split(':')[0];
      
      const redirectUrl = new URL(request.url);
      redirectUrl.host = targetDomain;
      redirectUrl.pathname = '/sign-in';
      
      // Use https for production/staging domains, http for localhost
      if (!targetDomain.includes('localhost') && !targetDomain.includes('127.0.0.1')) {
        redirectUrl.protocol = 'https:';
      }
      
      if (request.nextUrl.search) {
        redirectUrl.search = request.nextUrl.search;
      }
      
      return NextResponse.redirect(redirectUrl, 307);
    }
    
    // Authenticated user - allow through
    return NextResponse.next();
  }

  // Handle domain redirect: action.com -> action.adrata.com
  // Note: This only redirects action.com to production
  // staging.adrata.com and action.adrata.com are handled as-is
  if (hostname === 'action.com' || hostname.startsWith('action.com')) {
    const redirectUrl = new URL(request.url);
    redirectUrl.host = 'action.adrata.com';
    
    // Use https for production domains
    if (!hostname.includes('localhost')) {
      redirectUrl.protocol = 'https:';
    }
    
    return NextResponse.redirect(redirectUrl, 307);
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
