/**
 * ROLE SWITCHING SERVICE
 * 
 * Manages active role selection for users with multiple roles.
 * Allows users to switch between roles (e.g., Seller and Leader) with
 * the active role determining data access scope.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserRole {
  id: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}

/**
 * Get all active roles for a user in a workspace
 */
export async function getUserRoles(
  userId: string,
  workspaceId: string
): Promise<UserRole[]> {
  try {
    const userRoles = await prisma.user_roles.findMany({
      where: {
        userId,
        workspaceId: workspaceId || undefined,
        isActive: true
      },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return userRoles.map(ur => ({
      id: ur.id,
      roleId: ur.roleId,
      roleName: ur.role.name,
      isActive: ur.isActive
    }));
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}

/**
 * Get the active role preference for a user in a workspace
 * Returns role name (e.g., "seller", "leader") or null
 * Checks user's dashboardConfig for stored preference, defaults to seller for security
 */
export async function getActiveRole(
  userId: string,
  workspaceId: string
): Promise<string | null> {
  try {
    // First, get all available roles for the user
    const userRoles = await getUserRoles(userId, workspaceId);
    
    if (userRoles.length === 0) {
      return null;
    }

    // If only one role, return it
    if (userRoles.length === 1) {
      return userRoles[0].roleName.toLowerCase();
    }

    // Check for stored preference in user's dashboardConfig
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { dashboardConfig: true }
    });

    if (user?.dashboardConfig && typeof user.dashboardConfig === 'object') {
      const config = user.dashboardConfig as any;
      const activeRoleKey = `activeRole_${workspaceId}`;
      const storedRole = config[activeRoleKey];
      
      if (storedRole) {
        // Validate that the stored role is still valid
        const isValidRole = userRoles.some(r => 
          r.roleName.toLowerCase() === storedRole.toLowerCase()
        );
        if (isValidRole) {
          return storedRole.toLowerCase();
        }
      }
    }
    
    // Default to seller role for security (lower privilege)
    const sellerRole = userRoles.find(r => 
      r.roleName.toLowerCase() === 'seller' || 
      r.roleName.toLowerCase().includes('seller')
    );
    
    if (sellerRole) {
      return sellerRole.roleName.toLowerCase();
    }
    
    // Otherwise, return the first role
    return userRoles[0].roleName.toLowerCase();
  } catch (error) {
    console.error('Error getting active role:', error);
    return null;
  }
}

/**
 * Set the active role preference for a user in a workspace
 * Stores preference in user's dashboardConfig
 */
export async function setActiveRole(
  userId: string,
  workspaceId: string,
  roleName: string
): Promise<boolean> {
  try {
    // Validate that user can switch to this role
    const canSwitch = await canSwitchToRole(userId, workspaceId, roleName);
    if (!canSwitch) {
      return false;
    }

    // Get current user config
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { dashboardConfig: true }
    });

    const currentConfig = (user?.dashboardConfig as any) || {};
    const activeRoleKey = `activeRole_${workspaceId}`;
    
    // Update config with new active role
    const updatedConfig = {
      ...currentConfig,
      [activeRoleKey]: roleName.toLowerCase()
    };

    // Save to database
    await prisma.users.update({
      where: { id: userId },
      data: {
        dashboardConfig: updatedConfig
      }
    });

    return true;
  } catch (error) {
    console.error('Error setting active role:', error);
    return false;
  }
}

/**
 * Get active role with full role details
 */
export async function getActiveRoleDetails(
  userId: string,
  workspaceId: string
): Promise<{ roleId: string; roleName: string } | null> {
  try {
    const activeRoleName = await getActiveRole(userId, workspaceId);
    if (!activeRoleName) return null;

    const userRoles = await getUserRoles(userId, workspaceId);
    const activeRole = userRoles.find(r => 
      r.roleName.toLowerCase() === activeRoleName
    );

    if (!activeRole) return null;

    return {
      roleId: activeRole.roleId,
      roleName: activeRole.roleName
    };
  } catch (error) {
    console.error('Error getting active role details:', error);
    return null;
  }
}

/**
 * Check if user has multiple roles in workspace
 */
export async function hasMultipleRoles(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const roles = await getUserRoles(userId, workspaceId);
  return roles.length > 1;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  userId: string,
  workspaceId: string,
  roleName: string
): Promise<boolean> {
  const roles = await getUserRoles(userId, workspaceId);
  return roles.some(r => 
    r.roleName.toLowerCase() === roleName.toLowerCase()
  );
}

/**
 * Validate that a user can switch to a specific role
 */
export async function canSwitchToRole(
  userId: string,
  workspaceId: string,
  roleName: string
): Promise<boolean> {
  return await hasRole(userId, workspaceId, roleName);
}

/**
 * Get role by name for a user
 */
export async function getUserRoleByName(
  userId: string,
  workspaceId: string,
  roleName: string
): Promise<UserRole | null> {
  const roles = await getUserRoles(userId, workspaceId);
  return roles.find(r => 
    r.roleName.toLowerCase() === roleName.toLowerCase()
  ) || null;
}

