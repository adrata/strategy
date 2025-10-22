"use client";

import React from 'react';

interface PipelineStepProps {
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  estimatedTime?: string;
  estimatedCost?: string;
  inputPreview?: string;
  outputPreview?: string;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const PipelineStep: React.FC<PipelineStepProps> = ({
  stepNumber,
  title,
  description,
  status,
  estimatedTime,
  estimatedCost,
  inputPreview,
  outputPreview,
  isExpandable = false,
  isExpanded = false,
  onToggleExpand
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '⟳';
      case 'error': return '✗';
      default: return '○';
    }
  };

  return (
    <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 shadow-sm">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getStatusColor(status)}`}>
            {stepNumber}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
            <p className="text-sm text-[var(--muted)]">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
          </div>
          {isExpandable && (
            <button
              onClick={onToggleExpand}
              className="p-1 hover:bg-[var(--hover)] rounded transition-colors"
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Step Metrics */}
      <div className="flex items-center gap-4 text-xs text-[var(--muted)] mb-3">
        {estimatedTime && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{estimatedTime}</span>
          </div>
        )}
        {estimatedCost && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span>{estimatedCost}</span>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {isExpandable && isExpanded && (
        <div className="border-t border-[var(--border)] pt-3 space-y-3">
          {inputPreview && (
            <div>
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">Input</h4>
              <div className="text-xs text-[var(--muted)] bg-[var(--hover)] p-2 rounded">
                {inputPreview}
              </div>
            </div>
          )}
          
          {outputPreview && (
            <div>
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-1">Output</h4>
              <div className="text-xs text-[var(--muted)] bg-[var(--hover)] p-2 rounded">
                {outputPreview}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
