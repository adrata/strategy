"use client";

import React, { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface StrategySummaryCardProps {
  title: string;
  content: string;
  color: 'green' | 'orange' | 'blue';
  isEditable?: boolean;
  onSave?: (content: string) => Promise<void>;
}

export function StrategySummaryCard({ 
  title, 
  content, 
  color, 
  isEditable = false, 
  onSave 
}: StrategySummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const colorClasses = {
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    blue: 'bg-blue-500'
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  };


  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className={`w-2 h-2 ${colorClasses[color]} rounded-full`}></div>
          {title}
        </h4>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1 text-muted hover:text-foreground transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="text-sm text-muted leading-relaxed">
        {content}
      </div>
    </div>
  );
}
