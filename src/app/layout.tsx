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
import { EnhancedDesktopErrorBoundary } from "@/platform/ui/components/EnhancedDesktopErrorBoundary";
import { AcquisitionOSProvider } from "@/platform/ui/context/AcquisitionOSProvider";
import { SpeedrunDataProvider } from "@/platform/services/speedrun-data-context";
import { DynamicFavicon } from "@/platform/ui/components/DynamicFavicon";
import { DynamicTitle } from "@/platform/ui/components/DynamicTitle";
import { usePathname } from "next/navigation";

// Import desktop auto-updater (only works in desktop environment)
import "@/platform/desktop-updater";

// ✅ Initialize notification service for dock badges
import { notificationService } from "@/platform/services/notification-service";
import { isDesktop } from "@/platform/platform-detection";

// ✅ Initialize Safari error handling for Safari compatibility
import { initializeSafariErrorHandling } from "@/platform/safari-error-handler";

// ✅ CRITICAL: Immediate Safari fix - must run before any other code
import "@/platform/safari-immediate-fix";

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
        console.log("🔔 [APP_STARTUP] Initializing notification service...");
        const success = await notificationService.initialize();

        if (success && isDesktop()) {
          console.log(
            "✅ [APP_STARTUP] Notifications initialized successfully - Dock badges enabled",
          );
          // Clear any existing badge on startup
          await notificationService.clearDockBadge();
        } else if (success) {
          console.log("✅ [APP_STARTUP] Notifications initialized for web");
        } else {
          console.warn(
            "⚠️ [APP_STARTUP] Notification initialization failed (non-critical)",
          );
        }
      } catch (error) {
        console.warn(
          "⚠️ [APP_STARTUP] Notification initialization error (non-critical):",
          error,
        );
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
      <EnhancedDesktopErrorBoundary>
        <ThemeProvider>
          <Suspense fallback={<SuspenseLoading />}>{children}</Suspense>
        </ThemeProvider>
      </EnhancedDesktopErrorBoundary>
    </body>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("🏗️ [ROOT LAYOUT] Rendering with children");
  console.log(
    "🏗️ [ROOT LAYOUT] Window available:",
    typeof window !== "undefined",
  );
  console.log(
    "🏗️ [ROOT LAYOUT] Current URL:",
    typeof window !== "undefined" ? window.location.href : "N/A",
  );

  return (
    <html
      lang="en"
      className={`${inter.variable} inter-font`}
      suppressHydrationWarning
    >
      <head>
        <title>Adrata | Sales Acceleration</title>
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
        
        {/* ULTIMATE: Safari fixes - most aggressive error suppression */}
        <Script id="safari-ultimate-fixes" strategy="beforeInteractive">
          {`
            (function() {
              'use strict';
              const userAgent = navigator.userAgent;
              const isSafari = (/iPhone|iPad|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)) ||
                              (/Macintosh/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent));
              
              if (isSafari) {
                console.log('🍎 [SAFARI ULTIMATE HEAD] Safari detected - applying ULTIMATE fixes');
                
                // 1. Override ALL Tauri detection
                window.__TAURI__ = undefined;
                window.__TAURI_METADATA__ = undefined;
                window.__TAURI_INTERNALS__ = undefined;
                window.__ADRATA_FORCE_WEB__ = true;
                window.__ADRATA_SAFARI_MODE__ = true;
                
                // 2. Override localStorage with ULTIMATE safe wrapper
                const originalLocalStorage = window.localStorage;
                if (originalLocalStorage) {
                  const ultimateSafeLocalStorage = {
                    getItem: function(key) {
                      try { return originalLocalStorage.getItem(key); } catch (e) { return null; }
                    },
                    setItem: function(key, value) {
                      try { originalLocalStorage.setItem(key, value); } catch (e) { /* ignore */ }
                    },
                    removeItem: function(key) {
                      try { originalLocalStorage.removeItem(key); } catch (e) { /* ignore */ }
                    },
                    clear: function() {
                      try { originalLocalStorage.clear(); } catch (e) { /* ignore */ }
                    },
                    get length() { try { return originalLocalStorage.length; } catch (e) { return 0; } },
                    key: function(index) { try { return originalLocalStorage.key(index); } catch (e) { return null; } }
                  };
                  Object.defineProperty(window, 'localStorage', { value: ultimateSafeLocalStorage, writable: false, configurable: false });
                }
                
                // 3. Override sessionStorage with ULTIMATE safe wrapper
                const originalSessionStorage = window.sessionStorage;
                if (originalSessionStorage) {
                  const ultimateSafeSessionStorage = {
                    getItem: function(key) {
                      try { return originalSessionStorage.getItem(key); } catch (e) { return null; }
                    },
                    setItem: function(key, value) {
                      try { originalSessionStorage.setItem(key, value); } catch (e) { /* ignore */ }
                    },
                    removeItem: function(key) {
                      try { originalSessionStorage.removeItem(key); } catch (e) { /* ignore */ }
                    },
                    clear: function() {
                      try { originalSessionStorage.clear(); } catch (e) { /* ignore */ }
                    },
                    get length() { try { return originalSessionStorage.length; } catch (e) { return 0; } },
                    key: function(index) { try { return originalSessionStorage.key(index); } catch (e) { return null; } }
                  };
                  Object.defineProperty(window, 'sessionStorage', { value: ultimateSafeSessionStorage, writable: false, configurable: false });
                }
                
                // 4. ULTIMATE Global Error Suppression
                window.onerror = function(message, source, lineno, colno, error) {
                  if (error && error.name === 'SecurityError') {
                    console.warn('🍎 [SAFARI ULTIMATE HEAD] SecurityError suppressed:', error.message);
                    return true;
                  }
                  if (typeof message === 'string' && message.includes('SecurityError')) {
                    console.warn('🍎 [SAFARI ULTIMATE HEAD] SecurityError in message suppressed:', message);
                    return true;
                  }
                  return false;
                };
                
                // 5. ULTIMATE Promise Rejection Suppression
                window.onunhandledrejection = function(event) {
                  if (event.reason && event.reason.name === 'SecurityError') {
                    console.warn('🍎 [SAFARI ULTIMATE HEAD] SecurityError promise rejection suppressed:', event.reason.message);
                    event.preventDefault();
                    return;
                  }
                  if (event.reason && typeof event.reason === 'string' && event.reason.includes('SecurityError')) {
                    console.warn('🍎 [SAFARI ULTIMATE HEAD] SecurityError in promise reason suppressed:', event.reason);
                    event.preventDefault();
                    return;
                  }
                };
                
                // 6. Override console.error to suppress SecurityError messages
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('SecurityError') || message.includes('The operation is insecure')) {
                    console.warn('🍎 [SAFARI ULTIMATE HEAD] SecurityError console.error suppressed:', message);
                    return;
                  }
                  originalConsoleError.apply(console, args);
                };
                
                // 7. Override protocol if it's tauri:
                if (window.location.protocol === 'tauri:') {
                  console.warn('🚨 [SAFARI ULTIMATE HEAD] Overriding tauri: protocol for Safari');
                  try {
                    Object.defineProperty(window.location, 'protocol', {
                      value: 'https:',
                      writable: false,
                      configurable: false
                    });
                  } catch (e) {
                    console.warn('🚨 [SAFARI ULTIMATE HEAD] Could not override protocol:', e);
                  }
                }
                
                console.log('🍎 [SAFARI ULTIMATE HEAD] ULTIMATE Safari fixes applied');
              }
            })();
          `}
        </Script>
      </head>
      <RootLayoutContent>{children}</RootLayoutContent>
    </html>
  );
}
