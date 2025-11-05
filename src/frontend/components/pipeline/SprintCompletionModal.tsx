"use client";

import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface SprintCompletionModalProps {
  isOpen: boolean;
  onContinue: () => void;
  currentSprintNumber: number;
  nextSprintNumber: number;
  completedCount: number;
}

export function SprintCompletionModal({
  isOpen,
  onContinue,
  currentSprintNumber,
  nextSprintNumber,
  completedCount
}: SprintCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl p-8 max-w-md w-full mx-4 border border-border">
        {/* Success Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        {/* Content */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-3">
            Sprint {currentSprintNumber} Complete!
          </h3>
          <p className="text-muted mb-4">
            You've completed all {completedCount} prospects in this sprint.
          </p>
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-success">
              Great work! Ready to start Sprint {nextSprintNumber}?
            </p>
          </div>
        </div>
        
        {/* Action */}
        <div className="flex justify-center">
          <button
            onClick={onContinue}
            className="px-6 py-3 text-white bg-black hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Start Sprint {nextSprintNumber}
          </button>
        </div>
      </div>
    </div>
  );
}

