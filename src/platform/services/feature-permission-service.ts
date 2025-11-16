import { PrismaClient } from '@prisma/client';
import { getActiveRoleDetails } from './role-switching-service';
import { hasCompanyOSAccess, getCompanyOSAccess } from './company-os-access-service';

const prisma = new PrismaClient();

export type FeatureName = 'OASIS' | 'STACKS' | 'WORKSHOP' | 'REVENUEOS' | 'METRICS' | 'CHRONICLE' | 'DESKTOP_DOWNLOAD' | 'ACQUISITION_OS' | 'RETENTION_OS' | 'EXPANSION_OS';

export type OSType = 'acquisition' | 'retention' | 'expansion';

interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
}

interface WorkspaceFeatures {
  enabledFeatures: string[];
  hasAllFeatures: boolean;
}

interface UserFeatures {
  enabledFeatures: string[];
  permissions: string[];
}

// Cache for performance
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(type: string, ...args: string[]): string {
  return `${type}:${args.join(':')}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Check if a user has access to a specific feature in a workspace
 */
export async function hasFeatureAccess(
  userId: string,
  workspaceId: string,
  feature: FeatureName
): Promise<FeatureAccessResult> {
  const cacheKey = getCacheKey('feature_access', userId, workspaceId, feature);
  const cached = getCached<FeatureAccessResult>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // First check if workspace has the feature enabled
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { enabledFeatures: true }
    });

    if (!workspace) {
      const result = { hasAccess: false, reason: 'Workspace not found' };
      setCached(cacheKey, result);
      return result;
    }

    if (!workspace.enabledFeatures.includes(feature)) {
      const result = { hasAccess: false, reason: 'Feature not enabled for workspace' };
      setCached(cacheKey, result);
      return result;
    }

    // Get active role for user (supports role switching)
    const activeRole = await getActiveRoleDetails(userId, workspaceId);
    
    if (!activeRole) {
      const result = { hasAccess: false, reason: 'No active role found for user in workspace' };
      setCached(cacheKey, result);
      return result;
    }

    // Get user role with permissions for the active role
    const userRole = await prisma.user_roles.findFirst({
      where: {
        userId,
        workspaceId,
        roleId: activeRole.roleId,
        isActive: true
      },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!userRole) {
      const result = { hasAccess: false, reason: 'Active role not found for user in workspace' };
      setCached(cacheKey, result);
      return result;
    }

    // Check if user's active role has the required permission
    const hasPermission = userRole.role.role_permissions.some(
      rp => rp.permission.name === `${feature}_ACCESS`
    );

    const result = { 
      hasAccess: hasPermission, 
      reason: hasPermission ? undefined : 'User role does not have required permission' 
    };
    setCached(cacheKey, result);
    return result;

  } catch (error) {
    console.error('Error checking feature access:', error);
    return { hasAccess: false, reason: 'Error checking permissions' };
  }
}

/**
 * Get all enabled features for a workspace
 */
export async function getWorkspaceFeatures(workspaceId: string): Promise<WorkspaceFeatures> {
  const cacheKey = getCacheKey('workspace_features', workspaceId);
  const cached = getCached<WorkspaceFeatures>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { enabledFeatures: true }
    });

    if (!workspace) {
      return { enabledFeatures: [], hasAllFeatures: false };
    }

    const result = {
      enabledFeatures: workspace.enabledFeatures,
      hasAllFeatures: workspace.enabledFeatures.length >= 7 // All 7 features enabled
    };

    setCached(cacheKey, result);
    return result;

  } catch (error) {
    console.error('Error getting workspace features:', error);
    return { enabledFeatures: [], hasAllFeatures: false };
  }
}

/**
 * Get all features a user can access in a workspace
 */
export async function getUserFeatures(userId: string, workspaceId: string): Promise<UserFeatures> {
  const cacheKey = getCacheKey('user_features', userId, workspaceId);
  const cached = getCached<UserFeatures>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Get workspace features
    const workspaceFeatures = await getWorkspaceFeatures(workspaceId);
    
    // Get active role for user (supports role switching)
    const activeRole = await getActiveRoleDetails(userId, workspaceId);
    
    if (!activeRole) {
      return { enabledFeatures: [], permissions: [] };
    }

    // Get user permissions for the active role
    const userRole = await prisma.user_roles.findFirst({
      where: {
        userId,
        workspaceId,
        roleId: activeRole.roleId,
        isActive: true
      },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const userPermissions = userRole?.role.role_permissions.map(rp => rp.permission.name) || [];

    // Filter workspace features by user permissions
    const accessibleFeatures = workspaceFeatures.enabledFeatures.filter(feature => {
      return userPermissions.includes(`${feature}_ACCESS`);
    });

    const result = {
      enabledFeatures: accessibleFeatures,
      permissions: userPermissions
    };

    setCached(cacheKey, result);
    return result;

  } catch (error) {
    console.error('Error getting user features:', error);
    return { enabledFeatures: [], permissions: [] };
  }
}

/**
 * Check if user has access to multiple features at once
 */
export async function hasMultipleFeatureAccess(
  userId: string,
  workspaceId: string,
  features: FeatureName[]
): Promise<Record<FeatureName, boolean>> {
  const results: Record<FeatureName, boolean> = {} as Record<FeatureName, boolean>;
  
  await Promise.all(
    features.map(async (feature) => {
      const access = await hasFeatureAccess(userId, workspaceId, feature);
      results[feature] = access.hasAccess;
    })
  );

  return results;
}

/**
 * Check if user has access to a specific OS in a workspace
 * Checks both workspace-level feature flags and company-level access
 */
export async function hasOSAccess(
  userId: string,
  workspaceId: string,
  osType: OSType
): Promise<FeatureAccessResult> {
  const cacheKey = getCacheKey('os_access', userId, workspaceId, osType);
  const cached = getCached<FeatureAccessResult>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Map OS type to feature name
    const featureMap: Record<OSType, FeatureName> = {
      acquisition: 'ACQUISITION_OS',
      retention: 'RETENTION_OS',
      expansion: 'EXPANSION_OS'
    };

    const feature = featureMap[osType];

    // First check workspace-level feature access
    const featureAccess = await hasFeatureAccess(userId, workspaceId, feature);
    
    if (!featureAccess.hasAccess) {
      const result = { hasAccess: false, reason: `OS feature not enabled: ${feature}` };
      setCached(cacheKey, result);
      return result;
    }

    // For now, if workspace has the feature enabled, user has access
    // Company-level access can be checked separately when viewing specific companies
    const result = { hasAccess: true };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error checking OS access:', error);
    const result = { hasAccess: false, reason: 'Error checking OS access' };
    setCached(cacheKey, result);
    return result;
  }
}

/**
 * Check if a company has access to a specific OS
 * This is used for company-level filtering
 */
export async function hasCompanyOSAccessForCompany(
  companyId: string,
  workspaceId: string,
  osType: OSType
): Promise<boolean> {
  try {
    return await hasCompanyOSAccess(companyId, workspaceId, osType);
  } catch (error) {
    console.error('Error checking company OS access:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Clear cache for a specific user/workspace combination
 */
export function clearUserCache(userId: string, workspaceId?: string): void {
  if (workspaceId) {
    // Clear specific user-workspace cache
    const keysToDelete = Array.from(cache.keys()).filter(key => 
      key.includes(`user_features:${userId}:${workspaceId}`) ||
      key.includes(`feature_access:${userId}:${workspaceId}`)
    );
    keysToDelete.forEach(key => cache.delete(key));
  } else {
    // Clear all cache for user
    const keysToDelete = Array.from(cache.keys()).filter(key => 
      key.includes(`user_features:${userId}:`) ||
      key.includes(`feature_access:${userId}:`)
    );
    keysToDelete.forEach(key => cache.delete(key));
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}
