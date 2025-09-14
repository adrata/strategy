// Robust desktop environment detection and error prevention
export interface DesktopEnvInfo {
  isDesktop: boolean;
  isTauri: boolean;
  isStaticExport: boolean;
  canUseAPI: boolean;
  platform: "desktop" | "web";
  errorSources: string[];
}

export function getDesktopEnvInfo(): DesktopEnvInfo {
  const errorSources: string[] = [];

  try {
    // Check build-time flags
    const isDesktopBuild = process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true";
    const isStaticExport = process['env']['NEXT_PUBLIC_USE_STATIC_EXPORT'] === "true";
    const isTauriBuild = process['env']['TAURI_BUILD'] === "true";

    // Check runtime detection
    let isTauriRuntime = false;
    let isFileProtocol = false;

    if (typeof window !== "undefined") {
      try {
        isTauriRuntime = !!(window as any).__TAURI__;
        isFileProtocol = window['location']['protocol'] === "file:";
      } catch (e) {
        errorSources.push("window-detection-failed");
      }
    }

    // Determine if this is a desktop environment (with runtime fallback)
    let isDesktop =
      isDesktopBuild ||
      isStaticExport ||
      isTauriBuild ||
      isTauriRuntime ||
      isFileProtocol;

    // RUNTIME DESKTOP DETECTION FALLBACK - if build-time detection failed
    if (!isDesktop && typeof window !== "undefined") {
      // Check for Tauri-specific globals that only exist in desktop mode
      const hasTauriGlobals =
        !!(window as any).__TAURI__ ||
        !!(window as any).__TAURI_INVOKE__ ||
        !!(window as any).ipc ||
        !!(window as any).__TAURI_INTERNALS__;

      // Check for app-specific indicators
      const hasAppIndicators =
        window['location']['protocol'] === "tauri:" ||
        window['location']['hostname'] === "tauri.localhost" ||
        (window['navigator']['userAgent'] &&
          window.navigator.userAgent.includes("Tauri"));

      if (hasTauriGlobals || hasAppIndicators) {
        if (process['env']['NODE_ENV'] === "development") {
          console.log(
            "🖥️ [RUNTIME DETECTION] Desktop mode detected via runtime checks!",
          );
        }
        isDesktop = true;
      }
    }

    // API availability - only allow API calls in web mode with http/https
    const canUseAPI =
      !isDesktop &&
      typeof window !== "undefined" &&
      (window['location']['protocol'] === "http:" ||
        window['location']['protocol'] === "https:");

    return {
      isDesktop,
      isTauri: isTauriRuntime,
      isStaticExport: isStaticExport || isDesktopBuild,
      canUseAPI,
      platform: isDesktop ? "desktop" : "web",
      errorSources,
    };
  } catch (error) {
    errorSources.push(`critical-detection-error: ${error}`);

    // Safe fallback - assume desktop if we can't detect properly
    return {
      isDesktop: true,
      isTauri: false,
      isStaticExport: true,
      canUseAPI: false,
      platform: "desktop",
      errorSources,
    };
  }
}

// Safe API call wrapper with desktop fallback
export async function safeDesktopApiFetch<T>(
  url: string,
  options?: RequestInit,
  fallback?: T,
): Promise<T> {
  const env = getDesktopEnvInfo();

  if (!env.canUseAPI) {
    if (fallback !== undefined) {
      if (process['env']['NODE_ENV'] === "development") {
        console.log(`🖥️ Desktop mode: Using fallback for ${url}`);
      }
      return fallback;
    }
    throw new Error(`API call ${url} not available in desktop mode`);
  }

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (fallback !== undefined) {
      console.warn(`⚠️ API call failed, using fallback: ${error}`);
      return fallback;
    }
    throw error;
  }
}

// Environment validation for debugging
export function validateDesktopEnv(): { isValid: boolean; issues: string[] } {
  const env = getDesktopEnvInfo();
  const issues: string[] = [];

  // Check for common issues
  if (env.errorSources?.length > 0) {
    issues.push(`Detection errors: ${env.errorSources.join(", ")}`);
  }

  if (env['isDesktop'] && env.canUseAPI) {
    issues.push("Desktop mode but API calls are enabled (may cause errors)");
  }

  if (!env['isDesktop'] && !env.canUseAPI) {
    issues.push("Web mode but API calls are disabled");
  }

  if (typeof window !== "undefined") {
    // Check for missing Tauri globals in expected desktop environment
    if (env['isDesktop'] && !env['isTauri'] && window.location.protocol !== "file:") {
      issues.push("Desktop mode detected but no Tauri runtime found");
    }
  }

  return {
    isValid: issues['length'] === 0,
    issues,
  };
}

/**
 * Enhanced Desktop Environment Detection
 * Provides comprehensive platform detection and environment management
 */

export function isDesktopEnvironment(): boolean {
  // Server-side always returns false
  if (typeof window === "undefined") {
    if (process['env']['NODE_ENV'] === "development") {
      console.log("🔍 [DESKTOP ENV] Server-side - returning false");
    }
    return false;
  }

  // Check for Tauri-specific indicators
  const hasTauriAPI = !!(window as any).__TAURI__;
  const hasTauriMetadata = !!(window as any).__TAURI_METADATA__;
  const hasTauriInternals = !!(window as any).__TAURI_INTERNALS__;
  const isTauriProtocol = window['location']['protocol'] === "tauri:";
  const isTauriHost = window['location']['hostname'] === "tauri.localhost";
  const hasFileProtocol = window['location']['protocol'] === "file:";
  const hasIndexHtml = window.location.pathname.includes("index.html");

  // Environment variable check
  const envIndicatesDesktop = process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true";
  const buildEnvDesktop = process['env']['TAURI_BUILD'] === "true";

  const isDesktop =
    hasTauriAPI ||
    hasTauriMetadata ||
    hasTauriInternals ||
    isTauriProtocol ||
    isTauriHost ||
    envIndicatesDesktop ||
    buildEnvDesktop ||
    (hasFileProtocol && hasIndexHtml);

  if (process['env']['NODE_ENV'] === "development") {
    console.log("🔍 [DESKTOP ENV] Detection results:");
    console.log("  - Tauri API:", hasTauriAPI);
    console.log("  - Tauri Metadata:", hasTauriMetadata);
    console.log("  - Tauri Internals:", hasTauriInternals);
    console.log("  - Tauri Protocol:", isTauriProtocol);
    console.log("  - Tauri Host:", isTauriHost);
    console.log(
      "  - File Protocol + index.html:",
      hasFileProtocol && hasIndexHtml,
    );
    console.log("  - Environment Variable:", envIndicatesDesktop);
    console.log("  - Build Environment:", buildEnvDesktop);
    console.log("  - Final Result:", isDesktop);
  }

  return isDesktop;
}

export function getDesktopEnvironmentInfo() {
  if (typeof window === "undefined") {
    return {
      isDesktop: false,
      platform: "server",
      protocol: "unknown",
      host: "unknown",
      hasTauriAPI: false,
    };
  }

  const isDesktop = isDesktopEnvironment();

  return {
    isDesktop,
    platform: isDesktop ? "desktop" : "web",
    protocol: window.location.protocol,
    host: window.location.hostname,
    href: window.location.href,
    hasTauriAPI: !!(window as any).__TAURI__,
    hasTauriMetadata: !!(window as any).__TAURI_METADATA__,
    hasTauriInternals: !!(window as any).__TAURI_INTERNALS__,
    userAgent: navigator.userAgent,
    buildTime: process['env']['NEXT_PUBLIC_BUILD_TIME'],
    buildVersion: process['env']['NEXT_PUBLIC_BUILD_VERSION'],
    isDesktopEnv: process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true",
  };
}

export function shouldUseDesktopAPI(): boolean {
  const isDesktop = isDesktopEnvironment();

  if (isDesktop) {
    if (process['env']['NODE_ENV'] === "development") {
      console.log("✅ [DESKTOP ENV] Using desktop API (Tauri commands)");
    }
  } else {
    if (process['env']['NODE_ENV'] === "development") {
      console.log("🌐 [DESKTOP ENV] Using web API (HTTP endpoints)");
    }
  }

  return isDesktop;
}

export function getAPIBaseURL(): string {
  if (shouldUseDesktopAPI()) {
    return "tauri://localhost"; // Desktop apps don't use HTTP APIs
  }

  // Web environment - use standard API routes
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process['env']['NEXT_PUBLIC_API_URL'] || "http://localhost:3000";
}

export function logEnvironmentInfo() {
  const envInfo = getDesktopEnvironmentInfo();

  if (process['env']['NODE_ENV'] === "development") {
    console.log("🌍 [DESKTOP ENV] ===== ENVIRONMENT INFORMATION =====");
    console.log("📱 Platform:", envInfo.platform);
    console.log("🔗 Protocol:", envInfo.protocol);
    console.log("🏠 Host:", envInfo.host);
    console.log("📍 Full URL:", envInfo.href);
    console.log("⚙️ Has Tauri API:", envInfo.hasTauriAPI);
    console.log("📦 Has Tauri Metadata:", envInfo.hasTauriMetadata);
    console.log("🔧 Has Tauri Internals:", envInfo.hasTauriInternals);
    console.log("📅 Build Time:", envInfo.buildTime);
    console.log("🏷️ Build Version:", envInfo.buildVersion);
    console.log("🖥️ Desktop Environment Variable:", envInfo.isDesktopEnv);
    console.log("🌐 User Agent:", envInfo.userAgent);
    console.log("✅ Final Decision - Use Desktop API:", shouldUseDesktopAPI());
    console.log("🌍 [DESKTOP ENV] ===== END ENVIRONMENT INFO =====");
  }
}

// Auto-log environment info on import (development only)
if (typeof window !== "undefined" && process['env']['NODE_ENV'] === "development") {
  logEnvironmentInfo();
}
