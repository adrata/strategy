// src/platform/safari-platform-override.ts
// 2025 Safari Platform Override - Prevents desktop detection in Safari
// This runs before any other platform detection

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  const userAgent = navigator.userAgent;
  const isSafari = (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)) ||
                   (/Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent));

  if (isSafari) {
    console.log('🍎 [SAFARI PLATFORM OVERRIDE] Safari detected - overriding platform detection');

    // CRITICAL: Override ALL Tauri detection variables BEFORE they can be detected
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_METADATA__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
    (window as any).__TAURI_IPC__ = undefined;
    (window as any).__TAURI_RUST__ = undefined;

    // Force web platform flags
    (window as any).__ADRATA_FORCE_WEB__ = true;
    (window as any).__ADRATA_SAFARI_MODE__ = true;
    (window as any).__ADRATA_WEB_PLATFORM__ = true;
    (window as any).__ADRATA_SAFARI_2025_FIX__ = true;

    // Override protocol if it's tauri:
    if (window.location.protocol === 'tauri:') {
      console.warn('🚨 [SAFARI PLATFORM OVERRIDE] Overriding tauri: protocol for Safari');
      try {
        Object.defineProperty(window.location, 'protocol', {
          value: 'https:',
          writable: false,
          configurable: false
        });
      } catch (e) {
        console.warn('🚨 [SAFARI PLATFORM OVERRIDE] Could not override protocol:', e);
      }
    }

    // Override environment variables that might indicate desktop
    if (typeof process !== 'undefined' && process.env) {
      process.env.NEXT_PUBLIC_IS_DESKTOP = 'false';
      process.env.TAURI_BUILD = 'false';
    }

    // Override any existing platform detection functions
    const originalGetPlatform = (window as any).getPlatform;
    (window as any).getPlatform = function() {
      console.log('🍎 [SAFARI PLATFORM OVERRIDE] getPlatform() overridden - returning web');
      return 'web';
    };

    // Override isDesktopEnvironment if it exists
    const originalIsDesktopEnvironment = (window as any).isDesktopEnvironment;
    (window as any).isDesktopEnvironment = function() {
      console.log('🍎 [SAFARI PLATFORM OVERRIDE] isDesktopEnvironment() overridden - returning false');
      return false;
    };

    // Override shouldUseDesktopAPI if it exists
    const originalShouldUseDesktopAPI = (window as any).shouldUseDesktopAPI;
    (window as any).shouldUseDesktopAPI = function() {
      console.log('🍎 [SAFARI PLATFORM OVERRIDE] shouldUseDesktopAPI() overridden - returning false');
      return false;
    };

    console.log('🍎 [SAFARI PLATFORM OVERRIDE] Platform detection overrides applied');
  }
})();

export {};
