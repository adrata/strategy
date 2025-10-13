import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

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
      try {
        const storageKey = `adrata-companies-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify({ companies: transformedCompanies, ts: Date.now() }));
      } catch {}
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
    // Instant hydration from cache
    try {
      const storageKey = `adrata-companies-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.companies)) {
          setCompanies(parsed.companies as Company[]);
          setCount((parsed.companies as Company[]).length);
          setLoading(false);
        }
      }
    } catch {}
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