"use client";

import React, { useState, useEffect } from 'react';
import { PlusIcon, ChevronDownIcon, BoltIcon } from '@heroicons/react/24/outline';
import { getCommonShortcut } from '@/platform/utils/keyboard-shortcuts';
import { getCategoryColors } from '@/platform/config/color-palette';

interface UnifiedAddActionButtonProps {
  onAddAction: () => void;
  onAddNote?: () => void;
  variant?: 'dropdown' | 'simple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'red' | 'blue' | 'navy';
  section?: string; // New prop to determine category colors
}

export function UnifiedAddActionButton({ 
  onAddAction, 
  onAddNote, 
  variant = 'simple',
  size = 'md',
  className = '',
  color = 'navy',
  section
}: UnifiedAddActionButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Keyboard shortcut for Add Action (⌘⏎)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field or textarea
      const target = event.target as HTMLElement;
      const isInputField =
        target['tagName'] === "INPUT" ||
        target['tagName'] === "TEXTAREA" ||
        target['contentEditable'] === "true";

      // Check if any modal or popup is open that should take precedence
      const hasOpenModal = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.fixed.inset-0') ||
                          document.querySelector('[data-slide-up]') ||
                          document.querySelector('.slide-up-visible') ||
                          document.querySelector('.z-50');

      // Check for Cmd+Enter (⌘⏎) on Mac or Ctrl+Enter on Windows/Linux
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isInputField && !hasOpenModal) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('⌨️ [UnifiedAddActionButton] Add Action keyboard shortcut triggered');
        onAddAction();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, false);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [onAddAction]);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Use category colors if section is provided, otherwise fall back to legacy color prop
  const getButtonStyles = () => {
    if (section) {
      const categoryColors = getCategoryColors(section);
      return {
        backgroundColor: categoryColors.bg,
        color: categoryColors.primary,
        border: `1px solid ${categoryColors.border}`,
        hoverBackgroundColor: categoryColors.bgHover
      };
    }
    
    // Legacy color support
    return color === 'blue' 
      ? { backgroundColor: '#2563EB', color: 'white', border: '1px solid #2563EB', hoverBackgroundColor: '#1D4ED8' }
      : color === 'navy'
      ? { backgroundColor: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', hoverBackgroundColor: '#F1F5F9' }
      : { backgroundColor: '#DC2626', color: 'white', border: '1px solid #DC2626', hoverBackgroundColor: '#B91C1C' };
  };

  const buttonStyles = getButtonStyles();
  const baseClasses = `rounded-lg font-medium transition-colors flex items-center gap-2 ${sizeClasses[size]} ${className}`;

  if (variant === 'dropdown' && onAddNote) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className={baseClasses}
          style={buttonStyles}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonStyles.hoverBackgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor;
          }}
        >
          <PlusIcon className="w-4 h-4" />
          Add Action ({getCommonShortcut('SUBMIT')})
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
      style={buttonStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = buttonStyles.hoverBackgroundColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = buttonStyles.backgroundColor;
      }}
    >
      <PlusIcon className="w-4 h-4" />
      Add Action ({getCommonShortcut('SUBMIT')})
    </button>
  );
}
