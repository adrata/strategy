"use client";

import React from 'react';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface AIAction {
  id: string;
  action: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'in_progress';
  details: string;
}

interface AIActionsViewProps {
  actions: AIAction[];
  onBack: () => void;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function AIActionsView({ actions, onBack }: AIActionsViewProps) {
  return (
    <div className="flex-1 flex flex-col px-6 py-4">
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 text-[var(--muted)] cursor-pointer hover:text-[var(--foreground)] transition-colors flex items-center justify-center"
          title="Back to Chat"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Logs</h2>
      </div>
      
      <div className="space-y-4 overflow-y-auto">
        {actions.map((action) => (
          <div key={action.id} className="bg-[var(--hover-bg)] rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-[var(--foreground)]">{action.action}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                action['status'] === 'completed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : action['status'] === 'in_progress'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-[var(--hover)] text-gray-800 dark:bg-[var(--foreground)] dark:text-gray-200'
              }`}>
                {action.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] mb-2">{action.details}</p>
            <div className="text-xs text-[var(--muted)]">
              {formatTimeAgo(action.timestamp)}
            </div>
          </div>
        ))}
        
        {actions['length'] === 0 && (
          <div className="text-center py-8 text-[var(--muted)]">
            <p>No AI actions yet.</p>
            <p className="text-sm mt-2">Actions will appear here as the AI helps you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
