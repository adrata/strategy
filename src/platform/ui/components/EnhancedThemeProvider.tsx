/**
 * Enhanced Theme Provider
 * 
 * Integrates the new theme system with the existing ThemeProvider
 * for backward compatibility while adding new features.
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { 
  allThemes, 
  getThemeById, 
  getThemesByCategory, 
  searchThemes,
  type Theme,
  type ThemeCategory 
} from '@/platform/ui/themes/theme-definitions';
import { 
  themeStorage, 
  DEFAULT_THEME_PREFERENCES,
  type ThemePreferences 
} from '@/platform/storage/theme-storage';
import { themeApplier } from '@/platform/ui/themes/theme-applier';
import { getPlatform } from '@/platform/platform-detection';

// ==================== TYPES ====================

interface ThemeManagerState {
  // Current theme state
  themeMode: 'light' | 'dark' | 'auto';
  lightTheme: string;
  darkTheme: string;
  highContrastTheme: string;
  currentTheme: Theme | null;
  isDarkMode: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Available themes
  availableThemes: Theme[];
  lightThemes: Theme[];
  darkThemes: Theme[];
  highContrastThemes: Theme[];
  
  // Search and filtering
  searchQuery: string;
  filteredThemes: Theme[];
  selectedCategory: ThemeCategory | 'all';
}

interface ThemeManagerActions {
  // Theme switching
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => Promise<void>;
  setLightTheme: (themeId: string) => Promise<void>;
  setDarkTheme: (themeId: string) => Promise<void>;
  setHighContrastTheme: (themeId: string) => Promise<void>;
  applyTheme: (themeId: string) => Promise<void>;
  
  // Search and filtering
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ThemeCategory | 'all') => void;
  clearSearch: () => void;
  
  // Utility actions
  refreshThemes: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  clearError: () => void;
}

interface ThemeContextType extends ThemeManagerState, ThemeManagerActions {
  // Legacy API for backward compatibility
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  setLightTheme: (theme: string) => void;
  setDarkTheme: (theme: string) => void;
  
  // Event emitters
  onThemeChange: (callback: (theme: Theme) => void) => () => void;
  onThemeModeChange: (callback: (mode: 'light' | 'dark' | 'auto') => void) => () => void;
}

// ==================== CONTEXT ====================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ==================== ENHANCED THEME PROVIDER ====================

export function EnhancedThemeProvider({ children }: { children: React.ReactNode }) {
  const themeManager = useThemeManager();
  const [themeChangeListeners, setThemeChangeListeners] = useState<Set<(theme: Theme) => void>>(new Set());
  const [themeModeChangeListeners, setThemeModeChangeListeners] = useState<Set<(mode: 'light' | 'dark' | 'auto') => void>>(new Set());

  // ==================== EVENT EMITTERS ====================

  const onThemeChange = useCallback((callback: (theme: Theme) => void) => {
    setThemeChangeListeners(prev => new Set(prev).add(callback));
    
    // Return cleanup function
    return () => {
      setThemeChangeListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  const onThemeModeChange = useCallback((callback: (mode: 'light' | 'dark' | 'auto') => void) => {
    setThemeModeChangeListeners(prev => new Set(prev).add(callback));
    
    // Return cleanup function
    return () => {
      setThemeModeChangeListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  // ==================== ENHANCED ACTIONS ====================

  const applyTheme = useCallback(async (themeId: string) => {
    try {
      await themeManager.applyTheme(themeId);
      
      // Notify listeners
      if (themeManager.currentTheme) {
        themeChangeListeners.forEach(callback => callback(themeManager.currentTheme!));
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, [themeManager, themeChangeListeners]);

  const setThemeMode = useCallback(async (mode: 'light' | 'dark' | 'auto') => {
    try {
      await themeManager.setThemeMode(mode);
      
      // Notify listeners
      themeModeChangeListeners.forEach(callback => callback(mode));
    } catch (error) {
      console.error('Failed to set theme mode:', error);
    }
  }, [themeManager, themeModeChangeListeners]);

  const setLightTheme = useCallback(async (theme: string) => {
    try {
      await themeManager.setLightTheme(theme);
    } catch (error) {
      console.error('Failed to set light theme:', error);
    }
  }, [themeManager]);

  const setDarkTheme = useCallback(async (theme: string) => {
    try {
      await themeManager.setDarkTheme(theme);
    } catch (error) {
      console.error('Failed to set dark theme:', error);
    }
  }, [themeManager]);

  const refreshThemes = useCallback(async () => {
    try {
      await themeManager.refreshThemes();
    } catch (error) {
      console.error('Failed to refresh themes:', error);
    }
  }, [themeManager]);

  // ==================== EFFECTS ====================

  // Notify listeners when theme changes
  useEffect(() => {
    if (themeManager.currentTheme) {
      themeChangeListeners.forEach(callback => callback(themeManager.currentTheme!));
    }
  }, [themeManager.currentTheme, themeChangeListeners]);

  // Notify listeners when theme mode changes
  useEffect(() => {
    themeModeChangeListeners.forEach(callback => callback(themeManager.themeMode));
  }, [themeManager.themeMode, themeModeChangeListeners]);

  // ==================== CONTEXT VALUE ====================

  const contextValue: ThemeContextType = {
    // Legacy API
    themeMode: themeManager.themeMode,
    lightTheme: themeManager.lightTheme,
    darkTheme: themeManager.darkTheme,
    setThemeMode,
    setLightTheme,
    setDarkTheme,
    
    // Enhanced API
    currentTheme: themeManager.currentTheme,
    isDarkMode: themeManager.isDarkMode,
    isLoading: themeManager.isLoading,
    error: themeManager.error,
    
    // Theme actions
    applyTheme,
    refreshThemes,
    
    // Event emitters
    onThemeChange,
    onThemeModeChange,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ==================== HOOKS ====================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within an EnhancedThemeProvider');
  }
  return context;
}

// Legacy hook for backward compatibility
export function useLegacyTheme() {
  const { themeMode, lightTheme, darkTheme, setThemeMode, setLightTheme, setDarkTheme } = useTheme();
  return {
    themeMode,
    lightTheme,
    darkTheme,
    setThemeMode,
    setLightTheme,
    setDarkTheme,
  };
}

// Enhanced hook with new features
export function useEnhancedTheme() {
  const theme = useTheme();
  return {
    ...theme,
    // Additional convenience methods
    isLightMode: theme.themeMode === 'light',
    isAutoMode: theme.themeMode === 'auto',
    hasError: !!theme.error,
    clearError: () => {
      // This would need to be implemented in the theme manager
      console.warn('clearError not yet implemented');
    },
  };
}

// ==================== EXPORTS ====================

export default EnhancedThemeProvider;
