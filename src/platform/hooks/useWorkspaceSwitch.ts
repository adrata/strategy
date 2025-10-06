"use client";

import { useCallback } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { parseWorkspaceFromUrl, getWorkspaceBySlug } from '@/platform/auth/workspace-slugs';

/**
 * Hook for handling workspace switching based on URL changes
 * This ensures that when users navigate to workspace-specific URLs,
 * the workspace context is properly updated
 */
export function useWorkspaceSwitch() {
  const { user: authUser } = useUnifiedAuth();

  const switchToWorkspaceFromUrl = useCallback(async (pathname: string) => {
    if (!authUser?.workspaces) {
      console.log('⚠️ [WORKSPACE SWITCH] No workspaces available');
      return false;
    }

    const parsed = parseWorkspaceFromUrl(pathname);
    if (!parsed) {
      console.log('⚠️ [WORKSPACE SWITCH] No workspace found in URL');
      return false;
    }

    const { slug } = parsed;
    const workspace = getWorkspaceBySlug(authUser.workspaces, slug);
    
    if (!workspace) {
      console.log(`⚠️ [WORKSPACE SWITCH] Workspace not found for slug: ${slug}`);
      return false;
    }

    // Check if we need to switch workspaces
    if (workspace['id'] === authUser.activeWorkspaceId) {
      console.log(`✅ [WORKSPACE SWITCH] Already on correct workspace: ${workspace.name}`);
      return true;
    }

    console.log(`🔄 [WORKSPACE SWITCH] Switching from ${authUser.activeWorkspaceId} to ${workspace.id} (${workspace.name})`);

    try {
      // Get the current session
      const { UnifiedAuthService } = await import('@/platform/auth/service');
      const { storeSession } = await import('@/platform/auth/session');
      const session = await UnifiedAuthService.getSession();
      
      if (!session?.accessToken) {
        console.error('❌ [WORKSPACE SWITCH] No access token available');
        return false;
      }

      // Call the unified auth API with switch-workspace action
      const response = await fetch('/api/auth/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ 
          action: 'switch-workspace',
          workspaceId: workspace.id 
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error(`❌ [WORKSPACE SWITCH] API call failed: ${response.status}`);
        return false;
      }

      const result = await response.json();
      
      if (result['success'] && result.auth?.token) {
        // Update the session with the new token
        session['accessToken'] = result.auth.token;
        await storeSession(session);
        
        // 🆕 CRITICAL: Clear cache before dispatching event to ensure clean workspace switch
        try {
          const { cache } = await import('@/platform/services/unified-cache');
          const currentWorkspaceId = authUser?.activeWorkspaceId;
          if (currentWorkspaceId && currentWorkspaceId !== workspace.id) {
            console.log(`🧹 [WORKSPACE SWITCH] Clearing cache before workspace switch event: ${currentWorkspaceId} -> ${workspace.id}`);
            await cache.clearWorkspaceCache(currentWorkspaceId, workspace.id);
            console.log(`✅ [WORKSPACE SWITCH] Cache cleared before workspace switch event`);
          }
        } catch (error) {
          console.warn('⚠️ [WORKSPACE SWITCH] Failed to clear cache before event:', error);
        }
        
        // Dispatch event to notify other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('adrata-workspace-switched', {
            detail: { 
              workspaceId: workspace.id, 
              workspaceName: workspace.name,
              previousWorkspaceId: authUser?.activeWorkspaceId,
              cacheCleared: true
            }
          }));
        }
        
        console.log(`✅ [WORKSPACE SWITCH] Successfully switched to workspace: ${workspace.name}`);
        return true;
      } else {
        console.error('❌ [WORKSPACE SWITCH] API returned error:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [WORKSPACE SWITCH] Failed to switch workspace:', error);
      return false;
    }
  }, [authUser]);

  return {
    switchToWorkspaceFromUrl,
  };
}
