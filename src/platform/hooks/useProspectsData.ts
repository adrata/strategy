import { useState, useEffect } from 'react';

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
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/people?status=PROSPECT');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prospects: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform people data to Prospect format
      const transformedProspects: Prospect[] = data.map((person: any) => ({
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
    } catch (err) {
      console.error('❌ [useProspectsData] Error fetching prospects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prospects');
      setProspects([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  return {
    prospects,
    loading,
    error,
    count,
    refresh: fetchProspects,
  };
}