"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { allThemes } from '@/platform/ui/themes/theme-definitions';
import { themeApplier } from '@/platform/ui/themes/theme-applier-2025';

// Convert theme definitions to CSS variables format for compatibility
const themes: Record<string, { [key: string]: string }> = {};

allThemes.forEach(theme => {
  themes[theme.id] = {
    "--background": theme.colors.background,
    "--foreground": theme.colors.foreground,
    "--accent": theme.colors.accent,
    "--border": theme.colors.border,
    "--muted": theme.colors.muted,
    "--muted-light": theme.colors.mutedLight,
    "--loading-bg": theme.colors.loadingBg,
    "--hover": theme.colors.hover,
    "--button-text": theme.colors.buttonText,
    "--button-background": theme.colors.buttonBackground,
    "--button-hover": theme.colors.buttonHover,
    "--button-active": theme.colors.buttonActive,
    "--success": theme.colors.success,
    "--warning": theme.colors.warning,
    "--error": theme.colors.error,
    "--info": theme.colors.info,
    "--badge-new-bg": theme.colors.badgeNewBg,
    "--badge-new-text": theme.colors.badgeNewText,
    "--badge-contacted-bg": theme.colors.badgeContactedBg,
    "--badge-contacted-text": theme.colors.badgeContactedText,
    "--badge-qualified-bg": theme.colors.badgeQualifiedBg,
    "--badge-qualified-text": theme.colors.badgeQualifiedText,
    "--badge-lost-bg": theme.colors.badgeLostBg,
    "--badge-lost-text": theme.colors.badgeLostText,
    "--active-app-border": theme.colors.activeAppBorder,
    "--panel-background": theme.colors.panelBackground,
    "--scrollbar-thumb": theme.colors.scrollbarThumb,
    "--focus-ring": theme.colors.focusRing,
    "--focus-ring-width": theme.colors.focusRingWidth,
  };
});

// CRITICAL: Ensure CSS variables are always available
const initializeCSSVariables = (themeVars?: Record<string, string>) => {
  if (typeof document === "undefined") return;

  try {
    // Set fallback values first
    const fallbackVars = {
      "--background": "#ffffff",
      "--foreground": "#171717",
      "--accent": "#ff9800",
      "--border": "#e3e4e8",
    };

    const varsToApply = themeVars || fallbackVars;

    for (const [key, value] of Object.entries(varsToApply)) {
      document.documentElement.style.setProperty(key, value);
    }
  } catch (error) {
    console.error("Failed to initialize CSS variables:", error);
  }
};

// Initialize CSS variables immediately on module load
if (typeof window !== "undefined") {
  initializeCSSVariables();
}

export interface ThemeSettings {
  themeMode: "light" | "dark" | "auto";
  lightTheme: string;
  darkTheme: string;
}

export interface ZoomSettings {
  zoom: number;
  setZoom: (zoom: number) => void;
}

interface ThemeContextType extends ThemeSettings, ZoomSettings {
  setThemeMode: (mode: "light" | "dark" | "auto") => void;
  setLightTheme: (theme: string) => void;
  setDarkTheme: (theme: string) => void;
  currentTheme: string;
  isDarkMode: boolean;
  themes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Silent fail
    }
  },
};

// Get initial theme settings from data attributes set by blocking script
const getInitialThemeSettings = () => {
  if (typeof window === "undefined") {
    return {
      themeMode: "light" as const,
      lightTheme: "ghost",
      darkTheme: "dark-matter",
      zoom: 100,
    };
  }

  try {
    // Read from data attributes set by blocking script
    const themeMode = document.documentElement.getAttribute('data-theme-mode') as "light" | "dark" | "auto" || "light";
    const lightTheme = document.documentElement.getAttribute('data-light-theme') || "ghost";
    const darkTheme = document.documentElement.getAttribute('data-dark-theme') || "dark-matter";
    
    // Get zoom from localStorage (not set by blocking script to avoid flash)
    const savedZoom = safeLocalStorage.getItem("zoom");
    const zoom = savedZoom ? parseInt(savedZoom, 10) : 100;
    
    return {
      themeMode,
      lightTheme,
      darkTheme,
      zoom: isNaN(zoom) || zoom < 50 || zoom > 200 ? 100 : zoom,
    };
  } catch (error) {
    return {
      themeMode: "light" as const,
      lightTheme: "ghost",
      darkTheme: "dark-matter",
      zoom: 100,
    };
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with settings from blocking script
  const initialSettings = getInitialThemeSettings();
  
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "auto">(
    initialSettings.themeMode,
  );
  const [lightTheme, setLightTheme] = useState(initialSettings.lightTheme);
  const [darkTheme, setDarkTheme] = useState(initialSettings.darkTheme);
  const [zoom, setZoom] = useState(initialSettings.zoom);

  // Compute current theme and dark mode status
  const isDarkMode =
    themeMode === "dark" ||
    (themeMode === "auto" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // CRITICAL: Apply theme using 2025 theme applier
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if this is the initial load (no transitions to prevent flash)
    const isInitialLoad = !document.documentElement.hasAttribute('data-theme-applied');
    
    // Use the modern theme applier
    themeApplier.applyTheme(currentTheme, {
      enableTransitions: !isInitialLoad, // Disable transitions on initial load
      transitionDuration: 200,
      persistToStorage: false, // ThemeProvider handles persistence
      updateSystemTheme: true
    }).then(success => {
      if (success) {
        console.log(`🎨 Theme applied successfully: ${currentTheme}`);
        
        // CRITICAL: Ensure Tailwind dark mode is synced
        const root = document.documentElement;
        if (isDarkMode) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // Mark that theme has been applied
        root.setAttribute('data-theme-applied', 'true');
      } else {
        console.warn(`🎨 Failed to apply theme: ${currentTheme}`);
        // Fallback to legacy method
        const themeVars = themes[currentTheme];
        if (themeVars) {
          initializeCSSVariables(themeVars);
        } else {
          initializeCSSVariables();
        }
        
        // Ensure dark mode sync even in fallback
        const root = document.documentElement;
        if (isDarkMode) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // Mark that theme has been applied
        root.setAttribute('data-theme-applied', 'true');
      }
    });
  }, [currentTheme, isDarkMode]);

  // CRITICAL: Listen to system theme changes for auto mode
  useEffect(() => {
    if (themeMode !== "auto") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Force re-render when system theme changes in auto mode
      console.log("🎨 System theme changed, updating auto theme");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themeMode]);

  // No need to load from localStorage - already initialized from blocking script

  // Save settings to localStorage when they change
  useEffect(() => {
    safeLocalStorage.setItem(
      "theme-settings",
      JSON.stringify({ themeMode, lightTheme, darkTheme }),
    );
  }, [themeMode, lightTheme, darkTheme]);

  useEffect(() => {
    safeLocalStorage.setItem("zoom", String(zoom));
  }, [zoom]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        lightTheme,
        setLightTheme,
        darkTheme,
        setDarkTheme,
        currentTheme,
        isDarkMode,
        themes,
        zoom,
        setZoom,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// Zoom functionality moved to separate file to avoid circular dependencies
// Import from: @/platform/ui/components/ZoomProvider
