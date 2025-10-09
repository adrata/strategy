import { useState, useEffect } from 'react';

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/companies');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform companies data to Company format
      const transformedCompanies: Company[] = data.map((company: any) => ({
        id: company.id,
        name: company.name || 'Unknown Company',
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
    } catch (err) {
      console.error('❌ [useCompaniesData] Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
      setCompanies([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return {
    companies,
    loading,
    error,
    count,
    refresh: fetchCompanies,
  };
}