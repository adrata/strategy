"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
// Standard error handling - no need for custom desktop error logger

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
  errorDetails?: any | undefined;
}

// Enhanced error logging and analysis for desktop debugging
function logDesktopError(error: Error, errorInfo?: ErrorInfo) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    name: error.name,
    componentStack: errorInfo?.componentStack,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    platform:
      typeof window !== "undefined" && (window as any).__TAURI__
        ? "tauri-desktop"
        : "web",
    environmentVars: {
      NODE_ENV: process['env']['NODE_ENV'],
      NEXT_PUBLIC_IS_DESKTOP: process['env']['NEXT_PUBLIC_IS_DESKTOP'],
      NEXT_PUBLIC_USE_STATIC_EXPORT: process['env']['NEXT_PUBLIC_USE_STATIC_EXPORT'],
      TAURI_BUILD: process['env']['TAURI_BUILD'],
    },
    // Additional debugging context
    windowGlobals:
      typeof window !== "undefined"
        ? {
            hasTauri: !!(window as any).__TAURI__,
            hasTauriMetadata: !!(window as any).__TAURI_METADATA__,
            hasLocalStorage: typeof localStorage !== "undefined",
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            pathname: window.location.pathname,
            search: window.location.search,
          }
        : null,
    // Check for common issues
    commonIssues: {
      isFileProtocol:
        typeof window !== "undefined"
          ? window['location']['protocol'] === "file:"
          : false,
      hasIndexHtml:
        typeof window !== "undefined"
          ? window.location.pathname.includes("index.html")
          : false,
      missingEnvVars: !process['env']['NODE_ENV'],
      possibleStaticExportIssue:
        process['env']['NEXT_PUBLIC_USE_STATIC_EXPORT'] === "true" &&
        typeof window !== "undefined" &&
        window['location']['protocol'] === "file:",
    },
  };

  // Use our new error logger
  console.error("DesktopErrorBoundary", "Critical React error caught", {
    error,
    errorInfo,
    errorDetails,
  });

  return errorDetails;
}

export class DesktopErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this['state'] = { hasError: false };

    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log("DesktopErrorBoundary", "Error boundary component constructed", {
      NODE_ENV: process['env']['NODE_ENV'],
      TAURI_BUILD: process['env']['TAURI_BUILD'],
      NEXT_PUBLIC_IS_DESKTOP: process['env']['NEXT_PUBLIC_IS_DESKTOP'],
      isClient: typeof window !== "undefined",
      hasTauri:
        typeof window !== "undefined" ? !!(window as any).__TAURI__ : false,
      });
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Note: Can't use our logger here since it's a static method
    console.error(
      "🚨 DesktopErrorBoundary.getDerivedStateFromError - ERROR CAUGHT:",
      error,
    );
    console.error("🚨 Error type:", typeof error);
    console.error("🚨 Error constructor:", error?.constructor?.name || 'Unknown');

    const errorDetails = logDesktopError(error);

    return {
      hasError: true,
      error,
      errorDetails,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "🚨 DesktopErrorBoundary.componentDidCatch - DETAILED ERROR INFO:",
    );
    console.error("🚨 Error:", error);
    console.error("🚨 Error message:", error.message);
    console.error("🚨 Error stack:", error.stack);
    console.error("🚨 Error Info:", errorInfo);
    console.error("🚨 Component stack:", errorInfo.componentStack);

    const errorDetails = logDesktopError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorDetails,
    });

    // For Tauri apps, additional logging
    if (typeof window !== "undefined" && (window as any).__TAURI__) {
      try {
        console.log("🖥️ TAURI ERROR - Additional context:", {
          tauriVersion:
            (window as any).__TAURI_METADATA__?.version || "unknown",
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      } catch (tauriError) {
        console.warn("Could not log to Tauri context:", tauriError);
      }
    }
  }

  private handleReset = () => {
    console.log("🔄 DesktopErrorBoundary: User clicked reset");
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorDetails: undefined,
    });
  };

  private handleReload = () => {
    console.log("🔄 DesktopErrorBoundary: User clicked reload");
    try {
      window.location.reload();
    } catch (reloadError) {
      console.error("❌ Failed to reload:", reloadError);
    }
  };

  private showErrorLogs = () => {
    try {
      const logs = localStorage.getItem("adrata_desktop_error_logs");
      if (logs) {
        console.log("📋 ALL DESKTOP ERROR LOGS:", JSON.parse(logs));
        alert(
          "Error logs printed to console. Check DevTools (F12 or Cmd+Option+I).",
        );
      } else {
        alert("No error logs found in localStorage.");
      }
    } catch (error) {
      console.error("Failed to show error logs:", error);
    }
  };

  private clearAllData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log("🧹 All storage cleared");
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear data:", error);
      window['location']['href'] = "/";
    }
  };

  private getErrorSummary = () => {
    const { error, errorDetails } = this.state;
    if (!error) return "Unknown error";

    // Analyze common error patterns
    const message = error.message || "";
    const stack = error.stack || "";

    if (
      message.includes("Cannot read property") ||
      message.includes("Cannot read properties")
    ) {
      return "Property Access Error - Likely accessing undefined/null object";
    }
    if (message.includes("is not a function")) {
      return "Function Call Error - Trying to call undefined function";
    }
    if (message.includes("localStorage")) {
      return "Local Storage Error - Storage access issue";
    }
    if (message.includes("JSON")) {
      return "JSON Parse Error - Invalid JSON data";
    }
    if (message.includes("import") || message.includes("module")) {
      return "Module Import Error - Failed to load component/module";
    }
    if (stack.includes("page.tsx")) {
      return "Page Component Error - Error in main page component";
    }
    if (stack.includes("layout.tsx")) {
      return "Layout Component Error - Error in layout wrapper";
    }
    if (message.includes("hydration") || message.includes("Hydration")) {
      return "Hydration Mismatch - Server/client render difference";
    }

    return error.name || "Unknown Error Type";
  };

  private getPossibleSolutions = () => {
    const { error } = this.state;
    if (!error) return [];

    const message = error.message || "";
    const solutions = [];

    if (message.includes("localStorage")) {
      solutions.push("Try clearing browser data");
      solutions.push("Check if localStorage is available in this context");
    }
    if (message.includes("JSON")) {
      solutions.push("Clear corrupted stored data");
      solutions.push("Reset application state");
    }
    if (message.includes("Cannot read property")) {
      solutions.push("Check for missing data or failed API calls");
      solutions.push("Verify component props are properly passed");
    }
    if (message.includes("is not a function")) {
      solutions.push("Check import statements");
      solutions.push("Verify function definitions");
    }

    solutions.push("Clear all data and reload");
    solutions.push("Check browser console for more details");

    return solutions;
  };

  override render() {
    if (this.state.hasError) {
      console.error("🚨 DesktopErrorBoundary: Rendering error UI");
      console.error("🚨 Current error state:", this.state.error?.message);

      // Custom error UI for desktop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorSummary = this.getErrorSummary();
      const solutions = this.getPossibleSolutions();

      return (
        <div className="min-h-screen bg-[var(--panel-background)] flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-[var(--background)] rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
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

              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                Desktop Application Error
              </h2>

              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm font-medium text-red-800">
                  {errorSummary}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Reload App
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={this.showErrorLogs}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  Show Debug Info
                </button>

                <button
                  onClick={this.clearAllData}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  Clear All Data
                </button>
              </div>
            </div>

            {solutions.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Suggested Solutions:
                </h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  {solutions.map((solution, index) => (
                    <li key={index}>• {solution}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-[var(--foreground)]">
                Technical Details & Debug Information
              </summary>
              <div className="mt-3 p-4 bg-[var(--hover)] rounded text-xs font-mono text-gray-800 max-h-80 overflow-auto">
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-red-700 mb-1">
                      Error Message:
                    </div>
                    <div className="text-red-600 mb-2">
                      {this.state.error?.message || "No message"}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1">Error Type:</div>
                    <div className="mb-2">
                      {this.state.error?.name || "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1">Environment:</div>
                    <div className="mb-2">
                      Platform:{" "}
                      {typeof window !== "undefined" &&
                      (window as any).__TAURI__
                        ? "Tauri Desktop"
                        : "Web"}
                      <br />
                      URL:{" "}
                      {typeof window !== "undefined"
                        ? window.location.href
                        : "unknown"}
                      <br />
                      Protocol:{" "}
                      {typeof window !== "undefined"
                        ? window.location.protocol
                        : "unknown"}
                      <br />
                      Time: {new Date().toISOString()}
                    </div>
                  </div>

                  {this['state']['errorDetails'] && (
                    <div>
                      <div className="font-semibold mb-1">Debug Context:</div>
                      <pre className="whitespace-pre-wrap text-xs bg-[var(--background)] p-2 rounded">
                        {JSON.stringify(this.state.errorDetails, null, 2)}
                      </pre>
                    </div>
                  )}

                  {this.state.error?.stack && (
                    <div>
                      <div className="font-semibold mb-1">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap text-xs bg-[var(--background)] p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <div className="font-semibold mb-1">Component Stack:</div>
                      <pre className="whitespace-pre-wrap text-xs bg-[var(--background)] p-2 rounded">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
