/**
 * 📊 PDF DOWNLOAD NOTIFICATION COMPONENT
 * 
 * Provides user feedback during PDF generation and download
 */

import React from 'react';

interface PDFDownloadNotificationProps {
  isVisible: boolean;
  status: 'loading' | 'success' | 'error';
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function PDFDownloadNotification({ 
  isVisible, 
  status, 
  message, 
  onClose, 
  onRetry 
}: PDFDownloadNotificationProps) {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        );
      case 'success':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-border bg-panel-background';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-800';
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className={`border rounded-lg shadow-lg p-4 ${getStatusColor()}`}>
        <div className="flex items-start space-x-3">
          {getStatusIcon()}
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getStatusTextColor()}`}>
              {status === 'loading' && 'Generating PDF...'}
              {status === 'success' && 'PDF Ready!'}
              {status === 'error' && 'PDF Generation Failed'}
            </p>
            <p className="text-sm text-muted mt-1">
              {message}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="text-muted hover:text-muted transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {status === 'error' && onRetry && (
          <div className="mt-3 flex space-x-2">
            <button
              onClick={onRetry}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {status === 'success' && (
          <div className="mt-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
