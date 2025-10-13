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
// Desktop updater removed - handled by Tauri directly

// Import console helpers for logging control
import "@/platform/console-helpers";

// ✅ Initialize notification service for dock badges
import { notificationService } from "@/platform/services/notification-service";
import { isDesktop } from "@/platform/platform-detection";

// ✅ Initialize Safari compatibility (consolidated from multiple files)
import { initializeSafariCompatibility } from "@/platform/platform-detection";

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

// Service worker management handled by Next.js

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
    initializeSafariCompatibility();
  }, []);

  return (
    <body
      className={`font-sans antialiased ${
        isWebsite
          ? "min-h-screen bg-black text-white overflow-x-hidden overflow-y-auto"
          : "h-screen overflow-hidden"
      }`}
      style={{
        // Use CSS variables for theme-aware background
        backgroundColor: isWebsite ? '#000000' : 'var(--background, #ffffff)',
        transition: 'background-color 0.1s ease-in-out'
      }}
      suppressHydrationWarning
    >
              <DynamicFavicon isWebsite={isWebsite} defaultColor="#3b82f6" />
      <Suspense fallback={null}>
        <DynamicTitle />
      </Suspense>
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
        
        {/* Blocking theme script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get theme settings from localStorage
                  const themeSettings = localStorage.getItem('theme-settings');
                  const zoom = localStorage.getItem('zoom');
                  
                  // Default theme settings
                  let themeMode = 'light';
                  let lightTheme = 'ghost';
                  let darkTheme = 'dark-matter';
                  
                  // Parse stored settings
                  if (themeSettings) {
                    const parsed = JSON.parse(themeSettings);
                    if (parsed.themeMode) themeMode = parsed.themeMode;
                    if (parsed.lightTheme) lightTheme = parsed.lightTheme;
                    if (parsed.darkTheme) darkTheme = parsed.darkTheme;
                  }
                  
                  // Determine if dark mode should be active
                  const isDarkMode = themeMode === 'dark' || 
                    (themeMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  // Set dark mode class immediately
                  if (isDarkMode) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Apply zoom if available
                  if (zoom) {
                    const zoomValue = parseInt(zoom, 10);
                    if (!isNaN(zoomValue) && zoomValue >= 50 && zoomValue <= 200) {
                      document.documentElement.style.fontSize = zoomValue + '%';
                    }
                  }
                  
                  // Set theme data attribute for React to read
                  document.documentElement.setAttribute('data-theme-mode', themeMode);
                  document.documentElement.setAttribute('data-light-theme', lightTheme);
                  document.documentElement.setAttribute('data-dark-theme', darkTheme);
                  
                } catch (error) {
                  // Silent fail - fallback to light mode
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme-mode', 'light');
                }
              })();
            `,
          }}
        />
        
        {/* Twilio Voice SDK for computer-to-phone calling */}
        <Script src="/twilio-voice.min.js" strategy="beforeInteractive" />
        
        {/* Safari compatibility handled by Next.js */}
      </head>
      <RootLayoutContent>{children}</RootLayoutContent>
    </html>
  );
}
