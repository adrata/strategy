/**
 * Immediate Safari Fix
 * This script runs immediately to prevent Safari from detecting the app as a desktop application
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
    console.log('🍎 [SAFARI IMMEDIATE] Safari detected - applying immediate fixes');
    
    // CRITICAL: Override Tauri detection immediately
    (window as any).__TAURI__ = undefined;
    (window as any).__TAURI_METADATA__ = undefined;
    (window as any).__TAURI_INTERNALS__ = undefined;
    
    // Force web platform
    (window as any).__ADRATA_FORCE_WEB__ = true;
    (window as any).__ADRATA_SAFARI_MODE__ = true;
    
    // Override protocol if it's tauri:
    if (window.location.protocol === 'tauri:') {
      console.warn('🚨 [SAFARI IMMEDIATE] Overriding tauri: protocol');
      try {
        Object.defineProperty(window.location, 'protocol', {
          value: 'https:',
          writable: false,
          configurable: false
        });
      } catch (e) {
        console.warn('🚨 [SAFARI IMMEDIATE] Could not override protocol:', e);
      }
    }
    
    // Add Safari CSS class immediately
    document.documentElement.classList.add('safari');
    if (isSafariMobile) {
      document.documentElement.classList.add('safari-mobile');
    }
    if (isSafariDesktop) {
      document.documentElement.classList.add('safari-desktop');
    }
    
    console.log('🍎 [SAFARI IMMEDIATE] Safari fixes applied');
  }
})();

export {};
