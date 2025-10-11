"use client";

/**
 * 🚀 ADRATA UNIFIED ERROR BOUNDARY SYSTEM - 2025 WORLD-CLASS
 * 
 * Comprehensive error handling for all components
 * Provides graceful error recovery and user-friendly error messages
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export interface AdrataErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number;
  showDetails?: boolean;
  className?: string;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  onRetry: () => void;
  maxRetries: number;
  showDetails: boolean;
}

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

export class AdrataErrorBoundary extends Component<AdrataErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: AdrataErrorBoundaryProps) {
    super(props);
    this['state'] = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('🚨 [ERROR BOUNDARY] Caught error:', error, errorInfo);
    
    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      // Call custom retry handler
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, maxRetries = 3, showDetails = false, className = '' } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          retryCount={retryCount}
          onRetry={this.handleRetry}
          maxRetries={maxRetries}
          showDetails={showDetails}
          className={className}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// ERROR FALLBACK COMPONENT
// ============================================================================

export const ErrorFallback: React.FC<ErrorFallbackProps & { className?: string }> = ({
  error,
  errorInfo,
  retryCount,
  onRetry,
  maxRetries,
  showDetails,
  className = ''
}) => {
  const canRetry = retryCount < maxRetries;
  const isLastRetry = retryCount === maxRetries - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-8 text-center min-h-[400px] ${className}`}
    >
      {/* Error Icon */}
      <div className="text-red-500 mb-6">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>

      {/* Error Title */}
      <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
        {isLastRetry ? 'Something went wrong' : 'Oops! Something went wrong'}
      </h2>

      {/* Error Message */}
      <p className="text-[var(--muted)] mb-6 max-w-md">
        {isLastRetry 
          ? 'We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.'
          : 'We encountered an error while loading this content. Let\'s try again.'
        }
      </p>

      {/* Retry Button */}
      {canRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {retryCount === 0 ? 'Try Again' : `Retry (${retryCount}/${maxRetries})`}
        </motion.button>
      )}

      {/* Refresh Button (Last resort) */}
      {!canRetry && (
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Refresh Page
          </button>
          <p className="text-sm text-[var(--muted)]">
            If the problem persists, please contact support
          </p>
        </div>
      )}

      {/* Error Details (Development only) */}
      {showDetails && error && (
        <details className="mt-8 text-left max-w-2xl w-full">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-[var(--foreground)]">
            Error Details (Development)
          </summary>
          <div className="mt-4 p-4 bg-[var(--hover)] rounded-lg text-xs font-mono text-gray-800 overflow-auto">
            <div className="mb-4">
              <strong>Error:</strong>
              <pre className="whitespace-pre-wrap mt-1">{error.message}</pre>
            </div>
            {errorInfo && (
              <div>
                <strong>Component Stack:</strong>
                <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
              </div>
            )}
          </div>
        </details>
      )}
    </motion.div>
  );
};

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

/**
 * 🎯 PAGE ERROR BOUNDARY: For full-page error handling
 */
export const PageErrorBoundary: React.FC<Omit<AdrataErrorBoundaryProps, 'showDetails'>> = (props) => (
  <AdrataErrorBoundary
    {...props}
    showDetails={process['env']['NODE_ENV'] === 'development'}
    className="min-h-screen"
  />
);

/**
 * 🎯 COMPONENT ERROR BOUNDARY: For component-level error handling
 */
export const ComponentErrorBoundary: React.FC<AdrataErrorBoundaryProps> = (props) => (
  <AdrataErrorBoundary
    {...props}
    showDetails={process['env']['NODE_ENV'] === 'development'}
  />
);

/**
 * 🎯 SILENT ERROR BOUNDARY: For non-critical components
 */
export const SilentErrorBoundary: React.FC<AdrataErrorBoundaryProps> = ({ children, onError }) => (
  <AdrataErrorBoundary
    onError={onError}
    fallback={
      <div className="p-4 text-center text-[var(--muted)] text-sm">
        <p>This component is temporarily unavailable</p>
      </div>
    }
  >
    {children}
  </AdrataErrorBoundary>
);

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

/**
 * 🎯 WITH ERROR BOUNDARY: HOC for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<AdrataErrorBoundaryProps, 'children'> = {}
) {
  return function ErrorBoundaryWrappedComponent(props: P) {
    return (
      <AdrataErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </AdrataErrorBoundary>
    );
  };
}

// ============================================================================
// ERROR REPORTING UTILITIES
// ============================================================================

/**
 * 🎯 ERROR REPORTING: Utility for reporting errors
 */
export const reportError = (error: Error, context?: Record<string, any>) => {
  console.error('🚨 [ERROR REPORT]', error, context);
  
  // Report to error tracking service
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.captureException(error, { extra: context });
  }
};

/**
 * 🎯 ASYNC ERROR HANDLER: For async operations
 */
export const withAsyncErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error as Error, { context, args });
      return null;
    }
  };
};
