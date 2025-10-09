import { useState, useEffect } from 'react';

export interface SpeedrunPerson {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  lastAction: string;
  nextAction: string;
  status: string;
  rank?: number;
  winningScore?: {
    rank: string;
    totalScore: number;
  };
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

interface UseSpeedrunDataReturn {
  speedrunPeople: SpeedrunPerson[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => Promise<void>;
}

// Default speedrun limit - can be made configurable
const DEFAULT_SPEEDRUN_LIMIT = 50;

export function useSpeedrunData(limit: number = DEFAULT_SPEEDRUN_LIMIT): UseSpeedrunDataReturn {
  const [speedrunPeople, setSpeedrunPeople] = useState<SpeedrunPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchSpeedrunData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all people and apply ranking logic
      const response = await fetch('/api/v1/people');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch speedrun data: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform people data to SpeedrunPerson format
      const transformedPeople: SpeedrunPerson[] = data.map((person: any, index: number) => ({
        id: person.id,
        name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
        company: person.company?.name || person.companyName || '-',
        title: person.title || person.jobTitle || '-',
        email: person.email || '-',
        lastAction: person.lastAction || '-',
        nextAction: person.nextAction || '-',
        status: person.status || 'ACTIVE',
        rank: index + 1, // Simple ranking for now
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

      // Apply speedrun ranking logic (top N)
      const rankedPeople = transformedPeople
        .sort((a, b) => {
          // Sort by priority/status first, then by last contact date
          const statusPriority = (status: string) => {
            switch (status?.toLowerCase()) {
              case 'lead': return 1;
              case 'prospect': return 2;
              case 'opportunity': return 3;
              case 'client': return 4;
              default: return 5;
            }
          };
          
          const aPriority = statusPriority(a.status);
          const bPriority = statusPriority(b.status);
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          // If same priority, sort by last contact date (most recent first)
          const aDate = a.lastActionDate ? new Date(a.lastActionDate).getTime() : 0;
          const bDate = b.lastActionDate ? new Date(b.lastActionDate).getTime() : 0;
          return bDate - aDate;
        })
        .slice(0, limit) // Take top N
        .map((person, index) => ({
          ...person,
          rank: index + 1,
        }));

      setSpeedrunPeople(rankedPeople);
      setCount(rankedPeople.length);
    } catch (err) {
      console.error('❌ [useSpeedrunData] Error fetching speedrun data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch speedrun data');
      setSpeedrunPeople([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeedrunData();
  }, [limit]);

  return {
    speedrunPeople,
    loading,
    error,
    count,
    refresh: fetchSpeedrunData,
  };
}

