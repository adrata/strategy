import React, { useState } from 'react';
import { ClipboardDocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CommentaryPanelProps {
  isCommentaryMode: boolean;
  commentaryLog: string[];
  isExecuting: boolean;
}

export const CommentaryPanel: React.FC<CommentaryPanelProps> = ({
  isCommentaryMode,
  commentaryLog,
  isExecuting
}) => {
  const [errorLog, setErrorLog] = useState<string>('');
  const [showErrorBox, setShowErrorBox] = useState(false);

  if (!isCommentaryMode) return null;

  const handleCopyError = () => {
    navigator.clipboard.writeText(errorLog);
  };

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Adrata Execution Commentary</h2>
              <p className="text-sm text-gray-600">Real-time workflow execution details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExecuting && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Executing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Commentary Log */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {commentaryLog.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>Waiting for execution to begin...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commentaryLog.map((entry, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500 animate-fade-in"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed">{entry}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Log Box */}
      {showErrorBox && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-red-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-800">Error Log</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyError}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-700 hover:text-red-800 hover:bg-red-200 rounded transition-colors"
                  >
                    <ClipboardDocumentIcon className="w-3 h-3" />
                    Copy
                  </button>
                  <button
                    onClick={() => setShowErrorBox(false)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap overflow-x-auto">
                {errorLog || 'No errors logged'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
