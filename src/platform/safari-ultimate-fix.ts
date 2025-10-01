// src/platform/safari-ultimate-fix.ts
// ULTIMATE Safari SecurityError suppression - this runs immediately and overrides everything

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;

  const userAgent = navigator.userAgent;
  const isSafari = (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)) ||
                   (/Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent));

  if (isSafari) {
    console.log('🍎 [SAFARI ULTIMATE] Safari detected - applying ULTIMATE error suppression');

    // 1. Override ALL possible Tauri detection
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_METADATA__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
    (window as any).__ADRATA_FORCE_WEB__ = true;
    (window as any).__ADRATA_SAFARI_MODE__ = true;

    // 2. Override localStorage with ULTIMATE safe wrapper
    const originalLocalStorage = window.localStorage;
    if (originalLocalStorage) {
      const ultimateSafeLocalStorage = {
        getItem: function(key: string) {
          try { 
            return originalLocalStorage.getItem(key); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] localStorage.getItem suppressed:', e.message);
            return null; 
          }
        },
        setItem: function(key: string, value: string) {
          try { 
            originalLocalStorage.setItem(key, value); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] localStorage.setItem suppressed:', e.message);
            // ignore completely
          }
        },
        removeItem: function(key: string) {
          try { 
            originalLocalStorage.removeItem(key); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] localStorage.removeItem suppressed:', e.message);
            // ignore completely
          }
        },
        clear: function() {
          try { 
            originalLocalStorage.clear(); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] localStorage.clear suppressed:', e.message);
            // ignore completely
          }
        },
        get length() { 
          try { 
            return originalLocalStorage.length; 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] localStorage.length suppressed:', e.message);
            return 0; 
          } 
        },
        key: function(index: number) { 
          try { 
            return originalLocalStorage.key(index); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] localStorage.key suppressed:', e.message);
            return null; 
          } 
        }
      };
      
      // Override localStorage completely
      Object.defineProperty(window, 'localStorage', { 
        value: ultimateSafeLocalStorage, 
        writable: false, 
        configurable: false 
      });
    }

    // 3. Override sessionStorage with ULTIMATE safe wrapper
    const originalSessionStorage = window.sessionStorage;
    if (originalSessionStorage) {
      const ultimateSafeSessionStorage = {
        getItem: function(key: string) {
          try { 
            return originalSessionStorage.getItem(key); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] sessionStorage.getItem suppressed:', e.message);
            return null; 
          }
        },
        setItem: function(key: string, value: string) {
          try { 
            originalSessionStorage.setItem(key, value); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] sessionStorage.setItem suppressed:', e.message);
            // ignore completely
          }
        },
        removeItem: function(key: string) {
          try { 
            originalSessionStorage.removeItem(key); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] sessionStorage.removeItem suppressed:', e.message);
            // ignore completely
          }
        },
        clear: function() {
          try { 
            originalSessionStorage.clear(); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] sessionStorage.clear suppressed:', e.message);
            // ignore completely
          }
        },
        get length() { 
          try { 
            return originalSessionStorage.length; 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] sessionStorage.length suppressed:', e.message);
            return 0; 
          } 
        },
        key: function(index: number) { 
          try { 
            return originalSessionStorage.key(index); 
          } catch (e) { 
            console.warn('🍎 [SAFARI ULTIMATE] sessionStorage.key suppressed:', e.message);
            return null; 
          } 
        }
      };
      
      // Override sessionStorage completely
      Object.defineProperty(window, 'sessionStorage', { 
        value: ultimateSafeSessionStorage, 
        writable: false, 
        configurable: false 
      });
    }

    // 4. ULTIMATE Global Error Suppression
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      // Suppress ALL SecurityError instances
      if (error && error.name === 'SecurityError') {
        console.warn('🍎 [SAFARI ULTIMATE] SecurityError suppressed (onerror):', error.message);
        return true; // Prevent default browser error handling
      }
      
      // Suppress SecurityError in message
      if (typeof message === 'string' && message.includes('SecurityError')) {
        console.warn('🍎 [SAFARI ULTIMATE] SecurityError in message suppressed:', message);
        return true;
      }
      
      // Call original handler for other errors
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      
      return false;
    };

    // 5. ULTIMATE Promise Rejection Suppression
    const originalOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = function(event) {
      // Suppress ALL SecurityError promise rejections
      if (event.reason && event.reason.name === 'SecurityError') {
        console.warn('🍎 [SAFARI ULTIMATE] SecurityError promise rejection suppressed:', event.reason.message);
        event.preventDefault();
        return;
      }
      
      // Suppress SecurityError in reason message
      if (event.reason && typeof event.reason === 'string' && event.reason.includes('SecurityError')) {
        console.warn('🍎 [SAFARI ULTIMATE] SecurityError in promise reason suppressed:', event.reason);
        event.preventDefault();
        return;
      }
      
      // Call original handler for other rejections
      if (originalOnUnhandledRejection) {
        return originalOnUnhandledRejection.call(this, event);
      }
    };

    // 6. Override console.error to suppress SecurityError messages
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('SecurityError') || message.includes('The operation is insecure')) {
        console.warn('🍎 [SAFARI ULTIMATE] SecurityError console.error suppressed:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // 7. Override console.warn to suppress SecurityError messages
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const message = args.join(' ');
      if (message.includes('SecurityError') || message.includes('The operation is insecure')) {
        console.log('🍎 [SAFARI ULTIMATE] SecurityError console.warn suppressed:', message);
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    // 8. Override protocol if it's tauri:
    if (window.location.protocol === 'tauri:') {
      console.warn('🚨 [SAFARI ULTIMATE] Overriding tauri: protocol for Safari');
      try {
        Object.defineProperty(window.location, 'protocol', {
          value: 'https:',
          writable: false,
          configurable: false
        });
      } catch (e) {
        console.warn('🚨 [SAFARI ULTIMATE] Could not override protocol:', e);
      }
    }

    // 9. Add Safari-specific CSS classes
    document.documentElement.classList.add('safari-ultimate-fix');
    document.documentElement.classList.add('safari-error-suppressed');

    console.log('🍎 [SAFARI ULTIMATE] ULTIMATE Safari error suppression applied');
  }
})();
