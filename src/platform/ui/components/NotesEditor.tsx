"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoSave?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error' | 'loading';
  onSave?: (value: string) => Promise<void>;
  debounceMs?: number;
  lastSavedAt?: Date | null;
  showHeader?: boolean;
}

export function NotesEditor({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = "Add your notes here...",
  className = "",
  disabled = false,
  autoSave = true,
  saveStatus = 'idle',
  onSave,
  debounceMs = 1500,
  lastSavedAt = null,
  showHeader = true
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
  
  // Timing state for save indicator
  const [timeSinceSave, setTimeSinceSave] = useState<number>(0);
  const [saveStartTime, setSaveStartTime] = useState<Date | null>(null);

  // Track if this is the initial mount or if value changed significantly
  const isInitialMountRef = useRef(true);
  const previousValueRef = useRef<string>(value);
  
  // Sync with external value changes - only when not actively editing
  useEffect(() => {
    const isInitialMount = isInitialMountRef.current;
    const valueChanged = previousValueRef.current !== value;
    const isSignificantChange = valueChanged && (
      // Value went from empty to non-empty (likely switching records)
      (previousValueRef.current === '' && value !== '') ||
      // Value went from non-empty to empty (likely switching records)
      (previousValueRef.current !== '' && value === '') ||
      // Value changed significantly (more than just a character or two)
      Math.abs(value.length - previousValueRef.current.length) > 2
    );
    
    // Reset initial mount flag if value changed significantly (likely a new record)
    if (isSignificantChange && !isInitialMount) {
      console.log('🔄 [NotesEditor] Significant value change detected, treating as initial mount');
      isInitialMountRef.current = true;
    }
    
    // On initial mount or significant change, always sync with the value prop (it's the source of truth)
    // After initial mount, only sync if conditions are met to prevent overwriting user edits
    const shouldSync = (isInitialMount || isSignificantChange)
      ? value !== localValue  // Always sync on initial mount/significant change if different
      : (value !== localValue && 
         value !== lastSavedValue &&
         !isFocused && 
         saveStatus !== 'saving' && 
         !isSavingRef.current);
    
    if (shouldSync) {
      console.log('🔄 [NotesEditor] Syncing external value:', { 
        value, 
        localValue, 
        lastSavedValue, 
        isInitialMount: isInitialMount || isSignificantChange,
        length: value?.length || 0,
        previousLength: previousValueRef.current?.length || 0
      });
      setLocalValue(value);
      setLastSavedValue(value);
      pendingValueRef.current = value;
    } else if ((isInitialMount || isSignificantChange) && value === localValue) {
      // Even if values match, update lastSavedValue to match on initial mount
      setLastSavedValue(value);
      pendingValueRef.current = value;
    }
    
    // Update refs
    previousValueRef.current = value;
    
    // Mark initial mount as complete after first sync attempt
    if (isInitialMount || isSignificantChange) {
      isInitialMountRef.current = false;
    }
  }, [value, isFocused, saveStatus, localValue, lastSavedValue]);

  // Update time display every 10 seconds to keep "Last saved X ago" current
  useEffect(() => {
    if (lastSavedAt && (saveStatus === 'saved' || saveStatus === 'idle')) {
      const interval = setInterval(() => {
        forceUpdate({});
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [lastSavedAt, saveStatus]);

  // Track timing for save indicator color transition
  useEffect(() => {
    if (saveStatus === 'saved') {
      setSaveStartTime(new Date());
      setTimeSinceSave(0);
    } else {
      setSaveStartTime(null);
      setTimeSinceSave(0);
    }
  }, [saveStatus]);

  // Update time since save every second when in saved state
  useEffect(() => {
    if (saveStartTime && saveStatus === 'saved') {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - saveStartTime.getTime()) / 1000);
        setTimeSinceSave(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [saveStartTime, saveStatus]);

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
      
      // Save immediately on unmount if there are unsaved changes
      if (localValue !== lastSavedValue && onSave) {
        try {
          // Use synchronous save for unmount
          onSave(localValue).catch(error => {
            console.error('Failed to save notes on unmount:', error);
          });
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
      }, debounceMs);
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
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately when losing focus
    if (localValue !== lastSavedValue) {
      queuedSave(localValue);
    }
  }, [localValue, lastSavedValue, queuedSave, onBlur]);

  const getStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        // Only show status when actively saving
        return {
          icon: <ClockIcon className="w-4 h-4 text-gray-400 animate-spin" />,
          text: 'Saving...',
          color: 'text-gray-400',
          show: true
        };
      case 'error':
        // Always show error status
        return {
          icon: <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />,
          text: 'Error saving',
          color: 'text-red-500',
          show: true
        };
      case 'saved':
      case 'idle':
      default:
        // Hide status in idle/saved states to reduce visual distraction
        return {
          icon: null,
          text: '',
          color: 'text-transparent',
          show: false
        };
    }
  };

  return (
    <div className={`relative h-full flex flex-col ${className}`}>
      {/* Header with Notes title and status indicator */}
      {showHeader && (
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-inter), Inter, system-ui, -apple-system, sans-serif' }}>
            Notes
          </h2>
          <div className="flex items-center gap-2">
            {(() => {
              const status = getStatusDisplay();
              // Only render status when it should be shown (saving or error)
              if (!status.show) {
                return null;
              }
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
      )}

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
            w-full h-full min-h-[400px] p-4
            bg-transparent
            text-base
            text-foreground
            placeholder-[var(--muted)]
            resize-none
            border-0
            outline-none
            focus:outline-none
            focus:ring-0
            focus:border-0
            transition-all duration-200
            ${isFocused ? 'bg-background' : 'bg-transparent'}
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
