"use client";

import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    // In desktop mode, redirect to home instead of showing 404
    if (typeof window !== "undefined") {
      const isDesktop =
        !!(window as any).__TAURI__ ||
        process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true";

      if (isDesktop) {
        // Redirect to home page in desktop mode
        window['location']['href'] = "/";
        return;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          404
        </h1>
        <p className="text-lg text-gray-600">
          Page not found
        </p>
      </div>
    </div>
  );
}
