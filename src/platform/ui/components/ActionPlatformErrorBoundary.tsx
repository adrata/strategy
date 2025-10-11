"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { PipelineSkeleton } from "@/platform/ui/components/Loader";
import { ActionPlatformError } from "@/platform/aos/aos";
import { errorConfig } from "@/platform/aos/api/aos/config";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: ActionPlatformError) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class ActionPlatformErrorBoundary extends Component<Props, State> {
  private errorReportingQueue: ActionPlatformError[] = [];
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this['state'] = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Create structured error object
    const actionPlatformError: ActionPlatformError = {
      code: "COMPONENT_ERROR",
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        retryCount: this.state.retryCount,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    // Log error locally
    this.logError(actionPlatformError);

    // Report error to external service
    this.reportError(actionPlatformError);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(actionPlatformError);
    }
  }

  private logError(error: ActionPlatformError) {
    if (errorConfig.enableConsoleLogging) {
      console.group(`🚨 Action Platform Error [${error.code}]`);
      console.error("Message:", error.message);
      console.error("Details:", error.details);
      console.error("Stack:", this.state.error?.stack);
      console.error("Component Stack:", this.state.errorInfo?.componentStack);
      console.groupEnd();
    }
  }

  private async reportError(error: ActionPlatformError) {
    if (!errorConfig.enableErrorReporting) return;

    // Add to queue
    this.errorReportingQueue.push(error);

    // Don't exceed max errors per session
    if (this.errorReportingQueue.length > errorConfig.maxErrorsPerSession) {
      this.errorReportingQueue.shift(); // Remove oldest
    }

    // Batch report errors
    if (this.errorReportingQueue.length >= errorConfig.errorBatchSize) {
      await this.sendErrorBatch();
    }
  }

  private async sendErrorBatch() {
    if (
      !errorConfig.errorReportingEndpoint ||
      this['errorReportingQueue']['length'] === 0
    ) {
      return;
    }

    const errors = [...this.errorReportingQueue];
    this['errorReportingQueue'] = [];

    try {
      await fetch(errorConfig.errorReportingEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errors,
          session: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
        }),
      });
    } catch (reportingError) {
      console.warn("Failed to report errors:", reportingError);
      // Put errors back in queue
      this.errorReportingQueue.unshift(...errors);
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: this.state.retryCount + 1,
      });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  private copyErrorDetails = async () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(errorDetails, null, 2),
      );
      // Show success feedback (you could add a toast here)
      console.log("Error details copied to clipboard");
    } catch (err) {
      console.warn("Failed to copy error details:", err);
    }
  };

  private getErrorSeverity(): "low" | "medium" | "high" | "critical" {
    const error = this.state.error;
    if (!error) return "low";

    // Critical errors
    if (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.message.includes("Network Error")
    ) {
      return "critical";
    }

    // High severity errors
    if (
      error['name'] === "TypeError" ||
      error['name'] === "ReferenceError" ||
      error.message.includes("Cannot read property")
    ) {
      return "high";
    }

    // Medium severity errors
    if (
      error['name'] === "SyntaxError" ||
      error.message.includes("Unexpected token")
    ) {
      return "medium";
    }

    return "low";
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  }

  private getRecoveryOptions() {
    const error = this.state.error;
    if (!error) return [];

    const options = [];

    // Retry option for transient errors
    if (this.state.retryCount < this.maxRetries) {
      options.push({
        label: "Try Again",
        action: this.handleRetry,
        icon: ArrowPathIcon,
        primary: true,
      });
    }

    // Reset option
    options.push({
      label: "Reset Component",
      action: this.handleReset,
      icon: ArrowPathIcon,
      primary: false,
    });

    // Refresh page for critical errors
    if (this.getErrorSeverity() === "critical") {
      options.push({
        label: "Refresh Page",
        action: () => window.location.reload(),
        icon: ArrowPathIcon,
        primary: true,
      });
    }

    return options;
  }

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity();
      const severityColor = this.getSeverityColor(severity);
      const recoveryOptions = this.getRecoveryOptions();

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div
            className={`max-w-md w-full border rounded-lg p-6 ${severityColor}`}
          >
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Something went wrong</h3>
                <p className="text-sm opacity-75 capitalize">
                  {severity} severity error
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm mb-2">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>

              {this['state']['errorId'] && (
                <p className="text-xs opacity-60">
                  Error ID: {this.state.errorId}
                </p>
              )}

              {this.state.retryCount > 0 && (
                <p className="text-xs opacity-60">
                  Retry attempts: {this.state.retryCount}/{this.maxRetries}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {recoveryOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={option.action}
                  className={`w-full px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                    option.primary
                      ? "bg-current text-white hover:opacity-90"
                      : "bg-[var(--background)]/50 hover:bg-[var(--background)]/70"
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}

              <button
                onClick={this.copyErrorDetails}
                className="w-full px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium bg-[var(--background)]/30 hover:bg-[var(--background)]/50 transition-colors"
              >
                <ClipboardIcon className="w-4 h-4" />
                Copy Error Details
              </button>
            </div>

            {process['env']['NODE_ENV'] === "development" && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer font-medium mb-2">
                  Debug Information
                </summary>
                <pre className="bg-[var(--background)]/20 p-2 rounded text-xs overflow-auto max-h-32">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper
export function withActionPlatformErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, "children">,
) {
  const WrappedComponent = (props: T) => (
    <ActionPlatformErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ActionPlatformErrorBoundary>
  );

  WrappedComponent['displayName'] = `withActionPlatformErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// React Suspense fallback component
export function ActionPlatformLoadingFallback() {
  return (
    <Loader 
      type="skeleton" 
      size="md" 
      message="Loading Action Platform..."
      className="min-h-[400px]"
    />
  );
}
