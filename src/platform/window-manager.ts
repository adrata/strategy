// Window management utility for Tauri apps
// Handles window sizing and positioning when config doesn't work properly

import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

// Simple inline check for desktop environment
function isDesktopApp(): boolean {
  return typeof window !== "undefined" && !!(window as any).__TAURI__;
}

// Cache Tauri window instance
let tauriWindow: any = null;

async function getTauriWindow() {
  if (!tauriWindow && typeof window !== "undefined" && isDesktopApp()) {
    try {
      tauriWindow = getCurrentWindow();
    } catch {
      console.warn("Tauri window API not available");
    }
  }
  return tauriWindow;
}

export class WindowManager {
  private static hasInitialized = false;

  static async initializeWindow(): Promise<void> {
    // Only run once and only in desktop apps
    if (this.hasInitialized || !isDesktopApp()) {
      return;
    }

    this['hasInitialized'] = true;

    try {
      // Wait a bit for the window to fully load
      await new Promise((resolve) => setTimeout(resolve, 500));

      const window = await getTauriWindow();
      if (!window) return;

      // Get available screen size
      const screenWidth = globalThis.window.screen.availWidth;
      const screenHeight = globalThis.window.screen.availHeight;

      // Calculate reasonable window size (max 1200x800, but fit on screen)
      const maxWidth = 1200;
      const maxHeight = 800;
      const windowWidth = Math.min(maxWidth, screenWidth * 0.8);
      const windowHeight = Math.min(maxHeight, screenHeight * 0.8);

      if (process['env']['NODE_ENV'] === "development") {
        console.log(
          `📐 WindowManager: Setting window to ${windowWidth}x${windowHeight}`,
        );
      }

      // Set window size and center it
      await window.setSize(new LogicalSize(windowWidth, windowHeight));

      // Try to center window, but don't fail if permissions aren't available
      try {
        await window.center();
        if (process['env']['NODE_ENV'] === "development") {
          console.log("✅ WindowManager: Window centered successfully");
        }
      } catch (centerError: any) {
        // More specific error handling for different types of center failures
        if (
          centerError?.message?.includes("permissions") ||
          centerError?.message?.includes("allow-center")
        ) {
          console.warn(
            "⚠️ WindowManager: Window centering requires additional permissions. This is normal on first run.",
          );
          console.info(
            '💡 To enable window centering, add "window:allow-center" to your Tauri configuration.',
          );
        } else {
          console.warn(
            "⚠️ WindowManager: Could not center window:",
            centerError?.message || "Unknown error",
          );
        }
      }

      if (process['env']['NODE_ENV'] === "development") {
        console.log("✅ WindowManager: Window positioned successfully");
      }
    } catch (error) {
      console.error("❌ WindowManager: Failed to manage window:", error);
    }
  }

  static async centerWindow(): Promise<void> {
    if (!isDesktopApp()) return;

    try {
      const window = await getTauriWindow();
      if (window) {
        await window.center();
        if (process['env']['NODE_ENV'] === "development") {
          console.log("✅ WindowManager: Window centered");
        }
      }
    } catch (error) {
      console.error("❌ WindowManager: Failed to center window:", error);
    }
  }

  static async setSize(width: number, height: number): Promise<void> {
    if (!isDesktopApp()) return;

    try {
      const window = await getTauriWindow();
      if (window) {
        await window.setSize(new LogicalSize(width, height));
        if (process['env']['NODE_ENV'] === "development") {
          console.log(`✅ WindowManager: Window resized to ${width}x${height}`);
        }
      }
    } catch (error) {
      console.error("❌ WindowManager: Failed to resize window:", error);
    }
  }
}
