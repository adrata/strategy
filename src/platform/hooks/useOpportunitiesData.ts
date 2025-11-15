import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

export interface Opportunity {
  id: string;
  name: string;
  company: string;
  status: string;
  lastAction: string;
  nextAction: string;
  amount?: number;
  stage?: string;
  companyId?: string;
  industry?: string;
  size?: string;
  lastActionDate?: string;
  nextActionDate?: string;
  assignedUserId?: string;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseOpportunitiesDataReturn {
  opportunities: Opportunity[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

export function useOpportunitiesData(): UseOpportunitiesDataReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id || 'default';

  const fetchOpportunities = useCallback(async () => {
    if (authLoading) return;
    try {
      // Only set loading to true if we don't have data yet
      if (opportunities.length === 0) {
        setLoading(true);
      }
      setError(null);

      // Opportunities are COMPANIES with status=OPPORTUNITY
      const response = await fetch('/api/v1/companies?status=OPPORTUNITY&limit=10000', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
      }

      const json = await response.json();
      const data = Array.isArray(json) ? json : (json?.data || []);
      
      // Transform company data to Opportunity format
      const transformedOpportunities: Opportunity[] = (data || []).map((company: any) => ({
        id: company.id,
        name: company.name || 'Unnamed Opportunity',
        company: company.name || '-',
        account: { name: company.name },
        status: company.status || 'OPPORTUNITY',
        lastAction: company.lastAction || '-',
        nextAction: company.nextAction || '-',
        amount: company.opportunityAmount || company.amount || company.dealValue || 0,
        revenue: company.opportunityAmount || company.amount || company.dealValue || 0,
        stage: company.opportunityStage || company.stage || company.dealStage || 'QUALIFICATION',
        companyId: company.id,
        industry: company.industry || '-',
        size: company.size || company.employeeCount || '-',
        lastActionDate: company.lastActionDate,
        nextActionDate: company.nextActionDate,
        assignedUserId: company.mainSellerId,
        workspaceId: company.workspaceId,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

      setOpportunities(transformedOpportunities);
      setCount(transformedOpportunities.length);
      try {
        const storageKey = `adrata-opportunities-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify({ opportunities: transformedOpportunities, ts: Date.now() }));
      } catch {}
    } catch (err) {
      console.error('[useOpportunitiesData] Error fetching opportunities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      setOpportunities([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [authLoading, workspaceId]);

  useEffect(() => {
    if (authLoading) return;
    
    // Instant hydration from cache
    let hasCachedData = false;
    try {
      const storageKey = `adrata-opportunities-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.opportunities)) {
          setOpportunities(parsed.opportunities as Opportunity[]);
          setCount((parsed.opportunities as Opportunity[]).length);
          setLoading(false);
          hasCachedData = true;
        }
      }
    } catch {}
    
    // Only set loading to true if we don't have cached data
    if (!hasCachedData) {
      setLoading(true);
    }
    
    // Revalidate in background
    fetchOpportunities();
  }, [authLoading, workspaceId, fetchOpportunities]);

  return {
    opportunities,
    loading,
    error,
    count,
    refresh: fetchOpportunities,
  };
}