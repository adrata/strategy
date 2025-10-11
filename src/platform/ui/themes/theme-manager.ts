/**
 * Theme Manager
 * 
 * Centralized theme management service with hooks and state management.
 * Provides real-time theme switching, persistence, and event handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  allThemes, 
  getThemeById, 
  getThemesByCategory, 
  searchThemes,
  type Theme,
  type ThemeCategory 
} from './theme-definitions';
import { 
  themeStorage, 
  DEFAULT_THEME_PREFERENCES,
  type ThemePreferences 
} from '@/platform/storage/theme-storage';
import { getPlatform } from '@/platform/platform-detection';

// ==================== TYPES ====================

export interface ThemeManagerState {
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

export interface ThemeManagerActions {
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

export interface ThemeManager extends ThemeManagerState, ThemeManagerActions {}

// ==================== THEME MANAGER HOOK ====================

export function useThemeManager(): ThemeManager {
  const [state, setState] = useState<ThemeManagerState>({
    themeMode: 'auto',
    lightTheme: 'ghost',
    darkTheme: 'dark-matter',
    highContrastTheme: 'high-contrast-light',
    currentTheme: null,
    isDarkMode: false,
    isLoading: true,
    error: null,
    availableThemes: allThemes,
    lightThemes: getThemesByCategory('light'),
    darkThemes: getThemesByCategory('dark'),
    highContrastThemes: getThemesByCategory('high-contrast'),
    searchQuery: '',
    filteredThemes: allThemes,
    selectedCategory: 'all',
  });

  const isInitialized = useRef(false);
  const systemThemeListener = useRef<MediaQueryList | null>(null);

  // ==================== INITIALIZATION ====================

  const initializeThemeManager = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load preferences from storage
      const preferences = await themeStorage.getThemePreferences();
      const themePrefs = preferences || DEFAULT_THEME_PREFERENCES;

      // Determine current theme based on mode
      let currentTheme: Theme | null = null;
      let isDarkMode = false;

      if (themePrefs.themeMode === 'auto') {
        // Check system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkMode = systemPrefersDark;
        currentTheme = getThemeById(isDarkMode ? themePrefs.darkTheme : themePrefs.lightTheme) || null;
      } else {
        isDarkMode = themePrefs.themeMode === 'dark';
        currentTheme = getThemeById(isDarkMode ? themePrefs.darkTheme : themePrefs.lightTheme) || null;
      }

      // Update state
      setState(prev => ({
        ...prev,
        themeMode: themePrefs.themeMode,
        lightTheme: themePrefs.lightTheme,
        darkTheme: themePrefs.darkTheme,
        highContrastTheme: themePrefs.highContrastTheme,
        currentTheme,
        isDarkMode,
        isLoading: false,
      }));

      // Apply theme to DOM
      if (currentTheme) {
        await applyThemeToDOM(currentTheme);
      }

      isInitialized.current = true;
    } catch (error) {
      console.error('Failed to initialize theme manager:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize themes',
        isLoading: false,
      }));
    }
  }, []);

  // ==================== SYSTEM THEME LISTENER ====================

  const setupSystemThemeListener = useCallback(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeListener.current = mediaQuery;

    const handleSystemThemeChange = async () => {
      if (!isInitialized.current) return;

      setState(prev => {
        if (prev.themeMode !== 'auto') return prev;

        const isDarkMode = mediaQuery.matches;
        const currentTheme = getThemeById(isDarkMode ? prev.darkTheme : prev.lightTheme);

        if (currentTheme) {
          applyThemeToDOM(currentTheme);
        }

        return {
          ...prev,
          isDarkMode,
          currentTheme,
        };
      });
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // ==================== THEME APPLICATION ====================

  const applyThemeToDOM = useCallback(async (theme: Theme) => {
    if (typeof document === 'undefined') return;

    try {
      const root = document.documentElement;
      
      // Apply CSS variables
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      });

      // Update document class for theme-specific styling
      root.className = root.className.replace(/theme-\w+/g, '');
      root.classList.add(`theme-${theme.id}`);

      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme.colors.background);
      }

      // Update scrollbar colors
      updateScrollbarColors(theme.colors.scrollbarThumb);

    } catch (error) {
      console.error('Failed to apply theme to DOM:', error);
    }
  }, []);

  const updateScrollbarColors = useCallback((thumbColor: string) => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.id = 'theme-scrollbar-styles';
    
    // Remove existing scrollbar styles
    const existingStyle = document.getElementById('theme-scrollbar-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    style.textContent = `
      ::-webkit-scrollbar-thumb {
        background: ${thumbColor} !important;
      }
      * {
        scrollbar-color: ${thumbColor} transparent !important;
      }
    `;

    document.head.appendChild(style);
  }, []);

  // ==================== ACTIONS ====================

  const setThemeMode = useCallback(async (mode: 'light' | 'dark' | 'auto') => {
    try {
      await themeStorage.setThemeMode(mode);
      
      let currentTheme: Theme | null = null;
      let isDarkMode = false;

      if (mode === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkMode = systemPrefersDark;
        currentTheme = getThemeById(isDarkMode ? state.darkTheme : state.lightTheme) || null;
      } else {
        isDarkMode = mode === 'dark';
        currentTheme = getThemeById(isDarkMode ? state.darkTheme : state.lightTheme) || null;
      }

      setState(prev => ({
        ...prev,
        themeMode: mode,
        currentTheme,
        isDarkMode,
      }));

      if (currentTheme) {
        await applyThemeToDOM(currentTheme);
      }
    } catch (error) {
      console.error('Failed to set theme mode:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set theme mode',
      }));
    }
  }, [state.darkTheme, state.lightTheme, applyThemeToDOM]);

  const setLightTheme = useCallback(async (themeId: string) => {
    try {
      await themeStorage.setLightTheme(themeId);
      
      setState(prev => {
        const newLightTheme = themeId;
        const currentTheme = !prev.isDarkMode ? getThemeById(themeId) : prev.currentTheme;
        
        if (currentTheme && !prev.isDarkMode) {
          applyThemeToDOM(currentTheme);
        }

        return {
          ...prev,
          lightTheme: newLightTheme,
          currentTheme,
        };
      });
    } catch (error) {
      console.error('Failed to set light theme:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set light theme',
      }));
    }
  }, [applyThemeToDOM]);

  const setDarkTheme = useCallback(async (themeId: string) => {
    try {
      await themeStorage.setDarkTheme(themeId);
      
      setState(prev => {
        const newDarkTheme = themeId;
        const currentTheme = prev.isDarkMode ? getThemeById(themeId) : prev.currentTheme;
        
        if (currentTheme && prev.isDarkMode) {
          applyThemeToDOM(currentTheme);
        }

        return {
          ...prev,
          darkTheme: newDarkTheme,
          currentTheme,
        };
      });
    } catch (error) {
      console.error('Failed to set dark theme:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set dark theme',
      }));
    }
  }, [applyThemeToDOM]);

  const setHighContrastTheme = useCallback(async (themeId: string) => {
    try {
      const preferences = await themeStorage.getThemePreferences() || DEFAULT_THEME_PREFERENCES;
      const updatedPreferences = {
        ...preferences,
        highContrastTheme: themeId,
        lastUpdated: Date.now(),
      };
      
      await themeStorage.setThemePreferences(updatedPreferences);
      
      setState(prev => ({
        ...prev,
        highContrastTheme: themeId,
      }));
    } catch (error) {
      console.error('Failed to set high contrast theme:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set high contrast theme',
      }));
    }
  }, []);

  const applyTheme = useCallback(async (themeId: string) => {
    try {
      const theme = getThemeById(themeId);
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      // Determine which theme setting to update
      if (theme.category === 'light') {
        await setLightTheme(themeId);
      } else if (theme.category === 'dark') {
        await setDarkTheme(themeId);
      } else if (theme.category === 'high-contrast') {
        await setHighContrastTheme(themeId);
      }

      // Apply immediately if it matches current mode
      setState(prev => {
        const shouldApply = 
          (theme.category === 'light' && !prev.isDarkMode) ||
          (theme.category === 'dark' && prev.isDarkMode) ||
          (theme.category === 'high-contrast');

        if (shouldApply) {
          applyThemeToDOM(theme);
          return {
            ...prev,
            currentTheme: theme,
          };
        }

        return prev;
      });
    } catch (error) {
      console.error('Failed to apply theme:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to apply theme',
      }));
    }
  }, [setLightTheme, setDarkTheme, setHighContrastTheme, applyThemeToDOM]);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => {
      const filteredThemes = query.trim() 
        ? searchThemes(query)
        : prev.selectedCategory === 'all'
          ? allThemes
          : getThemesByCategory(prev.selectedCategory);

      return {
        ...prev,
        searchQuery: query,
        filteredThemes,
      };
    });
  }, []);

  const setSelectedCategory = useCallback((category: ThemeCategory | 'all') => {
    setState(prev => {
      const filteredThemes = prev.searchQuery.trim()
        ? searchThemes(prev.searchQuery)
        : category === 'all'
          ? allThemes
          : getThemesByCategory(category);

      return {
        ...prev,
        selectedCategory: category,
        filteredThemes,
      };
    });
  }, []);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      filteredThemes: prev.selectedCategory === 'all' 
        ? allThemes 
        : getThemesByCategory(prev.selectedCategory),
    }));
  }, []);

  const refreshThemes = useCallback(async () => {
    await initializeThemeManager();
  }, [initializeThemeManager]);

  const resetToDefaults = useCallback(async () => {
    try {
      await themeStorage.clear();
      await initializeThemeManager();
    } catch (error) {
      console.error('Failed to reset themes to defaults:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to reset themes',
      }));
    }
  }, [initializeThemeManager]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ==================== EFFECTS ====================

  useEffect(() => {
    initializeThemeManager();
  }, [initializeThemeManager]);

  useEffect(() => {
    const cleanup = setupSystemThemeListener();
    return cleanup;
  }, [setupSystemThemeListener]);

  // ==================== RETURN ====================

  return {
    // State
    ...state,
    
    // Actions
    setThemeMode,
    setLightTheme,
    setDarkTheme,
    setHighContrastTheme,
    applyTheme,
    setSearchQuery,
    setSelectedCategory,
    clearSearch,
    refreshThemes,
    resetToDefaults,
    clearError,
  };
}

// ==================== UTILITY HOOKS ====================

export function useCurrentTheme(): Theme | null {
  const { currentTheme } = useThemeManager();
  return currentTheme;
}

export function useThemeMode(): 'light' | 'dark' | 'auto' {
  const { themeMode } = useThemeManager();
  return themeMode;
}

export function useIsDarkMode(): boolean {
  const { isDarkMode } = useThemeManager();
  return isDarkMode;
}

export function useThemeSearch(): {
  searchQuery: string;
  filteredThemes: Theme[];
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
} {
  const { searchQuery, filteredThemes, setSearchQuery, clearSearch } = useThemeManager();
  return { searchQuery, filteredThemes, setSearchQuery, clearSearch };
}

// ==================== EXPORTS ====================

export { allThemes, getThemeById, getThemesByCategory, searchThemes };
export type { Theme, ThemeCategory };
