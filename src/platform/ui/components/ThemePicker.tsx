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
    theme?.lightTheme || "Ghost",
  );
  const [selectedDark, setSelectedDark] = React.useState(
    theme?.darkTheme || "Dark Matter",
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
    "Ghost",
    "Rise",
    "Lightening",
    "Parchment",
    "Snow",
    "Horizon",
  ];
  const darkThemes = [
    "Dark Matter",
    "Night",
    "Midnight Drive",
    "Graphite Core",
    "Eclipse",
    "Neon Pulse",
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
                {darkThemes.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedDark(name);
                      theme.setDarkTheme(name);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedDark === name && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(name)}
                    {selectedDark === name && theme['themeMode'] === "auto" && (
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
                {lightThemes.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedLight(name);
                      theme.setLightTheme(name);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedLight === name && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(name)}
                    {selectedLight === name && theme['themeMode'] === "auto" && (
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
                {lightThemes.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedLight(name);
                      theme.setLightTheme(name);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedLight === name && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(name)}
                    {selectedLight === name && theme['themeMode'] === "auto" && (
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
                {darkThemes.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedDark(name);
                      theme.setDarkTheme(name);
                      theme.setThemeMode("auto");
                    }}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                      selectedDark === name && theme['themeMode'] === "auto"
                        ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {formatThemeName(name)}
                    {selectedDark === name && theme['themeMode'] === "auto" && (
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
            {lightThemes.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setSelectedLight(name);
                  theme.setLightTheme(name);
                  theme.setThemeMode("light");
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                  selectedLight === name
                    ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                }`}
              >
                {formatThemeName(name)}
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
            {darkThemes.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setSelectedDark(name);
                  theme.setDarkTheme(name);
                  theme.setThemeMode("dark");
                }}
                className={`p-3 rounded-lg text-sm font-medium transition-colors border ${
                  selectedDark === name
                    ? "bg-[var(--background)] text-[var(--foreground)] border-[var(--accent)] shadow"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
                }`}
              >
                {formatThemeName(name)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
