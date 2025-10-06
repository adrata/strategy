/**
 * Production Logger Utility
 * 
 * Provides environment-aware logging that:
 * - Suppresses debug logs in production
 * - Allows critical logs in production
 * - Maintains development debugging capabilities
 */

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Production-aware logger that suppresses debug logs in production
 */
export class ProductionLogger {
  private static instance: ProductionLogger;
  private isProduction: boolean;
  private isDevelopment: boolean;

  private constructor() {
    this.isProduction = isProduction;
    this.isDevelopment = isDevelopment;
  }

  public static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info logging - only in development
   */
  info(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning logging - always shown (important for production issues)
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`⚠️ [WARN] ${message}`, ...args);
  }

  /**
   * Error logging - always shown (critical for production issues)
   */
  error(message: string, ...args: any[]): void {
    console.error(`❌ [ERROR] ${message}`, ...args);
  }

  /**
   * Critical logging - always shown (essential for production monitoring)
   */
  critical(message: string, ...args: any[]): void {
    console.error(`🚨 [CRITICAL] ${message}`, ...args);
  }

  /**
   * Performance logging - only in development
   */
  performance(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`⚡ [PERF] ${message}`, ...args);
    }
  }

  /**
   * Security logging - always shown (critical for security monitoring)
   */
  security(message: string, ...args: any[]): void {
    console.warn(`🔒 [SECURITY] ${message}`, ...args);
  }

  /**
   * Authentication logging - only in development
   */
  auth(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🔐 [AUTH] ${message}`, ...args);
    }
  }

  /**
   * API logging - only in development
   */
  api(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🌐 [API] ${message}`, ...args);
    }
  }

  /**
   * Database logging - only in development
   */
  database(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🗄️ [DB] ${message}`, ...args);
    }
  }

  /**
   * Platform detection logging - only in development
   */
  platform(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🔍 [PLATFORM] ${message}`, ...args);
    }
  }

  /**
   * Notification logging - only in development
   */
  notifications(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`🔔 [NOTIFICATIONS] ${message}`, ...args);
    }
  }

  /**
   * Error boundary logging - always shown (critical for error tracking)
   */
  errorBoundary(message: string, ...args: any[]): void {
    console.error(`🛡️ [ERROR_BOUNDARY] ${message}`, ...args);
  }
}

// Export singleton instance
export const logger = ProductionLogger.getInstance();

// Export individual methods for convenience
export const {
  debug,
  info,
  warn,
  error,
  critical,
  performance,
  security,
  auth,
  api,
  database,
  platform,
  notifications,
  errorBoundary,
} = logger;

// Export default logger
export default logger;
