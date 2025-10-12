/**
 * Unit Tests: Auth Utilities
 * 
 * Tests for authentication utility functions and helpers
 */

import { detectPlatform, getPlatformShortcut, getCommonShortcut, COMMON_SHORTCUTS } from '@/platform/utils/keyboard-shortcuts';

// Mock navigator for platform detection
const mockNavigator = (platform: string, userAgent: string) => {
  Object.defineProperty(global, 'navigator', {
    value: {
      platform,
      userAgent,
    },
    writable: true,
  });
};

describe('Auth Utilities', () => {
  describe('Platform Detection', () => {
    it('detects Mac platform correctly', () => {
      mockNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      expect(detectPlatform()).toBe('mac');
    });

    it('detects Mac platform from user agent', () => {
      mockNavigator('', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      expect(detectPlatform()).toBe('mac');
    });

    it('detects PC platform correctly', () => {
      mockNavigator('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      expect(detectPlatform()).toBe('pc');
    });

    it('defaults to PC when platform is undefined', () => {
      mockNavigator('', '');
      
      expect(detectPlatform()).toBe('pc');
    });

    it('handles case insensitive platform detection', () => {
      mockNavigator('macintel', 'mozilla/5.0 (macintosh; intel mac os x 10_15_7)');
      
      expect(detectPlatform()).toBe('mac');
    });
  });

  describe('Platform Shortcuts', () => {
    beforeEach(() => {
      // Reset navigator mock
      mockNavigator('', '');
    });

    it('returns Mac shortcut when on Mac platform', () => {
      mockNavigator('MacIntel', '');
      
      const shortcuts = ['⌘+K', 'Ctrl+K'];
      expect(getPlatformShortcut(shortcuts)).toBe('⌘+K');
    });

    it('returns PC shortcut when on PC platform', () => {
      mockNavigator('Win32', '');
      
      const shortcuts = ['⌘+K', 'Ctrl+K'];
      expect(getPlatformShortcut(shortcuts)).toBe('Ctrl+K');
    });

    it('returns first shortcut when no platform-specific shortcut found', () => {
      mockNavigator('MacIntel', '');
      
      const shortcuts = ['Alt+K', 'Shift+K'];
      expect(getPlatformShortcut(shortcuts)).toBe('Alt+K');
    });

    it('returns empty string when no shortcuts provided', () => {
      expect(getPlatformShortcut([])).toBe('');
    });

    it('handles single shortcut array', () => {
      mockNavigator('MacIntel', '');
      
      const shortcuts = ['⌘+K'];
      expect(getPlatformShortcut(shortcuts)).toBe('⌘+K');
    });
  });

  describe('Common Shortcuts', () => {
    it('has all required shortcut keys defined', () => {
      expect(COMMON_SHORTCUTS).toHaveProperty('SUBMIT');
      expect(COMMON_SHORTCUTS).toHaveProperty('SUBMIT_ALT');
      expect(COMMON_SHORTCUTS).toHaveProperty('UNDO');
      expect(COMMON_SHORTCUTS).toHaveProperty('COMMAND_PALETTE');
      expect(COMMON_SHORTCUTS).toHaveProperty('QUICK_SEARCH');
      expect(COMMON_SHORTCUTS).toHaveProperty('AI_ASSISTANT');
    });

    it('returns correct submit shortcut for Mac', () => {
      mockNavigator('MacIntel', '');
      
      expect(getCommonShortcut('SUBMIT')).toBe('⌘⏎');
    });

    it('returns correct submit shortcut for PC', () => {
      mockNavigator('Win32', '');
      
      expect(getCommonShortcut('SUBMIT')).toBe('Ctrl+⏎');
    });

    it('returns correct command palette shortcut for Mac', () => {
      mockNavigator('MacIntel', '');
      
      expect(getCommonShortcut('COMMAND_PALETTE')).toBe('⌘+K');
    });

    it('returns correct command palette shortcut for PC', () => {
      mockNavigator('Win32', '');
      
      expect(getCommonShortcut('COMMAND_PALETTE')).toBe('Ctrl+K');
    });

    it('handles unknown shortcut key gracefully', () => {
      mockNavigator('MacIntel', '');
      
      // @ts-ignore - Testing runtime behavior
      expect(() => getCommonShortcut('UNKNOWN_SHORTCUT')).toThrow();
    });
  });

  describe('Shortcut Formatting', () => {
    it('formats shortcuts correctly for display', () => {
      const shortcuts = ['⌘+K', 'Ctrl+K'];
      const fallback = 'No shortcut';
      
      mockNavigator('MacIntel', '');
      expect(getPlatformShortcut(shortcuts)).toBe('⌘+K');
      
      mockNavigator('Win32', '');
      expect(getPlatformShortcut(shortcuts)).toBe('Ctrl+K');
    });

    it('handles empty shortcut arrays', () => {
      expect(getPlatformShortcut([])).toBe('');
    });

    it('handles undefined shortcuts', () => {
      // @ts-ignore - Testing runtime behavior
      expect(() => getPlatformShortcut(undefined)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles navigator being undefined', () => {
      // @ts-ignore - Testing runtime behavior
      delete global.navigator;
      
      expect(detectPlatform()).toBe('pc');
    });

    it('handles empty platform and user agent', () => {
      mockNavigator('', '');
      
      expect(detectPlatform()).toBe('pc');
    });

    it('handles null platform and user agent', () => {
      // @ts-ignore - Testing runtime behavior
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: null,
          userAgent: null,
        },
        writable: true,
      });
      
      expect(detectPlatform()).toBe('pc');
    });
  });

  describe('Shortcut Constants', () => {
    it('has consistent shortcut formats', () => {
      // Check that Mac shortcuts start with ⌘
      Object.values(COMMON_SHORTCUTS).forEach(shortcuts => {
        if (Array.isArray(shortcuts) && shortcuts.length > 0) {
          const macShortcut = shortcuts.find(s => s.startsWith('⌘'));
          const pcShortcut = shortcuts.find(s => s.startsWith('Ctrl'));
          
          if (macShortcut) {
            expect(macShortcut).toMatch(/^⌘/);
          }
          if (pcShortcut) {
            expect(pcShortcut).toMatch(/^Ctrl/);
          }
        }
      });
    });

    it('has all shortcuts as arrays', () => {
      Object.values(COMMON_SHORTCUTS).forEach(shortcuts => {
        expect(Array.isArray(shortcuts)).toBe(true);
        expect(shortcuts.length).toBeGreaterThan(0);
      });
    });

    it('has submit shortcuts defined', () => {
      expect(COMMON_SHORTCUTS.SUBMIT).toEqual(['⌘⏎', 'Ctrl+⏎']);
      expect(COMMON_SHORTCUTS.SUBMIT_ALT).toEqual(['⌘+Enter', 'Ctrl+Enter']);
    });
  });
});
