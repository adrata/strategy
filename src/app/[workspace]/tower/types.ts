/**
 * Tower Monitoring Platform Types
 * 
 * TypeScript interfaces for monitoring metrics and system health data
 */

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  environment: string;
  version: string;
  timestamp: string;
}

export interface ApiHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  endpoints: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime: number;
      lastChecked: string;
    };
  };
}

export interface DatabaseStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connectionPool: {
    active: number;
    idle: number;
    total: number;
  };
  latency: number;
  lastQueryTime: number;
}

export interface QueryPerformance {
  status: 'healthy' | 'degraded' | 'unhealthy';
  averageTime: number;
  maxTime: number;
  slowQueries: number;
  totalQueries: number;
  slowestQueries: Array<{
    query: string;
    time: number;
    timestamp: string;
  }>;
}

export interface CacheMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  hitRate: number;
  size: number;
  memoryUsage: number;
  evictions: number;
  keys: number;
}

export interface ResponseTimes {
  status: 'healthy' | 'degraded' | 'unhealthy';
  p50: number;
  p95: number;
  p99: number;
  average: number;
  max: number;
}

export interface ErrorRate {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastHour: number;
  last24Hours: number;
  critical: number;
  warnings: number;
  total: number;
}

export interface DataCompleteness {
  status: 'healthy' | 'degraded' | 'unhealthy';
  score: number;
  totalRecords: number;
  incompleteRecords: number;
  lastUpdated: string;
}

export interface BackgroundJobs {
  status: 'healthy' | 'degraded' | 'unhealthy';
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  queueSize: number;
}

export interface MemoryUsage {
  status: 'healthy' | 'degraded' | 'unhealthy';
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

export interface RequestVolume {
  status: 'healthy' | 'degraded' | 'unhealthy';
  requestsPerMinute: number;
  peakRequests: number;
  averageRequests: number;
  lastHour: number;
}

export interface ServiceDependencies {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime: number;
      lastChecked: string;
      error?: string;
    };
  };
}

export interface MonitoringCard {
  id: string;
  title: string;
  category: 'system' | 'performance' | 'data' | 'infrastructure';
  status: 'healthy' | 'degraded' | 'unhealthy';
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  lastUpdated: string;
  details?: any;
}

export interface TowerMetrics {
  systemHealth: SystemHealth;
  apiHealth: ApiHealth;
  databaseStatus: DatabaseStatus;
  queryPerformance: QueryPerformance;
  cacheMetrics: CacheMetrics;
  responseTimes: ResponseTimes;
  errorRate: ErrorRate;
  dataCompleteness: DataCompleteness;
  backgroundJobs: BackgroundJobs;
  memoryUsage: MemoryUsage;
  requestVolume: RequestVolume;
  serviceDependencies: ServiceDependencies;
  lastUpdated: string;
}

export interface TowerApiResponse {
  success: boolean;
  data: TowerMetrics;
  error?: string;
}
