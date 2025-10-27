/**
 * 🎯 KEYBOARD SHORTCUT UTILITIES
 * 
 * Centralized utilities for consistent keyboard shortcut display
 * across the entire Adrata platform
 */

/**
 * Platform detection utility
 */
export function detectPlatform(): 'mac' | 'pc' {
  if (typeof navigator === 'undefined') return 'pc'; // Fallback for SSR
  
  const platform = navigator.platform?.toUpperCase() || '';
  const userAgent = navigator.userAgent?.toUpperCase() || '';
  
  const isMac = platform.includes('MAC') || 
                userAgent.includes('MACINTOSH') || 
                userAgent.includes('MAC OS');
  
  return isMac ? 'mac' : 'pc';
}

/**
 * Get platform-appropriate shortcut text
 * @param shortcuts Array of shortcuts in format ["⌘+K", "Ctrl+K"]
 * @returns The appropriate shortcut for the current platform
 */
export function getPlatformShortcut(shortcuts: string[]): string {
  const platform = detectPlatform();
  
  if (platform === 'mac') {
    // Find Mac shortcut (starts with ⌘)
    const macShortcut = shortcuts.find(s => s.startsWith('⌘'));
    return macShortcut || shortcuts[0] || '';
  } else {
    // Find PC shortcut (starts with Ctrl)
    const pcShortcut = shortcuts.find(s => s.startsWith('Ctrl'));
    return pcShortcut || shortcuts[0] || '';
  }
}

/**
 * Common shortcut patterns used across the platform
 */
export const COMMON_SHORTCUTS = {
  // Submit/Action shortcuts
  SUBMIT: ['⌘⏎', 'Ctrl+⏎'],
  SUBMIT_ALT: ['⌘+Enter', 'Ctrl+Enter'],
  
  // Undo shortcuts
  UNDO: ['⌘Z', 'Ctrl+Z'],
  
  // Navigation shortcuts
  COMMAND_PALETTE: ['⌘+K', 'Ctrl+K'],
  QUICK_SEARCH: ['⌘+/', 'Ctrl+/'],
  AI_ASSISTANT: ['⌘+J', 'Ctrl+J'],
  
  // Panel shortcuts
  TOGGLE_LEFT_PANEL: ['⌘+B', 'Ctrl+B'],
  TOGGLE_RIGHT_PANEL: ['⌘+Shift+B', 'Ctrl+Shift+B'],
  
  // App navigation
  GO_AOS: ['⌘+1', 'Ctrl+1'],
  GO_MONACO: ['⌘+2', 'Ctrl+2'],
  GO_OASIS: ['⌘+3', 'Ctrl+3'],
  GO_SPEEDRUN: ['⌘+4', 'Ctrl+4'],
  GO_BRIEFCASE: ['⌘+5', 'Ctrl+5'],
  
  // File operations
  NEW: ['⌘+N', 'Ctrl+N'],
  SAVE: ['⌘+S', 'Ctrl+S'],
  OPEN: ['⌘+O', 'Ctrl+O'],
  IMPORT: ['⌘+I', 'Ctrl+I'],
  EXPORT: ['⌘+E', 'Ctrl+E'],
  
  // Help
  HELP: ['⌘+/', 'Ctrl+/', '?'],
  PREFERENCES: ['⌘+,', 'Ctrl+,'],
} as const;

/**
 * Get a common shortcut by key
 */
export function getCommonShortcut(key: keyof typeof COMMON_SHORTCUTS): string {
  return getPlatformShortcut(COMMON_SHORTCUTS[key]);
}

/**
 * Format shortcut for display in buttons
 * @param shortcuts Array of shortcuts
 * @param fallback Fallback text if no shortcuts provided
 * @returns Formatted shortcut text
 */
export function formatShortcut(shortcuts: string[], fallback: string = ''): string {
  if (!shortcuts || shortcuts.length === 0) return fallback;
  
  const shortcut = getPlatformShortcut(shortcuts);
  return shortcut || fallback;
}

/**
 * Check if a keyboard event matches a shortcut
 * @param event Keyboard event
 * @param shortcuts Array of shortcuts to match against
 * @returns True if the event matches any of the shortcuts
 */
export function matchesShortcut(event: KeyboardEvent, shortcuts: string[]): boolean {
  const platform = detectPlatform();
  
  for (const shortcut of shortcuts) {
    if (matchesShortcutString(event, shortcut, platform)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a keyboard event matches a specific shortcut string
 */
function matchesShortcutString(event: KeyboardEvent, shortcut: string, platform: 'mac' | 'pc'): boolean {
  const parts = shortcut.split('+').map(p => p.trim());
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  
  // Check the main key
  if (event.key !== key && event.code !== `Key${key.toUpperCase()}`) {
    return false;
  }
  
  // Check modifiers
  const hasMeta = modifiers.includes('⌘') || modifiers.includes('Cmd');
  const hasCtrl = modifiers.includes('Ctrl');
  const hasAlt = modifiers.includes('⌥') || modifiers.includes('Alt');
  const hasShift = modifiers.includes('⇧') || modifiers.includes('Shift');
  
  if (platform === 'mac') {
    return event.metaKey === hasMeta && 
           event.ctrlKey === hasCtrl && 
           event.altKey === hasAlt && 
           event.shiftKey === hasShift;
  } else {
    return event.ctrlKey === (hasMeta || hasCtrl) && 
           event.altKey === hasAlt && 
           event.shiftKey === hasShift;
  }
}

/**
 * Hook for keyboard shortcut handling
 */
export function useKeyboardShortcut(
  shortcuts: string[],
  callback: (event: KeyboardEvent) => void,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
  } = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true
  } = options;
  
  React.useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesShortcut(event, shortcuts)) {
        if (preventDefault) event.preventDefault();
        if (stopPropagation) {
          event.stopPropagation();
          event.stopImmediatePropagation();
        }
        callback(event);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [shortcuts, callback, enabled, preventDefault, stopPropagation]);
}

// Import React for the hook
import React from 'react';

