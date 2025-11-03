/**
 * API Usage Tracker
 * Tracks API key usage for analytics and monitoring
 */

import { prisma } from '@/platform/database/prisma-client';

export interface UsageData {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Track API usage (non-blocking)
 */
export async function trackUsage(data: UsageData): Promise<void> {
  // Don't block the request if tracking fails
  try {
    await prisma.api_key_usage.create({
      data: {
        apiKeyId: data.apiKeyId,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      }
    });
  } catch (error) {
    // Log error but don't throw - tracking failures shouldn't break API
    console.error('❌ [USAGE TRACKER] Failed to track usage:', error);
  }
}

/**
 * Get usage statistics for an API key
 */
export async function getUsageStats(
  apiKeyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    apiKeyId,
    ...(startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    } : {})
  };

  const [total, byEndpoint, byStatusCode, recent] = await Promise.all([
    // Total requests
    prisma.api_key_usage.count({ where }),
    
    // Requests by endpoint
    prisma.api_key_usage.groupBy({
      by: ['endpoint'],
      where,
      _count: { endpoint: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10
    }),
    
    // Requests by status code
    prisma.api_key_usage.groupBy({
      by: ['statusCode'],
      where,
      _count: { statusCode: true },
      orderBy: { statusCode: 'asc' }
    }),
    
    // Recent requests (last 100)
    prisma.api_key_usage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        responseTime: true,
        createdAt: true
      }
    })
  ]);

  // Calculate average response time
  const avgResponseTime = await prisma.api_key_usage.aggregate({
    where,
    _avg: { responseTime: true }
  });

  return {
    total,
    byEndpoint: byEndpoint.map(e => ({
      endpoint: e.endpoint,
      count: e._count.endpoint
    })),
    byStatusCode: byStatusCode.map(s => ({
      statusCode: s.statusCode,
      count: s._count.statusCode
    })),
    avgResponseTime: avgResponseTime._avg.responseTime || 0,
    recent
  };
}

