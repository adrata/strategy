/**
 * 🚀 ADRATA UNIFIED API SYSTEM - 2025 WORLD-CLASS
 * 
 * Single API client for all data operations
 * Provides consistent patterns, error handling, and performance optimization
 */

import { cache } from '@/platform/services/unified-cache';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean;
  cacheTTL?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  timeout?: number;
  retries?: number;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  cache?: boolean;
  cacheTTL?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}

// ============================================================================
// API ENDPOINTS CONFIGURATION
// ============================================================================

export const API_ENDPOINTS: Record<string, APIEndpoint> = {
  // Data endpoints - migrated to v1
  PEOPLE_DATA: {
    path: '/api/v1/people',
    method: 'GET',
    cache: true,
    cacheTTL: 300000, // 5 minutes
    priority: 'high',
    tags: ['data', 'people']
  },
  
  COMPANIES_DATA: {
    path: '/api/v1/companies',
    method: 'GET',
    cache: true,
    cacheTTL: 300000, // 5 minutes
    priority: 'high',
    tags: ['data', 'companies']
  },
  
  ACTIONS_DATA: {
    path: '/api/v1/actions',
    method: 'GET',
    cache: true,
    cacheTTL: 300000, // 5 minutes
    priority: 'high',
    tags: ['data', 'actions']
  },
  
  RECORD_DETAIL: {
    path: '/api/v1/records',
    method: 'GET',
    cache: true,
    cacheTTL: 600000, // 10 minutes
    priority: 'high',
    tags: ['data', 'records']
  },
  
  PIPELINE_COUNTS: {
    path: '/api/v1/counts',
    method: 'GET',
    cache: true,
    cacheTTL: 60000, // 1 minute
    priority: 'high',
    tags: ['data', 'counts']
  },
  
  // Intelligence endpoints
  INTELLIGENCE: {
    path: '/api/intelligence',
    method: 'POST',
    cache: false,
    priority: 'critical',
    tags: ['intelligence', 'ai']
  },
  
  // Analytics endpoints
  ANALYTICS: {
    path: '/api/analytics',
    method: 'GET',
    cache: true,
    cacheTTL: 300000, // 5 minutes
    priority: 'medium',
    tags: ['analytics']
  }
};

// ============================================================================
// UNIFIED API CLIENT
// ============================================================================

export class AdrataAPI {
  private static instance: AdrataAPI;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private requestQueue: Map<string, Promise<any>> = new Map();

  private constructor() {
    this['baseURL'] = typeof window !== 'undefined' ? '' : process['env']['NEXT_PUBLIC_APP_URL'] || '';
    this['defaultHeaders'] = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  static getInstance(): AdrataAPI {
    if (!AdrataAPI.instance) {
      AdrataAPI['instance'] = new AdrataAPI();
    }
    return AdrataAPI.instance;
  }

  // ============================================================================
  // CORE REQUEST METHOD
  // ============================================================================

  async request<T = any>(
    endpoint: string | APIEndpoint,
    options: APIRequestOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      cache: useCache = true,
      cacheTTL = 300000,
      priority = 'medium',
      tags = [],
      timeout = 30000,
      retries = 3
    } = options;

    // Resolve endpoint
    const endpointConfig = typeof endpoint === 'string' 
      ? API_ENDPOINTS[endpoint] || { path: endpoint, method }
      : endpoint;

    const url = `${this.baseURL}${endpointConfig.path}`;
    const cacheKey = this.generateCacheKey(endpointConfig.path, method, body);

    // Check cache first
    if (useCache && method === 'GET') {
      const cached = await cache.get(cacheKey, () => this.makeRequest(url, method, headers, body, timeout));
      if (cached) {
        return cached;
      }
    }

    // Check request queue for deduplication
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Make request with retry logic
    const requestPromise = this.makeRequestWithRetry(
      url,
      method,
      headers,
      body,
      timeout,
      retries
    );

    // Add to queue for deduplication
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful responses
      if (useCache && method === 'GET' && result.success) {
        await cache.set(cacheKey, result, {
          ttl: cacheTTL,
          priority,
          tags: [...tags, ...(endpointConfig.tags || [])]
        });
      }

      return result;
    } finally {
      // Remove from queue
      this.requestQueue.delete(cacheKey);
    }
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  async get<T = any>(endpoint: string, options: Omit<APIRequestOptions, 'method'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options: Omit<APIRequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options: Omit<APIRequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = any>(endpoint: string, options: Omit<APIRequestOptions, 'method'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, body?: any, options: Omit<APIRequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // ============================================================================
  // SPECIALIZED METHODS
  // ============================================================================

  async getUnifiedData(workspaceId: string, userId: string, section?: string): Promise<APIResponse> {
    const params = new URLSearchParams({
      workspaceId,
      userId,
      ...(section && { currentSection: section })
    });

    return this.get(`UNIFIED_DATA?${params}`, {
      priority: 'high',
      tags: ['unified-data', workspaceId, userId, section || 'all']
    });
  }

  async getRecordDetail(section: string, recordId: string): Promise<APIResponse> {
    return this.get(`RECORD_DETAIL/${section}/${recordId}`, {
      priority: 'high',
      tags: ['record-detail', section, recordId]
    });
  }

  async getPipelineCounts(workspaceId: string, userId: string): Promise<APIResponse> {
    const params = new URLSearchParams({
      workspaceId,
      userId,
      dashboardOnly: 'true'
    });

    return this.get(`PIPELINE_COUNTS?${params}`, {
      priority: 'high',
      cacheTTL: 60000, // 1 minute
      tags: ['pipeline-counts', workspaceId, userId]
    });
  }

  async runIntelligence(data: any): Promise<APIResponse> {
    return this.post('INTELLIGENCE', data, {
      priority: 'critical',
      cache: false,
      tags: ['intelligence']
    });
  }

  async getAnalytics(workspaceId: string, userId: string, timeframe?: string): Promise<APIResponse> {
    const params = new URLSearchParams({
      workspaceId,
      userId,
      ...(timeframe && { timeframe })
    });

    return this.get(`ANALYTICS?${params}`, {
      priority: 'medium',
      tags: ['analytics', workspaceId, userId]
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async makeRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeout: number
  ): Promise<APIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        timestamp: new Date().toISOString(),
        requestId: data.requestId
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error['name'] === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  private async makeRequestWithRetry(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeout: number,
    retries: number
  ): Promise<APIResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.makeRequest(url, method, headers, body, timeout);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError!.message,
      timestamp: new Date().toISOString()
    };
  }

  private generateCacheKey(path: string, method: string, body?: any): string {
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method}:${path}:${bodyHash}`;
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  async clearCache(tags?: string[]): Promise<void> {
    if (tags) {
      await cache.invalidateByTags(tags);
    } else {
      await cache.clear();
    }
  }

  async preloadData(endpoints: string[], workspaceId: string, userId: string): Promise<void> {
    const preloadPromises = endpoints.map(endpoint => {
      switch (endpoint) {
        case 'UNIFIED_DATA':
          return this.getUnifiedData(workspaceId, userId);
        case 'PIPELINE_COUNTS':
          return this.getPipelineCounts(workspaceId, userId);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(preloadPromises);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const adrataAPI = AdrataAPI.getInstance();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const api = {
  get: <T = any>(endpoint: string, options?: Omit<APIRequestOptions, 'method'>) => 
    adrataAPI.get<T>(endpoint, options),
  
  post: <T = any>(endpoint: string, body?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) => 
    adrataAPI.post<T>(endpoint, body, options),
  
  put: <T = any>(endpoint: string, body?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) => 
    adrataAPI.put<T>(endpoint, body, options),
  
  delete: <T = any>(endpoint: string, options?: Omit<APIRequestOptions, 'method'>) => 
    adrataAPI.delete<T>(endpoint, options),
  
  patch: <T = any>(endpoint: string, body?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) => 
    adrataAPI.patch<T>(endpoint, body, options)
};
