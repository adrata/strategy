/**
 * Shared workspace ID resolution utility
 * 
 * Provides consistent workspace ID resolution across all stacks components
 * with proper fallback logic.
 */

import { useUnifiedAuth } from '@/platform/auth';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { getWorkspaceIdBySlug } from '@/platform/config/workspace-mapping';
import { usePathname } from 'next/navigation';

/**
 * Hook to resolve workspace ID with consistent fallback logic
 * 
 * Fallback order:
 * 1. ui.activeWorkspace?.id
 * 2. workspaceId from URL workspace slug
 * 3. authUser.activeWorkspaceId
 * 
 * @returns Resolved workspace ID or null if none available
 */
export function useWorkspaceId(): string | null {
  const { user: authUser } = useUnifiedAuth();
  const { ui } = useRevenueOS();
  const pathname = usePathname();
  
  // Get workspace slug from pathname
  const workspaceSlug = pathname.split('/').filter(Boolean)[0];
  
  // Resolve workspace ID with fallback logic
  let workspaceId = ui.activeWorkspace?.id;
  
  // Fallback 1: Get from URL workspace slug if UI workspace is missing
  if (!workspaceId && workspaceSlug) {
    const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
    if (urlWorkspaceId) {
      workspaceId = urlWorkspaceId;
    }
  }
  
  // Fallback 2: Use user's active workspace ID
  if (!workspaceId && authUser?.activeWorkspaceId) {
    workspaceId = authUser.activeWorkspaceId;
  }
  
  return workspaceId || null;
}

/**
 * Resolve workspace ID synchronously (for use outside React components)
 */
export function resolveWorkspaceId(
  uiWorkspaceId: string | undefined,
  workspaceSlug: string | undefined,
  userWorkspaceId: string | undefined
): string | null {
  let workspaceId = uiWorkspaceId;
  
  if (!workspaceId && workspaceSlug) {
    const urlWorkspaceId = getWorkspaceIdBySlug(workspaceSlug);
    if (urlWorkspaceId) {
      workspaceId = urlWorkspaceId;
    }
  }
  
  if (!workspaceId && userWorkspaceId) {
    workspaceId = userWorkspaceId;
  }
  
  return workspaceId || null;
}

