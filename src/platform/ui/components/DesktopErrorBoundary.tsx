"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
// Standard error handling - no need for custom desktop error logger

// Theme keys that should be preserved to prevent theme flash
const THEME_KEYS_TO_PRESERVE = [
  'adrata-theme-preferences',
  'adrata-theme-mode',
  'adrata-light-theme',
  'adrata-dark-theme',
];

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
      // Save theme preferences before clearing to prevent theme flash
      const themeData: Record<string, string | null> = {};
      THEME_KEYS_TO_PRESERVE.forEach(key => {
        themeData[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore theme preferences
      Object.entries(themeData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
      
      console.log("🧹 All storage cleared (theme preserved)");
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear data:", error);
      window['location']['href'] = "/";
    }
  };

  private getErrorSummary = () => {
    const { error, errorDetails } = this.state;
    if (!error) return "Something went wrong";

    // Analyze common error patterns
    const message = error.message || "";
    const stack = error.stack || "";
    const errorName = error.name || "";

    // ChunkLoadError - specific handling for webpack chunk loading failures
    if (errorName === "ChunkLoadError" || message.includes("Loading chunk") || message.includes("Failed to fetch dynamically imported module")) {
      return "App Update Available";
    }
    if (
      message.includes("Cannot read property") ||
      message.includes("Cannot read properties")
    ) {
      return "Data loading issue";
    }
    if (message.includes("is not a function")) {
      return "Feature temporarily unavailable";
    }
    if (message.includes("localStorage")) {
      return "Storage access issue";
    }
    if (message.includes("JSON")) {
      return "Data format issue";
    }
    if (message.includes("import") || message.includes("module")) {
      return "Component loading failed";
    }
    if (stack.includes("page.tsx")) {
      return "Page loading issue";
    }
    if (stack.includes("layout.tsx")) {
      return "Layout loading issue";
    }
    if (message.includes("hydration") || message.includes("Hydration")) {
      return "Display synchronization issue";
    }

    return "Something unexpected happened";
  };

  private getPossibleSolutions = () => {
    const { error } = this.state;
    if (!error) return [];

    const message = error.message || "";
    const errorName = error.name || "";
    const solutions = [];

    // ChunkLoadError - specific solutions for webpack chunk loading failures
    if (errorName === "ChunkLoadError" || message.includes("Loading chunk") || message.includes("Failed to fetch dynamically imported module")) {
      solutions.push("Reloading the app will fix this issue");
      solutions.push("This happens when the app updates while running");
      return solutions; // Return early for ChunkLoadError
    }

    if (message.includes("localStorage")) {
      solutions.push("Clear app data may help");
      solutions.push("Try refreshing the app");
    }
    if (message.includes("JSON")) {
      solutions.push("Clear corrupted data and restart");
      solutions.push("Reset the app to default settings");
    }
    if (message.includes("Cannot read property")) {
      solutions.push("Try refreshing the page");
      solutions.push("Check your internet connection");
    }
    if (message.includes("is not a function")) {
      solutions.push("Try reloading the app");
      solutions.push("Restart the application");
    }

    solutions.push("Clear all data and reload");
    solutions.push("Try refreshing the page");

    return solutions;
  };

  override render() {
    if (this.state.hasError) {
      console.error("🚨 DesktopErrorBoundary: Rendering error UI");
      console.error("🚨 Current error state:", this.state.error?.message);

      const errorSummary = this.getErrorSummary();
      
      // Auto-reload on ChunkLoadError
      if (errorSummary === "ChunkLoadError") {
        console.warn("🔄 ChunkLoadError detected - auto-reloading page in 2 seconds...");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        return (
          <div className="min-h-screen bg-panel-background flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full bg-background rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Loading Updated Code
                </h2>
                <p className="text-muted mb-4">
                  The application has been updated. Reloading...
                </p>
                <div className="text-sm text-muted">
                  If the page doesn't reload automatically, please refresh manually.
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Custom error UI for desktop
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const solutions = this.getPossibleSolutions();

      return (
        <div className="min-h-screen bg-panel-background flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-background rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-foreground mb-2">
                Something unexpected happened
              </h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-700">
                  {errorSummary}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={this.handleReset}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                >
                  Reload App
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={this.showErrorLogs}
                  className="w-full px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm transition-colors"
                >
                  View Technical Details
                </button>

                <button
                  onClick={this.clearAllData}
                  className="w-full px-4 py-2 bg-blue-300 text-blue-800 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm transition-colors"
                >
                  Clear Data & Reset
                </button>
              </div>
            </div>

            {solutions.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700 mb-2">
                  Quick fixes to try:
                </h3>
                <ul className="text-xs text-blue-600 space-y-1">
                  {solutions.map((solution, index) => (
                    <li key={index}>• {solution}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                Technical Information (for support)
              </summary>
              <div className="mt-3 p-4 bg-hover rounded text-xs font-mono text-gray-800 max-h-80 overflow-auto">
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-blue-700 mb-1">
                      Error Message:
                    </div>
                    <div className="text-blue-600 mb-2">
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
                      <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded">
                        {JSON.stringify(this.state.errorDetails, null, 2)}
                      </pre>
                    </div>
                  )}

                  {this.state.error?.stack && (
                    <div>
                      <div className="font-semibold mb-1">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <div className="font-semibold mb-1">Component Stack:</div>
                      <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded">
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
