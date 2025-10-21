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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
          <div className={`w-2 h-2 ${colorClasses[color]} rounded-full`}></div>
          {title}
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4" />
            )}
          </button>
          {isEditable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-3 text-sm border border-[var(--border)] rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Enter content..."
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-[var(--muted)] leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
}
