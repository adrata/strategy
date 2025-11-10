/**
 * Environment-Aware URL Utilities
 * 
 * Centralized URL resolution for different environments (development, staging, production)
 * Ensures consistent URL handling across the application
 */

/**
 * Get the base URL for the current environment
 * Priority: Environment variables > Vercel URL > Hostname detection
 */
export function getBaseUrl(): string {
  // Server-side: Use environment variables
  if (typeof window === 'undefined') {
    // Check for explicit environment variables first
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const vercelUrl = process.env.VERCEL_URL;
    
    if (nextAuthUrl) {
      return nextAuthUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    if (appUrl) {
      return appUrl.replace(/\/$/, '');
    }
    
    // Vercel provides VERCEL_URL in preview deployments
    if (vercelUrl) {
      return `https://${vercelUrl}`;
    }
    
    // Fallback for local development
    return 'http://localhost:3000';
  }
  
  // Client-side: Use current window location
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}:3000`;
  }
  
  // Production or staging - use current origin
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}

/**
 * Get the API base URL
 * For same-domain deployments, returns empty string for relative URLs
 */
export function getApiBaseUrl(): string {
  const baseUrl = getBaseUrl();
  
  // For production and staging on same domain, use relative URLs
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'action.adrata.com' || hostname === 'staging.adrata.com') {
      return ''; // Use relative URLs
    }
  }
  
  // For local development or different domains, return full URL
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    return baseUrl;
  }
  
  // For Vercel preview deployments or other environments
  return baseUrl;
}

/**
 * Get OAuth redirect base URL
 * Used for OAuth callback URLs
 */
export function getOAuthRedirectUrl(): string {
  const oauthBaseUrl = process.env.OAUTH_REDIRECT_BASE_URL;
  if (oauthBaseUrl) {
    return oauthBaseUrl.replace(/\/$/, '');
  }
  
  return getBaseUrl();
}

/**
 * Get webhook URL for a given path
 * @param path - Webhook path (e.g., '/api/webhooks/zoho')
 */
export function getWebhookUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Check if current environment is staging
 */
export function isStaging(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'staging.adrata.com';
  }
  
  const baseUrl = getBaseUrl();
  return baseUrl.includes('staging.adrata.com') || 
         process.env.VERCEL_ENV === 'preview' ||
         process.env.STAGING_ENV === 'true';
}

/**
 * Check if current environment is production
 */
export function isProduction(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'action.adrata.com';
  }
  
  const baseUrl = getBaseUrl();
  return baseUrl.includes('action.adrata.com') && 
         process.env.VERCEL_ENV === 'production';
}

/**
 * Check if current environment is development
 */
export function isDevelopment(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }
  
  const baseUrl = getBaseUrl();
  return baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
}

