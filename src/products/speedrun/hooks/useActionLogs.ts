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
          `/api/speedrun/action-log?personId=${encodeURIComponent(personId)}&workspaceId=${encodeURIComponent(workspaceId)}&limit=50`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch action logs: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Convert timestamp strings to Date objects
          const logs = result.data.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp),
            nextActionDate: log.nextActionDate ? new Date(log.nextActionDate) : null,
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
