/**
 * Safari Error Suppression
 * Comprehensive error suppression for Safari SecurityError issues
 */

// Run immediately when this script loads
(function() {
  'use strict';
  
  // Detect Safari immediately
  const userAgent = navigator.userAgent;
  const isSafariMobile = /iPhone|iPad|iPod/.test(userAgent) && 
                        /Safari/.test(userAgent) && 
                        !/Chrome|CriOS|FxiOS/.test(userAgent);
  
  const isSafariDesktop = /Macintosh/.test(userAgent) && 
                         /Safari/.test(userAgent) && 
                         !/Chrome/.test(userAgent);

  const isSafari = isSafariMobile || isSafariDesktop;

  if (isSafari) {
    console.log('🍎 [SAFARI SUPPRESSION] Safari detected - setting up error suppression');
    
    // Override global error handlers
    const originalOnError = window.onerror;
    const originalOnUnhandledRejection = window.onunhandledrejection;
    
    // Suppress SecurityError globally
    window.onerror = function(message, source, lineno, colno, error) {
      if (error && error.name === 'SecurityError' && error.message.includes('insecure')) {
        console.warn('🍎 [SAFARI SUPPRESSION] Suppressed SecurityError:', message);
        return true; // Prevent default error handling
      }
      
      // Call original handler for other errors
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Suppress unhandled promise rejections
    window.onunhandledrejection = function(event) {
      if (event.reason && event.reason.name === 'SecurityError' && 
          event.reason.message && event.reason.message.includes('insecure')) {
        console.warn('🍎 [SAFARI SUPPRESSION] Suppressed SecurityError promise rejection:', event.reason);
        event.preventDefault();
        return;
      }
      
      // Call original handler for other rejections
      if (originalOnUnhandledRejection) {
        return originalOnUnhandledRejection.call(this, event);
      }
    };
    
    // Override console.error to suppress SecurityError logs
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('SecurityError') && message.includes('insecure')) {
        console.warn('🍎 [SAFARI SUPPRESSION] Suppressed SecurityError console output');
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    // Override localStorage to prevent SecurityError
    const originalLocalStorage = window.localStorage;
    if (originalLocalStorage) {
      const safeLocalStorage = {
        getItem: function(key) {
          try {
            return originalLocalStorage.getItem(key);
          } catch (error) {
            if (error.name === 'SecurityError') {
              console.warn('🍎 [SAFARI SUPPRESSION] localStorage.getItem failed, using fallback');
              return null;
            }
            throw error;
          }
        },
        setItem: function(key, value) {
          try {
            return originalLocalStorage.setItem(key, value);
          } catch (error) {
            if (error.name === 'SecurityError') {
              console.warn('🍎 [SAFARI SUPPRESSION] localStorage.setItem failed, using fallback');
              return;
            }
            throw error;
          }
        },
        removeItem: function(key) {
          try {
            return originalLocalStorage.removeItem(key);
          } catch (error) {
            if (error.name === 'SecurityError') {
              console.warn('🍎 [SAFARI SUPPRESSION] localStorage.removeItem failed, using fallback');
              return;
            }
            throw error;
          }
        },
        clear: function() {
          try {
            return originalLocalStorage.clear();
          } catch (error) {
            if (error.name === 'SecurityError') {
              console.warn('🍎 [SAFARI SUPPRESSION] localStorage.clear failed, using fallback');
              return;
            }
            throw error;
          }
        },
        get length() {
          try {
            return originalLocalStorage.length;
          } catch (error) {
            if (error.name === 'SecurityError') {
              console.warn('🍎 [SAFARI SUPPRESSION] localStorage.length failed, using fallback');
              return 0;
            }
            throw error;
          }
        },
        key: function(index) {
          try {
            return originalLocalStorage.key(index);
          } catch (error) {
            if (error.name === 'SecurityError') {
              console.warn('🍎 [SAFARI SUPPRESSION] localStorage.key failed, using fallback');
              return null;
            }
            throw error;
          }
        }
      };
      
      // Replace localStorage with safe version
      Object.defineProperty(window, 'localStorage', {
        value: safeLocalStorage,
        writable: false,
        configurable: false
      });
    }
    
    console.log('🍎 [SAFARI SUPPRESSION] Error suppression system activated');
  }
})();

export {};
