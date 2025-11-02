"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CompaniesErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface CompaniesErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  maxRetries?: number;
}

export class CompaniesErrorBoundary extends Component<CompaniesErrorBoundaryProps, CompaniesErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: CompaniesErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CompaniesErrorBoundaryState> {
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
    console.error('🚨 [COMPANIES ERROR BOUNDARY] Caught error:', error, errorInfo);
    
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
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <CompaniesErrorFallback
          error={error}
          errorInfo={errorInfo}
          retryCount={retryCount}
          onRetry={this.handleRetry}
          maxRetries={maxRetries}
        />
      );
    }

    return children;
  }
}

// Error Fallback Component
interface CompaniesErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  onRetry: () => void;
  maxRetries: number;
}

export const CompaniesErrorFallback: React.FC<CompaniesErrorFallbackProps> = ({
  error,
  errorInfo,
  retryCount,
  onRetry,
  maxRetries
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center items-center px-6"
    >
      <div className="text-center max-w-2xl">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="mx-auto w-20 h-20 border-2 border-red-500 rounded-full flex items-center justify-center mb-6">
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
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Companies Page Error
          </h1>
          
          <p className="text-muted text-lg leading-relaxed mb-8">
            We encountered an issue loading the companies page. This is usually temporary and can be resolved by refreshing the page.
          </p>
        </motion.div>
        
        <div className="space-y-4">
          {canRetry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again ({retryCount + 1}/{maxRetries})
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium ml-4"
          >
            Refresh Page
          </motion.button>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left"
          >
            <h3 className="text-sm font-semibold text-red-800 mb-2">Error Details:</h3>
            <pre className="text-xs text-red-700 overflow-auto max-h-40">
              {error.message}
              {errorInfo?.componentStack}
            </pre>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// HOC for easy wrapping
export function withCompaniesErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<CompaniesErrorBoundaryProps, "children">
) {
  return function WrappedComponent(props: T) {
    return (
      <CompaniesErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </CompaniesErrorBoundary>
    );
  };
}
