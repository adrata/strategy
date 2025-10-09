import { useState, useEffect } from 'react';

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
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/companies?status=OPPORTUNITY');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform companies data to Opportunity format
      const transformedOpportunities: Opportunity[] = data.map((company: any) => ({
        id: company.id,
        name: company.name || 'Unknown Company',
        company: company.name || 'Unknown Company',
        status: company.status || 'OPPORTUNITY',
        lastAction: company.lastAction || '-',
        nextAction: company.nextAction || '-',
        amount: company.amount || company.dealValue || 0,
        stage: company.stage || company.dealStage || 'Qualification',
        companyId: company.id,
        industry: company.industry || '-',
        size: company.size || company.employeeCount || '-',
        lastActionDate: company.lastActionDate,
        nextActionDate: company.nextActionDate,
        assignedUserId: company.assignedUserId,
        workspaceId: company.workspaceId,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

      setOpportunities(transformedOpportunities);
      setCount(transformedOpportunities.length);
    } catch (err) {
      console.error('❌ [useOpportunitiesData] Error fetching opportunities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      setOpportunities([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  return {
    opportunities,
    loading,
    error,
    count,
    refresh: fetchOpportunities,
  };
}