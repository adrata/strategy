"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

export interface DateOption {
  id: string;
  label: string;
  duration?: number; // milliseconds
  type: 'preset' | 'custom';
}

export interface DatePickerProps {
  value?: string | Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  showTime?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

// Quick date options similar to the snooze modal
const QUICK_DATE_OPTIONS: DateOption[] = [
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    duration: 24 * 60 * 60 * 1000, // 1 day
    type: 'preset'
  },
  {
    id: 'next-week',
    label: 'Next Week',
    duration: 7 * 24 * 60 * 60 * 1000, // 1 week
    type: 'preset'
  },
  {
    id: 'two-weeks',
    label: 'Two Weeks',
    duration: 14 * 24 * 60 * 60 * 1000, // 2 weeks
    type: 'preset'
  },
  {
    id: 'next-month',
    label: 'Next Month',
    duration: 30 * 24 * 60 * 60 * 1000, // ~1 month
    type: 'preset'
  },
  {
    id: 'custom',
    label: 'Custom Date',
    type: 'custom'
  }
];

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  showTime = false,
  minDate,
  maxDate,
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<DateOption | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [isClient, setIsClient] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, positionAbove: false });
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Client-side rendering check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate dropdown position
  const calculatePosition = () => {
    if (!triggerRef.current || !isClient) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Estimate dropdown height (will be measured after render)
    const estimatedDropdownHeight = 300; // Conservative estimate
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    
    // Determine if we should position above or below
    const positionAbove = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;
    
    // Calculate vertical position
    const top = positionAbove 
      ? triggerRect.top - estimatedDropdownHeight - 4
      : triggerRect.bottom + 4;
    
    // Calculate horizontal position (center align, but keep within viewport)
    let left = triggerRect.left;
    const dropdownWidth = 280; // Estimated width
    if (left + dropdownWidth > viewportWidth) {
      left = viewportWidth - dropdownWidth - 16; // 16px margin from edge
    }
    if (left < 16) {
      left = 16; // 16px margin from edge
    }
    
    setDropdownPosition({ top, left, positionAbove });
  };

  // Recalculate position when dropdown opens
  useEffect(() => {
    if (isOpen && isClient) {
      calculatePosition();
    }
  }, [isOpen, isClient]);

  // Format the display value
  const formatDisplayValue = (date: string | Date | undefined): string => {
    if (!date) return placeholder;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return placeholder;
    
    if (showTime) {
      return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    return dateObj.toLocaleDateString();
  };

  // Handle quick option selection
  const handleQuickOption = (option: DateOption) => {
    if (option['type'] === 'custom') {
      setSelectedOption(option);
      return;
    }

    if (option.duration) {
      const futureDate = new Date(Date.now() + option.duration);
      onChange(futureDate);
      setIsOpen(false);
      setSelectedOption(null);
    }
  };

  // Handle custom date selection
  const handleCustomDate = () => {
    if (!customDate) return;
    
    const dateTime = showTime 
      ? new Date(`${customDate}T${customTime}`)
      : new Date(customDate);
    
    onChange(dateTime);
    setIsOpen(false);
    setSelectedOption(null);
  };

  // Handle direct date input
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : null;
    onChange(newDate);
  };

  const displayValue = formatDisplayValue(value);

  return (
    <div className={`relative ${className}`}>
      {/* Clickable date display */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border border-[var(--border)] rounded-md 
          bg-[var(--background)] text-[var(--foreground)] placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          hover:border-gray-400 transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}>
            {displayValue}
          </span>
          <CalendarIcon className="w-4 h-4 text-[var(--muted)]" />
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && isClient && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] w-72 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg max-h-80 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          {/* Quick options */}
          <div className="p-2">
            <div className="text-xs font-medium text-[var(--muted)] mb-2 px-2">Quick Options</div>
            {QUICK_DATE_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleQuickOption(option)}
                className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-[var(--hover)] rounded"
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom date picker */}
          {selectedOption?.type === 'custom' && (
            <div className="border-t border-[var(--border)] p-3">
              <div className="text-xs font-medium text-[var(--muted)] mb-2">Custom Date</div>
              <div className="space-y-2">
                <div>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={minDate?.toISOString().split('T')[0]}
                    max={maxDate?.toISOString().split('T')[0]}
                    className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {showTime && (
                  <div>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleCustomDate}
                    disabled={!customDate}
                    className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Date
                  </button>
                  <button
                    onClick={() => setSelectedOption(null)}
                    className="flex-1 px-3 py-1 text-xs border border-[var(--border)] text-gray-700 rounded hover:bg-[var(--panel-background)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Direct date input */}
          <div className="border-t border-[var(--border)] p-3">
            <div className="text-xs font-medium text-[var(--muted)] mb-2">Or pick a date</div>
            <input
              type={showTime ? 'datetime-local' : 'date'}
              value={value ? (typeof value === 'string' ? value : value.toISOString().split('T')[0]) : ''}
              onChange={handleDateChange}
              min={minDate?.toISOString().split('T')[0]}
              max={maxDate?.toISOString().split('T')[0]}
              className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && isClient && createPortal(
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />,
        document.body
      )}
    </div>
  );
}
