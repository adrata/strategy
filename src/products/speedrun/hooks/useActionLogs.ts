import { useState, useEffect } from 'react';

export interface ActionLog {
  id: string;
  personId: string;
  personName: string;
  actionLog: string;
  type: string;
  notes: string | null;
  nextAction: string | null;
  nextActionDate: Date | null;
  workspaceId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  timestamp: Date;
}

export function useActionLogs(personId: string, workspaceId: string) {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) return;

    const fetchActionLogs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/actions?personId=${encodeURIComponent(personId)}&limit=50`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch action logs: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Convert v1 API response to ActionLog format
          const logs = result.data.map((action: any) => ({
            id: action.id,
            personId: action.personId,
            personName: action.person?.fullName || 'Unknown',
            actionLog: action.description || '',
            type: action.type,
            notes: action.description,
            nextAction: action.outcome,
            nextActionDate: action.scheduledAt ? new Date(action.scheduledAt) : null,
            workspaceId: action.workspaceId,
            userId: action.userId,
            userName: action.user?.fullName || action.user?.name || action.user?.firstName && action.user?.lastName ? `${action.user.firstName} ${action.user.lastName}` : null,
            userEmail: action.user?.email || null,
            timestamp: new Date(action.completedAt || action.createdAt),
          }));
          
          setActionLogs(logs);
          console.log(`📋 Loaded ${logs.length} action logs for person ${personId}`);
        } else {
          throw new Error(result.error || 'Failed to fetch action logs');
        }
      } catch (err) {
        console.error('Error fetching action logs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setActionLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActionLogs();
  }, [personId, workspaceId]);

  return { actionLogs, loading, error };
}
