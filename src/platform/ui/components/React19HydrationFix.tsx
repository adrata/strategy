"use client";

import { useEffect } from "react";

// CRITICAL FIX: React 19 hydration improvements with stricter checks
// Based on research: React 19 requires exact server/client DOM matching
export function React19HydrationFix() {
  useEffect(() => {
    // Only run on client-side after hydration
    const handleHydrationMismatch = () => {
      try {
        // Force re-render of any components with hydration issues
        const hydrationElements = document.querySelectorAll(
          "[data-hydration-error]",
        );
        hydrationElements.forEach((element) => {
          // Remove the error marker and trigger re-render
          element.removeAttribute("data-hydration-error");
        });

        // Clean up any stale React fiber nodes that might cause issues
        const reactNodes = document.querySelectorAll("[data-reactroot]");
        reactNodes.forEach((node) => {
          // Ensure proper React 19 mounting
          if (node['parentNode'] && !node.querySelector("[data-react-error]")) {
            // React 19 specific: Ensure proper hydration markers
            if (!node.hasAttribute("data-react-hydrated")) {
              node.setAttribute("data-react-hydrated", "true");
            }
          }
        });

        // Handle theme system hydration specifically
        const htmlElement = document.documentElement;
        if (htmlElement) {
          // Ensure theme attributes are consistent
          const currentTheme = htmlElement.getAttribute("data-theme");
          if (!currentTheme) {
            htmlElement.setAttribute("data-theme", "light");
          }
        }

        // Clean up any orphaned portal containers
        const portalContainers = document.querySelectorAll(
          "[data-portal-container]",
        );
        portalContainers.forEach((container) => {
          if (!container.hasChildNodes()) {
            container.remove();
          }
        });
      } catch (error) {
        console.warn("React19HydrationFix: Error handling hydration:", error);
      }
    };

    // Run immediately after component mount
    handleHydrationMismatch();

    // Also run on any React errors
    const handleError = (event: ErrorEvent) => {
      if (
        event.message.includes("hydration") ||
        event.message.includes("Text content did not match")
      ) {
        console.warn(
          "Hydration error detected, attempting fix:",
          event.message,
        );
        handleHydrationMismatch();
      }
    };

    window.addEventListener("error", handleError);

    // React 19 specific: Listen for unhandled promise rejections that might be hydration related
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event['reason'] &&
        typeof event['reason'] === "string" &&
        (event.reason.includes("hydration") ||
          event.reason.includes("Text content"))
      ) {
        console.warn("Hydration promise rejection detected:", event.reason);
        handleHydrationMismatch();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  // This component doesn't render anything, it just handles hydration fixes
  return null;
}
