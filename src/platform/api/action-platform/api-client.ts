import {
  Lead,
  Opportunity,
  Contact,
  Account,
  Partnership,
  ApiResponse,
  ActionPlatformConfig,
  FilterOptions,
  SortOptions,
  PaginatedResponse,
} from "@/platform/aos/aos";
import { ActionPlatformError, ApiError } from "./errors";
import {
  performanceConfig,
  securityConfig,
  apiEndpoints,
  cacheKeys,
} from "./config";

// Use unified cache system instead of local cache
import { cache } from '@/platform/services';

// Request queue for managing concurrent requests
class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private maxConcurrent = 5;
  private activeRequests = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.activeRequests++;
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this['processing'] = true;

    while (this.queue?.length > 0 && this.activeRequests < this.maxConcurrent) {
      const request = this.queue.shift();
      if (request) {
        // Process without awaiting to allow concurrent execution
        request().catch(() => {}); // Errors are handled in the request itself
      }
    }

    this['processing'] = false;
  }

  getStats() {
    return {
      queued: this.queue.length,
      active: this.activeRequests,
      processing: this.processing,
    };
  }
}

// Enhanced fetch with retry logic and timeout
async function enhancedFetch(
  url: string,
  options: RequestInit = {},
  retryCount = 0,
  config: ActionPlatformConfig,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    performanceConfig.apiTimeoutMs,
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Handle rate limiting
    if (response['status'] === 429) {
      const retryAfter =
        parseInt(response.headers.get("Retry-After") || "1") * 1000;
      if (retryCount < config.retryAttempts) {
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return enhancedFetch(url, options, retryCount + 1, config);
      }
    }

    // Retry on server errors
    if (response.status >= 500 && retryCount < config.retryAttempts) {
      const delay = config.retryDelay * Math.pow(2, retryCount); // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      return enhancedFetch(url, options, retryCount + 1, config);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors
    if (
      retryCount < config['retryAttempts'] &&
      (error instanceof TypeError || // Network error
        (error as any)?.name === "AbortError") // Timeout
    ) {
      const delay = config.retryDelay * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return enhancedFetch(url, options, retryCount + 1, config);
    }

    throw error;
  }
}

// Main API Client class
export class ActionPlatformApiClient {
  private requestQueue = new RequestQueue();
  private config: ActionPlatformConfig;

  constructor(config: ActionPlatformConfig) {
    this['config'] = config;
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = true,
    cacheTtl = this.config.cacheTimeout,
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`;

    // Check cache first (for GET requests)
    if (useCache && (!options.method || options['method'] === "GET")) {
      try {
        const cached = await cache.get(cacheKey, async () => null, { skipCache: true });
        if (cached) {
          return cached;
        }
      } catch (error) {
        // Cache miss, continue with fetch
      }
    }

    try {
      const response = await this.requestQueue.add(() =>
        enhancedFetch(url, options, 0, this.config),
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          `HTTP_${response.status}`,
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            url,
            ...errorData,
          },
          url,
        );
      }

      const data: ApiResponse<T> = await response.json();

      // Cache successful responses
      if (
        useCache &&
        data['success'] &&
        (!options.method || options['method'] === "GET")
      ) {
        await cache.set(cacheKey, data, {
          ttl: cacheTtl,
          priority: 'medium',
          tags: ['api', endpoint]
        });
      }

      return data;
    } catch (error) {
      if (error instanceof ActionPlatformError) {
        throw error;
      }

      throw ActionPlatformError.networkError(
        error instanceof Error ? error.message : "Network request failed",
        {
          url,
          error: error instanceof Error ? error.name : "Unknown",
        },
      );
    }
  }

  // Leads API methods
  async getLeads(
    filters?: FilterOptions,
    sort?: SortOptions,
    page = 1,
    pageSize = performanceConfig.defaultPageSize,
  ): Promise<PaginatedResponse<Lead>> {
    const params = new URLSearchParams({
      workspaceId: this.config.workspaceId,
      userId: this.config.userId,
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters?.searchTerm) params['append']("search", filters.searchTerm);
    if (filters?.status?.length)
      params['append']("status", filters.status.join(","));
    if (filters?.source?.length)
      params['append']("source", filters.source.join(","));
    if (sort) {
      params['append']("sortField", sort.field);
      params['append']("sortDirection", sort.direction);
    }

    const response = await this.request<{ leads: Lead[]; pagination: any }>(
      `${apiEndpoints.leads}?${params['toString']()}`,
    );

    if (!response.success || !response.data) {
      throw ActionPlatformError.dataError(
        response.error || "Failed to fetch leads",
      );
    }

    return {
      items: response.data.leads,
      data: response.data.leads,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      pageSize: response.data.pagination.pageSize,
      totalPages: response.data.pagination.totalPages,
      hasMore: response.data.pagination.hasMore,
      pagination: response.data.pagination,
    };
  }

  async createLead(
    leadData: Omit<Lead, "id" | "createdAt" | "updatedAt">,
  ): Promise<Lead> {
    // Invalidate leads cache
    await cache.invalidate(
      cacheKeys.leads(this.config.workspaceId, this.config.userId),
    );

    const response = await this.request<Lead>(
      apiEndpoints.leads,
      {
        method: "POST",
        body: JSON.stringify({
          ...leadData,
          workspaceId: this.config.workspaceId,
          userId: this.config.userId,
        }),
      },
      false, // Don't cache write operations
    );

    if (!response.success || !response.data) {
      throw new ActionPlatformError(
        "CREATE_ERROR",
        response.error || "Failed to create lead",
      );
    }

    return response.data;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    // Invalidate leads cache
    await cache.invalidate(
      cacheKeys.leads(this.config.workspaceId, this.config.userId),
    );

    const response = await this.request<Lead>(
      `${apiEndpoints.leads}/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(updates),
      },
      false,
    );

    if (!response.success || !response.data) {
      throw new ActionPlatformError(
        "UPDATE_ERROR",
        response.error || "Failed to update lead",
      );
    }

    return response.data;
  }

  async deleteLead(id: string): Promise<void> {
    // Invalidate leads cache
    await cache.invalidate(
      cacheKeys.leads(this.config.workspaceId, this.config.userId),
    );

    const response = await this.request<void>(
      `${apiEndpoints.leads}/${id}`,
      { method: "DELETE" },
      false,
    );

    if (!response.success) {
      throw new ActionPlatformError(
        "DELETE_ERROR",
        response.error || "Failed to delete lead",
      );
    }
  }

  // Opportunities API methods (similar pattern)
  async getOpportunities(
    filters?: FilterOptions,
    sort?: SortOptions,
    page = 1,
    pageSize = performanceConfig.defaultPageSize,
  ): Promise<PaginatedResponse<Opportunity>> {
    // Implementation similar to getLeads
    throw new Error("Not implemented yet");
  }

  // Cache management methods
  getCacheStats() {
    return cache.stats();
  }

  getRequestQueueStats() {
    return this.requestQueue.getStats();
  }

  clearCache() {
    return cache.clear();
  }

  invalidateCache(pattern: string) {
    return cache.invalidate(pattern);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request<{ status: string }>(
        `${apiEndpoints.leads}/health`,
        { method: "OPTIONS" },
        false, // Don't cache health checks
        0, // No TTL
      );
      return response['success'] && response.data?.status === "healthy";
    } catch {
      return false;
    }
  }
}

// Factory function to create API client
export function createApiClient(
  config: ActionPlatformConfig,
): ActionPlatformApiClient {
  return new ActionPlatformApiClient(config);
}

// Export for use in context
export { RequestQueue };
