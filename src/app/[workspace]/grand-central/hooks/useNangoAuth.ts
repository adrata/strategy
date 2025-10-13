import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface UseNangoAuthReturn {
  initiateConnection: (provider: string) => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

export function useNangoAuth(): UseNangoAuthReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const workspaceId = params.workspace as string;

  const initiateConnection = useCallback(async (provider: string) => {
    if (!workspaceId) {
      setError('Workspace ID not found');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Call our API to initiate OAuth flow
      const response = await fetch('/api/v1/integrations/nango/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          workspaceId,
          redirectUrl: `${window.location.origin}/${workspaceId}/grand-central`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate connection');
      }

      const { authUrl } = await response.json();

      // Redirect to OAuth URL
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error initiating connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate connection');
    } finally {
      setIsConnecting(false);
    }
  }, [workspaceId]);

  return {
    initiateConnection,
    isConnecting,
    error
  };
}
