/**
 * Simple Feature Access Service
 * 
 * This service provides a streamlined approach to feature access control
 * that works with the simplified schema and v1 APIs.
 */

export type SimpleFeatureName = 'OASIS' | 'STACKS' | 'WORKSHOP' | 'REVENUEOS' | 'METRICS' | 'CHRONICLE' | 'DESKTOP_DOWNLOAD';

interface SimpleFeatureAccess {
  [key: string]: boolean;
}

/**
 * Get feature access for a user in a workspace
 * Uses a simple approach based on workspace type and user role
 */
export function getSimpleFeatureAccess(
  workspaceSlug: string, 
  userRole: string = 'VIEWER'
): SimpleFeatureAccess {
  // Define which workspaces get all features
  const fullAccessWorkspaces = ['adrata', 'notary-everyday'];
  
  // Define which roles get all features
  const fullAccessRoles = ['ADMIN', 'WORKSPACE_ADMIN', 'SUPER_ADMIN'];
  
  // Check if this workspace gets full access
  const hasFullWorkspaceAccess = fullAccessWorkspaces.includes(workspaceSlug.toLowerCase());
  
  // Check if this role gets full access
  const hasFullRoleAccess = fullAccessRoles.includes(userRole.toUpperCase());
  
  // If either workspace or role has full access, enable all features
  const hasFullAccess = hasFullWorkspaceAccess || hasFullRoleAccess;
  
  // Special case: DESKTOP_DOWNLOAD only for Adrata workspace
  const hasDesktopDownloadAccess = workspaceSlug.toLowerCase() === 'adrata' || hasFullRoleAccess;
  
  if (hasFullAccess) {
    return {
      OASIS: true,
      STACKS: true,
      WORKSHOP: true,
      REVENUEOS: true,
      METRICS: true,
      CHRONICLE: true,
      DESKTOP_DOWNLOAD: hasDesktopDownloadAccess
    };
  }
  
  // Default: no features for other workspaces/roles
  return {
    OASIS: false,
    STACKS: false,
    WORKSHOP: false,
    REVENUEOS: false,
    METRICS: false,
    CHRONICLE: false,
    DESKTOP_DOWNLOAD: hasDesktopDownloadAccess
  };
}

/**
 * Check if a specific feature is accessible
 */
export function hasSimpleFeatureAccess(
  feature: SimpleFeatureName,
  workspaceSlug: string,
  userRole: string = 'VIEWER'
): boolean {
  const access = getSimpleFeatureAccess(workspaceSlug, userRole);
  return access[feature] || false;
}
