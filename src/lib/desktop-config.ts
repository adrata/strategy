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
  
  // Database connection
  useLocalDatabase: isDesktopBuild,
  
  // Authentication
  useDesktopAuth: isDesktopBuild,
};

// Environment-specific API base URL
export const getAPIBaseURL = () => {
  if (isDesktopBuild) {
    return '/api/desktop'; // Will be handled by Tauri commands
  }
  
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api';
  }
  
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
};

// Desktop-specific feature flags
export const desktopFeatures = {
  // Enable offline capabilities
  offlineMode: isDesktopBuild,
  
  // Use local SQLite database
  localDatabase: isDesktopBuild,
  
  // Enable Tauri-specific features
  tauriFeatures: isDesktopBuild,
  
  // Disable web-specific features
  webFeatures: !isDesktopBuild,
  
  // Enable desktop notifications
  desktopNotifications: isDesktopBuild,
  
  // Enable file system access
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
