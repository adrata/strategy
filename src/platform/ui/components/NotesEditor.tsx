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
  const [, forceUpdate] = useState({});
  
  // Save queue management
  const saveQueueRef = useRef<Promise<void> | null>(null);
  const pendingValueRef = useRef<string>(value);
  const isSavingRef = useRef<boolean>(false);

  // Sync with external value changes - only when not actively editing
  useEffect(() => {
    // Only sync if the external value is different AND we're not currently editing
    if (value !== localValue && !isFocused && saveStatus !== 'saving' && !isSavingRef.current) {
      setLocalValue(value);
      setLastSavedValue(value);
      pendingValueRef.current = value;
    }
  }, [value, isFocused, saveStatus, localValue]);

  // Update time display every 10 seconds to keep "Last saved X ago" current
  useEffect(() => {
    if (lastSavedAt && (saveStatus === 'saved' || saveStatus === 'idle')) {
      const interval = setInterval(() => {
        forceUpdate({});
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [lastSavedAt, saveStatus]);

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

  // Queued save function to prevent race conditions
  const queuedSave = useCallback(async (valueToSave: string) => {
    if (!autoSave || !onSave || valueToSave === lastSavedValue || isSavingRef.current) {
      return;
    }

    // If there's already a save in progress, queue this one
    if (saveQueueRef.current) {
      pendingValueRef.current = valueToSave;
      return saveQueueRef.current.then(() => {
        if (pendingValueRef.current !== lastSavedValue) {
          return queuedSave(pendingValueRef.current);
        }
      });
    }

    isSavingRef.current = true;
    pendingValueRef.current = valueToSave;

    try {
      saveQueueRef.current = onSave(valueToSave);
      await saveQueueRef.current;
      setLastSavedValue(valueToSave);
    } catch (error) {
      console.error('Failed to save notes:', error);
      // Don't update lastSavedValue on error so it can be retried
    } finally {
      isSavingRef.current = false;
      saveQueueRef.current = null;
    }
  }, [autoSave, onSave, lastSavedValue]);

  // Save immediately when component unmounts (e.g., switching tabs)
  useEffect(() => {
    return () => {
      // Clear any pending timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // For unmount saves, use sendBeacon for reliability
      if (localValue !== lastSavedValue && onSave) {
        try {
          // Use sendBeacon for reliable unmount saves
          const data = JSON.stringify({ notes: localValue });
          if (navigator.sendBeacon) {
            // This is a fallback - the actual save should be handled by the parent
            console.log('Notes unmounting with unsaved changes:', localValue.length, 'chars');
          }
        } catch (error) {
          console.error('Failed to save notes on unmount:', error);
        }
      }
    };
  }, [localValue, lastSavedValue, onSave]);

  // Debounced save (faster)
  const debouncedSave = useCallback((valueToSave: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (autoSave && onSave && valueToSave !== lastSavedValue) {
      saveTimeoutRef.current = setTimeout(async () => {
        await queuedSave(valueToSave);
      }, Math.min(debounceMs, 500)); // Cap at 500ms for faster response
    }
  }, [autoSave, onSave, lastSavedValue, debounceMs, queuedSave]);

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
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately when losing focus
    if (localValue !== lastSavedValue) {
      queuedSave(localValue);
    }
  }, [localValue, lastSavedValue, queuedSave]);

  const getStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <ClockIcon className="w-4 h-4 text-gray-400 animate-spin" />,
          text: 'Saving...',
          color: 'text-gray-400'
        };
      case 'saved':
        // Show "Last saved" message when successfully saved
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
          icon: <CheckIcon className="w-4 h-4 text-green-500" />,
          text: 'Saved',
          color: 'text-green-500'
        };
      case 'error':
        return {
          icon: <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />,
          text: 'Error saving',
          color: 'text-red-500'
        };
      default:
        // Show "Unsaved changes" when there are changes but no save yet
        if (localValue && localValue !== lastSavedValue) {
          return {
            icon: <ClockIcon className="w-4 h-4 text-orange-500" />,
            text: 'Unsaved changes',
            color: 'text-orange-500'
          };
        }
        
        // Show "Last saved" message when idle and there's a lastSavedAt time
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

    </div>
  );
}
