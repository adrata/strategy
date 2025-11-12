/**
 * Buyer Group Sync Service
 * 
 * Syncs buyer group data from company context to person records.
 * Ensures consistency between buyerGroupRole, isBuyerGroupMember, and influenceLevel.
 */

import { prisma } from '@/platform/database/prisma-client';

/**
 * Calculate influence level from buyer group role
 * Maps buyer group roles to influence levels for consistency
 */
function calculateInfluenceLevelFromRole(role: string | null | undefined): 'High' | 'Medium' | 'Low' | null {
  if (!role) return null;
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Decision Maker and Champion have high influence
  if (normalizedRole === 'decision maker' || normalizedRole === 'champion') {
    return 'High';
  }
  
  // Blocker and Stakeholder have medium influence
  if (normalizedRole === 'blocker' || normalizedRole === 'stakeholder') {
    return 'Medium';
  }
  
  // Introducer has low influence
  if (normalizedRole === 'introducer') {
    return 'Low';
  }
  
  // Default to Medium for unknown roles
  return 'Medium';
}

export class BuyerGroupSyncService {
  /**
   * Sync buyer group data for a specific person
   * Ensures isBuyerGroupMember and influenceLevel are set correctly based on buyerGroupRole
   */
  static async syncPersonBuyerGroupData(personId: string): Promise<{ updated: boolean; changes: Record<string, any> }> {
    const person = await prisma.people.findUnique({
      where: { id: personId },
      select: {
        id: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        influenceLevel: true,
      },
    });

    if (!person) {
      throw new Error(`Person not found: ${personId}`);
    }

    const changes: Record<string, any> = {};
    const updateData: Record<string, any> = {};

    // If person has a buyerGroupRole, ensure isBuyerGroupMember is true
    if (person.buyerGroupRole && !person.isBuyerGroupMember) {
      updateData.isBuyerGroupMember = true;
      changes.isBuyerGroupMember = { old: person.isBuyerGroupMember, new: true };
    }

    // Calculate and set influenceLevel from buyerGroupRole if missing or incorrect
    if (person.buyerGroupRole) {
      const calculatedInfluenceLevel = calculateInfluenceLevelFromRole(person.buyerGroupRole);
      
      if (calculatedInfluenceLevel && person.influenceLevel !== calculatedInfluenceLevel) {
        updateData.influenceLevel = calculatedInfluenceLevel;
        changes.influenceLevel = { old: person.influenceLevel, new: calculatedInfluenceLevel };
      }
    }

    // If no buyerGroupRole but isBuyerGroupMember is true, set it to false
    if (!person.buyerGroupRole && person.isBuyerGroupMember) {
      updateData.isBuyerGroupMember = false;
      changes.isBuyerGroupMember = { old: person.isBuyerGroupMember, new: false };
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await prisma.people.update({
        where: { id: personId },
        data: updateData,
      });
      return { updated: true, changes };
    }

    return { updated: false, changes: {} };
  }

  /**
   * Sync buyer group data for all people in a workspace
   * Finds people with buyerGroupRole but missing/null influenceLevel or incorrect isBuyerGroupMember
   */
  static async syncWorkspaceBuyerGroupData(
    workspaceId: string,
    options?: { batchSize?: number; dryRun?: boolean }
  ): Promise<{ synced: number; updated: number; errors: number }> {
    const batchSize = options?.batchSize || 100;
    const dryRun = options?.dryRun || false;

    let synced = 0;
    let updated = 0;
    let errors = 0;

    // Find people with buyerGroupRole but missing/null influenceLevel or incorrect isBuyerGroupMember
    const peopleToSync = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          // Has buyerGroupRole but missing/null influenceLevel
          {
            buyerGroupRole: { not: null },
            influenceLevel: null,
          },
          // Has buyerGroupRole but isBuyerGroupMember is false/null
          {
            buyerGroupRole: { not: null },
            OR: [
              { isBuyerGroupMember: false },
              { isBuyerGroupMember: null },
            ],
          },
          // No buyerGroupRole but isBuyerGroupMember is true
          {
            buyerGroupRole: null,
            isBuyerGroupMember: true,
          },
        ],
      },
      select: {
        id: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        influenceLevel: true,
      },
      take: batchSize,
    });

    console.log(`🔄 [BUYER GROUP SYNC] Found ${peopleToSync.length} people to sync in workspace ${workspaceId}`);

    for (const person of peopleToSync) {
      try {
        const calculatedInfluenceLevel = person.buyerGroupRole
          ? calculateInfluenceLevelFromRole(person.buyerGroupRole)
          : null;

        const updateData: Record<string, any> = {};

        // Set isBuyerGroupMember based on buyerGroupRole
        if (person.buyerGroupRole) {
          if (!person.isBuyerGroupMember) {
            updateData.isBuyerGroupMember = true;
          }
          // Set influenceLevel if missing or incorrect
          if (calculatedInfluenceLevel && person.influenceLevel !== calculatedInfluenceLevel) {
            updateData.influenceLevel = calculatedInfluenceLevel;
          }
        } else {
          // No buyerGroupRole but isBuyerGroupMember is true - set to false
          if (person.isBuyerGroupMember) {
            updateData.isBuyerGroupMember = false;
          }
        }

        if (Object.keys(updateData).length > 0) {
          synced++;
          if (!dryRun) {
            updateData.updatedAt = new Date();
            await prisma.people.update({
              where: { id: person.id },
              data: updateData,
            });
            updated++;
          } else {
            console.log(`[DRY RUN] Would update person ${person.id}:`, updateData);
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ [BUYER GROUP SYNC] Error syncing person ${person.id}:`, error);
      }
    }

    console.log(`✅ [BUYER GROUP SYNC] Synced ${synced} people, updated ${updated}, errors ${errors}`);

    return { synced, updated, errors };
  }

  /**
   * Sync buyer group data for all people with a specific company
   */
  static async syncCompanyBuyerGroupData(
    companyId: string,
    workspaceId: string,
    options?: { dryRun?: boolean }
  ): Promise<{ synced: number; updated: number; errors: number }> {
    const dryRun = options?.dryRun || false;

    let synced = 0;
    let updated = 0;
    let errors = 0;

    const peopleToSync = await prisma.people.findMany({
      where: {
        companyId,
        workspaceId,
        deletedAt: null,
        OR: [
          {
            buyerGroupRole: { not: null },
            influenceLevel: null,
          },
          {
            buyerGroupRole: { not: null },
            OR: [
              { isBuyerGroupMember: false },
              { isBuyerGroupMember: null },
            ],
          },
          {
            buyerGroupRole: null,
            isBuyerGroupMember: true,
          },
        ],
      },
      select: {
        id: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        influenceLevel: true,
      },
    });

    console.log(`🔄 [BUYER GROUP SYNC] Found ${peopleToSync.length} people to sync for company ${companyId}`);

    for (const person of peopleToSync) {
      try {
        const result = await this.syncPersonBuyerGroupData(person.id);
        if (result.updated) {
          synced++;
          if (!dryRun) {
            updated++;
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ [BUYER GROUP SYNC] Error syncing person ${person.id}:`, error);
      }
    }

    console.log(`✅ [BUYER GROUP SYNC] Synced ${synced} people for company ${companyId}, updated ${updated}, errors ${errors}`);

    return { synced, updated, errors };
  }
}

