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
  description?: string;
  summary?: string;
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

      // Opportunities are now in the opportunities table
      const response = await fetch('/api/v1/opportunities?limit=10000', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
      }

      const json = await response.json();
      const data = Array.isArray(json) ? json : (json?.data || []);
      
      // Data is already in Opportunity format from the API
      const transformedOpportunities: Opportunity[] = (data || []).map((opp: any) => ({
        id: opp.id,
        name: opp.name || 'Unnamed Opportunity',
        company: opp.company || '-',
        account: opp.account || { name: opp.company },
        status: opp.status || 'OPPORTUNITY',
        lastAction: opp.lastAction || '-',
        nextAction: opp.nextAction || '-',
        amount: opp.opportunityAmount || opp.amount || 0,
        revenue: opp.opportunityAmount || opp.amount || 0,
        stage: opp.opportunityStage || opp.stage || 'Discovery',
        companyId: opp.companyId,
        industry: opp.industry && opp.industry !== '-' ? opp.industry : undefined,
        size: opp.size || '-',
        lastActionDate: opp.lastActionDate,
        nextActionDate: opp.nextActionDate,
        assignedUserId: opp.assignedUserId,
        workspaceId: opp.workspaceId,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        description: opp.description || '',
        summary: opp.summary || opp.description || '',
        opportunityAmount: opp.opportunityAmount || opp.amount || 0,
        opportunityStage: opp.opportunityStage || opp.stage,
        opportunityProbability: opp.opportunityProbability,
        expectedCloseDate: opp.expectedCloseDate,
        customFields: opp.customFields || {},
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