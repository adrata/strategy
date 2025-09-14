// PRODUCTION-READY DATA SERVICE - WORKSPACE ISOLATED & OPTIMIZED
// Lightning-fast data access with proper workspace isolation

import { getPlatform, canUseAPI } from "./platform-detection";
import { performanceOptimizer } from "./services/performance";

// Production data types (no demo concepts)
export interface Company {
  id: string;
  workspaceId: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  location?: string;
  revenue?: string;
  description?: string;
  logo?: string;
  website?: string;
  linkedinUrl?: string;
  enrichedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  avatar?: string;
  enrichedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  source?: string;
  notes?: string;
  score?: number;
  enrichedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  type: "prospect" | "client" | "partner";
  industry?: string;
  size?: string;
  revenue?: string;
  status: "active" | "inactive" | "prospect";
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  workspaceId: string;
  name: string;
  accountId?: string;
  amount?: number;
  stage:
    | "prospecting"
    | "qualification"
    | "proposal"
    | "negotiation"
    | "closed-won"
    | "closed-lost";
  probability?: number;
  closeDate?: string;
  owner?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Service configuration
interface DataServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  cacheTimeout: number;
  enableBatching: boolean;
  maxBatchSize: number;
}

class DataService {
  private config: DataServiceConfig;
  private cache = new Map<
    string,
    { data: any; timestamp: number; workspaceId: string }
  >();
  private requestQueue = new Map<string, Promise<any>>();

  constructor() {
    const platform = getPlatform();

    this['config'] = {
      baseUrl: process['env']['NEXT_PUBLIC_API_BASE_URL'] || "/api",
      timeout: platform === "web" ? 30000 : 10000, // 30s web, 10s desktop/mobile
      retries: 3,
      cacheTimeout: platform === "web" ? 300000 : 600000, // 5min web, 10min desktop/mobile
      enableBatching: true,
      maxBatchSize: 10,
    };
  }

  // PRODUCTION: Workspace-isolated data fetching
  private async fetchWithWorkspaceIsolation<T>(
    endpoint: string,
    workspaceId: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!workspaceId) {
      throw new Error("Workspace ID is required for all data operations");
    }

    const cacheKey = `${workspaceId}_${endpoint}_${JSON.stringify(options)}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      // Verify workspace isolation
      if (cached['workspaceId'] === workspaceId) {
        return cached.data;
      } else {
        // Remove invalid cache entry
        this.cache.delete(cacheKey);
      }
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey)!;
    }

    // Make the request
    const requestPromise = this.makeRequest<T>(endpoint, workspaceId, options);
    this.requestQueue.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;

      // Cache with workspace isolation
      this.cache.set(cacheKey, {
        data: performanceOptimizer.sanitizeDataForProduction(data, workspaceId),
        timestamp: Date.now(),
        workspaceId,
      });

      return data;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  // PRODUCTION: Optimized HTTP request with error handling
  private async makeRequest<T>(
    endpoint: string,
    workspaceId: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Workspace-ID": workspaceId, // Ensure workspace context
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    };

    // Add workspace filter to GET requests
    if (!options.method || options['method'] === "GET") {
      const separator = endpoint.includes("?") ? "&" : "?";
      const finalUrl = `${url}${separator}workspaceId=${encodeURIComponent(workspaceId)}`;

      return performanceOptimizer.optimizedFetch<T>(finalUrl, requestOptions);
    }

    // Add workspace ID to POST/PUT request bodies
    if (options['body'] && typeof options['body'] === "string") {
      try {
        const bodyData = JSON.parse(options.body);
        bodyData['workspaceId'] = workspaceId; // Ensure workspace isolation
        requestOptions['body'] = JSON.stringify(bodyData);
      } catch (error) {
        // Body is not JSON, leave as is
      }
    }

    return performanceOptimizer.optimizedFetch<T>(url, requestOptions);
  }

  // PRODUCTION: Get companies with workspace isolation
  async getCompanies(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<Company[]> {
    if (!canUseAPI()) {
      throw new Error("API access not available in this environment");
    }

    const endpoint = `/companies?limit=${limit}&offset=${offset}`;
    const companies = await this.fetchWithWorkspaceIsolation<Company[]>(
      endpoint,
      workspaceId,
    );

    // Ensure all companies belong to the workspace
    return (companies || []).filter(
      (company) => company['workspaceId'] === workspaceId,
    );
  }

  // PRODUCTION: Get contacts with workspace isolation
  async getContacts(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<Contact[]> {
    if (!canUseAPI()) {
      throw new Error("API access not available in this environment");
    }

    const endpoint = `/contacts?limit=${limit}&offset=${offset}`;
    const contacts = await this.fetchWithWorkspaceIsolation<Contact[]>(
      endpoint,
      workspaceId,
    );

    return contacts.filter((contact) => contact['workspaceId'] === workspaceId);
  }

  // PRODUCTION: Get leads with workspace isolation
  async getLeads(workspaceId: string, limit = 50, offset = 0): Promise<Lead[]> {
    if (!canUseAPI()) {
      throw new Error("API access not available in this environment");
    }

    const endpoint = `/leads?limit=${limit}&offset=${offset}`;
    const leads = await this.fetchWithWorkspaceIsolation<Lead[]>(
      endpoint,
      workspaceId,
    );

    return leads.filter((lead) => lead['workspaceId'] === workspaceId);
  }

  // PRODUCTION: Get accounts with workspace isolation
  async getAccounts(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<Account[]> {
    if (!canUseAPI()) {
      throw new Error("API access not available in this environment");
    }

    const endpoint = `/accounts?limit=${limit}&offset=${offset}`;
    const accounts = await this.fetchWithWorkspaceIsolation<Account[]>(
      endpoint,
      workspaceId,
    );

    return accounts.filter((account) => account['workspaceId'] === workspaceId);
  }

  // PRODUCTION: Get opportunities with workspace isolation
  async getOpportunities(
    workspaceId: string,
    limit = 50,
    offset = 0,
  ): Promise<Opportunity[]> {
    if (!canUseAPI()) {
      throw new Error("API access not available in this environment");
    }

    const endpoint = `/opportunities?limit=${limit}&offset=${offset}`;
    const opportunities = await this.fetchWithWorkspaceIsolation<Opportunity[]>(
      endpoint,
      workspaceId,
    );

    return opportunities.filter(
      (opportunity) => opportunity['workspaceId'] === workspaceId,
    );
  }

  // PRODUCTION: Create lead with workspace isolation
  async createLead(
    workspaceId: string,
    leadData: Omit<Lead, "id" | "workspaceId" | "createdAt" | "updatedAt">,
  ): Promise<Lead> {
    if (!canUseAPI()) {
      throw new Error("API access not available in this environment");
    }

    const sanitizedData = performanceOptimizer.sanitizeDataForProduction(
      leadData,
      workspaceId,
    );

    return this.fetchWithWorkspaceIsolation<Lead>("/leads", workspaceId, {
      method: "POST",
      body: JSON.stringify({ ...sanitizedData, workspaceId }),
    });
  }

  // PRODUCTION: Update lead with workspace isolation
  async updateLead(
    workspaceId: string,
    leadId: string,
    updates: Partial<Lead>,
  ): Promise<Lead> {
    if (!canUseAPI()) {
      throw new Error("API access not available in this environment");
    }

    const sanitizedData = performanceOptimizer.sanitizeDataForProduction(
      updates,
      workspaceId,
    );

    return this.fetchWithWorkspaceIsolation<Lead>(
      `/leads/${leadId}`,
      workspaceId,
      {
        method: "PUT",
        body: JSON.stringify({ ...sanitizedData, workspaceId }),
      },
    );
  }

  // PRODUCTION: Batch operations for performance
  async batchGetData(
    workspaceId: string,
    requests: Array<{
      type: "companies" | "people" | "leads" | "opportunities";
      limit?: number;
      offset?: number;
    }>,
  ): Promise<{ [key: string]: any[] }> {
    if (!this.config.enableBatching) {
      // Fallback to individual requests
      const results: { [key: string]: any[] } = {};
      for (const request of requests) {
        switch (request.type) {
          case "companies":
            results['companies'] = await this.getCompanies(
              workspaceId,
              request.limit,
              request.offset,
            );
            break;
          case "people":
            results['people'] = await this.getPeople(
              workspaceId,
              request.limit,
              request.offset,
            );
            break;
          case "leads":
            results['leads'] = await this.getLeads(
              workspaceId,
              request.limit,
              request.offset,
            );
            break;
          case "companies":
            results['companies'] = await this.getCompanies(
              workspaceId,
              request.limit,
              request.offset,
            );
            break;
          case "opportunities":
            results['opportunities'] = await this.getOpportunities(
              workspaceId,
              request.limit,
              request.offset,
            );
            break;
        }
      }
      return results;
    }

    // Use performance optimizer for batching
    const batchRequests = requests
      .slice(0, this.config.maxBatchSize)
      .map((request) => {
        return () => {
          switch (request.type) {
            case "companies":
              return this.getCompanies(
                workspaceId,
                request.limit,
                request.offset,
              );
            case "people":
              return this.getPeople(
                workspaceId,
                request.limit,
                request.offset,
              );
            case "leads":
              return this.getLeads(workspaceId, request.limit, request.offset);
            case "companies":
              return this.getCompanies(
                workspaceId,
                request.limit,
                request.offset,
              );
            case "opportunities":
              return this.getOpportunities(
                workspaceId,
                request.limit,
                request.offset,
              );
            default:
              return Promise.resolve([]);
          }
        };
      });

    const results = await performanceOptimizer.batchRequests(batchRequests);

    // Map results back to request types
    const mappedResults: { [key: string]: any[] } = {};
    requests.forEach((request, index) => {
      if (index < results.length) {
        mappedResults[request.type] = results[index] || [];
      }
    });

    return mappedResults;
  }

  // PRODUCTION: Search with workspace isolation
  async search(
    workspaceId: string,
    query: string,
    types: string[] = ["companies", "people", "leads"],
  ): Promise<{ [key: string]: any[] }> {
    if (!canUseAPI()) {
      throw new Error("Search not available in this environment");
    }

    const searchParams = new URLSearchParams({
      q: query,
      types: types.join(","),
      workspaceId,
    });

    const endpoint = `/search?${searchParams.toString()}`;
    return this.fetchWithWorkspaceIsolation(endpoint, workspaceId);
  }

  // PRODUCTION: Cache management
  clearCache(workspaceId?: string): void {
    if (workspaceId) {
      // Clear only workspace-specific cache entries
      for (const [key, value] of this.cache.entries()) {
        if (value['workspaceId'] === workspaceId) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // PRODUCTION: Health check
  async healthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    timestamp: string;
    metrics: any;
  }> {
    try {
      const start = performance.now();
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      const duration = performance.now() - start;

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        metrics: {
          ...data,
          responseTime: duration,
          cacheSize: this.cache.size,
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        metrics: {
          error: error instanceof Error ? error.message : "Unknown error",
          cacheSize: this.cache.size,
        },
      };
    }
  }
}

// Singleton instance
export const dataService = new DataService();
