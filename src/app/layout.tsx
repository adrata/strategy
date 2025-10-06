"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import React, { Suspense, useEffect } from "react";

// Initialize Inter font with optimized settings for enterprise applications
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});
import Script from "next/script";
import { ThemeProvider } from "@/platform/ui/components/ThemeProvider";
import { DesktopErrorBoundary } from "@/platform/ui/components/DesktopErrorBoundary";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { DynamicFavicon } from "@/platform/ui/components/DynamicFavicon";
import { DynamicTitle } from "@/platform/ui/components/DynamicTitle";
import { SafariImmediateFix } from "@/platform/components/SafariImmediateFix";
import { usePathname } from "next/navigation";

// Import desktop auto-updater (only works in desktop environment)
import "@/platform/desktop-updater";

// ✅ Initialize notification service for dock badges
import { notificationService } from "@/platform/services/notification-service";
import { isDesktop } from "@/platform/platform-detection";

// ✅ Initialize Safari error handling for Safari compatibility
import { initializeSafariErrorHandling } from "@/platform/safari-error-handler";

// ✅ NUCLEAR: Safari nuclear fix - most aggressive error suppression
import "@/platform/safari-nuclear-fix";

// ✅ CRITICAL: Safari platform override - must run FIRST to prevent desktop detection
import "@/platform/safari-platform-override";

// ✅ CRITICAL: Safari 2025 fix - latest compatibility fixes
import "@/platform/safari-2025-fix";

// ✅ CRITICAL: Immediate Safari fix - must run before any other code
// import "@/platform/safari-immediate-fix"; // Moved to client-side component

// ✅ CRITICAL: Safari error suppression - must run before any other code
import "@/platform/safari-error-suppression";

// ✅ ULTIMATE: Safari ultimate fix - most aggressive error suppression
import "@/platform/safari-ultimate-fix";

// Service worker temporarily disabled to fix production errors
// TODO: Re-enable when sw.js file is properly implemented
// if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').then((registration) => {
//       console.log('🚀 Service Worker registered:', registration);
//     }).catch((error) => {
//       console.log('❌ Service Worker registration failed:', error);
//     });
//   });
// }

// CRITICAL FIX: Unregister any existing service workers to prevent JavaScript errors
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        console.log('🧹 Unregistering service worker:', registration);
        registration.unregister();
      });
    }).catch((error) => {
      console.log('❌ Service Worker unregistration failed:', error);
    });
  });
}

// Simple loading fallback for Suspense - invisible for instant experience
const SuspenseLoading = React.memo(() => {
  return null; // No loading screen - instant experience
});

SuspenseLoading['displayName'] = "SuspenseLoading";

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPathnameReady, setIsPathnameReady] = React.useState(false);
  
  // 🔧 FIX: Wait for pathname to be available to prevent black screen flash
  React.useEffect(() => {
    if (pathname) {
      setIsPathnameReady(true);
    }
  }, [pathname]);
  
  // 🔧 FIX: Handle undefined pathname during reload to prevent black screen flash
  const isWebsite = isPathnameReady && pathname ? (
    pathname === "/" ||
    pathname.startsWith("/website") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/demo") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/cookies") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/monaco") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/help") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/careers") ||
    pathname.startsWith("/research") ||
    pathname.startsWith("/find-your-buyer-group") ||
    pathname.startsWith("/alternatives") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/documentation") ||
    pathname.startsWith("/help-center") ||
    pathname.startsWith("/system-status") ||
    pathname.startsWith("/paper") ||
    pathname.startsWith("/oasis") ||
    pathname.startsWith("/tower") ||
    pathname.startsWith("/academy") ||
    pathname.startsWith("/battleground") ||
    pathname.startsWith("/win")
  ) : false; // Default to false when pathname is not ready (during reload)

  // 🔔 Initialize notification service for dock badge functionality
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const success = await notificationService.initialize();

        if (success && isDesktop()) {
          // Clear any existing badge on startup
          await notificationService.clearDockBadge();
        }
      } catch (error) {
        // Silent error handling for production
      }
    };

    // Don't initialize on website pages
    if (!isWebsite) {
      initializeNotifications();
    }
  }, [isWebsite]);

  // 🍎 Initialize Safari error handling for Safari compatibility
  useEffect(() => {
    initializeSafariErrorHandling();
  }, []);

  return (
    <body
      className={`font-sans antialiased ${
        isWebsite
          ? "min-h-screen bg-black text-white overflow-x-hidden overflow-y-auto"
          : "h-screen overflow-hidden bg-white"
      }`}
      style={{
        // Ensure consistent background during navigation transitions
        backgroundColor: isWebsite ? '#000000' : '#ffffff'
      }}
      suppressHydrationWarning
    >
              <DynamicFavicon isWebsite={isWebsite} defaultColor="#3b82f6" />
      <DynamicTitle />
      <SafariImmediateFix />
      <DesktopErrorBoundary>
        <ThemeProvider>
          <Suspense fallback={<SuspenseLoading />}>{children}</Suspense>
        </ThemeProvider>
      </DesktopErrorBoundary>
    </body>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Debug logs removed for production

  return (
    <html
      lang="en"
      className={`${inter.variable} inter-font`}
      suppressHydrationWarning
    >
      <head>
        <title>Adrata</title>
        <meta
          name="description"
          content="The Leader in Buyer Group Intelligence. Instantly identify decision-makers, influencers, and stakeholders within complex buyer groups. Decode buyer dynamics in seconds, not months."
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Basic privacy protection */}
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Twilio Voice SDK for computer-to-phone calling */}
        <Script src="/twilio-voice.min.js" strategy="beforeInteractive" />
        
        {/* NUCLEAR SAFARI FIXES: Most aggressive Safari compatibility fixes */}
        <Script id="safari-nuclear-fixes" strategy="beforeInteractive">
          {`
            (function() {
              'use strict';
              const userAgent = navigator.userAgent;
              const isSafari = (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)) ||
                              (/Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent));
              
              if (isSafari) {
                console.log('🍎 [SAFARI NUCLEAR HEAD] Safari detected - applying NUCLEAR compatibility fixes');
                
                // 1. NUCLEAR: Override ALL Tauri detection IMMEDIATELY
                window.__TAURI__ = undefined;
                window.__TAURI_METADATA__ = undefined;
                window.__TAURI_INTERNALS__ = undefined;
                window.__TAURI_IPC__ = undefined;
                window.__TAURI_RUST__ = undefined;
                window.__ADRATA_FORCE_WEB__ = true;
                window.__ADRATA_SAFARI_MODE__ = true;
                window.__ADRATA_WEB_PLATFORM__ = true;
                window.__ADRATA_SAFARI_2025_FIX__ = true;
                window.__ADRATA_NUCLEAR_FIX__ = true;
                
                // 2. NUCLEAR: Override protocol if it's tauri: (CRITICAL FIX)
                if (window.location.protocol === 'tauri:') {
                  console.warn('🚨 [SAFARI NUCLEAR HEAD] Overriding tauri: protocol for Safari');
                  try {
                    Object.defineProperty(window.location, 'protocol', {
                      value: 'https:',
                      writable: false,
                      configurable: false
                    });
                  } catch (e) {
                    console.warn('🚨 [SAFARI 2025 HEAD] Could not override protocol:', e);
                  }
                }
                
                // 3. NUCLEAR: Create nuclear-safe storage with memory fallback
                const createNuclearSafeStorage = (originalStorage, name) => {
                  return {
                    getItem: function(key) {
                      try { return originalStorage.getItem(key); } catch (e) { 
                        console.warn('🍎 [SAFARI NUCLEAR HEAD] ' + name + '.getItem failed:', e.message);
                        return null; 
                      }
                    },
                    setItem: function(key, value) {
                      try { 
                        originalStorage.setItem(key, value); 
                      } catch (e) { 
                        console.warn('🍎 [SAFARI NUCLEAR HEAD] ' + name + '.setItem failed:', e.message);
                        // Store in memory as fallback
                        window.__ADRATA_MEMORY_STORAGE__ = window.__ADRATA_MEMORY_STORAGE__ || {};
                        window.__ADRATA_MEMORY_STORAGE__[key] = value;
                      }
                    },
                    removeItem: function(key) {
                      try { 
                        originalStorage.removeItem(key); 
                      } catch (e) { 
                        console.warn('🍎 [SAFARI NUCLEAR HEAD] ' + name + '.removeItem failed:', e.message);
                        if (window.__ADRATA_MEMORY_STORAGE__) {
                          delete window.__ADRATA_MEMORY_STORAGE__[key];
                        }
                      }
                    },
                    clear: function() {
                      try { 
                        originalStorage.clear(); 
                      } catch (e) { 
                        console.warn('🍎 [SAFARI NUCLEAR HEAD] ' + name + '.clear failed:', e.message);
                        window.__ADRATA_MEMORY_STORAGE__ = {};
                      }
                    },
                    get length() { 
                      try { 
                        return originalStorage.length; 
                      } catch (e) { 
                        console.warn('🍎 [SAFARI NUCLEAR HEAD] ' + name + '.length failed:', e.message);
                        return window.__ADRATA_MEMORY_STORAGE__ ? Object.keys(window.__ADRATA_MEMORY_STORAGE__).length : 0;
                      } 
                    },
                    key: function(index) { 
                      try { 
                        return originalStorage.key(index); 
                      } catch (e) { 
                        console.warn('🍎 [SAFARI NUCLEAR HEAD] ' + name + '.key failed:', e.message);
                        const memoryKeys = window.__ADRATA_MEMORY_STORAGE__ ? Object.keys(window.__ADRATA_MEMORY_STORAGE__) : [];
                        return memoryKeys[index] || null;
                      } 
                    }
                  };
                };
                
                // 4. NUCLEAR: Override localStorage with nuclear-safe implementation
                if (window.localStorage) {
                  const nuclearSafeLocalStorage = createNuclearSafeStorage(window.localStorage, 'localStorage');
                  Object.defineProperty(window, 'localStorage', { value: nuclearSafeLocalStorage, writable: false, configurable: false });
                }
                
                // 5. NUCLEAR: Override sessionStorage with nuclear-safe implementation
                if (window.sessionStorage) {
                  const nuclearSafeSessionStorage = createNuclearSafeStorage(window.sessionStorage, 'sessionStorage');
                  Object.defineProperty(window, 'sessionStorage', { value: nuclearSafeSessionStorage, writable: false, configurable: false });
                }
                
                // 6. NUCLEAR: Global Error Handler - Enhanced SecurityError detection
                window.onerror = function(message, source, lineno, colno, error) {
                  const isSecurityError = 
                    (error && error.name === 'SecurityError') ||
                    (typeof message === 'string' && (
                      message.includes('SecurityError') ||
                      message.includes('The operation is insecure') ||
                      message.includes('insecure')
                    ));
                  
                  if (isSecurityError) {
                    console.warn('🍎 [SAFARI NUCLEAR HEAD] SecurityError suppressed:', { message, source, lineno, colno, error: error?.message });
                    return true;
                  }
                  return false;
                };
                
                // 7. NUCLEAR: Promise Rejection Handler - Enhanced detection
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
                    console.warn('🍎 [SAFARI NUCLEAR HEAD] SecurityError promise rejection suppressed:', reason);
                    event.preventDefault();
                    return;
                  }
                };
                
                // 8. NUCLEAR: Override console methods to suppress SecurityError messages
                const originalConsoleError = console.error;
                const originalConsoleWarn = console.warn;
                
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('SecurityError') || message.includes('The operation is insecure') || message.includes('insecure')) {
                    console.log('🍎 [SAFARI NUCLEAR HEAD] SecurityError console.error suppressed:', message);
                    return;
                  }
                  originalConsoleError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('SecurityError') || message.includes('The operation is insecure') || message.includes('insecure')) {
                    console.log('🍎 [SAFARI NUCLEAR HEAD] SecurityError console.warn suppressed:', message);
                    return;
                  }
                  originalConsoleWarn.apply(console, args);
                };
                
                // 9. NUCLEAR: Override platform detection functions
                window.getPlatform = function() {
                  console.log('🍎 [SAFARI NUCLEAR HEAD] getPlatform() overridden - returning web');
                  return 'web';
                };
                
                window.isDesktopEnvironment = function() {
                  console.log('🍎 [SAFARI NUCLEAR HEAD] isDesktopEnvironment() overridden - returning false');
                  return false;
                };
                
                window.shouldUseDesktopAPI = function() {
                  console.log('🍎 [SAFARI NUCLEAR HEAD] shouldUseDesktopAPI() overridden - returning false');
                  return false;
                };
                
                console.log('🍎 [SAFARI NUCLEAR HEAD] NUCLEAR Safari compatibility fixes applied successfully');
              }
            })();
          `}
        </Script>
      </head>
      <RootLayoutContent>{children}</RootLayoutContent>
    </html>
  );
}
