import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

// Maximum size for localStorage caching (4MB)
const MAX_CACHE_SIZE_BYTES = 4 * 1024 * 1024;

/**
 * Estimate the size of data in bytes
 */
function estimateDataSize(data: any): number {
  try {
    return JSON.stringify(data).length * 2; // UTF-16 uses 2 bytes per character
  } catch {
    return Infinity;
  }
}

/**
 * Clear old section caches to free up localStorage space
 * Called when QuotaExceeded error occurs
 */
function clearOldSectionCaches(): void {
  if (typeof window === 'undefined') return;
  
  const SECTION_PREFIXES = ['adrata-companies-', 'adrata-leads-', 'adrata-prospects-', 'adrata-people-', 'adrata-record-'];
  const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && SECTION_PREFIXES.some(prefix => key.startsWith(prefix))) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - (parsed.ts || 0);
          if (cacheAge > MAX_CACHE_AGE) {
            keysToRemove.push(key);
          }
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

/**
 * Safely store data in localStorage with size check
 * Returns true if stored successfully, false if skipped
 */
function safeLocalStorageSet(key: string, data: any): boolean {
  if (typeof window === 'undefined') return false;
  
  const dataSize = estimateDataSize(data);
  
  // Skip caching if data exceeds threshold - this is expected for large datasets
  if (dataSize > MAX_CACHE_SIZE_BYTES) {
    return false;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    // Handle QuotaExceeded silently - clear old caches and retry once
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldSectionCaches();
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch {
        // Still failed - skip caching silently (expected for large datasets)
        return false;
      }
    }
    return false;
  }
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  lastAction: string;
  nextAction: string;
  status: string;
  revenue?: number;
  employeeCount?: number;
  lastActionDate?: string;
  nextActionDate?: string;
  assignedUserId?: string;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseCompaniesDataReturn {
  companies: Company[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

// In-memory cache for large datasets that exceed localStorage limits
const inMemoryCache = new Map<string, { companies: Company[]; ts: number }>();

export function useCompaniesData(): UseCompaniesDataReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id || 'default';

  const fetchCompanies = useCallback(async () => {
    if (authLoading) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/companies?limit=10000', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`);
      }

      const json = await response.json();
      const data = Array.isArray(json) ? json : (json?.data || []);
      
      // Transform companies data to Company format
      const transformedCompanies: Company[] = (data || []).map((company: any) => ({
        id: company.id,
        name: company.name || '-',
        industry: company.industry || '-',
        size: company.size || company.employeeCount || '-',
        lastAction: company.lastAction || '-',
        nextAction: company.nextAction || '-',
        status: company.status || 'ACTIVE',
        revenue: company.revenue || company.annualRevenue || 0,
        employeeCount: company.employeeCount || 0,
        lastActionDate: company.lastActionDate,
        nextActionDate: company.nextActionDate,
        assignedUserId: company.assignedUserId,
        workspaceId: company.workspaceId,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

      setCompanies(transformedCompanies);
      setCount(transformedCompanies.length);
      
      // Try localStorage first, fall back to in-memory cache silently
      const storageKey = `adrata-companies-${workspaceId}`;
      const cacheData = { companies: transformedCompanies, ts: Date.now() };
      
      const cachedInLocalStorage = safeLocalStorageSet(storageKey, cacheData);
      
      if (!cachedInLocalStorage) {
        // Use in-memory fallback for large datasets (no warning needed - expected behavior)
        inMemoryCache.set(storageKey, cacheData);
      }
    } catch (err) {
      console.error('❌ [useCompaniesData] Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
      setCompanies([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [authLoading, workspaceId]);

  useEffect(() => {
    if (authLoading) return;
    
    const storageKey = `adrata-companies-${workspaceId}`;
    
    // Instant hydration from cache (localStorage first, then in-memory)
    let hydratedFromCache = false;
    
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.companies)) {
          setCompanies(parsed.companies as Company[]);
          setCount((parsed.companies as Company[]).length);
          setLoading(false);
          hydratedFromCache = true;
        }
      }
    } catch {}
    
    // Try in-memory cache if localStorage didn't have data
    if (!hydratedFromCache) {
      const inMemoryCached = inMemoryCache.get(storageKey);
      if (inMemoryCached && Array.isArray(inMemoryCached.companies)) {
        setCompanies(inMemoryCached.companies);
        setCount(inMemoryCached.companies.length);
        setLoading(false);
        hydratedFromCache = true;
      }
    }
    
    // Revalidate in background
    fetchCompanies();
  }, [authLoading, workspaceId, fetchCompanies]);

  return {
    companies,
    loading,
    error,
    count,
    refresh: fetchCompanies,
  };
}