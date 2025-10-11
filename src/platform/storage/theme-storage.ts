/**
 * Platform-Aware Theme Storage
 * 
 * Unified storage abstraction supporting:
 * - Web: localStorage
 * - Desktop (Tauri): @tauri-apps/plugin-store
 * - Mobile (Capacitor): @capacitor/preferences
 */

import { getPlatform } from '@/platform/platform-detection';

export interface ThemePreferences {
  themeMode: 'light' | 'dark' | 'auto';
  lightTheme: string;
  darkTheme: string;
  highContrastTheme: string;
  customThemes?: Record<string, any>;
  lastUpdated: number;
}

export interface ThemeStorage {
  getThemePreferences(): Promise<ThemePreferences | null>;
  setThemePreferences(preferences: ThemePreferences): Promise<void>;
  getThemeMode(): Promise<'light' | 'dark' | 'auto'>;
  setThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void>;
  getLightTheme(): Promise<string>;
  setLightTheme(themeId: string): Promise<void>;
  getDarkTheme(): Promise<string>;
  setDarkTheme(themeId: string): Promise<void>;
  clear(): Promise<void>;
}

// ==================== WEB STORAGE ====================

class WebThemeStorage implements ThemeStorage {
  private readonly STORAGE_KEY = 'adrata-theme-preferences';
  private readonly MODE_KEY = 'adrata-theme-mode';
  private readonly LIGHT_THEME_KEY = 'adrata-light-theme';
  private readonly DARK_THEME_KEY = 'adrata-dark-theme';

  async getThemePreferences(): Promise<ThemePreferences | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const preferences = JSON.parse(stored) as ThemePreferences;
      
      // Validate and migrate if needed
      return this.validatePreferences(preferences);
    } catch (error) {
      console.warn('Failed to load theme preferences from localStorage:', error);
      return null;
    }
  }

  async setThemePreferences(preferences: ThemePreferences): Promise<void> {
    try {
      const validated = this.validatePreferences(preferences);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validated));
    } catch (error) {
      console.error('Failed to save theme preferences to localStorage:', error);
      throw error;
    }
  }

  async getThemeMode(): Promise<'light' | 'dark' | 'auto'> {
    try {
      const mode = localStorage.getItem(this.MODE_KEY) as 'light' | 'dark' | 'auto';
      return mode || 'auto';
    } catch (error) {
      console.warn('Failed to load theme mode from localStorage:', error);
      return 'auto';
    }
  }

  async setThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    try {
      localStorage.setItem(this.MODE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode to localStorage:', error);
      throw error;
    }
  }

  async getLightTheme(): Promise<string> {
    try {
      return localStorage.getItem(this.LIGHT_THEME_KEY) || 'ghost';
    } catch (error) {
      console.warn('Failed to load light theme from localStorage:', error);
      return 'ghost';
    }
  }

  async setLightTheme(themeId: string): Promise<void> {
    try {
      localStorage.setItem(this.LIGHT_THEME_KEY, themeId);
    } catch (error) {
      console.error('Failed to save light theme to localStorage:', error);
      throw error;
    }
  }

  async getDarkTheme(): Promise<string> {
    try {
      return localStorage.getItem(this.DARK_THEME_KEY) || 'dark-matter';
    } catch (error) {
      console.warn('Failed to load dark theme from localStorage:', error);
      return 'dark-matter';
    }
  }

  async setDarkTheme(themeId: string): Promise<void> {
    try {
      localStorage.setItem(this.DARK_THEME_KEY, themeId);
    } catch (error) {
      console.error('Failed to save dark theme to localStorage:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.MODE_KEY);
      localStorage.removeItem(this.LIGHT_THEME_KEY);
      localStorage.removeItem(this.DARK_THEME_KEY);
    } catch (error) {
      console.error('Failed to clear theme storage:', error);
      throw error;
    }
  }

  private validatePreferences(preferences: any): ThemePreferences {
    return {
      themeMode: ['light', 'dark', 'auto'].includes(preferences.themeMode) 
        ? preferences.themeMode 
        : 'auto',
      lightTheme: preferences.lightTheme || 'ghost',
      darkTheme: preferences.darkTheme || 'dark-matter',
      highContrastTheme: preferences.highContrastTheme || 'high-contrast-light',
      customThemes: preferences.customThemes || {},
      lastUpdated: preferences.lastUpdated || Date.now(),
    };
  }
}

// ==================== TAURI STORAGE ====================

class TauriThemeStorage implements ThemeStorage {
  private store: any = null;
  private readonly STORAGE_KEY = 'theme-preferences';
  private readonly MODE_KEY = 'theme-mode';
  private readonly LIGHT_THEME_KEY = 'light-theme';
  private readonly DARK_THEME_KEY = 'dark-theme';

  constructor() {
    this.initializeStore();
  }

  private async initializeStore() {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { Store } = await import('@tauri-apps/plugin-store');
        this.store = new Store('.theme-preferences.dat');
      }
    } catch (error) {
      console.warn('Failed to initialize Tauri store, falling back to localStorage:', error);
      this.store = null;
    }
  }

  async getThemePreferences(): Promise<ThemePreferences | null> {
    try {
      if (!this.store) {
        // Fallback to localStorage
        const webStorage = new WebThemeStorage();
        return await webStorage.getThemePreferences();
      }

      const stored = await this.store.get(this.STORAGE_KEY);
      if (!stored) return null;
      
      return this.validatePreferences(stored);
    } catch (error) {
      console.warn('Failed to load theme preferences from Tauri store:', error);
      return null;
    }
  }

  async setThemePreferences(preferences: ThemePreferences): Promise<void> {
    try {
      if (!this.store) {
        // Fallback to localStorage
        const webStorage = new WebThemeStorage();
        return await webStorage.setThemePreferences(preferences);
      }

      const validated = this.validatePreferences(preferences);
      await this.store.set(this.STORAGE_KEY, validated);
      await this.store.save();
    } catch (error) {
      console.error('Failed to save theme preferences to Tauri store:', error);
      throw error;
    }
  }

  async getThemeMode(): Promise<'light' | 'dark' | 'auto'> {
    try {
      if (!this.store) {
        const webStorage = new WebThemeStorage();
        return await webStorage.getThemeMode();
      }

      const mode = await this.store.get(this.MODE_KEY);
      return mode || 'auto';
    } catch (error) {
      console.warn('Failed to load theme mode from Tauri store:', error);
      return 'auto';
    }
  }

  async setThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    try {
      if (!this.store) {
        const webStorage = new WebThemeStorage();
        return await webStorage.setThemeMode(mode);
      }

      await this.store.set(this.MODE_KEY, mode);
      await this.store.save();
    } catch (error) {
      console.error('Failed to save theme mode to Tauri store:', error);
      throw error;
    }
  }

  async getLightTheme(): Promise<string> {
    try {
      if (!this.store) {
        const webStorage = new WebThemeStorage();
        return await webStorage.getLightTheme();
      }

      const theme = await this.store.get(this.LIGHT_THEME_KEY);
      return theme || 'ghost';
    } catch (error) {
      console.warn('Failed to load light theme from Tauri store:', error);
      return 'ghost';
    }
  }

  async setLightTheme(themeId: string): Promise<void> {
    try {
      if (!this.store) {
        const webStorage = new WebThemeStorage();
        return await webStorage.setLightTheme(themeId);
      }

      await this.store.set(this.LIGHT_THEME_KEY, themeId);
      await this.store.save();
    } catch (error) {
      console.error('Failed to save light theme to Tauri store:', error);
      throw error;
    }
  }

  async getDarkTheme(): Promise<string> {
    try {
      if (!this.store) {
        const webStorage = new WebThemeStorage();
        return await webStorage.getDarkTheme();
      }

      const theme = await this.store.get(this.DARK_THEME_KEY);
      return theme || 'dark-matter';
    } catch (error) {
      console.warn('Failed to load dark theme from Tauri store:', error);
      return 'dark-matter';
    }
  }

  async setDarkTheme(themeId: string): Promise<void> {
    try {
      if (!this.store) {
        const webStorage = new WebThemeStorage();
        return await webStorage.setDarkTheme(themeId);
      }

      await this.store.set(this.DARK_THEME_KEY, themeId);
      await this.store.save();
    } catch (error) {
      console.error('Failed to save dark theme to Tauri store:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      if (!this.store) {
        const webStorage = new WebThemeStorage();
        return await webStorage.clear();
      }

      await this.store.clear();
      await this.store.save();
    } catch (error) {
      console.error('Failed to clear Tauri theme storage:', error);
      throw error;
    }
  }

  private validatePreferences(preferences: any): ThemePreferences {
    return {
      themeMode: ['light', 'dark', 'auto'].includes(preferences.themeMode) 
        ? preferences.themeMode 
        : 'auto',
      lightTheme: preferences.lightTheme || 'ghost',
      darkTheme: preferences.darkTheme || 'dark-matter',
      highContrastTheme: preferences.highContrastTheme || 'high-contrast-light',
      customThemes: preferences.customThemes || {},
      lastUpdated: preferences.lastUpdated || Date.now(),
    };
  }
}

// ==================== CAPACITOR STORAGE ====================

class CapacitorThemeStorage implements ThemeStorage {
  private preferences: any = null;
  private readonly STORAGE_KEY = 'theme-preferences';
  private readonly MODE_KEY = 'theme-mode';
  private readonly LIGHT_THEME_KEY = 'light-theme';
  private readonly DARK_THEME_KEY = 'dark-theme';

  constructor() {
    this.initializePreferences();
  }

  private async initializePreferences() {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { Preferences } = await import('@capacitor/preferences');
        this.preferences = Preferences;
      }
    } catch (error) {
      console.warn('Failed to initialize Capacitor preferences, falling back to localStorage:', error);
      this.preferences = null;
    }
  }

  async getThemePreferences(): Promise<ThemePreferences | null> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.getThemePreferences();
      }

      const { value } = await this.preferences.get({ key: this.STORAGE_KEY });
      if (!value) return null;
      
      const preferences = JSON.parse(value);
      return this.validatePreferences(preferences);
    } catch (error) {
      console.warn('Failed to load theme preferences from Capacitor:', error);
      return null;
    }
  }

  async setThemePreferences(preferences: ThemePreferences): Promise<void> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.setThemePreferences(preferences);
      }

      const validated = this.validatePreferences(preferences);
      await this.preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(validated),
      });
    } catch (error) {
      console.error('Failed to save theme preferences to Capacitor:', error);
      throw error;
    }
  }

  async getThemeMode(): Promise<'light' | 'dark' | 'auto'> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.getThemeMode();
      }

      const { value } = await this.preferences.get({ key: this.MODE_KEY });
      return value || 'auto';
    } catch (error) {
      console.warn('Failed to load theme mode from Capacitor:', error);
      return 'auto';
    }
  }

  async setThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.setThemeMode(mode);
      }

      await this.preferences.set({ key: this.MODE_KEY, value: mode });
    } catch (error) {
      console.error('Failed to save theme mode to Capacitor:', error);
      throw error;
    }
  }

  async getLightTheme(): Promise<string> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.getLightTheme();
      }

      const { value } = await this.preferences.get({ key: this.LIGHT_THEME_KEY });
      return value || 'ghost';
    } catch (error) {
      console.warn('Failed to load light theme from Capacitor:', error);
      return 'ghost';
    }
  }

  async setLightTheme(themeId: string): Promise<void> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.setLightTheme(themeId);
      }

      await this.preferences.set({ key: this.LIGHT_THEME_KEY, value: themeId });
    } catch (error) {
      console.error('Failed to save light theme to Capacitor:', error);
      throw error;
    }
  }

  async getDarkTheme(): Promise<string> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.getDarkTheme();
      }

      const { value } = await this.preferences.get({ key: this.DARK_THEME_KEY });
      return value || 'dark-matter';
    } catch (error) {
      console.warn('Failed to load dark theme from Capacitor:', error);
      return 'dark-matter';
    }
  }

  async setDarkTheme(themeId: string): Promise<void> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.setDarkTheme(themeId);
      }

      await this.preferences.set({ key: this.DARK_THEME_KEY, value: themeId });
    } catch (error) {
      console.error('Failed to save dark theme to Capacitor:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      if (!this.preferences) {
        const webStorage = new WebThemeStorage();
        return await webStorage.clear();
      }

      await this.preferences.remove({ key: this.STORAGE_KEY });
      await this.preferences.remove({ key: this.MODE_KEY });
      await this.preferences.remove({ key: this.LIGHT_THEME_KEY });
      await this.preferences.remove({ key: this.DARK_THEME_KEY });
    } catch (error) {
      console.error('Failed to clear Capacitor theme storage:', error);
      throw error;
    }
  }

  private validatePreferences(preferences: any): ThemePreferences {
    return {
      themeMode: ['light', 'dark', 'auto'].includes(preferences.themeMode) 
        ? preferences.themeMode 
        : 'auto',
      lightTheme: preferences.lightTheme || 'ghost',
      darkTheme: preferences.darkTheme || 'dark-matter',
      highContrastTheme: preferences.highContrastTheme || 'high-contrast-light',
      customThemes: preferences.customThemes || {},
      lastUpdated: preferences.lastUpdated || Date.now(),
    };
  }
}

// ==================== UNIFIED THEME STORAGE ====================

class UnifiedThemeStorage implements ThemeStorage {
  private storage: ThemeStorage;

  constructor() {
    const platform = getPlatform();
    
    switch (platform) {
      case 'desktop':
        this.storage = new TauriThemeStorage();
        break;
      case 'mobile':
        this.storage = new CapacitorThemeStorage();
        break;
      case 'web':
      default:
        this.storage = new WebThemeStorage();
        break;
    }
  }

  async getThemePreferences(): Promise<ThemePreferences | null> {
    return await this.storage.getThemePreferences();
  }

  async setThemePreferences(preferences: ThemePreferences): Promise<void> {
    return await this.storage.setThemePreferences(preferences);
  }

  async getThemeMode(): Promise<'light' | 'dark' | 'auto'> {
    return await this.storage.getThemeMode();
  }

  async setThemeMode(mode: 'light' | 'dark' | 'auto'): Promise<void> {
    return await this.storage.setThemeMode(mode);
  }

  async getLightTheme(): Promise<string> {
    return await this.storage.getLightTheme();
  }

  async setLightTheme(themeId: string): Promise<void> {
    return await this.storage.setLightTheme(themeId);
  }

  async getDarkTheme(): Promise<string> {
    return await this.storage.getDarkTheme();
  }

  async setDarkTheme(themeId: string): Promise<void> {
    return await this.storage.setDarkTheme(themeId);
  }

  async clear(): Promise<void> {
    return await this.storage.clear();
  }
}

// ==================== EXPORTS ====================

export const themeStorage = new UnifiedThemeStorage();

// Default theme preferences
export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  themeMode: 'auto',
  lightTheme: 'ghost',
  darkTheme: 'dark-matter',
  highContrastTheme: 'high-contrast-light',
  customThemes: {},
  lastUpdated: Date.now(),
};
