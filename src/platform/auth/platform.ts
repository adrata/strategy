/**
 * Platform Detection
 * Utilities for detecting and configuring platform-specific authentication
 */

import type { PlatformConfig, TauriEnvironment } from "./types";

// Device ID Generation
export const getDeviceId = (): string => {
  if (typeof window === "undefined") return "server";

  let deviceId = localStorage.getItem("adrata_device_id");
  if (!deviceId) {
    const platform = getPlatform();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    deviceId = `${platform}-${timestamp}-${random}`;
    localStorage.setItem("adrata_device_id", deviceId);
  }
  return deviceId;
};

// Platform detection utility with caching for performance
let cachedPlatformResult: "web" | "mobile" | "desktop" | null = null;

export function getPlatform(): "web" | "mobile" | "desktop" {
  // Return cached result for performance (but allow override in development)
  if (cachedPlatformResult && process['env']['NODE_ENV'] !== 'development') return cachedPlatformResult;
  
  // Only log in debug mode to improve performance
  if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PLATFORM'] === 'true') {
    console.log("🔍 [PLATFORM] Detecting platform...");
  }

  // Server-side: Can't detect properly, use environment variables
  if (typeof window === "undefined") {
    const isDesktopBuild = process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true" || process['env']['TAURI_BUILD'] === "true";
    if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PLATFORM'] === 'true') {
      console.log("🔍 [PLATFORM] Server-side detection:", { isDesktopBuild });
    }
    cachedPlatformResult = isDesktopBuild ? "desktop" : "web";
    return cachedPlatformResult;
  }

  // Desktop detection for Tauri applications
  const isDesktop =
    // Primary: Tauri environment detection
    (!!(window as any).__TAURI__ ||
      !!(window as any).__TAURI_METADATA__ ||
      !!(window as any).__TAURI_INTERNALS__ ||
      (window as any).location?.protocol === "tauri:") ||
    // Build-time environment variables
    process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true" ||
    process['env']['TAURI_BUILD'] === "true" ||
    // File protocol detection for static builds
    (window['location']['protocol'] === "file:" ||
      window.location.pathname.includes("index.html") ||
      window.location.href.includes("tauri://localhost"));

  // More robust mobile detection - check if Capacitor is actually available and native
  const isMobile = (window as any).Capacitor && 
    typeof (window as any).Capacitor['isNativePlatform'] === 'function' && 
    (window as any).Capacitor.isNativePlatform();

  // Log detailed detection in debug mode OR production for troubleshooting
  if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PLATFORM'] === 'true' || process['env']['NODE_ENV'] === 'production') {
    console.log("🔍 [PLATFORM] Detection results:");
    console.log("  - NEXT_PUBLIC_IS_DESKTOP:", process['env']['NEXT_PUBLIC_IS_DESKTOP']);
    console.log("  - TAURI_BUILD:", process['env']['TAURI_BUILD']);
    console.log("  - window.location.protocol:", window.location.protocol);
    console.log("  - window.location.href:", window.location.href);
    console.log("  - window.__TAURI__:", !!(window as any).__TAURI__);
    console.log("  - window.__TAURI_METADATA__:", !!(window as any).__TAURI_METADATA__);
    console.log("  - window.__TAURI_INTERNALS__:", !!(window as any).__TAURI_INTERNALS__);
    console.log("  - window.Capacitor:", !!(window as any).Capacitor);
    console.log("  - isDesktop:", isDesktop);
    console.log("  - isMobile:", isMobile);
  }

  if (isDesktop) {
      if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PLATFORM'] === 'true' || process['env']['NODE_ENV'] === 'production') {
    console.log("✅ [PLATFORM] Detected: DESKTOP");
  }
    cachedPlatformResult = "desktop";
    return cachedPlatformResult;
  }

  if (isMobile) {
    if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PLATFORM'] === 'true' || process['env']['NODE_ENV'] === 'production') {
      console.log("✅ [PLATFORM] Detected: MOBILE");
    }
    cachedPlatformResult = "mobile";
    return cachedPlatformResult;
  }

  if (process['env']['NODE_ENV'] === 'development' && process['env']['ADRATA_DEBUG_PLATFORM'] === 'true' || process['env']['NODE_ENV'] === 'production') {
    console.log("✅ [PLATFORM] Detected: WEB");
  }
  cachedPlatformResult = "web";
  return cachedPlatformResult;
}

// Platform configuration utility
export function getPlatformConfig(): PlatformConfig {
  const platform = getPlatform();
  return {
    platform,
    isDesktop: platform === "desktop",
    isMobile: platform === "mobile",
    isWeb: platform === "web",
  };
}

// Tauri environment checks
export function getTauriEnvironment(): TauriEnvironment {
  if (typeof window === "undefined") {
    return {
      hasTauriGlobal: false,
      hasTauriMetadata: false,
      hasTauriInternals: false,
      hasTauriInvoke: false,
      protocol: "",
      hostname: "",
      href: "",
      userAgent: "",
    };
  }

  return {
    hasTauriGlobal: !!(window as any).__TAURI__,
    hasTauriMetadata: !!(window as any).__TAURI_METADATA__,
    hasTauriInternals: !!(window as any).__TAURI_INTERNALS__,
    hasTauriInvoke: !!(window as any).__TAURI_INVOKE__,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    href: window.location.href,
    userAgent: navigator.userAgent,
  };
}

// Check if any Tauri indicators are present
export function hasTauriIndicators(env: TauriEnvironment): boolean {
  return (
    env.hasTauriGlobal ||
    env.hasTauriMetadata ||
    env.hasTauriInternals ||
    env.hasTauriInvoke ||
    env['protocol'] === "tauri:" ||
    env['hostname'] === "tauri.localhost"
  );
}
