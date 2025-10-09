/**
 * Desktop Error Logger
 * 
 * Provides centralized error logging functionality for desktop applications
 * with support for both Tauri and web environments.
 */

export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent?: string;
  url?: string;
  platform: 'tauri-desktop' | 'web';
  environmentVars: Record<string, string | undefined>;
  windowGlobals?: Record<string, any>;
  commonIssues?: Record<string, boolean>;
  metadata?: Record<string, any>;
}

export interface InfoLogEntry {
  timestamp: string;
  level: 'info';
  message: string;
  metadata?: Record<string, any>;
}

class DesktopErrorLogger {
  private logs: (ErrorLogEntry | InfoLogEntry)[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  /**
   * Log an error with detailed context
   */
  logError(
    message: string,
    error?: Error,
    errorInfo?: any,
    metadata?: Record<string, any>
  ): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      platform: this.detectPlatform(),
      environmentVars: this.getEnvironmentVars(),
      windowGlobals: this.getWindowGlobals(),
      commonIssues: this.detectCommonIssues(),
      metadata,
    };

    this.addLog(logEntry);
    this.outputToConsole(logEntry);
  }

  /**
   * Log an info message
   */
  logInfo(message: string, metadata?: Record<string, any>): void {
    const logEntry: InfoLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      metadata,
    };

    this.addLog(logEntry);
    this.outputToConsole(logEntry);
  }

  /**
   * Log a warning
   */
  logWarn(message: string, metadata?: Record<string, any>): void {
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      platform: this.detectPlatform(),
      environmentVars: this.getEnvironmentVars(),
      windowGlobals: this.getWindowGlobals(),
      commonIssues: this.detectCommonIssues(),
      metadata,
    };

    this.addLog(logEntry);
    this.outputToConsole(logEntry);
  }

  /**
   * Get all logs
   */
  getLogs(): (ErrorLogEntry | InfoLogEntry)[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  private addLog(logEntry: ErrorLogEntry | InfoLogEntry): void {
    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private outputToConsole(logEntry: ErrorLogEntry | InfoLogEntry): void {
    const prefix = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}]`;
    
    if (logEntry.level === 'error') {
      console.error(`${prefix} ${logEntry.message}`, {
        stack: (logEntry as ErrorLogEntry).stack,
        componentStack: (logEntry as ErrorLogEntry).componentStack,
        platform: (logEntry as ErrorLogEntry).platform,
        metadata: logEntry.metadata,
      });
    } else if (logEntry.level === 'warn') {
      console.warn(`${prefix} ${logEntry.message}`, logEntry.metadata);
    } else {
      console.log(`${prefix} ${logEntry.message}`, logEntry.metadata);
    }
  }

  private detectPlatform(): 'tauri-desktop' | 'web' {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      return 'tauri-desktop';
    }
    return 'web';
  }

  private getEnvironmentVars(): Record<string, string | undefined> {
    return {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_IS_DESKTOP: process.env.NEXT_PUBLIC_IS_DESKTOP,
      NEXT_PUBLIC_USE_STATIC_EXPORT: process.env.NEXT_PUBLIC_USE_STATIC_EXPORT,
      TAURI_BUILD: process.env.TAURI_BUILD,
    };
  }

  private getWindowGlobals(): Record<string, any> | undefined {
    if (typeof window === 'undefined') return undefined;

    return {
      hasTauri: !!(window as any).__TAURI__,
      hasTauriMetadata: !!(window as any).__TAURI_METADATA__,
      hasLocalStorage: typeof localStorage !== 'undefined',
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
    };
  }

  private detectCommonIssues(): Record<string, boolean> {
    return {
      isFileProtocol: typeof window !== 'undefined' ? window.location.protocol === 'file:' : false,
      hasIndexHtml: typeof window !== 'undefined' ? window.location.pathname.includes('index.html') : false,
      missingEnvVars: !process.env.NODE_ENV,
      possibleStaticExportIssue:
        process.env.NEXT_PUBLIC_USE_STATIC_EXPORT === 'true' &&
        typeof window !== 'undefined' &&
        window.location.protocol === 'file:',
    };
  }
}

// Create singleton instance
export const desktopErrorLogger = new DesktopErrorLogger();

// Convenience functions
export function logError(
  message: string,
  error?: Error,
  errorInfo?: any,
  metadata?: Record<string, any>
): void {
  desktopErrorLogger.logError(message, error, errorInfo, metadata);
}

export function logInfo(message: string, metadata?: Record<string, any>): void {
  desktopErrorLogger.logInfo(message, metadata);
}

export function logWarn(message: string, metadata?: Record<string, any>): void {
  desktopErrorLogger.logWarn(message, metadata);
}

// Export the class for advanced usage
export { DesktopErrorLogger };
