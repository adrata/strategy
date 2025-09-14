"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", error);
    console.error("Error Stack:", error.stack);
    console.error("Error Digest:", error.digest);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-12 max-w-lg w-full mx-6">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 border-2 border-red-500 rounded-full flex items-center justify-center mb-8">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-6">
                Critical Error
              </h1>
              
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                The application encountered a critical error and needs to restart.
              </p>

              <div className="bg-black border border-gray-700 rounded-lg p-4 mb-8 text-left">
                <p className="text-sm text-red-400 font-semibold mb-2">
                  Error Details:
                </p>
                <p className="text-xs text-gray-300 break-all font-mono">
                  {error.message}
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => reset()}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 border border-red-500 hover:border-red-400"
                >
                  Try Again
                </button>

                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
                >
                  Clear Data and Restart
                </button>

                <button
                  onClick={() => (window['location']['href'] = "/sign-in")}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 border border-gray-600 hover:border-gray-500"
                >
                  Go to Sign In
                </button>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500">Adrata Desktop v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
