import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

export interface Person {
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

interface UsePeopleDataReturn {
  people: Person[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

export function usePeopleData(): UsePeopleDataReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const workspaceId = authUser?.activeWorkspaceId || authUser?.workspaces?.[0]?.id || 'default';

  const fetchPeople = useCallback(async () => {
    if (authLoading) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/people', { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch people: ${response.statusText}`);
      }

      const json = await response.json();
      const data = Array.isArray(json) ? json : (json?.data || []);
      
      // Transform people data to Person format
      const transformedPeople: Person[] = (data || []).map((person: any) => ({
        id: person.id,
        company: person.company?.name || person.companyName || '-',
        name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || '-',
        title: person.title || person.jobTitle || '-',
        email: person.email || '-',
        lastAction: person.lastAction || '-',
        nextAction: person.nextAction || '-',
        status: person.status || 'ACTIVE',
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

      setPeople(transformedPeople);
      setCount(transformedPeople.length);
      try {
        const storageKey = `adrata-people-${workspaceId}`;
        localStorage.setItem(storageKey, JSON.stringify({ people: transformedPeople, ts: Date.now() }));
      } catch {}
    } catch (err) {
      console.error('❌ [usePeopleData] Error fetching people:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch people');
      setPeople([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [authLoading, workspaceId]);

  useEffect(() => {
    if (authLoading) return;
    // Instant hydration from cache
    try {
      const storageKey = `adrata-people-${workspaceId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed?.people)) {
          setPeople(parsed.people as Person[]);
          setCount((parsed.people as Person[]).length);
          setLoading(false);
        }
      }
    } catch {}
    // Revalidate in background
    fetchPeople();
  }, [authLoading, workspaceId, fetchPeople]);

  return {
    people,
    loading,
    error,
    count,
    refresh: fetchPeople,
  };
}