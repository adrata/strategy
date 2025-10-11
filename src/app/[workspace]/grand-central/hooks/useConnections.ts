import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Connection {
  id: string;
  workspaceId: string;
  userId: string;
  provider: string;
  providerConfigKey: string;
  nangoConnectionId: string;
  connectionName?: string;
  metadata: any;
  status: 'active' | 'pending' | 'error' | 'inactive';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UseConnectionsReturn {
  connections: Connection[];
  isLoading: boolean;
  error: string | null;
  refreshConnections: () => Promise<void>;
  disconnectConnection: (connectionId: string) => Promise<boolean>;
}

export function useConnections(): UseConnectionsReturn {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const workspaceId = params.workspace as string;

  const fetchConnections = useCallback(async () => {
    if (!workspaceId) {
      setError('Workspace ID not found');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/grand-central/nango/connections?workspaceId=${workspaceId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch connections');
      }

      const { connections: fetchedConnections } = await response.json();
      setConnections(fetchedConnections);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch connections');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const refreshConnections = useCallback(async () => {
    setIsLoading(true);
    await fetchConnections();
  }, [fetchConnections]);

  const disconnectConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    if (!workspaceId) {
      setError('Workspace ID not found');
      return false;
    }

    try {
      const response = await fetch('/api/grand-central/nango/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId,
          workspaceId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }

      // Remove connection from local state
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      return true;
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      return false;
    }
  }, [workspaceId]);

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Poll for connection updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchConnections();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchConnections, isLoading]);

  return {
    connections,
    isLoading,
    error,
    refreshConnections,
    disconnectConnection
  };
}
