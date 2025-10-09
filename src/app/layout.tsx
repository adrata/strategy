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
          : "h-screen overflow-hidden bg-white"
      }`}
      style={{
        // Ensure consistent background during navigation transitions
        backgroundColor: isWebsite ? '#000000' : '#ffffff',
        transition: 'background-color 0.1s ease-in-out'
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
        
        {/* Safari compatibility handled by Next.js */}
      </head>
      <RootLayoutContent>{children}</RootLayoutContent>
    </html>
  );
}
