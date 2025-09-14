"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tabName: string;
  recordId?: string;
  recordType?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 🛡️ TAB ERROR BOUNDARY
 * 
 * Specialized error boundary for tab components that provides:
 * - Tab-specific error handling
 * - Detailed error information for debugging
 * - Graceful fallback UI with recovery options
 * - Context-aware error reporting
 */
export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this['state'] = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error(`🚨 [TAB ERROR BOUNDARY] Error caught:`, error);
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 [TAB ERROR BOUNDARY] Tab "${this.props.tabName}" crashed:`, error, errorInfo);
    
    // Enhanced logging for tab-specific errors
    console.group(`Tab Error Details - ${this.props.tabName}`);
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    console.log('Component Stack:', errorInfo.componentStack);
    console.log('Record ID:', this.props.recordId);
    console.log('Record Type:', this.props.recordType);
    console.groupEnd();

    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    console.log(`🔄 [TAB ERROR BOUNDARY] Retrying tab: ${this.props.tabName}`);
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  {this.props.tabName} Tab Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    The {this.props.tabName} tab encountered an error and couldn't be displayed. 
                    This might be due to data structure issues or component problems.
                  </p>
                </div>
                
                {/* Debug Information */}
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Debug Information:</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Tab:</strong> {this.props.tabName}</div>
                    <div><strong>Record Type:</strong> {this.props.recordType || 'Unknown'}</div>
                    <div><strong>Record ID:</strong> {this.props.recordId || 'Unknown'}</div>
                    <div><strong>Error:</strong> {this.state.error?.message || 'Unknown error'}</div>
                  </div>
                </div>

                {/* Technical Details (Collapsible) */}
                {process['env']['NODE_ENV'] === 'development' && this['state']['error'] && (
                  <details className="mt-4">
                    <summary className="text-xs font-medium text-red-700 cursor-pointer hover:text-red-800">
                      Technical Details (Development)
                    </summary>
                    <div className="mt-2 p-3 bg-red-100 rounded-md">
                      <div className="text-xs font-mono text-red-800">
                        <div className="mb-2">
                          <strong>Error Message:</strong>
                          <br />
                          {this.state.error.message}
                        </div>
                        {this.state['error']['stack'] && (
                          <div className="mb-2">
                            <strong>Stack Trace:</strong>
                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-32 mt-1">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                        {this.state.errorInfo?.componentStack && (
                          <div>
                            <strong>Component Stack:</strong>
                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-32 mt-1">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={this.handleRetry}
                    className="bg-red-100 text-red-800 px-3 py-1 text-xs rounded hover:bg-red-200 transition-colors"
                  >
                    Retry Tab
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-100 text-gray-800 px-3 py-1 text-xs rounded hover:bg-gray-200 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
