/**
 * Platform Detection Utilities
 * Detects whether code is running on web, mobile (React Native), or desktop (Tauri)
 */

export type Platform = 'web' | 'mobile' | 'desktop';

/**
 * Check if running on web platform
 */
export function isWeb(): boolean {
  return typeof window !== 'undefined' && !isMobile() && !isDesktop();
}

/**
 * Check if running on mobile platform (React Native)
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // React Native detection
  // @ts-ignore - React Native global
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
}

/**
 * Check if running on desktop platform (Tauri)
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Tauri detection
  // @ts-ignore - Tauri global
  return !!(window as any).__TAURI__ || !!(window as any).__TAURI_INTERNALS__;
}

/**
 * Get current platform
 */
export function getPlatform(): Platform {
  if (isMobile()) return 'mobile';
  if (isDesktop()) return 'desktop';
  return 'web';
}

/**
 * Get API base URL based on platform
 */
export function getAPIBaseURL(): string {
  if (isMobile()) {
    // Mobile should use environment-aware API URL
    // Check for staging first, then production, then fallback
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    }
    // Default to production, but can be overridden via env var for staging
    return 'https://action.adrata.com';
  }
  
  if (isDesktop()) {
    // Desktop uses environment-aware URL
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Default to production, but can be overridden via env var for staging
    return 'https://action.adrata.com';
  }
  
  // Web uses relative URLs or env var
  return process.env.NEXT_PUBLIC_API_URL || '';
}

