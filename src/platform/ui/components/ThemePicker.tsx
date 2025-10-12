"use client";
import React from "react";
import { useTheme } from "./ThemeProvider";

export function ThemePicker() {
  const theme = useTheme();
  const [tab, setTab] = React.useState<"auto" | "light" | "dark">(
    theme?.themeMode === "auto"
      ? "auto"
      : theme?.themeMode === "dark"
        ? "dark"
        : "light",
  );
  const [selectedLight, setSelectedLight] = React.useState(
    theme?.lightTheme || "ghost",
  );
  const [selectedDark, setSelectedDark] = React.useState(
    theme?.darkTheme || "dark-matter",
  );
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">(
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );

  React.useEffect(() => {
    if (!theme || !theme.themes) return;
    theme.setDarkTheme(selectedDark);
    theme.setLightTheme(selectedLight);
    theme.setThemeMode(tab);
  }, [theme, selectedDark, selectedLight, tab]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!theme || !theme.themes) return null;

  const allThemeNames = Object.keys(theme.themes);
  const lightThemes = [
    { id: "ghost", name: "Ghost" },
    { id: "dawn", name: "Dawn" },
    { id: "lightening", name: "Lightening" },
    { id: "parchment", name: "Parchment" },
    { id: "snow", name: "Snow" },
    { id: "horizon", name: "Horizon" },
    { id: "catppuccin-latte", name: "Catppuccin Latte" },
  ];
  const darkThemes = [
    { id: "dark-matter", name: "Dark Matter" },
    { id: "night", name: "Night" },
    { id: "midnight-drive", name: "Midnight Drive" },
    { id: "graphite-core", name: "Graphite Core" },
    { id: "eclipse", name: "Eclipse" },
    { id: "neon-pulse", name: "Neon Pulse" },
    { id: "tokyo-night", name: "Tokyo Night" },
    { id: "tokyo-night-storm", name: "Tokyo Night Storm" },
    { id: "catppuccin-mocha", name: "Catppuccin Mocha" },
    { id: "nord", name: "Nord" },
    { id: "rose-pine", name: "Rosé Pine" },
    { id: "everforest", name: "Everforest" },
    { id: "arc-dark", name: "Arc Dark" },
  ];

  const formatThemeName = (name: string) => name;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setTab("auto")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "auto"
              ? "bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
          }`}
        >
          Auto
        </button>
        <button
          onClick={() => setTab("light")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "light"
              ? "bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
          }`}
        >
          Light
        </button>
        <button
          onClick={() => setTab("dark")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "dark"
              ? "bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] border border-transparent"
          }`}
        >
          Dark
        </button>
      </div>
      {tab === "auto" && (
        <div className="flex flex-col gap-4">
          <div className="mb-2 text-sm text-[var(--muted)]">
            System theme:{" "}
            <span className="font-semibold text-[var(--foreground)]">Auto</span>
          </div>
          {systemTheme === "dark" ? (
            <>
              <div className="mb-1 font-semibold text-[var(--foreground)]">
                Dark Theme (for system dark mode)
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {darkThemes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      setSelectedDark(themeOption.id);
                      theme.setDarkTheme(themeOption.id);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedDark === themeOption.id && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(themeOption.name)}
                    {selectedDark === themeOption.id && theme['themeMode'] === "auto" && (
                      <span className="ml-2 text-xs text-[var(--accent)]">
                        (Active)
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mb-1 font-semibold text-[var(--foreground)]">
                Light Theme (for system light mode)
              </div>
              <div className="grid grid-cols-3 gap-3">
                {lightThemes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      setSelectedLight(themeOption.id);
                      theme.setLightTheme(themeOption.id);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedLight === themeOption.id && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(themeOption.name)}
                    {selectedLight === themeOption.id && theme['themeMode'] === "auto" && (
                      <span className="ml-2 text-xs text-[var(--accent)]">
                        (Active)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-1 font-semibold text-[var(--foreground)]">
                Light Theme (for system light mode)
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {lightThemes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      setSelectedLight(themeOption.id);
                      theme.setLightTheme(themeOption.id);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedLight === themeOption.id && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(themeOption.name)}
                    {selectedLight === themeOption.id && theme['themeMode'] === "auto" && (
                      <span className="ml-2 text-xs text-[var(--accent)]">
                        (Active)
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mb-1 font-semibold text-[var(--foreground)]">
                Dark Theme (for system dark mode)
              </div>
              <div className="grid grid-cols-3 gap-3">
                {darkThemes.map((themeOption) => (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      setSelectedDark(themeOption.id);
                      theme.setDarkTheme(themeOption.id);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedDark === themeOption.id && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(themeOption.name)}
                    {selectedDark === themeOption.id && theme['themeMode'] === "auto" && (
                      <span className="ml-2 text-xs text-[var(--accent)]">
                        (Active)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {tab === "light" && (
        <div className="flex flex-col gap-4">
          <div className="mb-1 font-semibold text-[var(--foreground)]">
            Light Theme
          </div>
          <div className="grid grid-cols-3 gap-3">
            {lightThemes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => {
                  setSelectedLight(themeOption.id);
                  theme.setLightTheme(themeOption.id);
                  theme.setThemeMode("light");
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                  selectedLight === themeOption.id
                    ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                }`}
              >
                {formatThemeName(themeOption.name)}
              </button>
            ))}
          </div>
        </div>
      )}
      {tab === "dark" && (
        <div className="flex flex-col gap-4">
          <div className="mb-1 font-semibold text-[var(--foreground)]">
            Dark Theme
          </div>
          <div className="grid grid-cols-3 gap-3">
            {darkThemes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => {
                  setSelectedDark(themeOption.id);
                  theme.setDarkTheme(themeOption.id);
                  theme.setThemeMode("dark");
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                  selectedDark === themeOption.id
                    ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                }`}
              >
                {formatThemeName(themeOption.name)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
