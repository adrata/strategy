/**
 * 🎯 KEYBOARD SHORTCUT DISPLAY UTILITIES
 * 
 * Cross-platform utilities for displaying keyboard shortcuts in the UI
 * Automatically shows appropriate shortcuts based on user's platform
 */

import React from 'react';
import { detectPlatform, getPlatformShortcut } from './keyboard-shortcuts';

/**
 * Format a keyboard shortcut for display based on the current platform
 * @param shortcuts Array of shortcuts in format ["⌘+Enter", "Ctrl+Enter"]
 * @param fallback Fallback text if no shortcuts provided
 * @returns Platform-appropriate shortcut text
 */
export function formatShortcutForDisplay(shortcuts: string[], fallback: string = ''): string {
  if (!shortcuts || shortcuts.length === 0) return fallback;
  
  const shortcut = getPlatformShortcut(shortcuts);
  return shortcut || fallback;
}

/**
 * Format a single shortcut string for display
 * @param shortcut Shortcut string like "⌘+Enter" or "Ctrl+Enter"
 * @returns Platform-appropriate shortcut text
 */
export function formatSingleShortcut(shortcut: string): string {
  const platform = detectPlatform();
  
  if (platform === 'mac') {
    return shortcut.replace('Ctrl', '⌘').replace('Alt', '⌥').replace('Shift', '⇧');
  } else {
    return shortcut.replace('⌘', 'Ctrl').replace('⌥', 'Alt').replace('⇧', 'Shift');
  }
}

/**
 * Get the platform-appropriate modifier key symbol
 * @returns "⌘" for Mac, "Ctrl" for PC
 */
export function getModifierSymbol(): string {
  return detectPlatform() === 'mac' ? '⌘' : 'Ctrl';
}

/**
 * Get the platform-appropriate Enter key symbol
 * @returns "⏎" for Mac, "Enter" for PC
 */
export function getEnterSymbol(): string {
  return detectPlatform() === 'mac' ? '⏎' : 'Enter';
}

/**
 * Common shortcut patterns with platform-aware display
 */
export const DISPLAY_SHORTCUTS = {
  SUBMIT: formatShortcutForDisplay(['⌘⏎', 'Ctrl+Enter']),
  SUBMIT_ALT: formatShortcutForDisplay(['⌘+Enter', 'Ctrl+Enter']),
  COMMAND_PALETTE: formatShortcutForDisplay(['⌘+K', 'Ctrl+K']),
  AI_ASSISTANT: formatShortcutForDisplay(['⌘+J', 'Ctrl+J']),
  QUICK_SEARCH: formatShortcutForDisplay(['⌘+/', 'Ctrl+/']),
  PREFERENCES: formatShortcutForDisplay(['⌘+,', 'Ctrl+,']),
  TOGGLE_LEFT_PANEL: formatShortcutForDisplay(['⌘+B', 'Ctrl+B']),
  TOGGLE_RIGHT_PANEL: formatShortcutForDisplay(['⌘+Shift+B', 'Ctrl+Shift+B']),
  GO_AOS: formatShortcutForDisplay(['⌘+1', 'Ctrl+1']),
  GO_MONACO: formatShortcutForDisplay(['⌘+2', 'Ctrl+2']),
  GO_OASIS: formatShortcutForDisplay(['⌘+3', 'Ctrl+3']),
  GO_SPEEDRUN: formatShortcutForDisplay(['⌘+4', 'Ctrl+4']),
  GO_BRIEFCASE: formatShortcutForDisplay(['⌘+5', 'Ctrl+5']),
} as const;

/**
 * Props for the Kbd component
 */
interface KbdProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'green' | 'blue' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Platform-aware keyboard shortcut badge component
 */
export function Kbd({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md' 
}: KbdProps) {
  const baseClasses = 'font-mono rounded border';
  
  const variantClasses = {
    default: 'bg-hover text-gray-700 dark:text-gray-300',
    green: 'bg-green-200 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-loading-bg text-muted',
  };
  
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <kbd className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </kbd>
  );
}

/**
 * Props for the ShortcutDisplay component
 */
interface ShortcutDisplayProps {
  shortcuts: string[];
  fallback?: string;
  className?: string;
  variant?: 'default' | 'green' | 'blue' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  separator?: string;
}

/**
 * Component that displays platform-appropriate keyboard shortcuts
 */
export function ShortcutDisplay({ 
  shortcuts, 
  fallback = '', 
  className = '',
  variant = 'default',
  size = 'md',
  separator = '+'
}: ShortcutDisplayProps) {
  const shortcut = formatShortcutForDisplay(shortcuts, fallback);
  
  if (!shortcut) return null;
  
  // Split the shortcut into individual keys
  const keys = shortcut.split(separator).map(key => key.trim());
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <Kbd variant={variant} size={size}>
            {key}
          </Kbd>
          {index < keys.length - 1 && (
            <span className="text-muted text-sm">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Hook to get platform-aware shortcut display
 */
export function useShortcutDisplay() {
  return {
    formatShortcut: formatShortcutForDisplay,
    formatSingle: formatSingleShortcut,
    getModifier: getModifierSymbol,
    getEnter: getEnterSymbol,
    shortcuts: DISPLAY_SHORTCUTS,
  };
}

/**
 * Utility to create button text with shortcut
 * @param baseText Base button text
 * @param shortcuts Array of shortcuts
 * @returns Formatted button text with shortcut
 */
export function createButtonTextWithShortcut(baseText: string, shortcuts: string[]): string {
  const shortcut = formatShortcutForDisplay(shortcuts);
  return shortcut ? `${baseText} (${shortcut})` : baseText;
}

/**
 * Utility to create tooltip text with shortcut
 * @param baseText Base tooltip text
 * @param shortcuts Array of shortcuts
 * @returns Formatted tooltip text with shortcut
 */
export function createTooltipWithShortcut(baseText: string, shortcuts: string[]): string {
  const shortcut = formatShortcutForDisplay(shortcuts);
  return shortcut ? `${baseText} (${shortcut})` : baseText;
}
