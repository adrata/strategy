/**
 * Platform Logger
 * Centralized logging utility for the platform
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${this.context}:`, message, data);
    }
  }

  info(message: string, data?: any) {
    console.log(`[INFO] ${this.context}:`, message, data);
  }

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${this.context}:`, message, data);
  }

  error(message: string, error?: any) {
    console.error(`[ERROR] ${this.context}:`, message, error);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}