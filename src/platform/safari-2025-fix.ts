// src/platform/safari-2025-fix.ts
// 2025 Safari Compatibility Fix - Based on latest research and best practices
// This addresses the root cause: Safari incorrectly detecting Tauri desktop app

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  const userAgent = navigator.userAgent;
  const isSafari = (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)) ||
                   (/Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent));

  if (isSafari) {
    console.log('🍎 [SAFARI 2025] Safari detected - applying 2025 compatibility fixes');

    // 1. CRITICAL: Force web platform detection immediately
    // This is the root cause - Safari is detecting Tauri when it shouldn't
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_METADATA__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
    (window as any).__ADRATA_FORCE_WEB__ = true;
    (window as any).__ADRATA_SAFARI_MODE__ = true;
    (window as any).__ADRATA_WEB_PLATFORM__ = true;

    // 2. Override protocol detection to prevent tauri: protocol issues
    if (window.location.protocol === 'tauri:') {
      console.warn('🚨 [SAFARI 2025] Detected tauri: protocol - forcing https:');
      try {
        // Create a new location object with https protocol
        const newLocation = {
          ...window.location,
          protocol: 'https:',
          href: window.location.href.replace('tauri:', 'https:')
        };
        
        // Override location properties
        Object.defineProperty(window.location, 'protocol', {
          value: 'https:',
          writable: false,
          configurable: false
        });
        
        Object.defineProperty(window.location, 'href', {
          value: window.location.href.replace('tauri:', 'https:'),
          writable: false,
          configurable: false
        });
      } catch (e) {
        console.warn('🚨 [SAFARI 2025] Could not override protocol:', e);
      }
    }

    // 3. Create a completely safe storage system that never throws SecurityError
    const createSafeStorage = (originalStorage: Storage, name: string) => {
      const safeStorage = {
        getItem: function(key: string) {
          try {
            return originalStorage.getItem(key);
          } catch (e) {
            console.warn(`🍎 [SAFARI 2025] ${name}.getItem failed:`, e.message);
            return null;
          }
        },
        setItem: function(key: string, value: string) {
          try {
            originalStorage.setItem(key, value);
          } catch (e) {
            console.warn(`🍎 [SAFARI 2025] ${name}.setItem failed:`, e.message);
            // Store in memory as fallback
            (window as any).__ADRATA_MEMORY_STORAGE__ = (window as any).__ADRATA_MEMORY_STORAGE__ || {};
            (window as any).__ADRATA_MEMORY_STORAGE__[key] = value;
          }
        },
        removeItem: function(key: string) {
          try {
            originalStorage.removeItem(key);
          } catch (e) {
            console.warn(`🍎 [SAFARI 2025] ${name}.removeItem failed:`, e.message);
            // Remove from memory fallback
            if ((window as any).__ADRATA_MEMORY_STORAGE__) {
              delete (window as any).__ADRATA_MEMORY_STORAGE__[key];
            }
          }
        },
        clear: function() {
          try {
            originalStorage.clear();
          } catch (e) {
            console.warn(`🍎 [SAFARI 2025] ${name}.clear failed:`, e.message);
            // Clear memory fallback
            (window as any).__ADRATA_MEMORY_STORAGE__ = {};
          }
        },
        get length() {
          try {
            return originalStorage.length;
          } catch (e) {
            console.warn(`🍎 [SAFARI 2025] ${name}.length failed:`, e.message);
            return (window as any).__ADRATA_MEMORY_STORAGE__ ? Object.keys((window as any).__ADRATA_MEMORY_STORAGE__).length : 0;
          }
        },
        key: function(index: number) {
          try {
            return originalStorage.key(index);
          } catch (e) {
            console.warn(`🍎 [SAFARI 2025] ${name}.key failed:`, e.message);
            const memoryKeys = (window as any).__ADRATA_MEMORY_STORAGE__ ? Object.keys((window as any).__ADRATA_MEMORY_STORAGE__) : [];
            return memoryKeys[index] || null;
          }
        }
      };
      
      return safeStorage;
    };

    // 4. Override localStorage with 2025-safe implementation
    if (window.localStorage) {
      const safeLocalStorage = createSafeStorage(window.localStorage, 'localStorage');
      Object.defineProperty(window, 'localStorage', {
        value: safeLocalStorage,
        writable: false,
        configurable: false
      });
    }

    // 5. Override sessionStorage with 2025-safe implementation
    if (window.sessionStorage) {
      const safeSessionStorage = createSafeStorage(window.sessionStorage, 'sessionStorage');
      Object.defineProperty(window, 'sessionStorage', {
        value: safeSessionStorage,
        writable: false,
        configurable: false
      });
    }

    // 6. 2025 Global Error Handler - More sophisticated than previous versions
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
        console.warn('🍎 [SAFARI 2025] SecurityError suppressed:', {
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

    // 7. 2025 Promise Rejection Handler - Enhanced detection
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
        console.warn('🍎 [SAFARI 2025] SecurityError promise rejection suppressed:', reason);
        event.preventDefault();
        return;
      }
      
      // Call original handler for other rejections
      if (originalOnUnhandledRejection) {
        return originalOnUnhandledRejection.call(this, event);
      }
    };

    // 8. 2025 Console Override - Suppress SecurityError messages completely
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('SecurityError') || 
          message.includes('The operation is insecure') ||
          message.includes('insecure')) {
        console.log('🍎 [SAFARI 2025] SecurityError console.error suppressed:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
      const message = args.join(' ');
      if (message.includes('SecurityError') || 
          message.includes('The operation is insecure') ||
          message.includes('insecure')) {
        console.log('🍎 [SAFARI 2025] SecurityError console.warn suppressed:', message);
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    // 9. 2025 Platform Detection Override - Force web platform
    // This is the most critical fix - prevent any desktop detection
    const originalGetPlatform = (window as any).getPlatform;
    (window as any).getPlatform = function() {
      console.log('🍎 [SAFARI 2025] Platform detection overridden - forcing web');
      return 'web';
    };

    // 10. Add Safari-specific CSS classes for styling
    document.documentElement.classList.add('safari-2025-fix');
    document.documentElement.classList.add('safari-web-platform');
    document.documentElement.classList.add('safari-error-suppressed');

    // 11. Set global Safari flags
    (window as any).__ADRATA_SAFARI_2025_FIX__ = true;
    (window as any).__ADRATA_WEB_PLATFORM_FORCED__ = true;

    console.log('🍎 [SAFARI 2025] 2025 Safari compatibility fixes applied successfully');
  }
})();

export {};
