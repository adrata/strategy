"use client";

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchNumber: number;
  completedCount: number;
  message?: string;
}

export function CongratulationsModal({
  isOpen,
  onClose,
  batchNumber,
  completedCount,
  message
}: CongratulationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">🎉 Congratulations!</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            You've completed {completedCount} records!
          </h3>
          <p className="text-gray-600 mb-4">
            {message || `Amazing work! You've finished your first batch and we're fetching your next 50 records to keep the momentum going.`}
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">Batch {batchNumber} Complete!</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 mb-4">
            Your next batch of 50 records is being prepared with updated rankings...
          </div>
          
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading next batch...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
