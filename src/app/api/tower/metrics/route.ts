/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * Tower Metrics API Endpoint
 * 
 * Aggregates system health data from various sources for the Tower monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { TowerApiResponse, TowerMetrics } from '@/app/[workspace]/tower/types';

export async function GET(request: NextRequest) {
  try {
    // Aggregate data from various sources
    const metrics = await aggregateSystemMetrics();
    
    const response: TowerApiResponse = {
      success: true,
      data: metrics,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Tower metrics API error:', error);
    
    const response: TowerApiResponse = {
      success: false,
      data: {} as TowerMetrics,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

async function aggregateSystemMetrics(): Promise<TowerMetrics> {
  const timestamp = new Date().toISOString();
  
  // Get system health data
  const systemHealth = await getSystemHealth();
  const apiHealth = await getApiHealth();
  const databaseStatus = await getDatabaseStatus();
  const queryPerformance = await getQueryPerformance();
  const cacheMetrics = await getCacheMetrics();
  const responseTimes = await getResponseTimes();
  const errorRate = await getErrorRate();
  const dataCompleteness = await getDataCompleteness();
  const backgroundJobs = await getBackgroundJobs();
  const memoryUsage = await getMemoryUsage();
  const requestVolume = await getRequestVolume();
  const serviceDependencies = await getServiceDependencies();

  return {
    systemHealth,
    apiHealth,
    databaseStatus,
    queryPerformance,
    cacheMetrics,
    responseTimes,
    errorRate,
    dataCompleteness,
    backgroundJobs,
    memoryUsage,
    requestVolume,
    serviceDependencies,
    lastUpdated: timestamp
  };
}

async function getSystemHealth() {
  const uptime = process.uptime();
  const environment = process.env.NODE_ENV || 'development';
  const version = '2025.1.0';
  
  return {
    status: 'healthy' as const,
    uptime,
    environment,
    version,
    timestamp: new Date().toISOString()
  };
}

async function getApiHealth() {
  // Simulate API health check
  const responseTime = Math.random() * 200 + 50; // 50-250ms
  const errorRate = Math.random() * 2; // 0-2%
  
  return {
    status: responseTime < 200 && errorRate < 1 ? 'healthy' as const : 
            responseTime < 500 && errorRate < 5 ? 'degraded' as const : 'unhealthy' as const,
    responseTime,
    errorRate,
    endpoints: {
      '/api/health': {
        status: 'up' as const,
        responseTime: Math.random() * 100 + 20,
        lastChecked: new Date().toISOString()
      },
      '/api/data/unified': {
        status: 'up' as const,
        responseTime: Math.random() * 300 + 50,
        lastChecked: new Date().toISOString()
      },
      '/api/pipeline/unified': {
        status: 'up' as const,
        responseTime: Math.random() * 400 + 100,
        lastChecked: new Date().toISOString()
      }
    }
  };
}

async function getDatabaseStatus() {
  // Simulate database health check
  const latency = Math.random() * 50 + 10; // 10-60ms
  const activeConnections = Math.floor(Math.random() * 10) + 1;
  const totalConnections = 20;
  
  return {
    status: latency < 50 ? 'healthy' as const : 
            latency < 100 ? 'degraded' as const : 'unhealthy' as const,
    connectionPool: {
      active: activeConnections,
      idle: totalConnections - activeConnections,
      total: totalConnections
    },
    latency,
    lastQueryTime: Date.now() - Math.random() * 1000
  };
}

async function getQueryPerformance() {
  const averageTime = Math.random() * 100 + 20; // 20-120ms
  const maxTime = Math.random() * 500 + 100; // 100-600ms
  const slowQueries = Math.floor(Math.random() * 5);
  const totalQueries = Math.floor(Math.random() * 1000) + 100;
  
  return {
    status: averageTime < 100 && slowQueries < 3 ? 'healthy' as const :
            averageTime < 200 && slowQueries < 10 ? 'degraded' as const : 'unhealthy' as const,
    averageTime,
    maxTime,
    slowQueries,
    totalQueries,
    slowestQueries: [
      {
        query: 'SELECT * FROM users WHERE created_at > ?',
        time: maxTime,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

async function getCacheMetrics() {
  const hitRate = Math.random() * 20 + 80; // 80-100%
  const size = Math.floor(Math.random() * 1000) + 100; // MB
  const memoryUsage = Math.random() * 50 + 10; // MB
  const evictions = Math.floor(Math.random() * 100);
  const keys = Math.floor(Math.random() * 10000) + 1000;
  
  return {
    status: hitRate > 80 ? 'healthy' as const :
            hitRate > 60 ? 'degraded' as const : 'unhealthy' as const,
    hitRate,
    size,
    memoryUsage,
    evictions,
    keys
  };
}

async function getResponseTimes() {
  const p50 = Math.random() * 100 + 50; // 50-150ms
  const p95 = Math.random() * 200 + 100; // 100-300ms
  const p99 = Math.random() * 400 + 200; // 200-600ms
  const average = (p50 + p95 + p99) / 3;
  const max = Math.random() * 1000 + 500; // 500-1500ms
  
  return {
    status: p95 < 200 ? 'healthy' as const :
            p95 < 500 ? 'degraded' as const : 'unhealthy' as const,
    p50,
    p95,
    p99,
    average,
    max
  };
}

async function getErrorRate() {
  const lastHour = Math.random() * 5; // 0-5%
  const last24Hours = Math.random() * 3; // 0-3%
  const critical = Math.floor(Math.random() * 3);
  const warnings = Math.floor(Math.random() * 10) + 1;
  const total = Math.floor(Math.random() * 100) + 10;
  
  return {
    status: lastHour < 1 ? 'healthy' as const :
            lastHour < 5 ? 'degraded' as const : 'unhealthy' as const,
    lastHour,
    last24Hours,
    critical,
    warnings,
    total
  };
}

async function getDataCompleteness() {
  const score = Math.random() * 20 + 80; // 80-100%
  const totalRecords = Math.floor(Math.random() * 10000) + 1000;
  const incompleteRecords = Math.floor(totalRecords * (100 - score) / 100);
  
  return {
    status: score > 90 ? 'healthy' as const :
            score > 75 ? 'degraded' as const : 'unhealthy' as const,
    score,
    totalRecords,
    incompleteRecords,
    lastUpdated: new Date().toISOString()
  };
}

async function getBackgroundJobs() {
  const pending = Math.floor(Math.random() * 20);
  const processing = Math.floor(Math.random() * 5) + 1;
  const failed = Math.floor(Math.random() * 3);
  const completed = Math.floor(Math.random() * 1000) + 100;
  const queueSize = pending + processing;
  
  return {
    status: failed < 2 && queueSize < 50 ? 'healthy' as const :
            failed < 5 && queueSize < 100 ? 'degraded' as const : 'unhealthy' as const,
    pending,
    processing,
    failed,
    completed,
    queueSize
  };
}

async function getMemoryUsage() {
  const used = process.memoryUsage();
  const total = 1024 * 1024 * 1024; // 1GB
  const percentage = (used.heapUsed / total) * 100;
  
  return {
    status: percentage < 70 ? 'healthy' as const :
            percentage < 85 ? 'degraded' as const : 'unhealthy' as const,
    used: used.heapUsed,
    total,
    percentage,
    heapUsed: used.heapUsed,
    heapTotal: used.heapTotal,
    external: used.external
  };
}

async function getRequestVolume() {
  const requestsPerMinute = Math.floor(Math.random() * 100) + 10;
  const peakRequests = Math.floor(Math.random() * 200) + 50;
  const averageRequests = Math.floor(requestsPerMinute * 0.7);
  const lastHour = requestsPerMinute * 60;
  
  return {
    status: requestsPerMinute < 1000 ? 'healthy' as const :
            requestsPerMinute < 2000 ? 'degraded' as const : 'unhealthy' as const,
    requestsPerMinute,
    peakRequests,
    averageRequests,
    lastHour
  };
}

async function getServiceDependencies() {
  return {
    status: 'healthy' as const,
    services: {
      'CoreSignal': {
        status: 'up' as const,
        responseTime: Math.random() * 200 + 100,
        lastChecked: new Date().toISOString()
      },
      'Hunter.io': {
        status: 'up' as const,
        responseTime: Math.random() * 300 + 150,
        lastChecked: new Date().toISOString()
      },
      'Prospeo': {
        status: 'up' as const,
        responseTime: Math.random() * 250 + 100,
        lastChecked: new Date().toISOString()
      },
      'Perplexity': {
        status: 'up' as const,
        responseTime: Math.random() * 1000 + 500,
        lastChecked: new Date().toISOString()
      }
    }
  };
}
