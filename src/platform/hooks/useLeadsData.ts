import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';

/**
 * 🎯 LEADS DATA HOOK
 * 
 * Fetches people with LEAD status using the new v1 API
 * Optimized for the leads table without Actions column
 */

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  workEmail?: string;
  jobTitle?: string;
  title?: string;
  company?: {
    id: string;
    name: string;
    industry?: string;
  };
  lastAction?: string;
  lastActionDate?: string;
  nextAction?: string;
  nextActionDate?: string;
  rank?: number;
  createdAt: string;
  updatedAt: string;
}

interface UseLeadsDataReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

export function useLeadsData(): UseLeadsDataReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id;
  const userId = authUser?.id;

  const fetchLeads = useCallback(async () => {
    if (!workspaceId || !userId || authLoading || !authUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 [LEADS DATA] Loading leads for workspace:', workspaceId);
      
      // 🎯 USE V1 API: Fetch people with LEAD status
      const response = await fetch(`/api/v1/people?status=LEAD&limit=1000`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch leads');
      }

      const peopleData = result.data || [];
      
      
      // 🎯 TRANSFORM: Convert people data to leads format (no fallback data)
      const leadsData: Lead[] = peopleData.map((person: any, index: number) => ({
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        fullName: person.fullName,
        email: person.email || person.workEmail,
        workEmail: person.workEmail,
        jobTitle: person.jobTitle,
        title: person.title,
        company: person.company ? {
          id: person.company.id,
          name: person.company.name,
          industry: person.company.industry
        } : undefined,
        lastAction: person.lastAction,
        lastActionDate: person.lastActionDate,
        nextAction: person.nextAction,
        nextActionDate: person.nextActionDate,
        rank: index + 1,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt
      }));

      setLeads(leadsData);
      setCount(leadsData.length);
      console.log('✅ [LEADS DATA] Loaded leads:', {
        count: leadsData.length,
        firstLead: leadsData[0]?.fullName || 'none'
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leads';
      console.error('❌ [LEADS DATA] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId, authLoading, authUser]);

  // 🚀 PERFORMANCE: Load leads when workspace/user is available
  useEffect(() => {
    if (workspaceId && userId && !authLoading) {
      fetchLeads();
    }
  }, [workspaceId, userId, authLoading, fetchLeads]);

  return {
    leads,
    loading,
    error,
    count,
    refresh: fetchLeads
  };
}
