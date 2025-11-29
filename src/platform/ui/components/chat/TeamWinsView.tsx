"use client";

import React from 'react';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface TeamWin {
  id: string;
  achievement: string;
  timestamp: Date;
  value?: string;
}

interface TeamWinsViewProps {
  wins: TeamWin[];
  onBack: () => void;
}

function formatTimeAgo(date: Date | string | undefined | null): string {
  // Safely convert to Date if needed
  const dateObj = date instanceof Date ? date : date ? new Date(date) : null;
  
  // Check if date is valid
  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'Unknown';
  }
  
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function TeamWinsView({ wins, onBack }: TeamWinsViewProps) {
  return (
    <div className="flex-1 flex flex-col px-6 py-4">
      <div className="flex items-center space-x-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 text-muted cursor-pointer hover:text-foreground transition-colors flex items-center justify-center"
          title="Back to Chat"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">Wins</h2>
      </div>
      
      <div className="space-y-4 overflow-y-auto">
        {wins.map((win) => (
          <div key={win.id} className="bg-hover rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-foreground">{win.achievement}</h3>
              {win['value'] && (
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {win.value}
                </div>
              )}
            </div>
            <div className="text-xs text-muted">
              {formatTimeAgo(win.timestamp)}
            </div>
          </div>
        ))}
        
        {wins['length'] === 0 && (
          <div className="text-center py-8 text-muted">
            <p>No team wins yet.</p>
            <p className="text-sm mt-2">Achievements will appear here as your team succeeds.</p>
          </div>
        )}
      </div>
    </div>
  );
}
