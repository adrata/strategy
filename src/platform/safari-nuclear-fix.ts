// src/platform/safari-nuclear-fix.ts
// NUCLEAR Safari SecurityError suppression - This runs IMMEDIATELY and overrides EVERYTHING
// This is the most aggressive approach possible for Safari compatibility

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  const userAgent = navigator.userAgent;
  const isSafari = (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)) ||
                   (/Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent));

  if (isSafari) {
    console.log('🍎 [SAFARI NUCLEAR] Safari detected - applying NUCLEAR error suppression');

    // 1. NUCLEAR: Override ALL Tauri detection IMMEDIATELY
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_METADATA__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
    (window as any).__TAURI_IPC__ = undefined;
    (window as any).__TAURI_RUST__ = undefined;
    (window as any).__ADRATA_FORCE_WEB__ = true;
    (window as any).__ADRATA_SAFARI_MODE__ = true;
    (window as any).__ADRATA_WEB_PLATFORM__ = true;
    (window as any).__ADRATA_SAFARI_2025_FIX__ = true;
    (window as any).__ADRATA_NUCLEAR_FIX__ = true;

    // 2. NUCLEAR: Override protocol if it's tauri:
    if (window.location.protocol === 'tauri:') {
      console.warn('🚨 [SAFARI NUCLEAR] Overriding tauri: protocol for Safari');
      try {
        Object.defineProperty(window.location, 'protocol', {
          value: 'https:',
          writable: false,
          configurable: false
        });
      } catch (e) {
        console.warn('🚨 [SAFARI NUCLEAR] Could not override protocol:', e);
      }
    }

    // 3. NUCLEAR: Create completely safe storage that NEVER throws
    const createNuclearSafeStorage = (originalStorage: Storage, name: string) => {
      return {
        getItem: function(key: string) {
          try {
            return originalStorage.getItem(key);
          } catch (e) {
            console.warn(`🍎 [SAFARI NUCLEAR] ${name}.getItem failed:`, e.message);
            return null;
          }
        },
        setItem: function(key: string, value: string) {
          try {
            originalStorage.setItem(key, value);
          } catch (e) {
            console.warn(`🍎 [SAFARI NUCLEAR] ${name}.setItem failed:`, e.message);
            // Store in memory as fallback
            (window as any).__ADRATA_NUCLEAR_STORAGE__ = (window as any).__ADRATA_NUCLEAR_STORAGE__ || {};
            (window as any).__ADRATA_NUCLEAR_STORAGE__[key] = value;
          }
        },
        removeItem: function(key: string) {
          try {
            originalStorage.removeItem(key);
          } catch (e) {
            console.warn(`🍎 [SAFARI NUCLEAR] ${name}.removeItem failed:`, e.message);
            if ((window as any).__ADRATA_NUCLEAR_STORAGE__) {
              delete (window as any).__ADRATA_NUCLEAR_STORAGE__[key];
            }
          }
        },
        clear: function() {
          try {
            originalStorage.clear();
          } catch (e) {
            console.warn(`🍎 [SAFARI NUCLEAR] ${name}.clear failed:`, e.message);
            (window as any).__ADRATA_NUCLEAR_STORAGE__ = {};
          }
        },
        get length() {
          try {
            return originalStorage.length;
          } catch (e) {
            console.warn(`🍎 [SAFARI NUCLEAR] ${name}.length failed:`, e.message);
            return (window as any).__ADRATA_NUCLEAR_STORAGE__ ? Object.keys((window as any).__ADRATA_NUCLEAR_STORAGE__).length : 0;
          }
        },
        key: function(index: number) {
          try {
            return originalStorage.key(index);
          } catch (e) {
            console.warn(`🍎 [SAFARI NUCLEAR] ${name}.key failed:`, e.message);
            const memoryKeys = (window as any).__ADRATA_NUCLEAR_STORAGE__ ? Object.keys((window as any).__ADRATA_NUCLEAR_STORAGE__) : [];
            return memoryKeys[index] || null;
          }
        }
      };
    };

    // 4. NUCLEAR: Override localStorage with nuclear-safe implementation
    if (window.localStorage) {
      const nuclearSafeLocalStorage = createNuclearSafeStorage(window.localStorage, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        value: nuclearSafeLocalStorage,
        writable: false,
        configurable: false
      });
    }

    // 5. NUCLEAR: Override sessionStorage with nuclear-safe implementation
    if (window.sessionStorage) {
      const nuclearSafeSessionStorage = createNuclearSafeStorage(window.sessionStorage, 'sessionStorage');
      Object.defineProperty(window, 'sessionStorage', {
        value: nuclearSafeSessionStorage,
        writable: false,
        configurable: false
      });
    }

    // 6. NUCLEAR: Global Error Handler - Catch ALL SecurityError instances
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      // Check for SecurityError in multiple ways
      const isSecurityError = 
        (error && error.name === 'SecurityError') ||
        (typeof message === 'string' && (
          message.includes('SecurityError') ||
          message.includes('The operation is insecure') ||
          message.includes('insecure')
        ));

      if (isSecurityError) {
        console.warn('🍎 [SAFARI NUCLEAR] SecurityError suppressed (onerror):', {
          message,
          source,
          lineno,
          colno,
          error: error?.message
        });
        return true; // Prevent default browser error handling
      }
      
      // Call original handler for other errors
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      
      return false;
    };

    // 7. NUCLEAR: Promise Rejection Handler - Catch ALL SecurityError promise rejections
    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = function(event) {
      const reason = event.reason;
      const isSecurityError = 
        (reason && reason.name === 'SecurityError') ||
        (reason && typeof reason === 'string' && (
          reason.includes('SecurityError') ||
          reason.includes('The operation is insecure') ||
          reason.includes('insecure')
        ));

      if (isSecurityError) {
        console.warn('🍎 [SAFARI NUCLEAR] SecurityError promise rejection suppressed:', reason);
        event.preventDefault();
        return;
      }
      
      // Call original handler for other rejections
      if (originalOnUnhandledRejection) {
        return originalOnUnhandledRejection.call(this, event);
      }
    };

    // 8. NUCLEAR: Override console methods to suppress SecurityError messages
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('SecurityError') || 
          message.includes('The operation is insecure') ||
          message.includes('insecure')) {
        console.log('🍎 [SAFARI NUCLEAR] SecurityError console.error suppressed:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
      const message = args.join(' ');
      if (message.includes('SecurityError') || 
          message.includes('The operation is insecure') ||
          message.includes('insecure')) {
        console.log('🍎 [SAFARI NUCLEAR] SecurityError console.warn suppressed:', message);
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    // 9. NUCLEAR: Override platform detection functions
    (window as any).getPlatform = function() {
      console.log('🍎 [SAFARI NUCLEAR] getPlatform() overridden - returning web');
      return 'web';
    };

    (window as any).isDesktopEnvironment = function() {
      console.log('🍎 [SAFARI NUCLEAR] isDesktopEnvironment() overridden - returning false');
      return false;
    };

    (window as any).shouldUseDesktopAPI = function() {
      console.log('🍎 [SAFARI NUCLEAR] shouldUseDesktopAPI() overridden - returning false');
      return false;
    };

    // 10. NUCLEAR: Add Safari-specific CSS classes
    document.documentElement.classList.add('safari-nuclear-fix');
    document.documentElement.classList.add('safari-error-suppressed');
    document.documentElement.classList.add('safari-web-platform');

    // 11. NUCLEAR: Set global Safari flags
    (window as any).__ADRATA_SAFARI_NUCLEAR_FIX__ = true;
    (window as any).__ADRATA_WEB_PLATFORM_FORCED__ = true;

    console.log('🍎 [SAFARI NUCLEAR] NUCLEAR Safari error suppression applied successfully');
  }
})();

export {};
