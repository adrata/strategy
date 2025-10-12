import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';

interface WorkspaceSpeedrunSettings {
  dailyTarget: number;
  weeklyTarget: number;
}

export function useWorkspaceSpeedrunSettings() {
  const [settings, setSettings] = useState<WorkspaceSpeedrunSettings>({
    dailyTarget: 50,
    weeklyTarget: 250,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user: authUser } = useUnifiedAuth();

  useEffect(() => {
    const loadSettings = async () => {
      if (!authUser?.activeWorkspaceId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/workspace/speedrun-settings?workspaceId=${authUser.activeWorkspaceId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data.data);
        }
      } catch (error) {
        console.error('Failed to load workspace speedrun settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [authUser?.activeWorkspaceId]);

  return { settings, isLoading };
}
