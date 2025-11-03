/**
 * 2025 Theme Application System
 * 
 * Modern theme application using CSS custom properties with:
 * - Real-time theme switching
 * - Smooth transitions
 * - Platform-aware storage
 * - Accessibility support
 * - Performance optimization
 */

import { allThemes, getThemeById, type Theme } from './theme-definitions';

export interface ThemeApplicationOptions {
  enableTransitions?: boolean;
  transitionDuration?: number;
  persistToStorage?: boolean;
  updateSystemTheme?: boolean;
}

export class ThemeApplier2025 {
  private static instance: ThemeApplier2025;
  private currentTheme: string | null = null;
  private isTransitioning = false;

  private constructor() {
    this.initializeThemeSystem();
  }

  public static getInstance(): ThemeApplier2025 {
    if (!ThemeApplier2025.instance) {
      ThemeApplier2025.instance = new ThemeApplier2025();
    }
    return ThemeApplier2025.instance;
  }

  /**
   * Apply a theme with modern 2025 best practices
   */
  public async applyTheme(
    themeId: string, 
    options: ThemeApplicationOptions = {}
  ): Promise<boolean> {
    const {
      enableTransitions = true,
      transitionDuration = 200,
      persistToStorage = true,
      updateSystemTheme = true
    } = options;

    try {
      const theme = getThemeById(themeId);
      if (!theme) {
        console.error(`🎨 Theme not found: ${themeId}`);
        return false;
      }

      // Prevent multiple simultaneous theme applications
      if (this.isTransitioning) {
        console.log('🎨 Theme application already in progress, queuing...');
        return new Promise((resolve) => {
          setTimeout(() => {
            this.applyTheme(themeId, options).then(resolve);
          }, 50);
        });
      }

      this.isTransitioning = true;

      // Enable transitions if requested
      if (enableTransitions) {
        this.enableThemeTransitions(transitionDuration);
      }

      // Apply theme variables
      this.applyThemeVariables(theme);

      // Update DOM attributes
      this.updateDOMAttributes(theme);

      // Update system theme if requested
      if (updateSystemTheme) {
        this.updateSystemTheme(theme);
      }

      // Persist to storage if requested
      if (persistToStorage) {
        this.persistTheme(themeId);
      }

      // Update current theme
      this.currentTheme = themeId;

      // Disable transitions after application
      if (enableTransitions) {
        setTimeout(() => {
          this.disableThemeTransitions();
          this.isTransitioning = false;
        }, transitionDuration + 50);
      } else {
        this.isTransitioning = false;
      }

      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Successfully applied theme: ${theme.displayName}`, theme.colors);
      }
      return true;

    } catch (error) {
      console.error('🎨 Failed to apply theme:', error);
      this.isTransitioning = false;
      return false;
    }
  }

  /**
   * Apply theme CSS variables to document root
   */
  private applyThemeVariables(theme: Theme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const colors = theme.colors;

    // Core theme variables
    const themeVars = {
      '--background': colors.background,
      '--foreground': colors.foreground,
      '--accent': colors.accent,
      '--border': colors.border,
      '--muted': colors.muted,
      '--muted-light': colors.mutedLight,
      '--loading-bg': colors.loadingBg,
      '--hover': colors.hover,
      '--button-text': colors.buttonText,
      '--button-background': colors.buttonBackground,
      '--button-hover': colors.buttonHover,
      '--button-active': colors.buttonActive,
      '--success': colors.success,
      '--warning': colors.warning,
      '--error': colors.error,
      '--info': colors.info,
      '--badge-new-bg': colors.badgeNewBg,
      '--badge-new-text': colors.badgeNewText,
      '--badge-contacted-bg': colors.badgeContactedBg,
      '--badge-contacted-text': colors.badgeContactedText,
      '--badge-qualified-bg': colors.badgeQualifiedBg,
      '--badge-qualified-text': colors.badgeQualifiedText,
      '--badge-lost-bg': colors.badgeLostBg,
      '--badge-lost-text': colors.badgeLostText,
      '--active-app-border': colors.activeAppBorder,
      '--panel-background': colors.panelBackground,
      '--scrollbar-thumb': colors.scrollbarThumb,
      '--focus-ring': colors.focusRing,
      '--focus-ring-width': colors.focusRingWidth,
      '--high-contrast-bg': colors.highContrastBg,
      '--high-contrast-fg': colors.highContrastFg,
      '--high-contrast-border': colors.highContrastBorder,
      '--high-contrast-accent': colors.highContrastAccent,
    };

    // Apply variables to document root with Safari compatibility
    Object.entries(themeVars).forEach(([key, value]) => {
      try {
        root.style.setProperty(key, value);
      } catch (error) {
        // Fallback for Safari readonly property issues
        console.warn(`🎨 [SAFARI COMPAT] Could not set CSS property ${key}, using fallback`);
        try {
          root.setAttribute(`data-${key.replace('--', '')}`, value);
        } catch (fallbackError) {
          console.error(`🎨 [SAFARI COMPAT] Failed to set fallback for ${key}:`, fallbackError);
        }
      }
    });

    // Also apply to body for immediate effect with Safari compatibility
    Object.entries(themeVars).forEach(([key, value]) => {
      try {
        document.body.style.setProperty(key, value);
      } catch (error) {
        // Fallback for Safari readonly property issues
        console.warn(`🎨 [SAFARI COMPAT] Could not set body CSS property ${key}, using fallback`);
        try {
          document.body.setAttribute(`data-${key.replace('--', '')}`, value);
        } catch (fallbackError) {
          console.error(`🎨 [SAFARI COMPAT] Failed to set body fallback for ${key}:`, fallbackError);
        }
      }
    });
  }

  /**
   * Update DOM attributes for theme targeting
   */
  private updateDOMAttributes(theme: Theme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Set data-theme attribute
    root.setAttribute('data-theme', theme.id);

    // Set data-color-scheme for system integration
    root.setAttribute('data-color-scheme', theme.category);

    // Set class for category-based styling
    root.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast');
    root.classList.add(`theme-${theme.category}`);

    // CRITICAL: Sync Tailwind dark mode with theme system
    if (theme.category === 'dark' || theme.category === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme.colors.accent);
  }

  /**
   * Update system theme integration
   */
  private updateSystemTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme.colors.accent);

    // Update CSS color-scheme property with Safari compatibility
    try {
      document.documentElement.style.colorScheme = theme.category;
    } catch (error) {
      // Fallback for Safari readonly property issues
      console.warn('🎨 [SAFARI COMPAT] Could not set color-scheme, using fallback');
      try {
        document.documentElement.setAttribute('data-color-scheme', theme.category);
      } catch (fallbackError) {
        console.error('🎨 [SAFARI COMPAT] Failed to set color-scheme fallback:', fallbackError);
      }
    }

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme, themeId: theme.id }
    }));
  }

  /**
   * Update meta theme-color for mobile browsers
   */
  private updateMetaThemeColor(color: string): void {
    if (typeof document === 'undefined') return;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
  }

  /**
   * Enable smooth theme transitions
   */
  private enableThemeTransitions(duration: number): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    try {
      root.style.setProperty('--theme-transition-duration', `${duration}ms`);
    } catch (error) {
      // Fallback for Safari readonly property issues
      console.warn('🎨 [SAFARI COMPAT] Could not set transition duration, using fallback');
      try {
        root.setAttribute('data-theme-transition-duration', `${duration}ms`);
      } catch (fallbackError) {
        console.error('🎨 [SAFARI COMPAT] Failed to set transition fallback:', fallbackError);
      }
    }
    root.classList.add('theme-transitioning');
  }

  /**
   * Disable theme transitions
   */
  private disableThemeTransitions(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    try {
      root.style.setProperty('--theme-transition-duration', '0ms');
    } catch (error) {
      // Fallback for Safari readonly property issues
      console.warn('🎨 [SAFARI COMPAT] Could not disable transition duration, using fallback');
      try {
        root.setAttribute('data-theme-transition-duration', '0ms');
      } catch (fallbackError) {
        console.error('🎨 [SAFARI COMPAT] Failed to disable transition fallback:', fallbackError);
      }
    }
    root.classList.remove('theme-transitioning');
  }

  /**
   * Persist theme to storage
   */
  private persistTheme(themeId: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('adrata-current-theme', themeId);
        localStorage.setItem('adrata-theme-timestamp', Date.now().toString());
      }
    } catch (error) {
      console.warn('🎨 Failed to persist theme to localStorage:', error);
    }
  }

  /**
   * Initialize theme system
   */
  private initializeThemeSystem(): void {
    if (typeof document === 'undefined') return;

    // Load saved theme on initialization
    this.loadSavedTheme();

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    }

    // Listen for storage changes (multi-tab sync)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  /**
   * Load saved theme from storage
   */
  private loadSavedTheme(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedTheme = localStorage.getItem('adrata-current-theme');
        if (savedTheme && getThemeById(savedTheme)) {
          this.currentTheme = savedTheme;
          // Don't apply here - let the ThemeProvider handle it
        }
      }
    } catch (error) {
      console.warn('🎨 Failed to load saved theme:', error);
    }
  }

  /**
   * Handle system theme changes
   */
  private handleSystemThemeChange(event: MediaQueryListEvent): void {
    console.log('🎨 System theme changed:', event.matches ? 'dark' : 'light');
    
    // Dispatch event for ThemeProvider to handle
    window.dispatchEvent(new CustomEvent('system-theme-changed', {
      detail: { isDark: event.matches }
    }));
  }

  /**
   * Handle storage changes (multi-tab sync)
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'adrata-current-theme' && event.newValue) {
      console.log('🎨 Theme changed in another tab:', event.newValue);
      
      // Dispatch event for ThemeProvider to handle
      window.dispatchEvent(new CustomEvent('theme-sync', {
        detail: { themeId: event.newValue }
      }));
    }
  }

  /**
   * Get current theme ID
   */
  public getCurrentTheme(): string | null {
    return this.currentTheme;
  }

  /**
   * Check if theme is currently being applied
   */
  public isApplying(): boolean {
    return this.isTransitioning;
  }

  /**
   * Get all available themes
   */
  public getAvailableThemes(): Theme[] {
    return allThemes;
  }

  /**
   * Get themes by category
   */
  public getThemesByCategory(category: 'light' | 'dark' | 'high-contrast'): Theme[] {
    return allThemes.filter(theme => theme.category === category);
  }
}

// Export singleton instance
export const themeApplier = ThemeApplier2025.getInstance();

// Export convenience functions
export const applyTheme = (themeId: string, options?: ThemeApplicationOptions) => 
  themeApplier.applyTheme(themeId, options);

export const getCurrentTheme = () => themeApplier.getCurrentTheme();

export const getAvailableThemes = () => themeApplier.getAvailableThemes();

export const getThemesByCategory = (category: 'light' | 'dark' | 'high-contrast') => 
  themeApplier.getThemesByCategory(category);
