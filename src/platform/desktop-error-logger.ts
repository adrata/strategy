// EXTREME ERROR LOGGING FOR DESKTOP DEBUGGING
// This will help us track exactly what's happening step by step

import { safeLocalStorage } from "./safe-storage";

export interface ErrorLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  component: string;
  message: string;
  stack?: string;
  context?: any;
  userAgent?: string;
  platform?: string;
  isDesktop?: boolean;
  isTauri?: boolean;
  url?: string;
}

class DesktopErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 1000;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window === "undefined") return;

    // Initialize immediately
    this['initialized'] = true;

    // Log initialization
    this.log("info", "DesktopErrorLogger", "Error logger initialized", {
      userAgent: navigator.userAgent,
      protocol: window.location.protocol,
      pathname: window.location.pathname,
      hasTauri: !!(window as any).__TAURI__,
      hasCapacitor: !!(window as any).Capacitor,
      NODE_ENV: process['env']['NODE_ENV'],
      NEXT_PUBLIC_IS_DESKTOP: process['env']['NEXT_PUBLIC_IS_DESKTOP'],
    });

    // Catch unhandled errors globally
    window.addEventListener("error", (event) => {
      this.log("error", "GlobalErrorHandler", "Unhandled JavaScript error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        error: event.error,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.log("error", "GlobalPromiseHandler", "Unhandled promise rejection", {
        reason: event.reason,
        stack: event.reason?.stack,
        promise: event.promise,
      });
    });

    // Log React errors (will be called by error boundaries)
    (window as any).__DESKTOP_ERROR_LOGGER__ = this;
  }

  log(
    level: ErrorLogEntry["level"],
    component: string,
    message: string,
    context?: any,
  ) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      context,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "server",
      platform: this.detectPlatform(),
      isDesktop: this.isDesktopEnvironment(),
      isTauri: this.isTauriEnvironment(),
      url: typeof window !== "undefined" ? window.location.href : "server",
    };

    if (context?.error) {
      entry['stack'] = context.error.stack || context.error.toString();
    }

    // Add to internal log
    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this['logs'] = this.logs.slice(-this.maxLogs);
    }

    // Console output with better formatting
    const prefix = `[${level.toUpperCase()}][${component}]`;
    const logMessage = `${prefix} ${message}`;

    switch (level) {
      case "error":
        console.error(logMessage, ...(context ? [context] : []));
        break;
      case "warn":
        console.warn(logMessage, ...(context ? [context] : []));
        break;
      case "debug":
        console.debug(logMessage, ...(context ? [context] : []));
        break;
      default:
        console.log(logMessage, ...(context ? [context] : []));
    }

    // Store in localStorage for persistence across reloads (safely)
    try {
      const recentLogs = this.logs.slice(-50); // Keep last 50 logs
      safeLocalStorage.setItem(
        "adrata_desktop_error_logs",
        JSON.stringify(recentLogs),
      );
    } catch (e) {
      // Silent fail - don't break during SSR
    }

    // Critical errors - show immediate feedback
    if (level === "error" && this.isDesktopEnvironment()) {
      this.showDesktopErrorNotification(entry);
    }
  }

  private detectPlatform(): string {
    if (typeof window === "undefined") return "server";

    try {
      if (process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true") return "desktop-build";
      if ((window as any).__TAURI__) return "tauri";
      if ((window as any).Capacitor) return "capacitor";
      if (window['location']['protocol'] === "file:") return "file-protocol";
      return "web";
    } catch {
      return "unknown";
    }
  }

  private isDesktopEnvironment(): boolean {
    if (typeof window === "undefined") return false;

    return !!(
      process['env']['NEXT_PUBLIC_IS_DESKTOP'] === "true" ||
      (window as any).__TAURI__ ||
      window['location']['protocol'] === "file:" ||
      window.location.pathname.includes("index.html")
    );
  }

  private isTauriEnvironment(): boolean {
    return typeof window !== "undefined" && !!(window as any).__TAURI__;
  }

  private showDesktopErrorNotification(entry: ErrorLogEntry) {
    // Visual error notifications are now disabled since the app is working correctly
    // Error logging still happens to console and localStorage for debugging
    console.log(
      "ℹ️ Desktop error logged (notification disabled):",
      entry.component,
      entry.message,
    );
    return;
  }

  // Get all logs for debugging
  getAllLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  // Get logs from localStorage (persisted across reloads)
  getPersistedLogs(): ErrorLogEntry[] {
    try {
      const stored = safeLocalStorage.getItem("adrata_desktop_error_logs");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Silently handle parse errors to prevent promise rejection
      console.warn("Failed to parse persisted logs:", error);
    }
    return [];
  }

  // Clear all logs
  clearLogs() {
    this['logs'] = [];
    safeLocalStorage.removeItem("adrata_desktop_error_logs");
  }

  // Export logs for debugging
  exportLogs(): string {
    const allLogs = {
      currentSession: this.logs,
      persisted: this.getPersistedLogs(),
      meta: {
        timestamp: new Date().toISOString(),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "server",
        platform: this.detectPlatform(),
        url: typeof window !== "undefined" ? window.location.href : "server",
      },
    };

    return JSON.stringify(allLogs, null, 2);
  }
}

// Create singleton instance
const desktopErrorLogger = new DesktopErrorLogger();

// Export logging functions
export const logInfo = (component: string, message: string, context?: any) =>
  desktopErrorLogger.log("info", component, message, context);

export const logWarn = (component: string, message: string, context?: any) =>
  desktopErrorLogger.log("warn", component, message, context);

export const logError = (component: string, message: string, context?: any) =>
  desktopErrorLogger.log("error", component, message, context);

export const logDebug = (component: string, message: string, context?: any) =>
  desktopErrorLogger.log("debug", component, message, context);

// Export logger instance for advanced usage
export { desktopErrorLogger };

// Make it globally available for debugging
if (typeof window !== "undefined") {
  (window as any).__ADRATA_ERROR_LOGGER__ = desktopErrorLogger;
}
