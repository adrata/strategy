// LIGHTNING-FAST MULTI-PLATFORM DETECTION - 2025 OPTIMIZED
// Production-ready for: Vercel Web + Tauri Desktop + Capacitor Mobile

import { detectSafari, initializeSafariCompatibility, handleSafariError } from './safari-compatibility';

export type Platform = "web" | "desktop" | "mobile";
export type DataMode = "api" | "static" | "hybrid";
export type AuthMode =
  | "web"
  | "desktop"
  | "mobile"
  | "database"
  | "local"
  | "hybrid";

interface PlatformConfig {
  platform: Platform;
  dataMode: DataMode;
  authMode: AuthMode;
  isDesktop: boolean;
  isMobile: boolean;
  isWeb: boolean;
  isDev: boolean;
  isProd: boolean;
  isStaticExport: boolean;
  supportsRealtime: boolean;
  supportsOffline: boolean;
  canUseAPI: boolean;
  features: {
    auth: AuthMode;
    storage: "localStorage" | "secure" | "hybrid";
    realtime: boolean;
    offline: boolean;
    notifications: boolean;
    filesystem: boolean;
    camera: boolean;
    deepLinks: boolean;
  };
  sync: {
    enabled: boolean;
    transport: "websocket" | "polling" | "localstorage";
    fallback: boolean;
    offline: boolean;
  };
}

// PERFORMANCE: Cached detection results
let cachedPlatform: Platform | null = null;
let cachedConfig: PlatformConfig | null = null;

// LIGHTNING-FAST: Platform detection with aggressive caching
export const getPlatform = (): Platform => {
  // Return cached result for maximum performance
  if (cachedPlatform) {
    return cachedPlatform;
  }

  // Server-side detection
  if (typeof window === "undefined") {
    cachedPlatform = "web";
    return cachedPlatform;
  }

  try {
    // Client-side platform detection

    // CRITICAL: Safari Detection - Must check this FIRST
    const safariInfo = detectSafari();
    
    // CRITICAL: If Safari (mobile or desktop), force web platform
    if (safariInfo.isSafari) {
      cachedPlatform = "web";
      // Safari detected - forcing web platform
      
      // CRITICAL: Override any Tauri detection for Safari
      if (typeof window !== 'undefined') {
        (window as any).__TAURI__ = undefined;
        (window as any).__TAURI_METADATA__ = undefined;
        (window as any).__TAURI_INTERNALS__ = undefined;
        (window as any).__ADRATA_FORCE_WEB__ = true;
      }
      
      // Initialize Safari compatibility
      try {
        initializeSafariCompatibility();
      } catch (error) {
        handleSafariError(error as Error, 'platform-detection');
      }
      
      return cachedPlatform;
    }

    // CRITICAL: Web browser detection - check for standard web protocols
    const isWebProtocol = window.location.protocol === "http:" || 
                          window.location.protocol === "https:";
    const isWebDomain = window.location.hostname.includes("adrata.com") ||
                       window.location.hostname.includes("vercel.app") ||
                       window.location.hostname === "localhost" ||
                       window.location.hostname === "127.0.0.1";

    if (isWebProtocol && isWebDomain) {
      cachedPlatform = "web";
      // Web protocol and domain detected - forcing web platform
      return cachedPlatform;
    }

    // FAST: Build-time environment variable detection (highest priority)
    if (process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true") {
      cachedPlatform = "desktop";
      // Environment variable detected as desktop
      return cachedPlatform;
    }

    // FAST: Capacitor detection (mobile runtime)
    if (typeof window !== "undefined" && (window as any).Capacitor) {
      const isNative = typeof (window as any).Capacitor['isNativePlatform'] === 'function' && 
        (window as any).Capacitor.isNativePlatform();
      if (isNative) {
        cachedPlatform = "mobile";
        return cachedPlatform;
      }
    }

    // FAST: Tauri detection (desktop runtime) - ONLY if not in web browser
    const windowObj = window as any;
    const hasTauriRuntime = !!(
      windowObj.__TAURI__ ||
      windowObj.__TAURI_METADATA__ ||
      windowObj.__TAURI_IPC__ ||
      windowObj.__TAURI_INTERNALS__
    );

    // Tauri indicators detected

    // Only consider Tauri if we're NOT in a web browser context
    if (hasTauriRuntime && !isWebProtocol) {
      cachedPlatform = "desktop";
      // Detected as desktop (Tauri)
      return cachedPlatform;
    }

    // FAST: File protocol detection (static exports) - ONLY for actual file protocol
    if (window['location']['protocol'] === "file:" && 
        window.location.pathname.includes("index.html")) {
      cachedPlatform = "desktop";
      // Detected as desktop (file protocol)
      return cachedPlatform;
    }

    // Default to web for all web browser contexts
    cachedPlatform = "web";
    // Defaulting to web platform
    return cachedPlatform;
  } catch (error) {
    // Silent fallback for production performance
    // Error in platform detection - fallback to web
    cachedPlatform = "web";
    return cachedPlatform;
  }
};

// LIGHTNING-FAST: Comprehensive platform configuration with caching
export const getPlatformConfig = (): PlatformConfig => {
  // Return cached config for maximum performance
  if (cachedConfig) return cachedConfig;

  try {
    const platform = getPlatform();
    const isDev = process['env']['NODE_ENV'] === "development";
    const isProd = process['env']['NODE_ENV'] === "production";
    const isStaticExport =
      process['env']['NEXT_PUBLIC_USE_STATIC_EXPORT'] === "true" ||
      process['env']['TAURI_BUILD'] === "true" ||
      platform !== "web";

    // OPTIMIZED: Platform-specific configurations
    switch (platform) {
      case "web":
        cachedConfig = {
          platform: "web",
          dataMode: "api",
          authMode: "web",
          isDesktop: false,
          isMobile: false,
          isWeb: true,
          isDev,
          isProd,
          isStaticExport: false,
          supportsRealtime: true,
          supportsOffline: false,
          canUseAPI: true,
          features: {
            auth: "web",
            storage: "localStorage",
            realtime: true,
            offline: false,
            notifications: true,
            filesystem: false,
            camera: false,
            deepLinks: false,
          },
          sync: {
            enabled: true,
            transport: "websocket",
            fallback: true,
            offline: false,
          },
        };
        break;

      case "desktop":
        cachedConfig = {
          platform: "desktop",
          dataMode: isStaticExport ? "static" : "hybrid",
          authMode: "desktop",
          isDesktop: true,
          isMobile: false,
          isWeb: false,
          isDev,
          isProd,
          isStaticExport,
          supportsRealtime: !isStaticExport,
          supportsOffline: true,
          canUseAPI: true, // Desktop can use API through hybrid mode
          features: {
            auth: "desktop",
            storage: "secure",
            realtime: !isStaticExport,
            offline: true,
            notifications: true,
            filesystem: true,
            camera: false,
            deepLinks: true,
          },
          sync: {
            enabled: true,
            transport: isStaticExport ? "localstorage" : "websocket",
            fallback: true,
            offline: true,
          },
        };
        break;

      case "mobile":
        cachedConfig = {
          platform: "mobile",
          dataMode: "static",
          authMode: "mobile",
          isDesktop: false,
          isMobile: true,
          isWeb: false,
          isDev,
          isProd,
          isStaticExport: true,
          supportsRealtime: false,
          supportsOffline: true,
          canUseAPI: false, // Mobile uses static data only
          features: {
            auth: "mobile",
            storage: "secure",
            realtime: false,
            offline: true,
            notifications: true,
            filesystem: true,
            camera: true,
            deepLinks: true,
          },
          sync: {
            enabled: false,
            transport: "localstorage",
            fallback: true,
            offline: true,
          },
        };
        break;

      default:
        // Safe fallback configuration
        cachedConfig = {
          platform: "web",
          dataMode: "api",
          authMode: "web",
          isDesktop: false,
          isMobile: false,
          isWeb: true,
          isDev: false,
          isProd: true,
          isStaticExport: false,
          supportsRealtime: true,
          supportsOffline: false,
          canUseAPI: true,
          features: {
            auth: "web",
            storage: "localStorage",
            realtime: true,
            offline: false,
            notifications: true,
            filesystem: false,
            camera: false,
            deepLinks: false,
          },
          sync: {
            enabled: true,
            transport: "websocket",
            fallback: true,
            offline: false,
          },
        };
    }

    return cachedConfig;
  } catch (error) {
    // Critical error fallback - return safe desktop configuration
    cachedConfig = {
      platform: "desktop",
      dataMode: "hybrid",
      authMode: "desktop",
      isDesktop: true,
      isMobile: false,
      isWeb: false,
      isDev: false,
      isProd: true,
      isStaticExport: true,
      supportsRealtime: false,
      supportsOffline: true,
      canUseAPI: true,
      features: {
        auth: "desktop",
        storage: "secure",
        realtime: false,
        offline: true,
        notifications: true,
        filesystem: true,
        camera: false,
        deepLinks: true,
      },
      sync: {
        enabled: true,
        transport: "localstorage",
        fallback: true,
        offline: true,
      },
    };
    return cachedConfig;
  }
};

// PERFORMANCE: Fast helper functions with caching
export const isDesktop = (): boolean => getPlatform() === "desktop";
export const isMobile = (): boolean => getPlatform() === "mobile";
export const isWeb = (): boolean => getPlatform() === "web";
export const canUseAPI = (): boolean => getPlatformConfig().canUseAPI;
export const isStaticExport = (): boolean => getPlatformConfig().isStaticExport;
export const supportsRealtime = (): boolean =>
  getPlatformConfig().supportsRealtime;
export const supportsOffline = (): boolean =>
  getPlatformConfig().supportsOffline;

// Environment helpers
export const isDev = (): boolean => {
  try {
    return process['env']['NODE_ENV'] === "development";
  } catch {
    return false;
  }
};

export const isProd = (): boolean => {
  try {
    return process['env']['NODE_ENV'] === "production";
  } catch {
    return true;
  }
};

// Data mode helpers
export const getDataMode = (): DataMode => getPlatformConfig().dataMode;
export const getAuthMode = (): AuthMode => getPlatformConfig().authMode;

// PERFORMANCE: Clear cache for testing/development
export const clearPlatformCache = (): void => {
  cachedPlatform = null;
  cachedConfig = null;
};

// DEBUGGING: Development helpers (only in development)
export const getPlatformDebugInfo = () => {
  if (typeof window === "undefined") {
    return {
      context: "server",
      platform: "web",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const config = getPlatformConfig();

    return {
      context: "client",
      timestamp: new Date().toISOString(),
      detectedPlatform: getPlatform(),
      config: config,
      environment: {
        NODE_ENV: process['env']['NODE_ENV'],
        NEXT_PUBLIC_IS_DESKTOP: process['env']['NEXT_PUBLIC_IS_DESKTOP'],
        NEXT_PUBLIC_USE_STATIC_EXPORT:
          process['env']['NEXT_PUBLIC_USE_STATIC_EXPORT'],
        TAURI_BUILD: process['env']['TAURI_BUILD'],
      },
      runtime: {
        hasWindow: typeof window !== "undefined",
        hasTauri: typeof window !== "undefined" && !!(window as any).__TAURI__,
        hasCapacitor:
          typeof window !== "undefined" && !!(window as any).Capacitor,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "server",
        protocol: window.location.protocol,
        pathname: window.location.pathname,
      },
    };
  } catch (error) {
    return {
      context: "client",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      platform: "desktop",
      location: window.location.href,
    };
  }
};

// PERFORMANCE: Platform-specific optimizations
export const getPlatformOptimizations = () => {
  const config = getPlatformConfig();

  return {
    // React optimizations
    shouldUseStrictMode: config['isDev'] && config.isWeb,
    shouldUseConcurrentFeatures: config['isWeb'] && config.supportsRealtime,
    shouldPreloadData: config.canUseAPI,
    shouldUseMemo: true, // Always optimize with React.memo
    shouldUseCallback: true, // Always optimize with useCallback

    // Bundle optimizations
    shouldSplitChunks: config.isWeb,
    shouldMinify: config.isProd,
    shouldRemoveConsole: config['isProd'] && !config.isDev,
    shouldTreeShake: config.isProd,

    // Caching strategies
    cacheStrategy: config.isStaticExport ? "aggressive" : "intelligent",
    shouldCacheAPI: config.canUseAPI,
    shouldCacheStatic: config.isStaticExport,
    maxCacheAge: config.isStaticExport ? 86400000 : 300000, // 24h vs 5min

    // Network optimizations
    shouldUseWebSocket: config.supportsRealtime,
    shouldUsePolling: !config['supportsRealtime'] && config.canUseAPI,
    shouldUseOfflineSync: config.supportsOffline,

    // Performance targets
    targetFCP: config.isWeb ? 1500 : 800, // First Contentful Paint (ms)
    targetLCP: config.isWeb ? 2500 : 1200, // Largest Contentful Paint (ms)
    targetTTI: config.isWeb ? 3500 : 1500, // Time to Interactive (ms)
  };
};

// Backward compatibility exports
export const getAppConfig = getPlatformConfig;
export const getDebugInfo = getPlatformDebugInfo;
