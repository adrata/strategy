import { ActionPlatformError as IActionPlatformError } from "@/platform/aos/aos";

// Production-ready error class that implements the interface
export class ActionPlatformError extends Error implements IActionPlatformError {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this['name'] = "ActionPlatformError";
    this['code'] = code;
    this['details'] = details;
    this['timestamp'] = new Date().toISOString();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ActionPlatformError.prototype);
  }

  // Factory methods for common error types
  static networkError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("NETWORK_ERROR", message, details);
  }

  static validationError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("VALIDATION_ERROR", message, details);
  }

  static authenticationError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("AUTHENTICATION_ERROR", message, details);
  }

  static authorizationError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("AUTHORIZATION_ERROR", message, details);
  }

  static rateLimitError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("RATE_LIMIT_EXCEEDED", message, details);
  }

  static configurationError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("CONFIGURATION_ERROR", message, details);
  }

  static dataError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("DATA_ERROR", message, details);
  }

  static timeoutError(
    message: string,
    details?: Record<string, unknown>,
  ): ActionPlatformError {
    return new ActionPlatformError("TIMEOUT_ERROR", message, details);
  }

  // Convert to JSON for logging/reporting
  toJSON(): IActionPlatformError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  // Convert to user-friendly message
  toUserMessage(): string {
    switch (this.code) {
      case "NETWORK_ERROR":
        return "Unable to connect. Please try again.";
      case "VALIDATION_ERROR":
        return "The information provided is invalid. Please check your input and try again.";
      case "AUTHENTICATION_ERROR":
        return "Please sign in to continue.";
      case "AUTHORIZATION_ERROR":
        return "You do not have permission to perform this action.";
      case "RATE_LIMIT_EXCEEDED":
        return "Too many requests. Please wait a moment and try again.";
      case "TIMEOUT_ERROR":
        return "The request took too long to complete. Please try again.";
      case "DATA_ERROR":
        return "There was an issue processing your data. Please try again.";
      default:
        return (
          this.message || "An unexpected error occurred. Please try again."
        );
    }
  }

  // Check if error is retriable
  isRetriable(): boolean {
    const retriableCodes = [
      "NETWORK_ERROR",
      "TIMEOUT_ERROR",
      "RATE_LIMIT_EXCEEDED",
    ];
    return retriableCodes.includes(this.code);
  }

  // Get severity level
  getSeverity(): "low" | "medium" | "high" | "critical" {
    switch (this.code) {
      case "NETWORK_ERROR":
      case "TIMEOUT_ERROR":
        return "high";
      case "AUTHENTICATION_ERROR":
      case "AUTHORIZATION_ERROR":
        return "medium";
      case "VALIDATION_ERROR":
        return "low";
      case "CONFIGURATION_ERROR":
      case "DATA_ERROR":
        return "critical";
      default:
        return "medium";
    }
  }
}

// API-specific error for HTTP responses
export class ApiError extends ActionPlatformError {
  public readonly statusCode: number;
  public readonly url?: string;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
    url?: string,
  ) {
    super(code, message, details);
    this['name'] = "ApiError";
    this['statusCode'] = statusCode;
    this['url'] = url;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // Factory methods for HTTP errors
  static badRequest(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message, details);
  }

  static forbidden(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(403, "FORBIDDEN", message, details);
  }

  static notFound(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(404, "NOT_FOUND", message, details);
  }

  static conflict(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(409, "CONFLICT", message, details);
  }

  static tooManyRequests(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(429, "TOO_MANY_REQUESTS", message, details);
  }

  static internalServerError(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message, details);
  }

  static serviceUnavailable(
    message: string,
    details?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(503, "SERVICE_UNAVAILABLE", message, details);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      url: this.url,
    };
  }
}

// Validation error for form/input validation
export class ValidationError extends ActionPlatformError {
  public readonly field?: string;
  public readonly validationErrors: Array<{ field: string; message: string }>;

  constructor(
    field: string | undefined,
    message: string,
    validationErrors: Array<{ field: string; message: string }> = [],
    details?: Record<string, unknown>,
  ) {
    super("VALIDATION_ERROR", message, details);
    this['name'] = "ValidationError";
    this['field'] = field;
    this['validationErrors'] = validationErrors;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  static fromZodError(zodError: any): ValidationError {
    const validationErrors = zodError.errors.map((err: any) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return new ValidationError(
      undefined,
      `Validation failed: ${validationErrors.map((e: { field: string; message: string }) => e.message).join(", ")}`,
      validationErrors,
      { zodError: zodError.errors },
    );
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      validationErrors: this.validationErrors,
    };
  }
}

// Error handler utility functions
export function isActionPlatformError(
  error: unknown,
): error is ActionPlatformError {
  return error instanceof ActionPlatformError;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// Convert any error to ActionPlatformError
export function toActionPlatformError(error: unknown): ActionPlatformError {
  if (isActionPlatformError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ActionPlatformError("UNKNOWN_ERROR", error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new ActionPlatformError("UNKNOWN_ERROR", "An unknown error occurred", {
    originalError: String(error),
  });
}
