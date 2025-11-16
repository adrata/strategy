/**
 * Company OS Access Service
 * 
 * Manages company-level OS access configuration
 * Allows enabling/disabling specific OS modules (acquisition, retention, expansion) per company
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type OSType = 'acquisition' | 'retention' | 'expansion';

export interface CompanyOSAccess {
  id: string;
  companyId: string;
  workspaceId: string;
  acquisitionOsEnabled: boolean;
  retentionOsEnabled: boolean;
  expansionOsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyOSAccessInput {
  companyId: string;
  workspaceId: string;
  acquisitionOsEnabled?: boolean;
  retentionOsEnabled?: boolean;
  expansionOsEnabled?: boolean;
}

/**
 * Get OS access configuration for a company
 * Returns default (all enabled) if no configuration exists
 */
export async function getCompanyOSAccess(
  companyId: string,
  workspaceId: string
): Promise<CompanyOSAccess> {
  try {
    let access = await prisma.company_os_access.findUnique({
      where: { companyId }
    });

    // If no configuration exists, return default (all enabled)
    if (!access) {
      return {
        id: '',
        companyId,
        workspaceId,
        acquisitionOsEnabled: true,
        retentionOsEnabled: true,
        expansionOsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    return {
      id: access.id,
      companyId: access.companyId,
      workspaceId: access.workspaceId,
      acquisitionOsEnabled: access.acquisitionOsEnabled,
      retentionOsEnabled: access.retentionOsEnabled,
      expansionOsEnabled: access.expansionOsEnabled,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt
    };
  } catch (error) {
    console.error('Error getting company OS access:', error);
    // Return default on error
    return {
      id: '',
      companyId,
      workspaceId,
      acquisitionOsEnabled: true,
      retentionOsEnabled: true,
      expansionOsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

/**
 * Update OS access configuration for a company
 * Creates configuration if it doesn't exist
 */
export async function updateCompanyOSAccess(
  input: CompanyOSAccessInput
): Promise<CompanyOSAccess> {
  try {
    const existing = await prisma.company_os_access.findUnique({
      where: { companyId: input.companyId }
    });

    if (existing) {
      // Update existing configuration
      const updated = await prisma.company_os_access.update({
        where: { companyId: input.companyId },
        data: {
          acquisitionOsEnabled: input.acquisitionOsEnabled ?? existing.acquisitionOsEnabled,
          retentionOsEnabled: input.retentionOsEnabled ?? existing.retentionOsEnabled,
          expansionOsEnabled: input.expansionOsEnabled ?? existing.expansionOsEnabled
        }
      });

      return {
        id: updated.id,
        companyId: updated.companyId,
        workspaceId: updated.workspaceId,
        acquisitionOsEnabled: updated.acquisitionOsEnabled,
        retentionOsEnabled: updated.retentionOsEnabled,
        expansionOsEnabled: updated.expansionOsEnabled,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      };
    } else {
      // Create new configuration
      const created = await prisma.company_os_access.create({
        data: {
          companyId: input.companyId,
          workspaceId: input.workspaceId,
          acquisitionOsEnabled: input.acquisitionOsEnabled ?? true,
          retentionOsEnabled: input.retentionOsEnabled ?? true,
          expansionOsEnabled: input.expansionOsEnabled ?? true
        }
      });

      return {
        id: created.id,
        companyId: created.companyId,
        workspaceId: created.workspaceId,
        acquisitionOsEnabled: created.acquisitionOsEnabled,
        retentionOsEnabled: created.retentionOsEnabled,
        expansionOsEnabled: created.expansionOsEnabled,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt
      };
    }
  } catch (error) {
    console.error('Error updating company OS access:', error);
    throw error;
  }
}

/**
 * Check if a company has access to a specific OS
 */
export async function hasCompanyOSAccess(
  companyId: string,
  workspaceId: string,
  osType: OSType
): Promise<boolean> {
  try {
    const access = await getCompanyOSAccess(companyId, workspaceId);
    
    switch (osType) {
      case 'acquisition':
        return access.acquisitionOsEnabled;
      case 'retention':
        return access.retentionOsEnabled;
      case 'expansion':
        return access.expansionOsEnabled;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking company OS access:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Get all companies in a workspace with their OS access configuration
 */
export async function getWorkspaceCompaniesOSAccess(
  workspaceId: string
): Promise<CompanyOSAccess[]> {
  try {
    const accessConfigs = await prisma.company_os_access.findMany({
      where: { workspaceId },
      include: {
        company: true
      }
    });

    return accessConfigs.map(access => ({
      id: access.id,
      companyId: access.companyId,
      workspaceId: access.workspaceId,
      acquisitionOsEnabled: access.acquisitionOsEnabled,
      retentionOsEnabled: access.retentionOsEnabled,
      expansionOsEnabled: access.expansionOsEnabled,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt
    }));
  } catch (error) {
    console.error('Error getting workspace companies OS access:', error);
    return [];
  }
}

/**
 * Bulk update OS access for multiple companies
 */
export async function bulkUpdateCompanyOSAccess(
  updates: Array<{
    companyId: string;
    workspaceId: string;
    acquisitionOsEnabled?: boolean;
    retentionOsEnabled?: boolean;
    expansionOsEnabled?: boolean;
  }>
): Promise<CompanyOSAccess[]> {
  try {
    const results = await Promise.all(
      updates.map(update => updateCompanyOSAccess(update))
    );
    return results;
  } catch (error) {
    console.error('Error bulk updating company OS access:', error);
    throw error;
  }
}

