/**
 * STRUCTURED LOGGING SERVICE
 * 
 * Structured logging with context for better observability
 * Following 2025 best practices: JSON logs, trace IDs, correlation
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogContext {
  workspaceId?: string;
  userId?: string;
  companyName?: string;
  enrichmentLevel?: string;
  traceId?: string;
  spanId?: string;
  pipelineName?: string;
  step?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class Logger {
  private context: LogContext = {};

  /**
   * Set global context for all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : {};

    this.log(LogLevel.ERROR, message, { ...context, ...errorContext });
  }

  /**
   * Log fatal error (application crash)
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    } : {};

    this.log(LogLevel.FATAL, message, { ...context, ...errorContext });
  }

  /**
   * Log step execution
   */
  step(stepName: string, action: 'started' | 'completed' | 'failed', context?: LogContext, duration?: number): void {
    const message = `${stepName}.${action}`;
    const logContext = {
      ...context,
      step: stepName,
      duration
    };

    if (action === 'failed') {
      this.error(message, undefined, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  /**
   * Log API call
   */
  apiCall(apiName: string, method: string, status: number, duration: number, context?: LogContext): void {
    this.info('api.call', {
      ...context,
      api: apiName,
      method,
      status,
      duration
    });
  }

  /**
   * Log cost tracking
   */
  cost(apiName: string, callCount: number, estimatedCost: number, context?: LogContext): void {
    this.info('cost.tracked', {
      ...context,
      api: apiName,
      callCount,
      estimatedCost
    });
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context }
    };

    // In production, send to logging service (DataDog, CloudWatch, etc.)
    // For now, use structured console logging
    const logMethod = this.getConsoleMethod(level);
    
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production
      logMethod(JSON.stringify(entry));
    } else {
      // Pretty format for development
      const emoji = this.getEmoji(level);
      const contextStr = Object.keys(entry.context).length > 0 
        ? JSON.stringify(entry.context, null, 2) 
        : '';
      
      logMethod(`${emoji} [${level.toUpperCase()}] ${message}${contextStr ? '\n' + contextStr : ''}`);
    }
  }

  /**
   * Get console method for log level
   */
  private getConsoleMethod(level: LogLevel): (message: string) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Get emoji for log level
   */
  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🐛';
      case LogLevel.INFO:
        return '📋';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.FATAL:
        return '💀';
      default:
        return '📝';
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory for creating child loggers with context
export function createLogger(context: LogContext): Logger {
  const childLogger = new Logger();
  childLogger.setContext(context);
  return childLogger;
}

export default logger;

