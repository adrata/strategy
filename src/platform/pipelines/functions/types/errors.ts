/**
 * CUSTOM ERROR TYPES
 * 
 * Specific error classes for better error handling
 * Following 2025 best practices for error management
 */

// ============================================================================
// BASE ERROR CLASS
// ============================================================================

export abstract class PipelineError extends Error {
  abstract readonly name: string;
  abstract readonly code: string;
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

export class ValidationError extends PipelineError {
  readonly name = 'ValidationError';
  readonly code = 'VALIDATION_ERROR';
  
  constructor(
    message: string,
    public readonly field: string,
    public readonly value?: any,
    context?: Record<string, any>
  ) {
    super(message, { field, value, ...context });
  }
}

export class RequiredFieldError extends ValidationError {
  readonly name = 'RequiredFieldError';
  readonly code = 'REQUIRED_FIELD_ERROR';
  
  constructor(field: string, context?: Record<string, any>) {
    super(`${field} is required`, field, undefined, context);
  }
}

export class InvalidFormatError extends ValidationError {
  readonly name = 'InvalidFormatError';
  readonly code = 'INVALID_FORMAT_ERROR';
  
  constructor(field: string, value: any, expectedFormat: string, context?: Record<string, any>) {
    super(`${field} has invalid format. Expected: ${expectedFormat}`, field, value, context);
  }
}

// ============================================================================
// API ERRORS
// ============================================================================

export class APIError extends PipelineError {
  readonly name = 'APIError';
  readonly code = 'API_ERROR';
  
  constructor(
    message: string,
    public readonly api: string,
    public readonly statusCode?: number,
    public readonly response?: any,
    context?: Record<string, any>
  ) {
    super(message, { api, statusCode, response, ...context });
  }
}

export class APITimeoutError extends APIError {
  readonly name = 'APITimeoutError';
  readonly code = 'API_TIMEOUT_ERROR';
  
  constructor(api: string, timeoutMs: number, context?: Record<string, any>) {
    super(`API ${api} timed out after ${timeoutMs}ms`, api, 408, undefined, context);
  }
}

export class APIRateLimitError extends APIError {
  readonly name = 'APIRateLimitError';
  readonly code = 'API_RATE_LIMIT_ERROR';
  
  constructor(api: string, retryAfter?: number, context?: Record<string, any>) {
    super(`API ${api} rate limit exceeded`, api, 429, undefined, { retryAfter, ...context });
  }
}

// ============================================================================
// BUSINESS LOGIC ERRORS
// ============================================================================

export class BusinessLogicError extends PipelineError {
  readonly name = 'BusinessLogicError';
  readonly code = 'BUSINESS_LOGIC_ERROR';
  
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

export class InsufficientDataError extends BusinessLogicError {
  readonly name = 'InsufficientDataError';
  readonly code = 'INSUFFICIENT_DATA_ERROR';
  
  constructor(operation: string, requiredFields: string[], context?: Record<string, any>) {
    super(
      `Insufficient data for ${operation}. Required: ${requiredFields.join(', ')}`,
      { operation, requiredFields, ...context }
    );
  }
}

export class ProcessingError extends BusinessLogicError {
  readonly name = 'ProcessingError';
  readonly code = 'PROCESSING_ERROR';
  
  constructor(operation: string, reason: string, context?: Record<string, any>) {
    super(`Failed to process ${operation}: ${reason}`, { operation, reason, ...context });
  }
}

// ============================================================================
// CONFIGURATION ERRORS
// ============================================================================

export class ConfigurationError extends PipelineError {
  readonly name = 'ConfigurationError';
  readonly code = 'CONFIGURATION_ERROR';
  
  constructor(message: string, public readonly configKey?: string, context?: Record<string, any>) {
    super(message, { configKey, ...context });
  }
}

export class MissingConfigurationError extends ConfigurationError {
  readonly name = 'MissingConfigurationError';
  readonly code = 'MISSING_CONFIGURATION_ERROR';
  
  constructor(configKey: string, context?: Record<string, any>) {
    super(`Missing required configuration: ${configKey}`, configKey, context);
  }
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isBusinessLogicError(error: unknown): error is BusinessLogicError {
  return error instanceof BusinessLogicError;
}

export function isConfigurationError(error: unknown): error is ConfigurationError {
  return error instanceof ConfigurationError;
}

export function getErrorCode(error: unknown): string {
  if (error instanceof PipelineError) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

export function getErrorContext(error: unknown): Record<string, any> {
  if (error instanceof PipelineError) {
    return error.context || {};
  }
  return {};
}
