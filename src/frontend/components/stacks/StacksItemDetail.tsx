"use client";

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface StacksItem {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'idea';
  priority: 'low' | 'medium' | 'high';
  type: 'epic' | 'story' | 'bug' | 'future';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

interface StacksItemDetailProps {
  item: StacksItem;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo': return 'bg-hover text-gray-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'done': return 'bg-green-100 text-green-800';
    case 'idea': return 'bg-purple-100 text-purple-800';
    default: return 'bg-hover text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'high': return 'text-red-600 bg-red-50';
    default: return 'text-muted bg-hover';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'epic': return '📦';
    case 'story': return '📄';
    case 'bug': return '🐛';
    case 'future': return '💡';
    default: return '📋';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'epic': return 'Epic';
    case 'story': return 'User Story';
    case 'bug': return 'Bug Report';
    case 'future': return 'Future Idea';
    default: return 'Item';
  }
};

export function StacksItemDetail({ item, onClose }: StacksItemDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon(item.type)}</span>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {item.title}
              </h1>
              <p className="text-sm text-muted">
                {getTypeLabel(item.type)} • ID: {item.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-hover rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Status and Priority */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted">Status:</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
                {item.status.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted">Priority:</span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                {item.priority}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
            <div className="bg-[var(--card)] border border-border rounded-lg p-4">
              <p className="text-foreground whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assignee */}
            {item.assignee && (
              <div>
                <h4 className="text-sm font-medium text-muted mb-2">Assignee</h4>
                <div className="bg-[var(--card)] border border-border rounded-lg p-3">
                  <p className="text-foreground">{item.assignee}</p>
                </div>
              </div>
            )}

            {/* Type */}
            <div>
              <h4 className="text-sm font-medium text-muted mb-2">Type</h4>
              <div className="bg-[var(--card)] border border-border rounded-lg p-3">
                <p className="text-foreground flex items-center gap-2">
                  <span>{getTypeIcon(item.type)}</span>
                  {getTypeLabel(item.type)}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div>
              <h4 className="text-sm font-medium text-muted mb-2">Created</h4>
              <div className="bg-[var(--card)] border border-border rounded-lg p-3">
                <p className="text-foreground">{item.createdAt}</p>
              </div>
            </div>

            {/* Updated Date */}
            <div>
              <h4 className="text-sm font-medium text-muted mb-2">Last Updated</h4>
              <div className="bg-[var(--card)] border border-border rounded-lg p-3">
                <p className="text-foreground">{item.updatedAt}</p>
              </div>
            </div>
          </div>

          {/* ID Section */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-muted mb-2">Item ID</h4>
            <div className="bg-[var(--card)] border border-border rounded-lg p-3">
              <code className="text-sm font-mono text-foreground break-all">
                {item.id}
              </code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-hover">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted hover:text-foreground transition-colors"
          >
            Close
          </button>
          <button
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
          >
            Edit Item
          </button>
        </div>
      </div>
    </div>
  );
}
