import { useState, useEffect } from 'react';

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
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/people');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch people: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform people data to Person format
      const transformedPeople: Person[] = data.map((person: any) => ({
        id: person.id,
        company: person.company?.name || person.companyName || '-',
        name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
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
    } catch (err) {
      console.error('❌ [usePeopleData] Error fetching people:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch people');
      setPeople([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  return {
    people,
    loading,
    error,
    count,
    refresh: fetchPeople,
  };
}