/**
 * 🎯 WORKSPACE CONTEXT HOOK - REAL-TIME WORKSPACE DETECTION
 * 
 * Provides real-time workspace ID detection from multiple sources
 * with priority order and automatic updates when workspace changes
 * 
 * Priority Order:
 * 1. JWT Token (most reliable - updated immediately on workspace switch)
 * 2. AcquisitionData (provider context)
 * 3. User activeWorkspaceId (may be stale)
 * 4. First available workspace (fallback)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';

interface UseWorkspaceContextReturn {
  workspaceId: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWorkspaceContext(): UseWorkspaceContextReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useRevenueOS();
  
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔧 FIX: Use refs to track previous values and prevent infinite loops
  const previousValuesRef = useRef<{
    acquisitionWorkspaceId?: string | null;
    acquisitionUserId?: string | null;
    userActiveWorkspaceId?: string | null;
    userId?: string | null;
    firstWorkspaceId?: string | null;
  }>({});
  const hasInitializedRef = useRef(false);

  // 🔧 FIX: Extract primitive values to prevent infinite loops from object reference changes
  const acquisitionWorkspaceId = acquisitionData?.auth?.authUser?.activeWorkspaceId;
  const acquisitionUserId = acquisitionData?.auth?.authUser?.id;
  const userActiveWorkspaceId = authUser?.activeWorkspaceId;
  const userId = authUser?.id;
  const firstWorkspaceId = authUser?.workspaces?.[0]?.id;

  // 🆕 CRITICAL FIX: Get workspace ID from multiple sources with priority
  const getCurrentWorkspaceId = useCallback(async () => {
    try {
      setError(null);
      
      // 0. First try to get from URL (most immediate)
      if (typeof window !== 'undefined') {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const workspaceSlug = pathSegments[0]; // First segment is workspace slug
        
        if (workspaceSlug) {
          // Map workspace slug to workspace ID
          const workspaceMapping: Record<string, string> = {
            'adrata': '01K7464TNANHQXPCZT1FYX205V',
            'demo': '01K74N79PCW5W8D9X6EK7KJANM',
            'notary-everyday': '01K7DNYR5VZ7JY36KGKKN76XZ1',
            'top-engineering-plus': '01K75ZD7DWHG1XF16HAF2YVKCK',
            'cloudcaddie': '01K7DSWP8ZBA75K5VSWVXPEMAH',
            'pinpoint': '01K90EQWJCCN2JDMRQF12F49GN',
            'top-temp': '01K9QAP09FHT6EAP1B4G2KP3D2',
            'toptemp': '01K9QAP09FHT6EAP1B4G2KP3D2',
            'ei-cooperative': '01K9WFW99WEGDQY2RARPCVC4JD'
          };
          
          const workspaceId = workspaceMapping[workspaceSlug];
          if (workspaceId) {
            console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from URL: ${workspaceId} (slug: ${workspaceSlug})`);
            return { workspaceId, userId: userId || null };
          }
        }
      }
      
      // 1. JWT verification removed - should only happen server-side for security
      // Client-side JWT verification causes instanceof errors and is not secure
      
      // 2. Fallback to acquisitionData
      if (acquisitionWorkspaceId) {
        console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from acquisitionData: ${acquisitionWorkspaceId}`);
        return { 
          workspaceId: acquisitionWorkspaceId, 
          userId: acquisitionUserId || userId || null 
        };
      }
      
      // 3. Fallback to user activeWorkspaceId
      if (userActiveWorkspaceId) {
        console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from user: ${userActiveWorkspaceId}`);
        return { workspaceId: userActiveWorkspaceId, userId: userId || null };
      }
      
      // 4. Last resort: first workspace
      if (firstWorkspaceId) {
        console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from first workspace: ${firstWorkspaceId}`);
        return { workspaceId: firstWorkspaceId, userId: userId || null };
      }
      
      return { workspaceId: null, userId: null };
    } catch (error) {
      console.error('❌ [WORKSPACE CONTEXT] Error getting workspace ID:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return { workspaceId: null, userId: null };
    }
  }, [acquisitionWorkspaceId, acquisitionUserId, userActiveWorkspaceId, userId, firstWorkspaceId]);

  // 🆕 CRITICAL FIX: Update workspace ID when it changes
  // 🔧 FIX: Use primitive values in dependencies to prevent infinite loops
  useEffect(() => {
    // Only run if we have the necessary data
    if (authLoading) return;
    
    // Check if any of the source values actually changed
    const prev = previousValuesRef.current;
    const hasChanged = 
      prev.acquisitionWorkspaceId !== acquisitionWorkspaceId ||
      prev.acquisitionUserId !== acquisitionUserId ||
      prev.userActiveWorkspaceId !== userActiveWorkspaceId ||
      prev.userId !== userId ||
      prev.firstWorkspaceId !== firstWorkspaceId;
    
    // Update ref with current values
    previousValuesRef.current = {
      acquisitionWorkspaceId,
      acquisitionUserId,
      userActiveWorkspaceId,
      userId,
      firstWorkspaceId
    };
    
    // Only proceed if values actually changed OR if we haven't initialized yet
    if (!hasChanged && hasInitializedRef.current) {
      return;
    }
    
    // Mark as initialized after first run
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
    
    const updateWorkspaceId = async () => {
      const { workspaceId: newWorkspaceId, userId: newUserId } = await getCurrentWorkspaceId();
      
      // Use functional updates to avoid stale closure issues
      setCurrentWorkspaceId((prevWorkspaceId) => {
        const workspaceChanged = newWorkspaceId !== prevWorkspaceId;
        
        if (workspaceChanged) {
          if (newWorkspaceId) {
            console.log(`🔄 [WORKSPACE CONTEXT] Workspace ID changed: ${prevWorkspaceId} -> ${newWorkspaceId}`);
          } else {
            console.log(`🔄 [WORKSPACE CONTEXT] Workspace cleared: ${prevWorkspaceId} -> null`);
          }
          setIsLoading(false);
          // Update user ID when workspace changes
          setCurrentUserId(newUserId);
          return newWorkspaceId;
        } else if (prevWorkspaceId === null && newWorkspaceId) {
          // Initial load complete - we now have a workspace ID
          setIsLoading(false);
          setCurrentUserId(newUserId);
        }
        
        // Check for user ID changes when workspace hasn't changed
        if (!workspaceChanged && newWorkspaceId) {
          setCurrentUserId((prevUserId) => {
            if (newUserId !== prevUserId) {
              // User ID changed but workspace stayed the same
              console.log(`🔄 [WORKSPACE CONTEXT] User ID changed: ${prevUserId} -> ${newUserId}`);
              setIsLoading(false);
              return newUserId;
            }
            return prevUserId;
          });
        }
        
        return prevWorkspaceId;
      });
    };
    
    updateWorkspaceId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acquisitionWorkspaceId, acquisitionUserId, userActiveWorkspaceId, userId, firstWorkspaceId, authLoading]);

  // 🧹 LISTEN FOR WORKSPACE SWITCH EVENTS: Clear cache when workspace switch event is fired
  useEffect(() => {
    const handleWorkspaceSwitch = (event: CustomEvent) => {
      const { workspaceId: newWorkspaceId, userId: newUserId } = event.detail;
      if (newWorkspaceId && newWorkspaceId !== currentWorkspaceId) {
        console.log(`🔄 [WORKSPACE CONTEXT] Received workspace switch event for: ${newWorkspaceId}`);
        setCurrentWorkspaceId(newWorkspaceId);
        setCurrentUserId(newUserId || authUser?.id);
        setError(null);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      return () => {
        window.removeEventListener('adrata-workspace-switched', handleWorkspaceSwitch as EventListener);
      };
    }
  }, [currentWorkspaceId, authUser]);

  const refresh = useCallback(async () => {
    const { workspaceId: newWorkspaceId, userId: newUserId } = await getCurrentWorkspaceId();
    setCurrentWorkspaceId(newWorkspaceId);
    setCurrentUserId(newUserId);
  }, [getCurrentWorkspaceId]);

  return {
    workspaceId: currentWorkspaceId,
    userId: currentUserId,
    isLoading: isLoading || authLoading,
    error,
    refresh
  };
}
