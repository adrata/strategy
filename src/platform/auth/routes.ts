/**
 * Authentication Route Constants
 * Centralized definition of all auth routes to prevent naming inconsistencies
 * Use these constants instead of hardcoded strings throughout the codebase
 * 
 * Enterprise platform: Users are added by administrators after platform purchase.
 */

// Environment-aware API base URL
// Uses centralized utility for consistent URL handling across environments
const getApiBaseUrl = () => {
  // Import utility dynamically to avoid issues in different contexts
  try {
    // For client-side, check window location
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Use relative URLs for production and staging (same domain)
      if (hostname === 'action.adrata.com' || hostname === 'staging.adrata.com') {
        return ''; // Use relative URLs for same-domain deployments
      }
      // Local development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return ''; // Local development (relative URLs)
      }
    }
    
    // Server-side: Use environment variables or utility
    if (process['env']['NEXT_PUBLIC_API_BASE_URL']) {
      const envUrl = process['env']['NEXT_PUBLIC_API_BASE_URL'];
      // If environment variable already ends with /api, return it as-is
      if (envUrl.endsWith('/api')) {
        return envUrl;
      }
      // Otherwise, return the environment variable (it will get /api appended)
      return envUrl;
    }
    
    return ''; // Default to relative URLs
  } catch (error) {
    // Fallback to relative URLs if utility import fails
    return '';
  }
};

// Authentication UI Routes - OPTIMIZED: Flattened structure for better performance
export const AUTH_UI_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_OUT: "/sign-out", 
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

// Authentication API Routes
export const AUTH_API_ROUTES = {
  SIGN_IN: `${getApiBaseUrl()}/api/auth/sign-in`,
  SIGN_OUT: `${getApiBaseUrl()}/api/auth/sign-out`,
  FORGOT_PASSWORD: `${getApiBaseUrl()}/api/auth/forgot-password`,
  RESET_PASSWORD: `${getApiBaseUrl()}/api/auth/reset-password`,
  REFRESH_TOKEN: `${getApiBaseUrl()}/api/auth/refresh-token`,
} as const;

// Real-time Authentication Routes
export const REALTIME_AUTH_ROUTES = {
  PUSHER_AUTH: `${getApiBaseUrl()}/api/pusher/auth`,
  WEBSOCKET_AUTH: `${getApiBaseUrl()}/api/websocket/auth`,
} as const;

// Utility function to get all auth routes
export const getAllAuthRoutes = () => ({
  UI: AUTH_UI_ROUTES,
  API: AUTH_API_ROUTES,
  REALTIME: REALTIME_AUTH_ROUTES,
});

// Type definitions for better TypeScript support
export type AuthUIRoute = (typeof AUTH_UI_ROUTES)[keyof typeof AUTH_UI_ROUTES];
export type AuthAPIRoute = (typeof AUTH_API_ROUTES)[keyof typeof AUTH_API_ROUTES];
export type RealtimeAuthRoute = (typeof REALTIME_AUTH_ROUTES)[keyof typeof REALTIME_AUTH_ROUTES];

/**
 * Usage Examples:
 * 
 * // In components:
 * import { AUTH_UI_ROUTES } from '@/platform/auth/routes';
 * router.push(AUTH_UI_ROUTES.SIGN_IN);
 * 
 * // In API calls:
 * import { AUTH_API_ROUTES } from '@/platform/auth/routes';
 * fetch(AUTH_API_ROUTES.SIGN_IN, {...});
 * 
 * // In redirects:
 * import { AUTH_UI_ROUTES } from '@/platform/auth/routes';
 * redirect(AUTH_UI_ROUTES.SIGN_IN);
 */ 