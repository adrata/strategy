'use client';

import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface SpeedrunCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMore: () => void;
  completedCount: number;
}

export function SpeedrunCompletionModal({ 
  isOpen, 
  onClose, 
  onAddMore, 
  completedCount 
}: SpeedrunCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        {/* Success Icon */}
        <div className="flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-12 h-12 text-green-500" />
        </div>
        
        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Great Work!
          </h3>
          <p className="text-gray-600">
            You've completed {completedCount} prospects today.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Done for Today
          </button>
          <button
            onClick={onAddMore}
            className="flex-1 px-4 py-2 text-white bg-black hover:bg-gray-800 rounded-lg transition-colors"
          >
            Add 20 More
          </button>
        </div>
      </div>
    </div>
  );
}
