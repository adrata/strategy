/**
 * Company Last Action Utility
 * 
 * Computes the most accurate lastAction for a company by checking:
 * 1. Actions directly linked to the company (companyId)
 * 2. Actions from people associated with the company (personId where person.companyId matches)
 * 
 * This ensures company lastAction reflects the most recent engagement with the company,
 * regardless of whether it was logged at the company or person level.
 */

import { PrismaClient } from '@prisma/client';
import { isMeaningfulAction } from './meaningfulActions';

// Use a singleton Prisma client or import from the database module
let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    // Try to import from the database module first
    try {
      const { prisma } = require('@/platform/database/prisma-client');
      prismaInstance = prisma;
    } catch {
      // Fallback: create new instance (for scripts)
      prismaInstance = new PrismaClient();
    }
  }
  return prismaInstance;
}

export interface CompanyLastActionResult {
  lastAction: string | null;
  lastActionDate: Date | null;
  lastActionTime: string;
  lastActionType: string | null;
}

/**
 * Compute the most accurate lastAction for a company
 * Checks both company-level and person-level actions
 */
export async function computeCompanyLastAction(
  companyId: string,
  fallbackLastAction?: string | null,
  fallbackLastActionDate?: Date | null
): Promise<CompanyLastActionResult> {
  const prisma = getPrisma();
  try {
    // Get all people associated with this company
    const companyPeople = await prisma.people.findMany({
      where: {
        companyId: companyId,
        deletedAt: null
      },
      select: { id: true }
    });
    const personIds = companyPeople.map(p => p.id);
    
    // Find last action from either company-level OR person-level actions
    const lastAction = await prisma.actions.findFirst({
      where: { 
        OR: [
          { companyId: companyId },
          ...(personIds.length > 0 ? [{ personId: { in: personIds } }] : [])
        ],
        deletedAt: null,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      select: { 
        subject: true, 
        completedAt: true, 
        type: true,
        createdAt: true,
        personId: true,
        companyId: true
      }
    });
    
    // Calculate lastActionTime for display
    let lastActionTime = 'Never';
    let lastActionText = fallbackLastAction || null;
    let lastActionDate = fallbackLastActionDate || null;
    
    // Check if we have a meaningful action from the database
    if (lastAction && isMeaningfulAction(lastAction.type)) {
      lastActionText = lastAction.subject || lastAction.type;
      lastActionDate = lastAction.completedAt || lastAction.createdAt;
    }
    
    // Only show real last actions if they exist and are meaningful
    if (lastActionDate && lastActionText && 
        lastActionText !== 'No action taken' && 
        lastActionText !== 'Record created' && 
        lastActionText !== 'Company record created') {
      // Real last action exists
      const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince === 0) lastActionTime = 'Today';
      else if (daysSince === 1) lastActionTime = 'Yesterday';
      else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
      else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
      else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
    }
    
    return {
      lastAction: lastActionText,
      lastActionDate: lastActionDate,
      lastActionTime: lastActionTime,
      lastActionType: lastAction?.type || null
    };
  } catch (error) {
    console.error(`❌ [COMPANY LAST ACTION] Error computing lastAction for company ${companyId}:`, error);
    // Return fallback values on error
    return {
      lastAction: fallbackLastAction || null,
      lastActionDate: fallbackLastActionDate || null,
      lastActionTime: 'Never',
      lastActionType: null
    };
  }
}

/**
 * Batch compute lastAction for multiple companies (optimized)
 * Uses a single query to fetch all people, then computes actions per company
 */
export async function computeCompanyLastActionsBatch(
  companies: Array<{ id: string; lastAction?: string | null; lastActionDate?: Date | null }>
): Promise<Map<string, CompanyLastActionResult>> {
  const prisma = getPrisma();
  const results = new Map<string, CompanyLastActionResult>();
  
  if (companies.length === 0) {
    return results;
  }
  
  try {
    const companyIds = companies.map(c => c.id);
    
    // Batch fetch all people for all companies at once
    const allCompanyPeople = await prisma.people.findMany({
      where: {
        companyId: { in: companyIds },
        deletedAt: null
      },
      select: { id: true, companyId: true }
    });
    
    // Create a map of companyId -> personIds for efficient lookup
    const companyToPeopleMap = new Map<string, string[]>();
    allCompanyPeople.forEach(person => {
      if (person.companyId) {
        const existing = companyToPeopleMap.get(person.companyId) || [];
        existing.push(person.id);
        companyToPeopleMap.set(person.companyId, existing);
      }
    });
    
    // Batch fetch all actions for all companies and people at once
    const allPersonIds = Array.from(companyToPeopleMap.values()).flat();
    const allActions = await prisma.actions.findMany({
      where: {
        OR: [
          { companyId: { in: companyIds } },
          ...(allPersonIds.length > 0 ? [{ personId: { in: allPersonIds } }] : [])
        ],
        deletedAt: null,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      select: {
        id: true,
        subject: true,
        completedAt: true,
        type: true,
        createdAt: true,
        personId: true,
        companyId: true
      }
    });
    
    // Group actions by company (either direct companyId or via person's companyId)
    const actionsByCompany = new Map<string, typeof allActions>();
    
    for (const action of allActions) {
      let targetCompanyId: string | null = null;
      
      if (action.companyId) {
        targetCompanyId = action.companyId;
      } else if (action.personId) {
        // Find which company this person belongs to
        for (const [companyId, personIds] of companyToPeopleMap.entries()) {
          if (personIds.includes(action.personId)) {
            targetCompanyId = companyId;
            break;
          }
        }
      }
      
      if (targetCompanyId && companyIds.includes(targetCompanyId)) {
        const existing = actionsByCompany.get(targetCompanyId) || [];
        existing.push(action);
        actionsByCompany.set(targetCompanyId, existing);
      }
    }
    
    // Compute lastAction for each company
    for (const company of companies) {
      const companyActions = actionsByCompany.get(company.id) || [];
      const meaningfulActions = companyActions.filter(a => isMeaningfulAction(a.type));
      const lastAction = meaningfulActions[0] || null; // Already sorted by completedAt desc
      
      let lastActionTime = 'Never';
      let lastActionText = company.lastAction || null;
      let lastActionDate = company.lastActionDate || null;
      
      if (lastAction) {
        lastActionText = lastAction.subject || lastAction.type;
        lastActionDate = lastAction.completedAt || lastAction.createdAt;
      }
      
      if (lastActionDate && lastActionText && 
          lastActionText !== 'No action taken' && 
          lastActionText !== 'Record created' && 
          lastActionText !== 'Company record created') {
        const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince === 0) lastActionTime = 'Today';
        else if (daysSince === 1) lastActionTime = 'Yesterday';
        else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
        else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
        else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
      }
      
      results.set(company.id, {
        lastAction: lastActionText,
        lastActionDate: lastActionDate,
        lastActionTime: lastActionTime,
        lastActionType: lastAction?.type || null
      });
    }
    
    return results;
  } catch (error) {
    console.error(`❌ [COMPANY LAST ACTION] Error computing batch lastActions:`, error);
    // Return fallback values for all companies on error
    for (const company of companies) {
      results.set(company.id, {
        lastAction: company.lastAction || null,
        lastActionDate: company.lastActionDate || null,
        lastActionTime: 'Never',
        lastActionType: null
      });
    }
    return results;
  }
}

