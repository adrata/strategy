"use client";

import React from "react";
import { isDesktop } from "@/platform/platform-detection";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this['state'] = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error("Error caught by boundary:", error);
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error boundary caught error:", error, errorInfo);

    // Additional logging for debugging
    console.group("Error Details");
    console.log("Error:", error);
    console.log("Component Stack:", errorInfo.componentStack);
    console.log("Environment:", {
      isDesktop: isDesktop(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "server",
    });
    console.groupEnd();
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.handleReset}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-black flex flex-col justify-center items-center px-6">
          <div className="text-center max-w-lg">
            <div className="mb-12">
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
                Component Error
              </h1>
              
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                A component encountered an unexpected error. Please try refreshing or resetting the component.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 border border-red-500 hover:border-red-400"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.reload();
                  }
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
              >
                Refresh Page
              </button>
            </div>
            
            {process['env']['NODE_ENV'] === "development" && this['state']['error'] && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-300 border-b border-gray-700 pb-2">
                  Error Details (Development)
                </summary>
                <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-gray-300 overflow-auto max-h-40">
                  <div className="mb-2">
                    <span className="text-red-400 font-semibold">Error:</span> {this.state.error.toString()}
                  </div>
                  {this.state['error']['stack'] && (
                    <div>
                      <span className="text-red-400 font-semibold">Stack:</span>
                      <pre className="mt-1 whitespace-pre-wrap text-gray-400">{this.state.error.stack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
