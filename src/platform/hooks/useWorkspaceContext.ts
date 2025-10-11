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

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';

interface UseWorkspaceContextReturn {
  workspaceId: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWorkspaceContext(): UseWorkspaceContextReturn {
  const { user: authUser, isLoading: authLoading } = useUnifiedAuth();
  const { data: acquisitionData } = useAcquisitionOS();
  
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🆕 CRITICAL FIX: Get workspace ID from multiple sources with priority
  const getCurrentWorkspaceId = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. First try to get from JWT token (most reliable)
      const session = await import('@/platform/auth/service').then(m => m.UnifiedAuthService.getSession());
      if (session?.accessToken) {
        try {
          const jwt = await import('jsonwebtoken');
          const secret = process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production";
          const decoded = jwt.verify(session.accessToken, secret) as any;
          if (decoded?.workspaceId) {
            console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from JWT: ${decoded.workspaceId}`);
            return { workspaceId: decoded.workspaceId, userId: decoded.userId || authUser?.id };
          }
        } catch (error) {
          console.warn('⚠️ [WORKSPACE CONTEXT] Failed to decode JWT token:', error);
        }
      }
      
      // 2. Fallback to acquisitionData
      if (acquisitionData?.auth?.authUser?.activeWorkspaceId) {
        console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from acquisitionData: ${acquisitionData.auth.authUser.activeWorkspaceId}`);
        return { 
          workspaceId: acquisitionData.auth.authUser.activeWorkspaceId, 
          userId: acquisitionData.auth.authUser.id || authUser?.id 
        };
      }
      
      // 3. Fallback to user activeWorkspaceId
      if (authUser?.activeWorkspaceId) {
        console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from user: ${authUser.activeWorkspaceId}`);
        return { workspaceId: authUser.activeWorkspaceId, userId: authUser.id };
      }
      
      // 4. Last resort: first workspace
      if (authUser?.workspaces?.[0]?.id) {
        console.log(`🔍 [WORKSPACE CONTEXT] Got workspace ID from first workspace: ${authUser.workspaces[0].id}`);
        return { workspaceId: authUser.workspaces[0].id, userId: authUser.id };
      }
      
      return { workspaceId: null, userId: null };
    } catch (error) {
      console.error('❌ [WORKSPACE CONTEXT] Error getting workspace ID:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      return { workspaceId: null, userId: null };
    } finally {
      setIsLoading(false);
    }
  }, [acquisitionData, authUser]);

  // 🆕 CRITICAL FIX: Update workspace ID when it changes
  useEffect(() => {
    const updateWorkspaceId = async () => {
      const { workspaceId: newWorkspaceId, userId: newUserId } = await getCurrentWorkspaceId();
      
      if (newWorkspaceId && newWorkspaceId !== currentWorkspaceId) {
        console.log(`🔄 [WORKSPACE CONTEXT] Workspace ID changed: ${currentWorkspaceId} -> ${newWorkspaceId}`);
        setCurrentWorkspaceId(newWorkspaceId);
        setCurrentUserId(newUserId);
      } else if (newWorkspaceId && newWorkspaceId === currentWorkspaceId && newUserId !== currentUserId) {
        // User ID changed but workspace stayed the same
        console.log(`🔄 [WORKSPACE CONTEXT] User ID changed: ${currentUserId} -> ${newUserId}`);
        setCurrentUserId(newUserId);
      }
    };
    
    updateWorkspaceId();
  }, [acquisitionData, authUser, getCurrentWorkspaceId, currentWorkspaceId, currentUserId]);

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
