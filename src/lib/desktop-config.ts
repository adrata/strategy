/**
 * Desktop Environment Configuration
 * 
 * This configuration disables API routes and server-side features
 * when building for Tauri desktop application.
 */

// Check if we're building for desktop
export const isDesktopBuild = process.env.TAURI_BUILD === 'true' || 
                              process.env.NEXT_PUBLIC_IS_DESKTOP === 'true';

// Desktop-specific configuration
export const desktopConfig = {
  // Disable API routes for desktop
  enableAPIRoutes: !isDesktopBuild,
  
  // Use desktop API client
  useDesktopAPI: isDesktopBuild,
  
  // Static export settings
  staticExport: isDesktopBuild,
  
  // Image optimization
  optimizeImages: !isDesktopBuild,
  
  // Server-side rendering
  enableSSR: !isDesktopBuild,
  
  // Database connection (online-only: no local database)
  useLocalDatabase: false,
  
  // Authentication
  useDesktopAuth: isDesktopBuild,
};

// Environment-specific API base URL
export const getAPIBaseURL = () => {
  // For desktop builds, use backend API server
  if (isDesktopBuild) {
    // Use environment variable if set, otherwise default to production API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBaseUrl) {
      // If it already ends with /api, return as-is; otherwise append /api
      return apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
    }
    // Default to production API for desktop
    return 'https://adrata.com/api';
  }
  
  // Web mode: use relative URLs (same domain)
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api';
  }
  
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
};

// Desktop-specific feature flags (online-only mode)
export const desktopFeatures = {
  // Online-only: no offline capabilities
  offlineMode: false,
  
  // Online-only: no local database needed
  localDatabase: false,
  
  // Enable Tauri-specific native features
  tauriFeatures: isDesktopBuild,
  
  // Disable web-specific features
  webFeatures: !isDesktopBuild,
  
  // Enable desktop notifications (native feature)
  desktopNotifications: isDesktopBuild,
  
  // Enable file system access (native feature)
  fileSystemAccess: isDesktopBuild,
};

// Log configuration in development
if (process.env.NODE_ENV === 'development' && isDesktopBuild) {
  console.log('🖥️ Desktop Build Configuration:', {
    isDesktopBuild,
    desktopConfig,
    desktopFeatures,
    apiBaseURL: getAPIBaseURL(),
  });
}
