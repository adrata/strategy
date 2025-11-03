import { useState, useEffect, useRef } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { authFetch } from '@/platform/api-fetch';

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
  const [error, setError] = useState<string | null>(null);
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  useEffect(() => {
    const loadSettings = async (retryAttempt = 0) => {
      // Don't attempt to load if auth is still loading or user is not authenticated
      if (authLoading || !isAuthenticated) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [SPEEDRUN SETTINGS HOOK] Auth not ready:', { authLoading, isAuthenticated });
        }
        return;
      }

      // Don't attempt if no active workspace
      if (!authUser?.activeWorkspaceId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 [SPEEDRUN SETTINGS HOOK] No active workspace ID');
        }
        setIsLoading(false);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 [SPEEDRUN SETTINGS HOOK] Loading settings for workspace: ${authUser.activeWorkspaceId} (attempt ${retryAttempt + 1})`);
      }

      try {
        const response = await authFetch(
          `/api/workspace/speedrun-settings?workspaceId=${authUser.activeWorkspaceId}`,
          {}, // options
          { success: false, data: { dailyTarget: 50, weeklyTarget: 250 } } // fallback
        );
        
        if (response?.success && response?.data) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ [SPEEDRUN SETTINGS HOOK] Settings loaded successfully:', response.data);
          }
          setSettings(response.data);
          setError(null);
          retryCountRef.current = 0; // Reset retry count on success
        } else if (response?.success === false && response?.data) {
          // Handle error response format: {success: false, data: {...}}
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [SPEEDRUN SETTINGS HOOK] Received error response with fallback data, using fallback:', response);
          }
          setSettings(response.data);
          setError(null);
          retryCountRef.current = 0;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [SPEEDRUN SETTINGS HOOK] Invalid response format:', response);
          }
          setError('Invalid response format');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ [SPEEDRUN SETTINGS HOOK] Failed to load settings (attempt ${retryAttempt + 1}):`, error);
        }
        setError(error instanceof Error ? error.message : 'Failed to load settings');
        
        // Retry logic for failed requests
        if (retryAttempt < maxRetries - 1) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 [SPEEDRUN SETTINGS HOOK] Retrying in ${retryDelay}ms...`);
          }
          setTimeout(() => {
            loadSettings(retryAttempt + 1);
          }, retryDelay * (retryAttempt + 1)); // Exponential backoff
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [SPEEDRUN SETTINGS HOOK] Max retries reached, using fallback values');
          }
          retryCountRef.current = 0; // Reset for future attempts
        }
      } finally {
        // Only set loading to false on the final attempt
        if (retryAttempt >= maxRetries - 1) {
          setIsLoading(false);
        }
      }
    };

    // Reset retry count when auth state changes
    retryCountRef.current = 0;
    
    loadSettings();
  }, [authUser?.activeWorkspaceId, isAuthenticated, authLoading]);

  const retry = () => {
    if (!authLoading && isAuthenticated && authUser?.activeWorkspaceId) {
      setIsLoading(true);
      setError(null);
      retryCountRef.current = 0;
      // Trigger reload by calling loadSettings directly
      const loadSettings = async (retryAttempt = 0) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 [SPEEDRUN SETTINGS HOOK] Manual retry for workspace: ${authUser.activeWorkspaceId} (attempt ${retryAttempt + 1})`);
        }

        try {
          const response = await authFetch(
            `/api/workspace/speedrun-settings?workspaceId=${authUser.activeWorkspaceId}`,
            {}, // options
            { success: false, data: { dailyTarget: 50, weeklyTarget: 250 } } // fallback
          );
          
          if (response?.success && response?.data) {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ [SPEEDRUN SETTINGS HOOK] Manual retry successful:', response.data);
            }
            setSettings(response.data);
            setError(null);
          } else if (response?.success === false && response?.data) {
            // Handle error response format: {success: false, data: {...}}
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ [SPEEDRUN SETTINGS HOOK] Manual retry - received error response with fallback data, using fallback:', response);
            }
            setSettings(response.data);
            setError(null);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ [SPEEDRUN SETTINGS HOOK] Manual retry - invalid response format:', response);
            }
            setError('Invalid response format');
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`❌ [SPEEDRUN SETTINGS HOOK] Manual retry failed:`, error);
          }
          setError(error instanceof Error ? error.message : 'Failed to load settings');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSettings();
    }
  };

  return { 
    settings, 
    isLoading: isLoading || authLoading, 
    error,
    retry
  };
}
