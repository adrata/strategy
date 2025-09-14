/**
 * 🔧 API UTILITIES - Conditional API Route Support
 * Handles desktop vs web API route behavior
 */

// Dynamic export based on environment
export const dynamic =
  process['env']['TAURI_BUILD'] === "true" ? "force-static" : "force-dynamic";

// Platform detection utilities
export function isDesktopMode(): boolean {
  return (
    process['env']['TAURI_BUILD'] === "true" ||
    process['env']['CAPACITOR_BUILD'] === "true" ||
    process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true"
  );
}

export function isWebMode(): boolean {
  return !isDesktopMode();
}

export function isMobileMode(): boolean {
  return process['env']['CAPACITOR_BUILD'] === "true";
}

export function getTauriPlatform(): "desktop" | "web" | "mobile" {
  if (isDesktopMode()) return "desktop";
  if (isMobileMode()) return "mobile";
  return "web";
}
