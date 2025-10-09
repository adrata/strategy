/**
 * WORKSPACE ACCESS CONTROL SERVICE
 * 
 * Provides secure workspace membership validation and role-based access control
 * for the Adrata platform. Ensures users can only access data from workspaces
 * they are members of.
 */

import { prisma } from '@/platform/database/prisma-client';

export interface WorkspaceAccessResult {
  hasAccess: boolean;
  role?: string;
  permissions?: string[];
  error?: string;
}

export interface WorkspaceMembership {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Cache for workspace access validation to improve performance
const workspaceAccessCache = new Map<string, { 
  result: WorkspaceAccessResult; 
  timestamp: number; 
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate if a user has access to a specific workspace
 * 
 * @param userId - The user ID to validate
 * @param workspaceId - The workspace ID to check access for
 * @param requiredRole - Optional minimum role required (admin, member, viewer)
 * @returns Promise<WorkspaceAccessResult>
 */
export async function validateWorkspaceAccess(
  userId: string,
  workspaceId: string,
  requiredRole?: 'admin' | 'member' | 'viewer'
): Promise<WorkspaceAccessResult> {
  try {
    // Check cache first
    const cacheKey = `${userId}:${workspaceId}:${requiredRole || 'any'}`;
    const cached = workspaceAccessCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }


    // Query workspace membership
    const membership = await prisma.workspace_users.findFirst({
      where: {
        userId,
        workspaceId,
      },
      select: {
        role: true,
      }
    });

    if (!membership) {
      const result: WorkspaceAccessResult = {
        hasAccess: false,
        error: 'User not member of workspace'
      };
      
      // Cache negative result for shorter time
      workspaceAccessCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      return result;
    }

    // Check role requirements if specified
    if (requiredRole) {
      const roleHierarchy = { 'viewer': 1, 'member': 2, 'admin': 3 };
      const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole];
      
      if (userRoleLevel < requiredRoleLevel) {
        const result: WorkspaceAccessResult = {
          hasAccess: false,
          error: `Insufficient permissions. Required: ${requiredRole}, User role: ${membership.role}`
        };
        
        workspaceAccessCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        return result;
      }
    }

    const result: WorkspaceAccessResult = {
      hasAccess: true,
      role: membership.role,
      permissions: [] // Simplified for now
    };

    // Cache positive result
    workspaceAccessCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;

  } catch (error) {
    console.error('❌ [WORKSPACE ACCESS] Validation error:', error);
    return {
      hasAccess: false,
      error: 'Access validation failed'
    };
  }
}

/**
 * Get all workspaces a user has access to
 * 
 * @param userId - The user ID
 * @returns Promise<WorkspaceMembership[]>
 */
export async function getUserWorkspaces(userId: string): Promise<WorkspaceMembership[]> {
  try {
    const memberships = await prisma.workspaceMembership.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        role: {
          select: {
            name: true,
            permissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return memberships.map(membership => ({
      id: membership.id,
      userId: membership.userId,
      workspaceId: membership.workspaceId,
      role: membership.role?.name || 'member',
      status: membership.status as 'active' | 'suspended' | 'pending',
      permissions: membership.role?.permissions || [],
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt
    }));

  } catch (error) {
    console.error('❌ [WORKSPACE ACCESS] Error getting user workspaces:', error);
    return [];
  }
}

/**
 * Check if user has specific permission in workspace
 * 
 * @param userId - The user ID
 * @param workspaceId - The workspace ID
 * @param permission - The permission to check
 * @returns Promise<boolean>
 */
export async function hasWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: string
): Promise<boolean> {
  try {
    const access = await validateWorkspaceAccess(userId, workspaceId);
    
    if (!access.hasAccess) {
      return false;
    }

    return access.permissions?.includes(permission) || false;

  } catch (error) {
    console.error('❌ [WORKSPACE ACCESS] Permission check error:', error);
    return false;
  }
}

/**
 * Clear workspace access cache for a user
 * 
 * @param userId - The user ID
 * @param workspaceId - Optional workspace ID (clears all if not provided)
 */
export function clearWorkspaceAccessCache(userId: string, workspaceId?: string): void {
  if (workspaceId) {
    // Clear specific workspace cache
    const keysToDelete = Array.from(workspaceAccessCache.keys())
      .filter(key => key.startsWith(`${userId}:${workspaceId}:`));
    
    keysToDelete.forEach(key => workspaceAccessCache.delete(key));
  } else {
    // Clear all cache for user
    const keysToDelete = Array.from(workspaceAccessCache.keys())
      .filter(key => key.startsWith(`${userId}:`));
    
    keysToDelete.forEach(key => workspaceAccessCache.delete(key));
  }
}

/**
 * Get workspace access statistics for monitoring
 * 
 * @returns Object with cache statistics
 */
export function getWorkspaceAccessStats(): {
  cacheSize: number;
  cacheKeys: string[];
  oldestEntry: number;
  newestEntry: number;
} {
  const now = Date.now();
  const timestamps = Array.from(workspaceAccessCache.values()).map(entry => entry.timestamp);
  
  return {
    cacheSize: workspaceAccessCache.size,
    cacheKeys: Array.from(workspaceAccessCache.keys()),
    oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
    newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
  };
}

/**
 * Validate workspace access with detailed error information
 * Used for debugging and security monitoring
 * 
 * @param userId - The user ID
 * @param workspaceId - The workspace ID
 * @returns Promise<{ access: WorkspaceAccessResult; debug: any }>
 */
export async function validateWorkspaceAccessWithDebug(
  userId: string,
  workspaceId: string
): Promise<{ access: WorkspaceAccessResult; debug: any }> {
  const startTime = Date.now();
  
  try {
    const access = await validateWorkspaceAccess(userId, workspaceId);
    
    const debug = {
      userId,
      workspaceId,
      processingTime: Date.now() - startTime,
      cacheHit: workspaceAccessCache.has(`${userId}:${workspaceId}:any`),
      timestamp: new Date().toISOString()
    };
    
    return { access, debug };
    
  } catch (error) {
    const debug = {
      userId,
      workspaceId,
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    
    return {
      access: {
        hasAccess: false,
        error: 'Access validation failed'
      },
      debug
    };
  }
}
