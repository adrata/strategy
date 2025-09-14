"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
