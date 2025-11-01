import { NextRequest } from 'next/server';
import { createSuccessResponse, createInternalErrorResponse } from '../utils';
import { HealthCheckData } from '../types';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Health check endpoint for API v1
 * GET /api/v1/health
 */
export async function GET(request: NextRequest) {
  try {
    // Basic health check - can be extended with database connectivity, etc.
    const healthData: HealthCheckData = {
      status: 'healthy',
      version: 'v1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return createSuccessResponse(healthData);
  } catch (error) {
    console.error('Health check failed:', error);
    return createInternalErrorResponse('Health check failed');
  }
}
