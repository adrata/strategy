"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import * as Popover from '@radix-ui/react-popover';
import { Calendar } from './calendar';
import { 
  formatDateInput, 
  parseDateInput, 
  validateDateFormat, 
  getDateFormatPlaceholder,
  formatDateForInput,
  isValidPartialDate,
  isValidDate,
  formatDateForDisplay
} from '@/platform/utils/dateInput';

export interface DatePickerProps {
  value?: string | Date;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  inModal?: boolean; // New prop to adjust positioning for modal context
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  minDate,
  maxDate,
  disabled = false,
  inModal = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isValidInput, setIsValidInput] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert value to Date object
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const date = typeof value === 'string' ? new Date(value) : value;
    return isValidDate(date) ? date : undefined;
  }, [value]);

  // Sync input value with selected date
  useEffect(() => {
    if (selectedDate && !isTyping) {
      setInputValue(formatDateForInput(selectedDate));
      setIsValidInput(true);
    } else if (!selectedDate && !isTyping) {
      setInputValue('');
      setIsValidInput(true);
    }
  }, [selectedDate, isTyping]);

  // Focus input when component mounts or when opened
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle input change with auto-formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatDateInput(inputValue);
    setInputValue(formattedValue);
    setIsTyping(true);
    
    // Validate the input
    const isValid = isValidPartialDate(formattedValue);
    setIsValidInput(isValid);
  };

  // Handle input blur - validate and update
  const handleInputBlur = () => {
    setIsTyping(false);
    if (inputValue && validateDateFormat(inputValue)) {
      const parsedDate = parseDateInput(inputValue);
      if (parsedDate) {
        onChange(parsedDate);
      }
    } else if (!inputValue) {
      onChange(null);
    }
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(selectedDate ? formatDateForInput(selectedDate) : '');
      setIsValidInput(true);
      setIsTyping(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setInputValue(formatDateForInput(date));
      setIsValidInput(true);
      setIsTyping(false);
    }
    setIsOpen(false);
  };

  // Handle clear button
  const handleClear = () => {
    onChange(null);
    setInputValue('');
    setIsValidInput(true);
    setIsTyping(false);
  };

  return (
    <div className={`relative ${className}`}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full px-3 py-2 pr-20 text-sm border rounded-md
              bg-background text-foreground
              placeholder:text-muted placeholder:italic
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
              ${!isValidInput && inputValue ? 'border-red-500' : 'border-border'}
            `}
          />
          
          {/* Calendar icon button */}
          <Popover.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground disabled:opacity-50"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
          </Popover.Trigger>

          {/* Clear button */}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <Popover.Portal>
          <Popover.Content
            className={`w-auto p-0 bg-background border border-border rounded-md shadow-lg ${
              inModal ? 'z-[60]' : 'z-50'
            }`}
            sideOffset={inModal ? 8 : 4}
            align={inModal ? "center" : "start"}
            side="bottom"
            avoidCollisions={true}
            collisionPadding={inModal ? 16 : 8}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              disabled={(date) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              initialFocus
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {/* Validation error message */}
      {!isValidInput && inputValue && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-500">
          Invalid date format. Use {getDateFormatPlaceholder()}
        </div>
      )}

      {/* Helper text when empty */}
      {!inputValue && (
        <div className="absolute top-full left-0 mt-1 text-xs text-muted">
          Type date or click calendar icon
        </div>
      )}
    </div>
  );
}
