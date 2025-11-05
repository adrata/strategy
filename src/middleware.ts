/**
 * Desktop API Middleware
 * 
 * This middleware redirects API calls to Tauri commands when running in desktop mode
 * Also handles workspace path redirects to sign-in
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

export function middleware(request: NextRequest) {
  // Skip middleware for desktop builds (static export)
  if (isDesktopBuild) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Handle API routes for web builds
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip excluded paths
  if (EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // NOTE: Workspace path authentication is handled client-side by RouteGuard
  // This middleware only handles domain redirects, not authentication checks
  // Removing workspace path redirect to prevent redirect loops after sign-in

  // Handle domain redirect: action.com -> action.adrata.com
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
