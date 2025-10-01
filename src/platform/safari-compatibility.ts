/**
 * Safari Compatibility Utilities
 * Handles Safari-specific issues and provides fallbacks
 */

export interface SafariCompatibilityInfo {
  isSafari: boolean;
  isSafariMobile: boolean;
  isSafariDesktop: boolean;
  version: string;
  hasWebKitIssues: boolean;
  supportsModernFeatures: boolean;
}

/**
 * Detect Safari browser and version
 */
export function detectSafari(): SafariCompatibilityInfo {
  const userAgent = navigator.userAgent;
  
  const isSafariMobile = /iPhone|iPad|iPod/.test(userAgent) && 
                        /Safari/.test(userAgent) && 
                        !/Chrome|CriOS|FxiOS/.test(userAgent);
  
  const isSafariDesktop = /Macintosh/.test(userAgent) && 
                         /Safari/.test(userAgent) && 
                         !/Chrome/.test(userAgent);

  const isSafari = isSafariMobile || isSafariDesktop;
  
  // Extract Safari version
  const versionMatch = userAgent.match(/Version\/(\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : 'unknown';
  
  // Check for known WebKit issues
  const hasWebKitIssues = isSafari && (
    version.startsWith('14.') || // iOS 14 Safari issues
    version.startsWith('15.') || // iOS 15 Safari issues
    version.startsWith('16.')    // iOS 16 Safari issues
  );
  
  // Check for modern feature support
  const supportsModernFeatures = isSafari && (
    version.startsWith('17.') || // iOS 17+ Safari
    version.startsWith('18.')    // iOS 18+ Safari
  );

  return {
    isSafari,
    isSafariMobile,
    isSafariDesktop,
    version,
    hasWebKitIssues,
    supportsModernFeatures
  };
}

/**
 * Safari-specific error handler
 */
export function handleSafariError(error: Error, context: string): void {
  const safariInfo = detectSafari();
  
  if (!safariInfo.isSafari) {
    return; // Not Safari, use normal error handling
  }

  console.warn(`🚨 [SAFARI COMPAT] Error in ${context}:`, error);
  
  // Safari-specific error messages
  if (error.message.includes('insecure') || error.message.includes('Desktop Application Error')) {
    console.warn('🚨 [SAFARI COMPAT] Desktop application error detected - forcing web mode');
    
    // Clear any cached platform detection
    if (typeof window !== 'undefined') {
      // Clear platform cache
      (window as any).__ADRATA_PLATFORM_CACHE__ = null;
      
      // Force web platform
      (window as any).__ADRATA_FORCE_WEB__ = true;
      
      // CRITICAL: Override any Tauri detection
      (window as any).__TAURI__ = undefined;
      (window as any).__TAURI_METADATA__ = undefined;
      (window as any).__TAURI_INTERNALS__ = undefined;
      
      // Force web protocol detection
      if (window.location.protocol === 'tauri:') {
        console.warn('🚨 [SAFARI COMPAT] Detected tauri: protocol - forcing web mode');
        // This is a Safari-specific workaround
        Object.defineProperty(window.location, 'protocol', {
          value: 'https:',
          writable: false,
          configurable: false
        });
      }
    }
  }
}

/**
 * Safari-specific fallbacks for missing features
 */
export function getSafariFallbacks() {
  const safariInfo = detectSafari();
  
  if (!safariInfo.isSafari) {
    return {};
  }

  return {
    // Disable problematic features on Safari
    disableWebRTC: safariInfo.hasWebKitIssues,
    disableServiceWorker: safariInfo.hasWebKitIssues,
    disableWebGL: safariInfo.version.startsWith('14.') || safariInfo.version.startsWith('15.'),
    
    // Use fallback implementations
    usePolyfillForFetch: safariInfo.version.startsWith('14.'),
    usePolyfillForPromise: safariInfo.version.startsWith('14.'),
    
    // Safari-specific optimizations
    reduceAnimations: safariInfo.isSafariMobile,
    reduceTransitions: safariInfo.isSafariMobile,
    optimizeImages: true,
    
    // Error handling
    suppressConsoleErrors: safariInfo.hasWebKitIssues,
    useGracefulDegradation: true
  };
}

/**
 * Initialize Safari compatibility
 */
export function initializeSafariCompatibility(): void {
  const safariInfo = detectSafari();
  
  if (!safariInfo.isSafari) {
    return;
  }

  console.log('🍎 [SAFARI COMPAT] Initializing Safari compatibility mode');
  console.log('🍎 [SAFARI COMPAT] Version:', safariInfo.version);
  console.log('🍎 [SAFARI COMPAT] Mobile:', safariInfo.isSafariMobile);
  console.log('🍎 [SAFARI COMPAT] Has WebKit issues:', safariInfo.hasWebKitIssues);

  // CRITICAL: Force web mode for Safari immediately
  if (typeof window !== 'undefined') {
    // Override any Tauri detection
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_METADATA__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
    
    // Force web platform
    (window as any).__ADRATA_FORCE_WEB__ = true;
    (window as any).__ADRATA_SAFARI_MODE__ = true;
    
    // Override protocol if it's tauri:
    if (window.location.protocol === 'tauri:') {
      console.warn('🚨 [SAFARI COMPAT] Overriding tauri: protocol for Safari');
      try {
        Object.defineProperty(window.location, 'protocol', {
          value: 'https:',
          writable: false,
          configurable: false
        });
      } catch (e) {
        console.warn('🚨 [SAFARI COMPAT] Could not override protocol:', e);
      }
    }
  }

  // Apply Safari-specific fixes
  const fallbacks = getSafariFallbacks();
  
  // Set global Safari flags
  if (typeof window !== 'undefined') {
    (window as any).__ADRATA_SAFARI_FALLBACKS__ = fallbacks;
  }

  // Handle common Safari issues
  if (safariInfo.hasWebKitIssues) {
    console.warn('🍎 [SAFARI COMPAT] Applying WebKit issue fixes');
    
    // Fix for iOS Safari viewport issues
    if (safariInfo.isSafariMobile) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
    }
  }

  // Add Safari-specific CSS classes
  document.documentElement.classList.add('safari');
  if (safariInfo.isSafariMobile) {
    document.documentElement.classList.add('safari-mobile');
  }
  if (safariInfo.isSafariDesktop) {
    document.documentElement.classList.add('safari-desktop');
  }
  if (safariInfo.hasWebKitIssues) {
    document.documentElement.classList.add('safari-webkit-issues');
  }
}

/**
 * Check if a feature is supported in Safari
 */
export function isSafariFeatureSupported(feature: string): boolean {
  const safariInfo = detectSafari();
  
  if (!safariInfo.isSafari) {
    return true; // Not Safari, assume supported
  }

  const unsupportedFeatures = {
    'webrtc': safariInfo.hasWebKitIssues,
    'service-worker': safariInfo.hasWebKitIssues,
    'webgl': safariInfo.version.startsWith('14.') || safariInfo.version.startsWith('15.'),
    'web-assembly': safariInfo.version.startsWith('14.'),
    'web-streams': safariInfo.version.startsWith('14.') || safariInfo.version.startsWith('15.')
  };

  return !unsupportedFeatures[feature as keyof typeof unsupportedFeatures];
}

/**
 * Get Safari-specific user agent string for debugging
 */
export function getSafariDebugInfo(): string {
  const safariInfo = detectSafari();
  const fallbacks = getSafariFallbacks();
  
  return JSON.stringify({
    safari: safariInfo,
    fallbacks,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  }, null, 2);
}
