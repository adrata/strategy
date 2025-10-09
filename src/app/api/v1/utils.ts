import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ApiV1Response, ApiV1ErrorResponse, ApiV1SuccessResponse, ApiV1ErrorCode } from './types';

/**
 * Utility functions for API v1
 */

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiV1SuccessResponse<T>> {
  const timestamp = new Date().toISOString();
  const requestId = uuidv4();

  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      meta: {
        version: 'v1',
        timestamp,
        requestId,
      },
    },
    { status }
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code?: ApiV1ErrorCode,
  details?: Record<string, any>
): NextResponse<ApiV1ErrorResponse> {
  const timestamp = new Date().toISOString();
  const requestId = uuidv4();

  const errorResponse: ApiV1ErrorResponse = {
    success: false,
    data: null,
    error,
    meta: {
      version: 'v1',
      timestamp,
      requestId,
    },
  };

  // Add error code and details if provided
  if (code || details) {
    (errorResponse as any).errorDetails = {
      code,
      details,
    };
  }

  return NextResponse.json(errorResponse, { status });
}

/**
 * Creates a validation error response
 */
export function createValidationErrorResponse(
  message: string,
  validationErrors?: Record<string, string[]>
): NextResponse<ApiV1ErrorResponse> {
  return createErrorResponse(
    message,
    422,
    ApiV1ErrorCode.VALIDATION_ERROR,
    validationErrors
  );
}

/**
 * Creates an authentication error response
 */
export function createAuthErrorResponse(
  message: string = 'Authentication required'
): NextResponse<ApiV1ErrorResponse> {
  return createErrorResponse(message, 401, ApiV1ErrorCode.AUTHENTICATION_ERROR);
}

/**
 * Creates an authorization error response
 */
export function createAuthorizationErrorResponse(
  message: string = 'Insufficient permissions'
): NextResponse<ApiV1ErrorResponse> {
  return createErrorResponse(message, 403, ApiV1ErrorCode.AUTHORIZATION_ERROR);
}

/**
 * Creates a not found error response
 */
export function createNotFoundErrorResponse(
  message: string = 'Resource not found'
): NextResponse<ApiV1ErrorResponse> {
  return createErrorResponse(message, 404, ApiV1ErrorCode.NOT_FOUND);
}

/**
 * Creates an internal server error response
 */
export function createInternalErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiV1ErrorResponse> {
  return createErrorResponse(message, 500, ApiV1ErrorCode.INTERNAL_ERROR);
}

/**
 * Extracts request ID from headers or generates a new one
 */
export function getRequestId(request: Request): string {
  const requestId = request.headers.get('x-request-id');
  return requestId || uuidv4();
}

/**
 * Validates required environment variables
 */
export function validateEnvironmentVariables(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const key = identifier;
  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}
