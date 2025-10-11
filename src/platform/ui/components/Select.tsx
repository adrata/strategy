"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  disabled = false
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation with numbers (like Speedrun sprint)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle number keys (1-9) for quick selection
      const isNumberKey = (event.key >= '1' && event.key <= '9') ||
                         (event.code >= 'Numpad1' && event.code <= 'Numpad9');
      
      if (isNumberKey) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Extract number from key or code
        let pressedNumber: number;
        if (event.key >= '1' && event.key <= '9') {
          pressedNumber = parseInt(event.key);
        } else if (event.code.includes('Digit')) {
          pressedNumber = parseInt(event.code.replace('Digit', ''));
        } else if (event.code.includes('Numpad')) {
          pressedNumber = parseInt(event.code.replace('Numpad', ''));
        } else {
          return;
        }
        
        // Check if the pressed number is within our options range
        if (pressedNumber <= options.length) {
          const currentIndex = options.findIndex(option => option.value === value);
          
          // If pressing the same number as current selection, cycle to next option
          if (currentIndex === pressedNumber - 1) {
            const nextIndex = (currentIndex + 1) % options.length;
            onChange(options[nextIndex].value);
          } else {
            // Otherwise, select the pressed number
            onChange(options[pressedNumber - 1].value);
          }
        }
        return;
      }

      // Handle Escape to close
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
    };

    // Use both capture and bubble phases to ensure we get the event
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keydown', handleKeyDown, false);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [isOpen, options, value, onChange]);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border border-[var(--border)] rounded-lg 
          bg-[var(--background)] text-[var(--foreground)] placeholder-gray-500 text-sm shadow-sm
          hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span className={selectedOption ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}>
          {selectedOption ? `${options.findIndex(opt => opt.value === selectedOption.value) + 1}. ${selectedOption.label}` : placeholder}
        </span>
        <ChevronDownIcon 
          className={`
            absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              className={`
                w-full px-4 py-2 text-left text-sm hover:bg-[var(--panel-background)] focus:bg-[var(--panel-background)] focus:outline-none
                transition-colors duration-150
                ${option.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-[var(--foreground)]'}
              `}
            >
              <span className="inline-block w-6 text-[var(--muted)] font-mono text-xs">
                {index + 1}.
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
