/**
 * STRUCTURED LOGGING UTILITY
 * 
 * Provides consistent, structured logging across the application
 * Replaces console.log statements with proper logging levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private currentLevel: LogLevel;
  private service: string;

  constructor(service: string = 'adrata', level: LogLevel = LogLevel.INFO) {
    this.service = service;
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatLog(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const service = entry.service || this.service;
    const requestId = entry.requestId ? `[${entry.requestId}]` : '';
    const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
    const error = entry.error ? ` ERROR: ${entry.error.name}: ${entry.error.message}` : '';

    return `${timestamp} [${levelName}] ${service}${requestId}: ${entry.message}${metadata}${error}`;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    const formattedLog = this.formatLog(entry);

    // Use appropriate console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  // Convenience methods for common patterns
  apiCall(method: string, endpoint: string, requestId?: string, metadata?: Record<string, any>): void {
    this.info(`API ${method} ${endpoint}`, { requestId, ...metadata });
  }

  apiSuccess(method: string, endpoint: string, statusCode: number, requestId?: string, metadata?: Record<string, any>): void {
    this.info(`API ${method} ${endpoint} - ${statusCode}`, { requestId, statusCode, ...metadata });
  }

  apiError(method: string, endpoint: string, error: Error, requestId?: string, metadata?: Record<string, any>): void {
    this.error(`API ${method} ${endpoint} failed`, error, { requestId, ...metadata });
  }

  processingStart(operation: string, requestId?: string, metadata?: Record<string, any>): void {
    this.info(`Starting ${operation}`, { requestId, ...metadata });
  }

  processingComplete(operation: string, duration: number, requestId?: string, metadata?: Record<string, any>): void {
    this.info(`Completed ${operation}`, { requestId, duration, ...metadata });
  }

  processingError(operation: string, error: Error, requestId?: string, metadata?: Record<string, any>): void {
    this.error(`${operation} failed`, error, { requestId, ...metadata });
  }

  dataQuality(service: string, quality: number, requestId?: string, metadata?: Record<string, any>): void {
    const level = quality >= 75 ? LogLevel.INFO : quality >= 50 ? LogLevel.WARN : LogLevel.ERROR;
    this.log(level, `Data quality: ${quality}%`, { requestId, service, quality, ...metadata });
  }

  salesIntent(company: string, score: number, level: string, requestId?: string, metadata?: Record<string, any>): void {
    this.info(`Sales intent: ${company} - ${score}/100 (${level})`, { requestId, company, score, level, ...metadata });
  }
}

// Create service-specific loggers
export const createLogger = (service: string): Logger => new Logger(service);

// Default logger
export const logger = new Logger('adrata');

// Service-specific loggers
export const pdlLogger = createLogger('pdl-service');
export const coreSignalLogger = createLogger('coresignal-service');
export const aiLogger = createLogger('ai-service');
export const apiLogger = createLogger('api');
export const pipelineLogger = createLogger('pipeline');
