'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface SpeedrunEmptyStateProps {
  type: 'left' | 'right';
  completedCount: number;
}

export function SpeedrunEmptyState({ type, completedCount }: SpeedrunEmptyStateProps) {
  if (type === 'left') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          All Done!
        </h3>
        <p className="text-gray-500 text-sm">
          {completedCount} prospects completed today
        </p>
      </div>
    );
  }

  // Right panel empty state
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <CheckIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Day Complete
      </h3>
      <p className="text-gray-500 text-sm">
        Great work today! You've finished all your prospects.
      </p>
    </div>
  );
}
