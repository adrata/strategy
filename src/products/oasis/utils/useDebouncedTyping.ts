/**
 * Debounced Typing Hook
 * 
 * Optimizes typing indicators with debouncing and throttling
 * Based on industry best practices: 300ms debounce, 1-2s throttle
 */

import { useCallback, useRef, useEffect } from 'react';

interface UseDebouncedTypingOptions {
  onStartTyping: () => void;
  onStopTyping: () => void;
  debounceMs?: number; // Delay before sending "start typing" (default: 300ms)
  throttleMs?: number; // Minimum time between "start typing" events (default: 2000ms)
  autoStopMs?: number; // Auto-stop after inactivity (default: 3000ms)
}

/**
 * Hook for optimized typing indicator management
 * 
 * Features:
 * - Debounces typing start (300ms delay)
 * - Throttles typing events (max 1 per 2 seconds)
 * - Auto-stops after 3 seconds of inactivity
 * - Prevents duplicate API calls
 */
export function useDebouncedTyping({
  onStartTyping,
  onStopTyping,
  debounceMs = 300,
  throttleMs = 2000,
  autoStopMs = 3000
}: UseDebouncedTypingOptions) {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingEventRef = useRef<number>(0);
  const isThrottledRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      
      // Stop typing on unmount
      if (isTypingRef.current) {
        onStopTyping();
      }
    };
  }, [onStopTyping]);

  /**
   * Handle typing start with debouncing and throttling
   */
  const handleTyping = useCallback(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear auto-stop timer (user is still typing)
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }

    // If already typing and within throttle window, skip
    const now = Date.now();
    if (isTypingRef.current && isThrottledRef.current) {
      const timeSinceLastEvent = now - lastTypingEventRef.current;
      if (timeSinceLastEvent < throttleMs) {
        // Reset auto-stop timer but don't send new typing event
        autoStopTimerRef.current = setTimeout(() => {
          if (isTypingRef.current) {
            isTypingRef.current = false;
            isThrottledRef.current = false;
            onStopTyping();
          }
        }, autoStopMs);
        return;
      }
    }

    // Debounce: Wait before sending typing event
    debounceTimerRef.current = setTimeout(() => {
      // Check if still within throttle window
      const timeSinceLastEvent = Date.now() - lastTypingEventRef.current;
      
      if (!isTypingRef.current || timeSinceLastEvent >= throttleMs) {
        // Send typing event
        if (!isTypingRef.current) {
          isTypingRef.current = true;
          onStartTyping();
        }
        
        lastTypingEventRef.current = Date.now();
        isThrottledRef.current = true;
        
        // Reset throttle after throttleMs
        throttleTimerRef.current = setTimeout(() => {
          isThrottledRef.current = false;
        }, throttleMs);

        // Set auto-stop timer
        autoStopTimerRef.current = setTimeout(() => {
          if (isTypingRef.current) {
            isTypingRef.current = false;
            isThrottledRef.current = false;
            onStopTyping();
          }
        }, autoStopMs);
      }
    }, debounceMs);
  }, [onStartTyping, onStopTyping, debounceMs, throttleMs, autoStopMs]);

  /**
   * Handle typing stop
   */
  const handleStopTyping = useCallback(() => {
    // Clear all timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    // Stop typing if currently typing
    if (isTypingRef.current) {
      isTypingRef.current = false;
      isThrottledRef.current = false;
      onStopTyping();
    }
  }, [onStopTyping]);

  /**
   * Reset typing state (e.g., when switching conversations)
   */
  const resetTyping = useCallback(() => {
    handleStopTyping();
    isTypingRef.current = false;
    isThrottledRef.current = false;
    lastTypingEventRef.current = 0;
  }, [handleStopTyping]);

  return {
    handleTyping,
    handleStopTyping,
    resetTyping,
    isTyping: isTypingRef.current
  };
}

