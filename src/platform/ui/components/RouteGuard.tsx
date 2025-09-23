"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUnifiedAuth } from "@/platform/auth-unified";
import { getPlatformConfig } from "@/platform/platform-detection";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";

interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Modern loading component with consistent styling
const SimpleLoading = () => (
  <PipelineSkeleton message="Loading Adrata..." />
);

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  fallback,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  const config = getPlatformConfig();

  // Define public routes
  const publicRoutes = [
    "/", // landing
    "/about",
    "/pricing",
    "/contact",
    "/sign-in",
    "/website",
  ];

  // Desktop-specific public routes (no auth required)
  const desktopPublicRoutes = [
          "/speedrun", // Speedrun standalone - REMOVED aos to require auth
  ];

  // Check if current route is public
  const isPublicRoute = pathname
    ? publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/"),
      ) ||
      (config['isDesktop'] &&
        desktopPublicRoutes.some(
          (route) => pathname === route || pathname.startsWith(route + "/"),
        ))
    : false;

  const isRoot = pathname === "/";
  const isSignInPage = pathname === "/sign-in";

  // Handle client-side hydration immediately
  useEffect(() => {
    setIsClient(true);
  }, []);

  // LIGHTNING FAST: Handle navigation immediately for sign-in page
  useEffect(() => {
    if (!isClient) return;

    // INSTANT: If user is on sign-in page, never show loading
    if (isSignInPage) {
      console.log("⚡ INSTANT: Sign-in page detected, skipping all loading");
      return;
    }

    // DESKTOP AGGRESSIVE FIX: Skip auth loading entirely in desktop
    if (config.isDesktop) {
      console.log(
        "🖥️ Desktop mode: Bypassing auth loading, proceeding immediately...",
      );
      return;
    }

    // FAST NAVIGATION: Handle navigation logic without waiting for auth
    if (!hasNavigated && !isLoading) {
      setHasNavigated(true);

      // Authenticated user on root or bare /aos -> redirect to main app
      if (isAuthenticated && (isRoot || pathname === "/aos")) {
        console.log("🛡️ Fast redirect to /speedrun");
        router.replace("/speedrun");
        return;
      }

      // Unauthenticated user on protected route -> redirect to sign-in
      if (!isAuthenticated && !isPublicRoute && !isRoot) {
        console.log("🛡️ Fast redirect to sign-in");
        // Ensure we redirect to the correct domain
        if (typeof window !== "undefined" && window.location.hostname !== "action.adrata.com" && window.location.hostname !== "localhost") {
          console.log("🔄 RouteGuard: Redirecting to correct domain");
          window['location']['href'] = "https://action.adrata.com/sign-in";
        } else {
          router.replace("/sign-in");
        }
        return;
      }
    }
  }, [
    isClient,
    isAuthenticated,
    isLoading,
    isPublicRoute,
    isRoot,
    isSignInPage,
    hasNavigated,
    router,
    config.isDesktop,
  ]);

  // LIGHTNING FAST: Never show loading for sign-in page
  if (isSignInPage) {
    return <>{children}</>;
  }

  // LIGHTNING FAST: Never show loading for public routes when not authenticated
  if (isPublicRoute && !isAuthenticated) {
    return <>{children}</>;
  }

  // REMOVED: Desktop authentication bypass - now requires auth like web

  // Only show loading for protected routes while determining auth status
  if (!isClient || (isLoading && !isPublicRoute)) {
    return fallback || <SimpleLoading />;
  }

  // Public routes: show content immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes: only show if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Fallback: redirect to sign-in (shouldn't reach here due to useEffect above)
  if (typeof window !== "undefined" && pathname !== "/sign-in") {
    // Ensure we redirect to the correct domain
    if (window.location.hostname !== "action.adrata.com" && window.location.hostname !== "localhost") {
      console.log("🔄 RouteGuard: Fallback redirect to correct domain");
      window['location']['href'] = "https://action.adrata.com/sign-in";
    } else {
      router.replace("/sign-in");
    }
  }

  return fallback || <SimpleLoading />;
};
