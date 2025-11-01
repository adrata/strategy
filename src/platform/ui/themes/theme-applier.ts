/**
 * Real-Time Theme Applier
 * 
 * Handles instant theme application with CSS variable updates,
 * smooth transitions, and platform-specific styling.
 */

import { type Theme, type ThemeColors } from './theme-definitions';
import { getPlatform } from '@/platform/platform-detection';

// ==================== TYPES ====================

export interface ThemeApplicationOptions {
  enableTransitions?: boolean;
  transitionDuration?: number;
  updateScrollbars?: boolean;
  updateMonacoEditor?: boolean;
  updateAGGrid?: boolean;
  updateMetaThemeColor?: boolean;
}

export interface ThemeApplicationResult {
  success: boolean;
  appliedTheme: Theme | null;
  error?: string;
  appliedAt: number;
}

// ==================== THEME APPLICATION ====================

export class ThemeApplier {
  private static instance: ThemeApplier;
  private currentTheme: Theme | null = null;
  private isApplying = false;
  private transitionTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): ThemeApplier {
    if (!ThemeApplier.instance) {
      ThemeApplier.instance = new ThemeApplier();
    }
    return ThemeApplier.instance;
  }

  /**
   * Apply a theme to the entire application
   */
  async applyTheme(
    theme: Theme, 
    options: ThemeApplicationOptions = {}
  ): Promise<ThemeApplicationResult> {
    const startTime = performance.now();
    
    try {
      if (this.isApplying) {
        console.warn('Theme application already in progress, skipping...');
        return {
          success: false,
          appliedTheme: null,
          error: 'Theme application already in progress',
          appliedAt: Date.now(),
        };
      }

      this.isApplying = true;
      
      const defaultOptions: Required<ThemeApplicationOptions> = {
        enableTransitions: true,
        transitionDuration: 200,
        updateScrollbars: true,
        updateMonacoEditor: true,
        updateAGGrid: true,
        updateMetaThemeColor: true,
      };

      const opts = { ...defaultOptions, ...options };

      // Clear any existing transition timeout
      if (this.transitionTimeout) {
        clearTimeout(this.transitionTimeout);
      }

      // Apply theme with transitions
      if (opts.enableTransitions) {
        await this.applyThemeWithTransitions(theme, opts.transitionDuration);
      } else {
        await this.applyThemeImmediate(theme);
      }

      // Apply platform-specific updates
      await this.applyPlatformSpecificUpdates(theme, opts);

      // Update third-party components
      await this.updateThirdPartyComponents(theme, opts);

      this.currentTheme = theme;
      this.isApplying = false;

      const endTime = performance.now();
      console.log(`🎨 Theme applied: ${theme.name} (${Math.round(endTime - startTime)}ms)`);

      return {
        success: true,
        appliedTheme: theme,
        appliedAt: Date.now(),
      };

    } catch (error) {
      this.isApplying = false;
      console.error('Failed to apply theme:', error);
      
      return {
        success: false,
        appliedTheme: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        appliedAt: Date.now(),
      };
    }
  }

  /**
   * Apply theme with smooth transitions
   */
  private async applyThemeWithTransitions(
    theme: Theme, 
    duration: number
  ): Promise<void> {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Add transition class
    root.classList.add('theme-transitioning');
    
    // Set transition duration
    root.style.setProperty('--theme-transition-duration', `${duration}ms`);

    // Apply theme colors
    this.applyThemeColors(theme.colors);

    // Remove transition class after animation completes
    this.transitionTimeout = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      root.style.removeProperty('--theme-transition-duration');
    }, duration);
  }

  /**
   * Apply theme immediately without transitions
   */
  private async applyThemeImmediate(theme: Theme): Promise<void> {
    if (typeof document === 'undefined') return;

    this.applyThemeColors(theme.colors);
  }

  /**
   * Apply theme colors to CSS variables
   */
  private applyThemeColors(colors: ThemeColors): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply all color variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Update document class for theme-specific styling
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${this.currentTheme?.id || 'default'}`);
  }

  /**
   * Apply platform-specific updates
   */
  private async applyPlatformSpecificUpdates(
    theme: Theme, 
    options: Required<ThemeApplicationOptions>
  ): Promise<void> {
    const platform = getPlatform();

    switch (platform) {
      case 'desktop':
        await this.applyDesktopUpdates(theme, options);
        break;
      case 'mobile':
        await this.applyMobileUpdates(theme, options);
        break;
      case 'web':
      default:
        await this.applyWebUpdates(theme, options);
        break;
    }
  }

  /**
   * Apply desktop-specific updates
   */
  private async applyDesktopUpdates(
    theme: Theme, 
    options: Required<ThemeApplicationOptions>
  ): Promise<void> {
    // Update window title bar color (if supported)
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_theme_color', { 
          color: theme.colors.background 
        });
      } catch (error) {
        console.warn('Failed to update window theme color:', error);
      }
    }

    // Update scrollbars
    if (options.updateScrollbars) {
      this.updateScrollbarColors(theme.colors.scrollbarThumb);
    }
  }

  /**
   * Apply mobile-specific updates
   */
  private async applyMobileUpdates(
    theme: Theme, 
    options: Required<ThemeApplicationOptions>
  ): Promise<void> {
    // Update meta theme color
    if (options.updateMetaThemeColor) {
      this.updateMetaThemeColor(theme.colors.background);
    }
  }

  /**
   * Apply web-specific updates
   */
  private async applyWebUpdates(
    theme: Theme, 
    options: Required<ThemeApplicationOptions>
  ): Promise<void> {
    // Update meta theme color
    if (options.updateMetaThemeColor) {
      this.updateMetaThemeColor(theme.colors.background);
    }

    // Update scrollbars
    if (options.updateScrollbars) {
      this.updateScrollbarColors(theme.colors.scrollbarThumb);
    }
  }

  /**
   * Update third-party components
   */
  private async updateThirdPartyComponents(
    theme: Theme, 
    options: Required<ThemeApplicationOptions>
  ): Promise<void> {
    // Update Monaco Editor theme
    if (options.updateMonacoEditor) {
      this.updateMonacoEditorTheme(theme);
    }

    // Update AG Grid theme
    if (options.updateAGGrid) {
      this.updateAGGridTheme(theme);
    }
  }

  /**
   * Update Monaco Editor theme
   */
  private updateMonacoEditorTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    try {
      // Monaco Editor theme mapping
      const monacoTheme = theme.category === 'dark' ? 'vs-dark' : 'vs';
      
      // Update all Monaco instances
      const monacoInstances = document.querySelectorAll('.monaco-editor');
      monacoInstances.forEach((instance) => {
        const editor = (instance as any).__monacoEditor;
        if (editor) {
          editor.updateOptions({ theme: monacoTheme });
        }
      });

      // Dispatch custom event for Monaco theme change
      window.dispatchEvent(new CustomEvent('monaco-theme-change', {
        detail: { theme: monacoTheme, themeData: theme }
      }));
    } catch (error) {
      console.warn('Failed to update Monaco Editor theme:', error);
    }
  }

  /**
   * Update AG Grid theme
   */
  private updateAGGridTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    try {
      // AG Grid theme mapping
      const agGridTheme = theme.category === 'dark' ? 'ag-theme-alpine-dark' : 'ag-theme-alpine';
      
      // Update all AG Grid instances
      const agGridInstances = document.querySelectorAll('.ag-theme-alpine, .ag-theme-alpine-dark');
      agGridInstances.forEach((instance) => {
        instance.className = instance.className.replace(/ag-theme-\w+/g, agGridTheme);
      });

      // Dispatch custom event for AG Grid theme change
      window.dispatchEvent(new CustomEvent('ag-grid-theme-change', {
        detail: { theme: agGridTheme, themeData: theme }
      }));
    } catch (error) {
      console.warn('Failed to update AG Grid theme:', error);
    }
  }

  /**
   * Update scrollbar colors
   */
  private updateScrollbarColors(thumbColor: string): void {
    if (typeof document === 'undefined') return;

    // Remove existing scrollbar styles
    const existingStyle = document.getElementById('theme-scrollbar-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new scrollbar styles
    const style = document.createElement('style');
    style.id = 'theme-scrollbar-styles';
    style.textContent = `
      ::-webkit-scrollbar-thumb {
        background: ${thumbColor} !important;
        transition: background-color var(--theme-transition-duration, 0ms) ease;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: ${this.lightenColor(thumbColor, 0.1)} !important;
      }
      * {
        scrollbar-color: ${thumbColor} transparent !important;
        scrollbar-width: thin !important;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Update meta theme color
   */
  private updateMetaThemeColor(backgroundColor: string): void {
    if (typeof document === 'undefined') return;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', backgroundColor);
  }

  /**
   * Lighten a color by a percentage
   */
  private lightenColor(color: string, amount: number): string {
    // Simple color lightening - in a real implementation, you'd use a proper color library
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const num = parseInt(hex, 16);
      const r = Math.min(255, Math.floor((num >> 16) * (1 + amount)));
      const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) * (1 + amount)));
      const b = Math.min(255, Math.floor((num & 0x0000FF) * (1 + amount)));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    return color;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Check if theme is currently being applied
   */
  isThemeApplying(): boolean {
    return this.isApplying;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }
}

// ==================== EXPORTS ====================

export const themeApplier = ThemeApplier.getInstance();

// Convenience function for quick theme application
export async function applyTheme(
  theme: Theme, 
  options?: ThemeApplicationOptions
): Promise<ThemeApplicationResult> {
  return await themeApplier.applyTheme(theme, options);
}

// Hook for React components
export function useThemeApplier() {
  return {
    applyTheme: (theme: Theme, options?: ThemeApplicationOptions) => 
      themeApplier.applyTheme(theme, options),
    getCurrentTheme: () => themeApplier.getCurrentTheme(),
    isApplying: () => themeApplier.isThemeApplying(),
  };
}
