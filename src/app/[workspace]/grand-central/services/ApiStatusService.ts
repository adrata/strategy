import { API_REGISTRY, APIRegistryItem } from '../data/api-registry';

export interface APIStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'configured' | 'not-configured';
  isConfigured: boolean;
  hasValidKeys: boolean;
  lastChecked?: Date;
  errorMessage?: string;
}

export class ApiStatusService {
  private static instance: ApiStatusService;
  private statusCache: Map<string, APIStatus> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ApiStatusService {
    if (!ApiStatusService.instance) {
      ApiStatusService.instance = new ApiStatusService();
    }
    return ApiStatusService.instance;
  }

  /**
   * Check configuration status for all APIs
   */
  async checkAllAPIStatus(): Promise<APIStatus[]> {
    try {
      const response = await fetch('/api/grand-central/api-status');
      if (!response.ok) {
        throw new Error('Failed to fetch API status');
      }
      const serverStatuses = await response.json();
      
      // Convert server response to our APIStatus format
      const statuses: APIStatus[] = serverStatuses.map((serverStatus: any) => ({
        id: serverStatus.id,
        name: serverStatus.name,
        status: serverStatus.status,
        isConfigured: serverStatus.isConfigured,
        hasValidKeys: serverStatus.isConfigured,
        lastChecked: new Date(),
        errorMessage: serverStatus.missingKeys ? `Missing environment variables: ${serverStatus.missingKeys.join(', ')}` : undefined
      }));
      
      // Update cache
      statuses.forEach(status => {
        this.statusCache.set(status.id, status);
      });
      
      return statuses;
    } catch (error) {
      console.error('Error fetching API status from server:', error);
      // Fallback to showing all as not configured
      const fallbackStatuses: APIStatus[] = API_REGISTRY.map(api => ({
        id: api.id,
        name: api.name,
        status: 'not-configured',
        isConfigured: false,
        hasValidKeys: false,
        lastChecked: new Date(),
        errorMessage: 'Unable to check configuration status'
      }));
      return fallbackStatuses;
    }
  }

  /**
   * Check configuration status for a specific API
   */
  async checkAPIStatus(api: APIRegistryItem): Promise<APIStatus> {
    const cached = this.statusCache.get(api.id);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      const response = await fetch('/api/grand-central/api-status');
      if (!response.ok) {
        throw new Error('Failed to fetch API status');
      }
      const serverStatuses = await response.json();
      const serverStatus = serverStatuses.find((s: any) => s.id === api.id);
      
      if (!serverStatus) {
        throw new Error(`API ${api.id} not found in server response`);
      }

      const status: APIStatus = {
        id: serverStatus.id,
        name: serverStatus.name,
        status: serverStatus.status,
        isConfigured: serverStatus.isConfigured,
        hasValidKeys: serverStatus.isConfigured,
        lastChecked: new Date(),
        errorMessage: serverStatus.missingKeys ? `Missing environment variables: ${serverStatus.missingKeys.join(', ')}` : undefined
      };

      this.statusCache.set(api.id, status);
      return status;
    } catch (error) {
      const status: APIStatus = {
        id: api.id,
        name: api.name,
        status: 'inactive',
        isConfigured: false,
        hasValidKeys: false,
        lastChecked: new Date(),
        errorMessage: `Error checking API status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };

      this.statusCache.set(api.id, status);
      return status;
    }
  }

  /**
   * Get cached status for an API
   */
  getCachedStatus(apiId: string): APIStatus | null {
    const cached = this.statusCache.get(apiId);
    return cached && this.isCacheValid(cached) ? cached : null;
  }

  /**
   * Get status summary
   */
  getStatusSummary(): {
    total: number;
    configured: number;
    notConfigured: number;
    inactive: number;
  } {
    const statuses = Array.from(this.statusCache.values());
    
    return {
      total: statuses.length,
      configured: statuses.filter(s => s.status === 'configured').length,
      notConfigured: statuses.filter(s => s.status === 'not-configured').length,
      inactive: statuses.filter(s => s.status === 'inactive').length
    };
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(status: APIStatus): boolean {
    if (!status.lastChecked) return false;
    return Date.now() - status.lastChecked.getTime() < this.cacheTimeout;
  }

  /**
   * Clear cache for a specific API
   */
  clearCache(apiId: string): void {
    this.statusCache.delete(apiId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.statusCache.clear();
  }

  /**
   * Get APIs by status
   */
  getAPIsByStatus(status: 'active' | 'inactive' | 'configured' | 'not-configured'): APIStatus[] {
    return Array.from(this.statusCache.values()).filter(s => s.status === status);
  }

  /**
   * Get APIs that need configuration
   */
  getAPIsNeedingConfiguration(): APIStatus[] {
    return Array.from(this.statusCache.values()).filter(s => 
      s.status === 'not-configured' || s.status === 'inactive'
    );
  }
}
