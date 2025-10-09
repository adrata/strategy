import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

export interface Prospect {
  id: string;
  company: string;
  name: string;
  title: string;
  email: string;
  lastAction: string;
  nextAction: string;
  status: string;
  companyId?: string;
  phone?: string;
  linkedinUrl?: string;
  tags?: string[];
  lastActionDate?: string;
  nextActionDate?: string;
  assignedUserId?: string;
  workspaceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UseProspectsDataReturn {
  prospects: Prospect[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

export function useProspectsData(): UseProspectsDataReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id || 'default';

  const fetchProspects = useCallback(async () => {
    if (authLoading) return;
    try {
      // Only set loading to true if we don't have data yet
      if (prospects.length === 0) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/v1/people?status=PROSPECT&limit=1000', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prospects: ${response.statusText}`);
      }

      const json = await response.json();
      const data = Array.isArray(json) ? json : (json?.data || []);
      
      // Transform people data to Prospect format
      const transformedProspects: Prospect[] = (data || []).map((person: any) => ({
        id: person.id,
        company: person.company?.name || person.companyName || '-',
        name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
        title: person.title || person.jobTitle || '-',
        email: person.email || '-',
        lastAction: person.lastAction || '-',
        nextAction: person.nextAction || '-',
        status: person.status || 'PROSPECT',
        companyId: person.companyId,
        phone: person.phone,
        linkedinUrl: person.linkedinUrl,
        tags: person.tags || [],
        lastActionDate: person.lastActionDate,
        nextActionDate: person.nextActionDate,
        assignedUserId: person.assignedUserId,
        workspaceId: person.workspaceId,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      }));

      setProspects(transformedProspects);
      setCount(transformedProspects.length);
      // Persist to cache for instant hydration
      try {
        const storageKey = `adrata-prospects-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify({ prospects: transformedProspects, ts: Date.now() }));
      } catch {}
    } catch (err) {
      console.error('[useProspectsData] Error fetching prospects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prospects');
      setProspects([]);
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
      const storageKey = `adrata-prospects-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.prospects)) {
          setProspects(parsed.prospects as Prospect[]);
          setCount((parsed.prospects as Prospect[]).length);
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
    fetchProspects();
  }, [authLoading, workspaceId, fetchProspects]);

  return {
    prospects,
    loading,
    error,
    count,
    refresh: fetchProspects,
  };
}