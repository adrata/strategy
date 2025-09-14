"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { applySafariFixes, loadSafariPolyfills } from "@/platform/utils/safari-fixes";

// Theme Context for light/dark mode
const ThemeContext = createContext<{
  theme: "light" | "dark";
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Apply Safari compatibility fixes
    loadSafariPolyfills();
    applySafariFixes();
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen font-sans antialiased bg-white text-gray-900 overflow-x-hidden transition-colors duration-300">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`min-h-screen font-sans antialiased ${
        theme === 'dark' 
          ? 'bg-gray-950 text-white' 
          : 'bg-white text-gray-900'
        } overflow-x-hidden overflow-y-auto transition-colors duration-300`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeProvider>{children}</ThemeProvider>;
} 