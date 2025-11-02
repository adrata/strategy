"use client";

import React, { useState, useRef, useEffect } from "react";
import { XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { US_STATES, USState } from "@/platform/constants/us-states";

interface StateSelectorProps {
  value: USState | null;
  onChange: (state: USState | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function StateSelector({ 
  value, 
  onChange, 
  placeholder = "Search or select state...", 
  className = "",
  disabled = false 
}: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStates, setFilteredStates] = useState<USState[]>(US_STATES);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter states based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStates(US_STATES);
    } else {
      const filtered = US_STATES.filter(state =>
        state.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStates(filtered);
    }
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Get current state name for display
  const getCurrentStateName = (): string => {
    if (!value) return '';
    return value;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchQuery('');
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if clicking on dropdown items
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleStateSelect = (state: USState) => {
    onChange(state);
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setSearchQuery('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredStates.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredStates.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredStates.length) {
          handleStateSelect(filteredStates[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : getCurrentStateName()}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        
        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted hover:text-foreground disabled:opacity-50"
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredStates.length > 0 ? (
            filteredStates.map((state, index) => (
              <button
                key={state}
                type="button"
                onClick={() => handleStateSelect(state)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-hover transition-colors ${
                  index === selectedIndex ? 'bg-hover' : ''
                } ${
                  value === state ? 'font-medium text-blue-600' : 'text-foreground'
                }`}
              >
                {state}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted">
              No states found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
