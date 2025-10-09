/**
 * Shared types for API v1
 */

export interface ApiV1Response<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta: {
    version: 'v1';
    timestamp: string;
    requestId: string;
  };
}

export interface ApiV1ErrorResponse {
  success: false;
  data: null;
  error: string;
  meta: {
    version: 'v1';
    timestamp: string;
    requestId: string;
  };
}

export interface ApiV1SuccessResponse<T = any> {
  success: true;
  data: T;
  error: null;
  meta: {
    version: 'v1';
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiV1SuccessResponse<T[]> {
  pagination: PaginationMeta;
}

export interface HealthCheckData {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  services?: {
    database?: 'connected' | 'disconnected';
    redis?: 'connected' | 'disconnected';
    external?: Record<string, 'connected' | 'disconnected'>;
  };
}

// Common error types
export enum ApiV1ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface ApiV1Error {
  code: ApiV1ErrorCode;
  message: string;
  details?: Record<string, any>;
}
