"use client";

import { useEffect } from 'react';

/**
 * Client-side Safari Immediate Fix Component
 * This component runs the Safari fix only on the client side to avoid SSR issues
 */
export function SafariImmediateFix() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

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
      
      // Force web mode (protocol override removed - causes Safari readonly property error)
      if (window.location.protocol === 'tauri:') {
        console.warn('🚨 [SAFARI IMMEDIATE] Detected tauri: protocol - forcing web mode');
        // Note: Protocol override removed to prevent Safari readonly property error
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
  }, []);

  // This component doesn't render anything
  return null;
}
