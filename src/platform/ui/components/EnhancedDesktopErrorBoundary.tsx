"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  getDesktopEnvInfo,
  validateDesktopEnv,
} from "@/platform/desktop-env-check";

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
  error: Error | null;
  errorInfo: ErrorInfo | null;
  envInfo: any;
  validationResult: any;
}

export class EnhancedDesktopErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this['state'] = {
      hasError: false,
      error: null,
      errorInfo: null,
      envInfo: null,
      validationResult: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 Enhanced Desktop Error Boundary - Error Caught:", error);
    console.error("🚨 Component Stack:", errorInfo.componentStack);

    // Gather comprehensive environment information
    const envInfo = getDesktopEnvInfo();
    const validationResult = validateDesktopEnv();

    // Enhanced error logging
    const errorAnalysis = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      environment: envInfo,
      validation: validationResult,
      tauri:
        typeof window !== "undefined"
          ? {
              hasTauri: !!(window as any).__TAURI__,
              hasMetadata: !!(window as any).__TAURI_METADATA__,
              hasIPC: !!(window as any).__TAURI_IPC__,
            }
          : null,
      location:
        typeof window !== "undefined"
          ? {
              href: window.location.href,
              protocol: window.location.protocol,
              hostname: window.location.hostname,
              pathname: window.location.pathname,
              search: window.location.search,
            }
          : null,
      commonIssues: this.diagnoseCommonIssues(error, envInfo, validationResult),
    };

    console.error(
      "🔍 Complete Error Analysis:",
      JSON.stringify(errorAnalysis, null, 2),
    );

    this.setState({
      errorInfo,
      envInfo,
      validationResult,
    });
  }

  diagnoseCommonIssues(error: Error, envInfo: any, validation: any): string[] {
    const issues: string[] = [];

    // API-related errors
    if (error.message.includes("fetch") || error.message.includes("API")) {
      if (envInfo['isDesktop'] && envInfo.canUseAPI) {
        issues.push(
          "API call attempted in desktop mode - this should use fallback data",
        );
      }
      if (error.message.includes("404")) {
        issues.push(
          "Missing API route - check if API routes were properly restored",
        );
      }
    }

    // Authentication errors
    if (error.message.includes("auth") || error.message.includes("session")) {
      issues.push(
        "Authentication error - may need to clear local storage and restart",
      );
    }

    // Tauri-specific errors
    if (envInfo['isDesktop'] && !envInfo.isTauri) {
      issues.push(
        "Desktop mode without Tauri runtime - check build configuration",
      );
    }

    // Environment mismatches
    if (validation.issues.length > 0) {
      issues.push(`Environment issues: ${validation.issues.join(", ")}`);
    }

    // Grand Central specific
    if (
      error.stack?.includes("grand-central") ||
      error.stack?.includes("GrandCentral")
    ) {
      issues.push(
        "Grand Central integration error - OAuth features not available in desktop mode",
      );
    }

    return issues;
  }

  handleRecover = () => {
    try {
      // Clear potentially corrupted state (preserve theme to prevent flash)
      const themeData: Record<string, string | null> = {};
      THEME_KEYS_TO_PRESERVE.forEach(key => {
        themeData[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      
      // Restore theme preferences
      Object.entries(themeData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });

      // Reset error boundary
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        envInfo: null,
        validationResult: null,
      });

      console.log("🔄 Error boundary reset successful");
    } catch (e) {
      console.error("❌ Error during recovery:", e);
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const { error, envInfo, validationResult } = this.state;
      const commonIssues =
        error && envInfo && validationResult
          ? this.diagnoseCommonIssues(error, envInfo, validationResult)
          : [];

      return (
        <div className="min-h-screen bg-panel-background flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-background rounded-lg shadow-lg p-6">
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
                    d="M12 9v2m0 4h.01M6.938 4H13.062c1.54 0 2.502 1.667 1.732 2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-semibold text-foreground mb-2">
                Desktop Application Error
              </h2>

              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm font-medium text-red-800">
                  {error?.message || "An unexpected error occurred"}
                </p>
              </div>
            </div>

            {/* Quick Recovery Actions */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={this.handleRecover}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Clear Data & Retry
              </button>

              <button
                onClick={this.handleReload}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Reload Application
              </button>
            </div>

            {/* Diagnosed Issues */}
            {commonIssues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Likely Causes:
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {commonIssues.map((issue, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Environment Info */}
            {envInfo && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-foreground">
                  Environment Information
                </summary>
                <div className="mt-2 p-3 bg-hover rounded text-xs font-mono">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Platform:</strong> {envInfo.platform}
                      <br />
                      <strong>Desktop Mode:</strong>{" "}
                      {envInfo.isDesktop ? "Yes" : "No"}
                      <br />
                      <strong>Tauri Runtime:</strong>{" "}
                      {envInfo.isTauri ? "Yes" : "No"}
                      <br />
                      <strong>API Enabled:</strong>{" "}
                      {envInfo.canUseAPI ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>Protocol:</strong>{" "}
                      {typeof window !== "undefined"
                        ? window.location.protocol
                        : "N/A"}
                      <br />
                      <strong>Host:</strong>{" "}
                      {typeof window !== "undefined"
                        ? window.location.hostname
                        : "N/A"}
                      <br />
                      <strong>Path:</strong>{" "}
                      {typeof window !== "undefined"
                        ? window.location.pathname
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </details>
            )}

            {/* Technical Details */}
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-hover rounded text-xs font-mono max-h-40 overflow-auto">
                <div className="space-y-2">
                  <div>
                    <strong>Error:</strong> {error?.name}
                  </div>
                  <div>
                    <strong>Message:</strong> {error?.message}
                  </div>
                  {error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {error.stack}
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
