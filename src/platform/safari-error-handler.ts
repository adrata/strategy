/**
 * Safari Error Handler
 * Global error handling for Safari-specific issues
 */

import { detectSafari, handleSafariError } from './safari-compatibility';

/**
 * Global error handler for Safari compatibility
 */
export function setupSafariErrorHandler(): void {
  // Only set up if we're in Safari
  const safariInfo = detectSafari();
  if (!safariInfo.isSafari) {
    return;
  }

  console.log('🍎 [SAFARI ERROR HANDLER] Setting up Safari error handling');

  // Global error handler
  window.addEventListener('error', (event) => {
    const error = new Error(event.message);
    error.stack = event.error?.stack;
    
    handleSafariError(error, 'global-error-handler');
    
    // Prevent default error handling for Safari-specific issues
    if (event.message.includes('insecure') || 
        event.message.includes('Desktop Application Error') ||
        event.message.includes('Tauri')) {
      event.preventDefault();
      console.warn('🍎 [SAFARI ERROR HANDLER] Prevented Safari error:', event.message);
    }
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(event.reason?.message || event.reason);
    error.stack = event.reason?.stack;
    
    handleSafariError(error, 'unhandled-promise-rejection');
    
    // Prevent default handling for Safari-specific issues
    if (event.reason?.message?.includes('insecure') || 
        event.reason?.message?.includes('Desktop Application Error') ||
        event.reason?.message?.includes('Tauri')) {
      event.preventDefault();
      console.warn('🍎 [SAFARI ERROR HANDLER] Prevented Safari promise rejection:', event.reason);
    }
  });

  // Console error interceptor
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    if (message.includes('insecure') || 
        message.includes('Desktop Application Error') ||
        message.includes('Tauri')) {
      handleSafariError(new Error(message), 'console-error');
      return; // Don't log the original error
    }
    
    originalConsoleError.apply(console, args);
  };
}

/**
 * Initialize Safari error handling on page load
 */
export function initializeSafariErrorHandling(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSafariErrorHandler);
  } else {
    setupSafariErrorHandler();
  }
}
