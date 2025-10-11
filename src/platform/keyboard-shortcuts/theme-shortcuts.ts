/**
 * Theme Keyboard Shortcuts
 * 
 * Handles keyboard shortcuts for theme management and navigation.
 * Integrates with the global keyboard shortcut system.
 */

import { useState, useEffect } from 'react';
import { getPlatform } from '@/platform/platform-detection';

// ==================== TYPES ====================

export interface ThemeShortcutConfig {
  openThemePicker: string;
  toggleThemeMode: string;
  nextTheme: string;
  previousTheme: string;
  resetTheme: string;
}

export interface ThemeShortcutHandlers {
  onOpenThemePicker: () => void;
  onToggleThemeMode: () => void;
  onNextTheme: () => void;
  onPreviousTheme: () => void;
  onResetTheme: () => void;
}

// ==================== PLATFORM-SPECIFIC SHORTCUTS ====================

const getPlatformShortcuts = (): ThemeShortcutConfig => {
  const platform = getPlatform();
  
  switch (platform) {
    case 'desktop':
      // Desktop shortcuts (macOS/Windows/Linux)
      return {
        openThemePicker: 'Meta+K Meta+T', // Cmd+K, Cmd+T on macOS, Ctrl+K, Ctrl+T on Windows/Linux
        toggleThemeMode: 'Meta+Shift+T', // Cmd+Shift+T on macOS, Ctrl+Shift+T on Windows/Linux
        nextTheme: 'Meta+Shift+Right', // Cmd+Shift+→ on macOS, Ctrl+Shift+→ on Windows/Linux
        previousTheme: 'Meta+Shift+Left', // Cmd+Shift+← on macOS, Ctrl+Shift+← on Windows/Linux
        resetTheme: 'Meta+Shift+R', // Cmd+Shift+R on macOS, Ctrl+Shift+R on Windows/Linux
      };
    
    case 'mobile':
      // Mobile shortcuts (limited due to touch interface)
      return {
        openThemePicker: 'Meta+T', // Cmd+T on iOS, Ctrl+T on Android
        toggleThemeMode: 'Meta+Shift+T',
        nextTheme: 'Meta+Right',
        previousTheme: 'Meta+Left',
        resetTheme: 'Meta+Shift+R',
      };
    
    case 'web':
    default:
      // Web shortcuts
      return {
        openThemePicker: 'Meta+K Meta+T', // Cmd+K, Cmd+T on macOS, Ctrl+K, Ctrl+T on Windows/Linux
        toggleThemeMode: 'Meta+Shift+T',
        nextTheme: 'Meta+Shift+Right',
        previousTheme: 'Meta+Shift+Left',
        resetTheme: 'Meta+Shift+R',
      };
  }
};

// ==================== SHORTCUT PARSER ====================

const parseShortcut = (shortcut: string): { key: string; modifiers: string[] } => {
  const parts = shortcut.split(' ');
  const lastPart = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  
  return {
    key: lastPart.toLowerCase(),
    modifiers: modifiers.map(m => m.toLowerCase()),
  };
};

// ==================== KEYBOARD EVENT HANDLER ====================

export class ThemeShortcutManager {
  private shortcuts: ThemeShortcutConfig;
  private handlers: ThemeShortcutHandlers | null = null;
  private isListening = false;
  private keySequence: string[] = [];
  private sequenceTimeout: NodeJS.Timeout | null = null;
  private readonly SEQUENCE_TIMEOUT = 1000; // 1 second

  constructor() {
    this.shortcuts = getPlatformShortcuts();
  }

  /**
   * Register shortcut handlers
   */
  registerHandlers(handlers: ThemeShortcutHandlers): void {
    this.handlers = handlers;
  }

  /**
   * Start listening for keyboard shortcuts
   */
  startListening(): void {
    if (this.isListening) return;
    
    document.addEventListener('keydown', this.handleKeyDown);
    this.isListening = true;
  }

  /**
   * Stop listening for keyboard shortcuts
   */
  stopListening(): void {
    if (!this.isListening) return;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    this.isListening = false;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.handlers) return;

    // Don't trigger shortcuts when typing in inputs
    if (this.isInputElement(event.target)) return;

    const key = event.key.toLowerCase();
    const modifiers = this.getModifiers(event);
    const shortcut = `${modifiers.join('+')} ${key}`;

    // Handle sequence shortcuts (like Cmd+K, Cmd+T)
    if (this.isSequenceShortcut(shortcut)) {
      this.handleSequenceShortcut(shortcut, event);
      return;
    }

    // Handle single shortcuts
    this.handleSingleShortcut(shortcut, event);
  };

  /**
   * Check if target is an input element
   */
  private isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    
    const tagName = target.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];
    
    if (inputTypes.includes(tagName)) return true;
    
    // Check for contenteditable
    if (target.contentEditable === 'true') return true;
    
    // Check for Monaco Editor
    if (target.closest('.monaco-editor')) return true;
    
    return false;
  }

  /**
   * Get modifier keys from event
   */
  private getModifiers(event: KeyboardEvent): string[] {
    const modifiers: string[] = [];
    
    if (event.metaKey) modifiers.push('meta');
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');
    
    return modifiers;
  }

  /**
   * Check if shortcut is a sequence shortcut
   */
  private isSequenceShortcut(shortcut: string): boolean {
    return shortcut.includes('meta+k') || shortcut.includes('ctrl+k');
  }

  /**
   * Handle sequence shortcuts
   */
  private handleSequenceShortcut(shortcut: string, event: KeyboardEvent): void {
    if (shortcut.includes('meta+k') || shortcut.includes('ctrl+k')) {
      // First part of sequence - don't prevent default, just track
      this.keySequence = [shortcut];
      this.resetSequenceTimeout();
      return;
    }

    // Check if this completes a sequence
    if (this.keySequence.length > 0) {
      const fullSequence = [...this.keySequence, shortcut].join(' ');
      
      if (fullSequence === this.shortcuts.openThemePicker) {
        event.preventDefault();
        this.handlers?.onOpenThemePicker();
        this.clearSequence();
        return;
      }
    }

    // Not a sequence shortcut, handle as single shortcut
    this.handleSingleShortcut(shortcut, event);
  }

  /**
   * Handle single shortcuts
   */
  private handleSingleShortcut(shortcut: string, event: KeyboardEvent): void {
    if (!this.handlers) return;

    switch (shortcut) {
      case this.shortcuts.toggleThemeMode:
        event.preventDefault();
        this.handlers.onToggleThemeMode();
        break;
      
      case this.shortcuts.nextTheme:
        event.preventDefault();
        this.handlers.onNextTheme();
        break;
      
      case this.shortcuts.previousTheme:
        event.preventDefault();
        this.handlers.onPreviousTheme();
        break;
      
      case this.shortcuts.resetTheme:
        event.preventDefault();
        this.handlers.onResetTheme();
        break;
    }
  }

  /**
   * Reset sequence timeout
   */
  private resetSequenceTimeout(): void {
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
    }
    
    this.sequenceTimeout = setTimeout(() => {
      this.clearSequence();
    }, this.SEQUENCE_TIMEOUT);
  }

  /**
   * Clear current sequence
   */
  private clearSequence(): void {
    this.keySequence = [];
    if (this.sequenceTimeout) {
      clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
  }

  /**
   * Get current shortcuts for display
   */
  getShortcuts(): ThemeShortcutConfig {
    return { ...this.shortcuts };
  }

  /**
   * Update shortcuts for current platform
   */
  updateShortcuts(): void {
    this.shortcuts = getPlatformShortcuts();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopListening();
    this.clearSequence();
    this.handlers = null;
  }
}

// ==================== GLOBAL INSTANCE ====================

export const themeShortcutManager = new ThemeShortcutManager();

// ==================== REACT HOOK ====================

export function useThemeShortcuts(handlers: ThemeShortcutHandlers) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    themeShortcutManager.registerHandlers(handlers);
    themeShortcutManager.startListening();
    setIsActive(true);

    return () => {
      themeShortcutManager.stopListening();
      setIsActive(false);
    };
  }, [handlers]);

  return {
    isActive,
    shortcuts: themeShortcutManager.getShortcuts(),
    updateShortcuts: () => themeShortcutManager.updateShortcuts(),
  };
}

// ==================== EXPORTS ====================

export { getPlatformShortcuts };
export default themeShortcutManager;
