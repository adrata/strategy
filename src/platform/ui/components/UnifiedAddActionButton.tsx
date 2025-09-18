"use client";

import React, { useState } from 'react';
import { PlusIcon, ChevronDownIcon, BoltIcon } from '@heroicons/react/24/outline';

interface UnifiedAddActionButtonProps {
  onAddAction: () => void;
  onAddNote?: () => void;
  variant?: 'dropdown' | 'simple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'red' | 'blue' | 'navy';
}

export function UnifiedAddActionButton({ 
  onAddAction, 
  onAddNote, 
  variant = 'simple',
  size = 'md',
  className = '',
  color = 'navy'
}: UnifiedAddActionButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const colorClasses = color === 'blue' 
    ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700'
    : color === 'navy'
    ? 'bg-navy-50 text-navy-900 border border-navy-200 hover:bg-navy-100'
    : 'bg-red-600 text-white border border-red-600 hover:bg-red-700';
  
  const baseClasses = `${colorClasses} rounded-lg font-medium transition-colors flex items-center gap-2 ${sizeClasses[size]} ${className}`;

  if (variant === 'dropdown' && onAddNote) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className={baseClasses}
        >
          <PlusIcon className="w-4 h-4" />
          Add Action
          <ChevronDownIcon className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => {
                onAddAction();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-3"
            >
              <BoltIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">Add Action</div>
                <div className="text-sm text-gray-500">Record activity with contact</div>
              </div>
            </button>
            
            <button
              onClick={() => {
                onAddNote();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
            >
              <PlusIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">Add Note</div>
                <div className="text-sm text-gray-500">Quick note for any contact</div>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Simple button variant
  return (
    <button
      onClick={onAddAction}
      className={baseClasses}
    >
      <PlusIcon className="w-4 h-4" />
      Add Action
    </button>
  );
}
