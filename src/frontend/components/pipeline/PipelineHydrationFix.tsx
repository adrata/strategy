"use client";

import { useEffect, useState } from "react";

/**
 * 🚀 PIPELINE HYDRATION FIX - 2025 OPTIMIZED
 * 
 * Prevents hydration mismatches in pipeline components by ensuring
 * consistent server/client rendering and proper state initialization.
 */

interface PipelineHydrationFixProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PipelineHydrationFix({ children, fallback }: PipelineHydrationFixProps) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Set hydrated state after component mounts
    setIsHydrated(true);

    // Handle any hydration errors
    const handleHydrationError = (event: ErrorEvent) => {
      if (
        event.message.includes("hydration") ||
        event.message.includes("Text content did not match") ||
        event.message.includes("Hydration failed")
      ) {
        console.warn("🚨 [HYDRATION FIX] Hydration error detected:", event.message);
        setHasError(true);
        
        // Attempt to recover from hydration error
        setTimeout(() => {
          setHasError(false);
          setIsHydrated(true);
        }, 100);
      }
    };

    // Handle unhandled promise rejections that might be hydration related
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        typeof event.reason === "string" &&
        (event.reason.includes("hydration") ||
          event.reason.includes("Text content"))
      ) {
        console.warn("🚨 [HYDRATION FIX] Hydration promise rejection detected:", event.reason);
        setHasError(true);
        
        // Attempt to recover
        setTimeout(() => {
          setHasError(false);
          setIsHydrated(true);
        }, 100);
      }
    };

    window.addEventListener("error", handleHydrationError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleHydrationError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  // Show fallback during hydration or if there's an error
  if (!isHydrated || hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default loading skeleton
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check if component is hydrated
 */
export function useHydrationStatus() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook to safely access window object after hydration
 */
export function useSafeWindow() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated ? window : null;
}

/**
 * Hook to safely access localStorage after hydration
 */
export function useSafeLocalStorage() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    isHydrated,
    getItem: (key: string) => {
      if (!isHydrated || typeof window === 'undefined') return null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      if (!isHydrated || typeof window === 'undefined') return;
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore localStorage errors
      }
    },
    removeItem: (key: string) => {
      if (!isHydrated || typeof window === 'undefined') return;
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore localStorage errors
      }
    }
  };
}
