"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const themes: Record<string, { [key: string]: string }> = {
  // --- LIGHT THEMES ---
  Ghost: {
    "--background": "#ffffff",
    "--foreground": "#1e1e1e",
    "--accent": "#000000",
    "--border": "#e3e4e8",
  },
  Dawn: {
    "--background": "#f8f8f7",
    "--foreground": "#232428",
    "--accent": "#666666",
    "--border": "#e3e4e8",
  },
  Parchment: {
    "--background": "#f5f6fa",
    "--foreground": "#222428",
    "--accent": "#555555",
    "--border": "#e3e4e8",
  },
  Lightening: {
    "--background": "#f9f9f9",
    "--foreground": "#2a2a2a",
    "--accent": "#444444",
    "--border": "#e3e4e8",
  },
  Horizon: {
    "--background": "#f7f7f7",
    "--foreground": "#1b1b1b",
    "--accent": "#333333",
    "--border": "#e3e4e8",
  },
  Snow: {
    "--background": "#f9fbfd",
    "--foreground": "#222",
    "--accent": "#111111",
    "--border": "#e3e4e8",
  },

  // --- DARK THEMES ---
  "Dark Matter": {
    "--background": "#111112",
    "--foreground": "#e0e0e3",
    "--accent": "#ffffff",
    "--border": "#2d2e36",
  },
  Night: {
    "--background": "#1e1e1e",
    "--foreground": "#d4d4d4",
    "--accent": "#cccccc",
    "--border": "#2d2e36",
  },
  "Midnight Drive": {
    "--background": "#18181a",
    "--foreground": "#e5e5ea",
    "--accent": "#bbbbbb",
    "--border": "#2d2e36",
  },
  "Graphite Core": {
    "--background": "#2c2c2e",
    "--foreground": "#f5f5f7",
    "--accent": "#aaaaaa",
    "--border": "#2d2e36",
  },
  Eclipse: {
    "--background": "#1c1c1e",
    "--foreground": "#e5e5ea",
    "--accent": "#999999",
    "--border": "#2d2e36",
  },
  "Neon Pulse": {
    "--background": "#181c24",
    "--foreground": "#e0e0e3",
    "--accent": "#888888",
    "--border": "#2d2e36",
  },
};

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "auto">(
    "light",
  );
  const [lightTheme, setLightTheme] = useState("Ghost");
  const [darkTheme, setDarkTheme] = useState("Dark Matter");
  const [zoom, setZoom] = useState(100);

  // Compute current theme and dark mode status
  const isDarkMode =
    themeMode === "dark" ||
    (themeMode === "auto" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  // CRITICAL: Apply theme CSS variables when theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const themeVars = themes[currentTheme];
    if (themeVars) {
      initializeCSSVariables(themeVars);
      console.log(`🎨 Applied theme: ${currentTheme}`, themeVars);
    } else {
      console.warn(`🎨 Theme not found: ${currentTheme}, using fallback`);
      initializeCSSVariables();
    }
  }, [currentTheme]);

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

  // Load settings from localStorage after mount (client-side only)
  useEffect(() => {
    const stored = safeLocalStorage.getItem("theme-settings");
    if (stored) {
      try {
        const {
          themeMode: storedMode,
          lightTheme,
          darkTheme,
        } = JSON.parse(stored);
        const validModes: Array<"light" | "dark" | "auto"> = [
          "light",
          "dark",
          "auto",
        ];
        if (storedMode && validModes.includes(storedMode)) {
          setThemeMode(storedMode);
        }
        if (lightTheme) setLightTheme(lightTheme);
        if (darkTheme) setDarkTheme(darkTheme);
      } catch (error) {
        // Silent fail
      }
    }

    const savedZoom = safeLocalStorage.getItem("zoom");
    if (savedZoom) {
      try {
        const parsed = parseInt(savedZoom, 10);
        if (!isNaN(parsed) && parsed >= 50 && parsed <= 200) {
          setZoom(parsed);
        }
      } catch (error) {
        // Silent fail
      }
    }
  }, []);

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
