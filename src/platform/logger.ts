/**
 * Centralized Logging Utility
 * Controls log verbosity across the application
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'silent';

class Logger {
  private level: LogLevel = 'warn'; // Default to only show warnings and errors

  constructor() {
    // Set log level based on environment
    if (typeof window !== 'undefined') {
      // Client-side: check localStorage for log level preference
      const savedLevel = localStorage.getItem('adrata-log-level') as LogLevel;
      if (savedLevel && ['error', 'warn', 'info', 'debug', 'silent'].includes(savedLevel)) {
        this.level = savedLevel;
      }
    } else {
      // Server-side: use environment variable
      const envLevel = process.env.ADRATA_LOG_LEVEL as LogLevel;
      if (envLevel && ['error', 'warn', 'info', 'debug', 'silent'].includes(envLevel)) {
        this.level = envLevel;
      }
    }
  }

  setLevel(level: LogLevel) {
    this.level = level;
    if (typeof window !== 'undefined') {
      localStorage.setItem('adrata-log-level', level);
    }
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(`❌ [ADRATA] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(`⚠️ [ADRATA] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(`ℹ️ [ADRATA] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(`🔍 [ADRATA] ${message}`, ...args);
    }
  }

  // Specialized loggers for different components
  api = {
    auth: (message: string, ...args: any[]) => this.debug(`[API AUTH] ${message}`, ...args),
    request: (message: string, ...args: any[]) => this.debug(`[API REQUEST] ${message}`, ...args),
    response: (message: string, ...args: any[]) => this.debug(`[API RESPONSE] ${message}`, ...args),
  };

  workspace = {
    access: (message: string, ...args: any[]) => this.debug(`[WORKSPACE ACCESS] ${message}`, ...args),
    config: (message: string, ...args: any[]) => this.debug(`[WORKSPACE CONFIG] ${message}`, ...args),
  };

  cache = {
    hit: (message: string, ...args: any[]) => this.debug(`[CACHE HIT] ${message}`, ...args),
    miss: (message: string, ...args: any[]) => this.debug(`[CACHE MISS] ${message}`, ...args),
  };

  auth = {
    check: (message: string, ...args: any[]) => this.debug(`[AUTH CHECK] ${message}`, ...args),
    success: (message: string, ...args: any[]) => this.info(`[AUTH SUCCESS] ${message}`, ...args),
    error: (message: string, ...args: any[]) => this.error(`[AUTH ERROR] ${message}`, ...args),
  };

  data = {
    provider: (message: string, ...args: any[]) => this.debug(`[DATA PROVIDER] ${message}`, ...args),
    loading: (message: string, ...args: any[]) => this.debug(`[DATA LOADING] ${message}`, ...args),
  };
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  error: (message: string, ...args: any[]) => logger.error(message, ...args),
  warn: (message: string, ...args: any[]) => logger.warn(message, ...args),
  info: (message: string, ...args: any[]) => logger.info(message, ...args),
  debug: (message: string, ...args: any[]) => logger.debug(message, ...args),
};

// Global function to change log level (useful for debugging)
if (typeof window !== 'undefined') {
  (window as any).setAdrataLogLevel = (level: LogLevel) => {
    logger.setLevel(level);
    console.log(`🔧 [ADRATA] Log level set to: ${level}`);
  };
  
  // Show current log level on load
  console.log(`🔧 [ADRATA] Current log level: ${logger.getLevel()}. Use setAdrataLogLevel('silent') to reduce noise.`);
}
