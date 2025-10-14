"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoSave?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'loading';
  onSave?: (value: string) => Promise<void>;
  debounceMs?: number;
  lastSavedAt?: Date | null;
}

export function NotesEditor({
  value,
  onChange,
  placeholder = "Add your notes here...",
  className = "",
  disabled = false,
  autoSave = true,
  saveStatus = 'idle',
  onSave,
  debounceMs = 1500,
  lastSavedAt = null
}: NotesEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSavedValue, setLastSavedValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
      setLastSavedValue(value);
    }
  }, [value]);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [localValue, autoResize]);

  // Immediate save function
  const immediateSave = useCallback(async (valueToSave: string) => {
    if (autoSave && onSave && valueToSave !== lastSavedValue) {
      try {
        await onSave(valueToSave);
        setLastSavedValue(valueToSave);
      } catch (error) {
        console.error('Failed to save notes:', error);
        // Don't update lastSavedValue on error so it can be retried
      }
    }
  }, [autoSave, onSave, lastSavedValue]);

  // Save immediately when component unmounts (e.g., switching tabs)
  useEffect(() => {
    return () => {
      if (localValue !== lastSavedValue) {
        // Use a synchronous approach for cleanup
        immediateSave(localValue);
      }
      // Clear any pending timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [localValue, lastSavedValue, immediateSave]);

  // Debounced save (faster)
  const debouncedSave = useCallback((valueToSave: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (autoSave && onSave && valueToSave !== lastSavedValue) {
      saveTimeoutRef.current = setTimeout(async () => {
        await immediateSave(valueToSave);
      }, Math.min(debounceMs, 500)); // Cap at 500ms for faster response
    }
  }, [autoSave, onSave, lastSavedValue, debounceMs, immediateSave]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    debouncedSave(newValue);
  }, [onChange, debouncedSave]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Save immediately when losing focus
    if (localValue !== lastSavedValue) {
      immediateSave(localValue);
    }
  }, [localValue, lastSavedValue, immediateSave]);

  const getStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <ClockIcon className="w-4 h-4 text-blue-500 animate-spin" />,
          text: 'Saving...',
          color: 'text-blue-500'
        };
      case 'error':
        return {
          icon: <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />,
          text: 'Error saving',
          color: 'text-red-500'
        };
      default:
        // Show "Last saved" message when not actively saving
        if (lastSavedAt) {
          const now = new Date();
          const diffMs = now.getTime() - lastSavedAt.getTime();
          const diffSeconds = Math.floor(diffMs / 1000);
          const diffMinutes = Math.floor(diffSeconds / 60);
          
          let timeText;
          if (diffSeconds < 10) {
            timeText = 'Now';
          } else if (diffSeconds < 60) {
            timeText = `${diffSeconds}s ago`;
          } else if (diffMinutes < 60) {
            timeText = `${diffMinutes}m ago`;
          } else {
            timeText = lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
          
          return {
            icon: <CheckIcon className="w-4 h-4 text-green-500" />,
            text: `Last saved ${timeText}`,
            color: 'text-green-500'
          };
        }
        return {
          icon: null,
          text: '',
          color: 'text-transparent'
        };
    }
  };

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Header with Notes title and status indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif' }}>
          Notes
        </h2>
        <div className="flex items-center gap-2">
          {(() => {
            const status = getStatusDisplay();
            return (
              <>
                {status.icon}
                <span className={`text-sm font-medium ${status.color}`} style={{ fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif' }}>
                  {status.text}
                </span>
              </>
            );
          })()}
        </div>
      </div>

      {/* Notes editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full h-full min-h-[200px] p-4
            bg-transparent
            text-base
            text-[var(--foreground)]
            placeholder-[var(--muted)]
            resize-none
            border-0
            outline-none
            focus:outline-none
            focus:ring-0
            focus:border-0
            transition-all duration-200
            ${isFocused ? 'bg-[var(--background)]' : 'bg-transparent'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
          `}
          style={{
            fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif',
            lineHeight: '1.6'
          }}
        />
        
        {/* Subtle focus indicator */}
        {isFocused && (
          <div className="absolute inset-0 pointer-events-none border border-blue-200/50 rounded-lg transition-opacity duration-200" />
        )}
      </div>

      {/* Character count and word count */}
      {localValue && (
        <div className="flex justify-between items-center mt-2 px-1 text-xs text-[var(--muted)]" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif' }}>
          <span>
            {localValue.split(/\s+/).filter(word => word.length > 0).length} words
          </span>
          <span>
            {localValue.length} characters
          </span>
        </div>
      )}
    </div>
  );
}
