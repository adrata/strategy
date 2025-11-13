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
 * Handles case-insensitive and various formats (spaces, underscores, etc.)
 */
function calculateInfluenceLevelFromRole(role: string | null | undefined): 'High' | 'Medium' | 'Low' | null {
  if (!role) return null;
  
  // Normalize: lowercase, replace underscores/hyphens with spaces, trim
  const normalizedRole = role.toLowerCase().replace(/[_-]/g, ' ').trim();
  
  // Decision Maker and Champion have high influence
  if (normalizedRole === 'decision maker' || 
      normalizedRole === 'champion' ||
      normalizedRole === 'decision' ||
      normalizedRole.includes('decision')) {
    return 'High';
  }
  
  // Blocker and Stakeholder have medium influence
  if (normalizedRole === 'blocker' || 
      normalizedRole === 'stakeholder') {
    return 'Medium';
  }
  
  // Introducer has low influence
  if (normalizedRole === 'introducer') {
    return 'Low';
  }
  
  // Default to Medium for unknown roles
  return 'Medium';
}

/**
 * Infer buyer group role from job title
 * Returns null if role cannot be confidently inferred
 */
function inferBuyerGroupRoleFromTitle(jobTitle: string | null | undefined): string | null {
  if (!jobTitle) return null;
  
  const title = jobTitle.toLowerCase().trim();
  
  // Decision Makers - C-suite, VP, President, Director
  if (title.match(/\b(ceo|cto|cfo|coo|cio|cmo|president|vp|vice president|director)\b/i)) {
    return 'Decision Maker';
  }
  
  // Champions - Managers, Leads, Heads, Architects, Technical Experts
  if (title.match(/\b(manager|lead|head of|senior|principal|architect|engineer|developer|consultant|advisor|expert)\b/i)) {
    return 'Champion';
  }
  
  // Blockers - Procurement, Legal, Compliance, Security
  if (title.match(/\b(procurement|legal|compliance|security|audit|risk)\b/i)) {
    return 'Blocker';
  }
  
  // Introducers - Sales, Marketing, BD
  if (title.match(/\b(sales|marketing|business development|bd|account)\b/i)) {
    return 'Introducer';
  }
  
  // Stakeholders - Everyone else
  return 'Stakeholder';
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
        fullName: true,
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
            console.log(`✅ [BUYER GROUP SYNC] Updated ${person.fullName}:`, result.changes);
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

  /**
   * Infer and persist buyer group roles for people without explicit roles
   * Uses job title to infer likely role, then persists it to database
   */
  static async inferAndPersistRoles(
    companyId: string,
    workspaceId: string,
    options?: { dryRun?: boolean; persistInferred?: boolean }
  ): Promise<{ inferred: number; persisted: number; errors: number }> {
    const dryRun = options?.dryRun || false;
    const persistInferred = options?.persistInferred ?? true;

    let inferred = 0;
    let persisted = 0;
    let errors = 0;

    // Find people without buyer group roles
    const people = await prisma.people.findMany({
      where: {
        companyId,
        workspaceId,
        deletedAt: null,
        buyerGroupRole: null,
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        influenceLevel: true,
      },
    });

    console.log(`🔍 [INFER ROLES] Found ${people.length} people without buyer group roles for company ${companyId}`);

    for (const person of people) {
      try {
        const inferredRole = inferBuyerGroupRoleFromTitle(person.jobTitle);
        
        if (inferredRole) {
          inferred++;
          
          if (persistInferred && !dryRun) {
            const influenceLevel = calculateInfluenceLevelFromRole(inferredRole);
            
            await prisma.people.update({
              where: { id: person.id },
              data: {
                buyerGroupRole: inferredRole,
                isBuyerGroupMember: true,
                influenceLevel: influenceLevel,
                updatedAt: new Date(),
              },
            });
            persisted++;
            console.log(`✅ [INFER ROLES] Persisted ${person.fullName}: ${inferredRole} (${influenceLevel} influence)`);
          } else if (dryRun) {
            const influenceLevel = calculateInfluenceLevelFromRole(inferredRole);
            console.log(`[DRY RUN] Would set ${person.fullName}: ${inferredRole} (${influenceLevel} influence)`);
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ [INFER ROLES] Error processing person ${person.id}:`, error);
      }
    }

    console.log(`✅ [INFER ROLES] Inferred ${inferred} roles, persisted ${persisted}, errors ${errors}`);

    return { inferred, persisted, errors };
  }
}

