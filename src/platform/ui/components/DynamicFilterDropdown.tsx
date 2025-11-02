import React, { useState, useRef, useEffect } from 'react';
import { FilterOption } from '@/platform/utils/filter-helpers';

interface DynamicFilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DynamicFilterDropdown({
  label,
  value,
  options,
  onChange,
  className = '',
  placeholder = 'All'
}: DynamicFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef['current'] && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt['value'] === value);
  const displayLabel = value === 'all' ? placeholder : (selectedOption?.label || value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 pr-10 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-gray-400 flex items-center justify-between"
      >
        <span className="truncate">{displayLabel}</span>
        <svg 
          className={`w-4 h-4 text-muted ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="py-1">
            {/* "All" option */}
            <button
              onClick={() => {
                onChange('all');
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-hover transition-colors ${
                value === 'all' ? 'bg-gray-50 text-gray-600 font-medium' : 'text-gray-700'
              }`}
            >
              {placeholder}
            </button>
            
            {/* Dynamic options */}
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-hover transition-colors ${
                  value === option.value ? 'bg-gray-50 text-gray-600 font-medium' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-muted ml-2">({option.count})</span>
                  )}
                </div>
              </button>
            ))}
            
            {options['length'] === 0 && (
              <div className="px-3 py-2 text-sm text-muted italic">
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
