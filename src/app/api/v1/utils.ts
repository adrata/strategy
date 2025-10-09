import { NextResponse } from 'next/server';

/**
 * Utility functions for V1 API responses
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string, 
  status: number = 400, 
  message?: string
): NextResponse<ApiResponse> {
  return NextResponse.json({
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
  }, { status });
}

/**
 * Create an internal server error response
 */
export function createInternalErrorResponse(error: string = 'Internal server error'): NextResponse<ApiResponse> {
  return createErrorResponse(error, 500);
}

/**
 * Create a not found error response
 */
export function createNotFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse> {
  return createErrorResponse(`${resource} not found`, 404);
}

/**
 * Create an unauthorized error response
 */
export function createUnauthorizedResponse(message: string = 'Authentication required'): NextResponse<ApiResponse> {
  return createErrorResponse(message, 401);
}

/**
 * Create a forbidden error response
 */
export function createForbiddenResponse(message: string = 'Access forbidden'): NextResponse<ApiResponse> {
  return createErrorResponse(message, 403);
}

/**
 * Create a validation error response
 */
export function createValidationErrorResponse(errors: string[]): NextResponse<ApiResponse> {
  return createErrorResponse('Validation failed', 400, errors.join(', '));
}
