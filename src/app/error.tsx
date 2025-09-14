"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="text-center max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            {/* Friendly error icon */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>

            <p className="text-gray-600 text-lg leading-relaxed mb-2">
              We encountered an unexpected error. Don't worry, this is usually temporary and can be fixed quickly.
            </p>
            
            <p className="text-gray-500 text-sm">
              Our team has been notified and we're working to resolve this issue.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => reset()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              🔄 Try Again
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
            >
              🔃 Reload Page
            </button>
            
            <button
              onClick={() => window['location']['href'] = '/'}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-6 rounded-lg transition-all duration-200 text-sm"
            >
              🏠 Go to Homepage
            </button>
          </div>

          {process['env']['NODE_ENV'] === "development" && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 border-b border-gray-200 pb-2 transition-colors">
                🔧 Error Details (Development)
              </summary>
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 overflow-auto max-h-40">
                <div className="mb-2">
                  <span className="text-red-600 font-semibold">Error:</span> {error.message}
                </div>
                {error['stack'] && (
                  <div>
                    <span className="text-red-600 font-semibold">Stack:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-gray-600">{error.stack}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
        
        {/* Footer with helpful links */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@adrata.com" className="text-blue-600 hover:text-blue-700 underline">
              support@adrata.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
