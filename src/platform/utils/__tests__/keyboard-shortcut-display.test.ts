/**
 * Tests for keyboard shortcut display utilities
 */

import { 
  formatShortcutForDisplay, 
  formatSingleShortcut, 
  getModifierSymbol, 
  getEnterSymbol,
  createButtonTextWithShortcut,
  createTooltipWithShortcut 
} from '../keyboard-shortcut-display';

// Mock navigator for testing
const mockNavigator = (platform: string, userAgent: string) => {
  Object.defineProperty(window, 'navigator', {
    value: {
      platform,
      userAgent,
    },
    writable: true,
  });
};

describe('Keyboard Shortcut Display Utilities', () => {
  beforeEach(() => {
    // Reset navigator mock
    delete (window as any).navigator;
  });

  describe('formatShortcutForDisplay', () => {
    it('should return Mac shortcut on Mac platform', () => {
      mockNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      const result = formatShortcutForDisplay(['⌘+Enter', 'Ctrl+Enter']);
      expect(result).toBe('⌘+Enter');
    });

    it('should return PC shortcut on Windows platform', () => {
      mockNavigator('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const result = formatShortcutForDisplay(['⌘+Enter', 'Ctrl+Enter']);
      expect(result).toBe('Ctrl+Enter');
    });

    it('should return PC shortcut on Linux platform', () => {
      mockNavigator('Linux x86_64', 'Mozilla/5.0 (X11; Linux x86_64)');
      
      const result = formatShortcutForDisplay(['⌘+Enter', 'Ctrl+Enter']);
      expect(result).toBe('Ctrl+Enter');
    });

    it('should fallback to first shortcut if platform not detected', () => {
      mockNavigator('Unknown', 'Unknown');
      
      const result = formatShortcutForDisplay(['⌘+Enter', 'Ctrl+Enter']);
      expect(result).toBe('⌘+Enter');
    });
  });

  describe('formatSingleShortcut', () => {
    it('should format Mac shortcut correctly', () => {
      mockNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      const result = formatSingleShortcut('Ctrl+Enter');
      expect(result).toBe('⌘+Enter');
    });

    it('should format PC shortcut correctly', () => {
      mockNavigator('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const result = formatSingleShortcut('⌘+Enter');
      expect(result).toBe('Ctrl+Enter');
    });
  });

  describe('getModifierSymbol', () => {
    it('should return ⌘ on Mac', () => {
      mockNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      const result = getModifierSymbol();
      expect(result).toBe('⌘');
    });

    it('should return Ctrl on PC', () => {
      mockNavigator('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const result = getModifierSymbol();
      expect(result).toBe('Ctrl');
    });
  });

  describe('getEnterSymbol', () => {
    it('should return ⏎ on Mac', () => {
      mockNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      const result = getEnterSymbol();
      expect(result).toBe('⏎');
    });

    it('should return Enter on PC', () => {
      mockNavigator('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const result = getEnterSymbol();
      expect(result).toBe('Enter');
    });
  });

  describe('createButtonTextWithShortcut', () => {
    it('should create button text with Mac shortcut', () => {
      mockNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      const result = createButtonTextWithShortcut('Add Company', ['⌘⏎', 'Ctrl+Enter']);
      expect(result).toBe('Add Company (⌘⏎)');
    });

    it('should create button text with PC shortcut', () => {
      mockNavigator('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const result = createButtonTextWithShortcut('Add Company', ['⌘⏎', 'Ctrl+Enter']);
      expect(result).toBe('Add Company (Ctrl+Enter)');
    });
  });

  describe('createTooltipWithShortcut', () => {
    it('should create tooltip with Mac shortcut', () => {
      mockNavigator('MacIntel', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
      
      const result = createTooltipWithShortcut('Mark as completed', ['⌘+Enter', 'Ctrl+Enter']);
      expect(result).toBe('Mark as completed (⌘+Enter)');
    });

    it('should create tooltip with PC shortcut', () => {
      mockNavigator('Win32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
      const result = createTooltipWithShortcut('Mark as completed', ['⌘+Enter', 'Ctrl+Enter']);
      expect(result).toBe('Mark as completed (Ctrl+Enter)');
    });
  });
});
