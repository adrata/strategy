import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getV1AuthUser } from '../../auth';

/**
 * Manual Next Action Regeneration API
 * POST /api/v1/next-action/regenerate - Regenerate next actions for records
 */

interface RegenerateRequest {
  workspaceId?: string;
  entityType?: 'person' | 'company' | 'both';
  rankRange?: {
    min?: number;
    max?: number;
  };
  recordIds?: string[];
  force?: boolean; // Force regeneration even if next actions exist
}

/**
 * Calculate next action date based on global rank
 */
function calculateRankBasedDate(globalRank: number | null, lastActionDate: Date | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if last action was today
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate;
  
  // Rank-based date calculation (Speedrun integration)
  if (!globalRank || globalRank <= 50) {
    // Top 50 (Speedrun tier): TODAY (or tomorrow if action already today)
    targetDate = lastActionToday ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  } else if (globalRank <= 200) {
    // High priority (51-200): THIS WEEK (2-3 days)
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    // Medium priority (201-500): NEXT WEEK (7 days)
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    // Lower priority (500+): THIS MONTH (14 days)
    targetDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  
  // Push weekend dates to Monday
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0) { // Sunday
    targetDate = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);
  } else if (dayOfWeek === 6) { // Saturday
    targetDate = new Date(targetDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  }
  
  return targetDate;
}

/**
 * Generate next action for a person based on recent actions
 */
function generatePersonNextAction(fullName: string, recentActions: any[], globalRank: number | null) {
  const actionTypes = [
    'Send LinkedIn connection request',
    'Send follow-up email', 
    'Schedule phone call',
    'Send LinkedIn InMail',
    'Send personalized outreach',
    'Research company and role'
  ];
  
  // If no recent actions, start with LinkedIn
  if (!recentActions || recentActions.length === 0) {
    return actionTypes[0];
  }
  
  // Cycle through action types based on last action
  const lastActionType = recentActions[0]?.type?.toLowerCase() || '';
  let nextActionIndex = 0;
  
  if (lastActionType.includes('linkedin') && !lastActionType.includes('inmail')) {
    nextActionIndex = 1; // Email after LinkedIn connection
  } else if (lastActionType.includes('email')) {
    nextActionIndex = 2; // Phone after email
  } else if (lastActionType.includes('call') || lastActionType.includes('phone')) {
    nextActionIndex = 3; // InMail after phone
  } else if (lastActionType.includes('inmail')) {
    nextActionIndex = 4; // Personalized outreach after InMail
  }
  
  return actionTypes[nextActionIndex];
}

/**
 * Generate next action for a company based on top person
 */
function generateCompanyNextAction(companyName: string, topPerson: any, companyRecentActions: any[]) {
  if (topPerson) {
    // Company action should align with engaging top person
    if (topPerson.nextAction) {
      // Use the person's existing next action
      return `Engage ${topPerson.fullName} - ${topPerson.nextAction}`;
    } else {
      // Person exists but no next action - generate one for them
      const personAction = generatePersonNextAction(topPerson.fullName, [], topPerson.globalRank);
      return `Engage ${topPerson.fullName} - ${personAction}`;
    }
  } else {
    // No people at company, use company's own action history
    return `Research and identify key contacts at ${companyName}`;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: RegenerateRequest = await request.json();
    const {
      workspaceId = authUser.activeWorkspaceId,
      entityType = 'both',
      rankRange,
      recordIds,
      force = false
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 [REGENERATE API] Starting next action regeneration:`, {
      workspaceId,
      entityType,
      rankRange,
      recordIds: recordIds?.length,
      force
    });

    let peopleProcessed = 0;
    let peopleSuccess = 0;
    let peopleErrors = 0;
    let companiesProcessed = 0;
    let companiesSuccess = 0;
    let companiesErrors = 0;

    // Build where clause for filtering
    const buildWhereClause = (baseWhere: any) => {
      let where = {
        ...baseWhere,
        workspaceId,
        deletedAt: null
      };

      // Add rank range filter
      if (rankRange) {
        if (rankRange.min !== undefined || rankRange.max !== undefined) {
          where.globalRank = {};
          if (rankRange.min !== undefined) where.globalRank.gte = rankRange.min;
          if (rankRange.max !== undefined) where.globalRank.lte = rankRange.max;
        }
      }

      // Add record IDs filter
      if (recordIds && recordIds.length > 0) {
        where.id = { in: recordIds };
      }

      // Add next action filter (unless force is true)
      if (!force) {
        where.OR = [
          { nextAction: null },
          { nextAction: '' },
          { nextActionDate: null }
        ];
      }

      return where;
    };

    // Process People
    if (entityType === 'person' || entityType === 'both') {
      console.log('👥 Processing people...');
      
      const peopleWhere = buildWhereClause({});
      const people = await prisma.people.findMany({
        where: peopleWhere,
        select: {
          id: true,
          fullName: true,
          globalRank: true,
          lastActionDate: true
        },
        orderBy: { globalRank: 'asc' }
      });

      console.log(`   Found ${people.length} people to process`);

      for (const person of people) {
        try {
          // Get recent actions for this person
          const recentActions = await prisma.actions.findMany({
            where: {
              personId: person.id,
              workspaceId
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { type: true }
          });

          // Generate next action
          const nextAction = generatePersonNextAction(person.fullName, recentActions, person.globalRank);
          const nextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);

          // Update person with next action
          await prisma.people.update({
            where: { id: person.id },
            data: {
              nextAction: nextAction,
              nextActionDate: nextActionDate
            }
          });

          peopleSuccess++;
          
          // Log for top 50
          if (person.globalRank && person.globalRank <= 50) {
            const dateStr = nextActionDate.toISOString().split('T')[0];
            console.log(`   ✅ [Rank ${person.globalRank}] ${person.fullName} → ${nextAction} (${dateStr})`);
          }
          
        } catch (error) {
          peopleErrors++;
          console.error(`   ❌ Error for person ${person.fullName}:`, error);
        }

        peopleProcessed++;
      }
    }

    // Process Companies
    if (entityType === 'company' || entityType === 'both') {
      console.log('🏢 Processing companies...');
      
      const companiesWhere = buildWhereClause({});
      const companies = await prisma.companies.findMany({
        where: companiesWhere,
        select: {
          id: true,
          name: true,
          globalRank: true,
          lastActionDate: true
        },
        orderBy: { globalRank: 'asc' }
      });

      console.log(`   Found ${companies.length} companies to process`);

      for (const company of companies) {
        try {
          // Find the highest-ranked person at this company
          const topPerson = await prisma.people.findFirst({
            where: {
              companyId: company.id,
              workspaceId,
              deletedAt: null
            },
            select: {
              id: true,
              fullName: true,
              globalRank: true,
              lastActionDate: true,
              nextAction: true
            },
            orderBy: { globalRank: 'asc' }
          });

          // Get recent actions for this company
          const companyRecentActions = await prisma.actions.findMany({
            where: {
              companyId: company.id,
              workspaceId
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { type: true }
          });

          // Generate next action based on top person or company history
          const nextAction = generateCompanyNextAction(company.name, topPerson, companyRecentActions);
          
          // Use top person's rank for date calculation, or company's rank as fallback
          const rankForDate = topPerson?.globalRank || company.globalRank;
          const lastActionDate = topPerson?.lastActionDate || company.lastActionDate;
          const nextActionDate = calculateRankBasedDate(rankForDate, lastActionDate);

          // Update company with next action
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              nextAction: nextAction,
              nextActionDate: nextActionDate
            }
          });

          companiesSuccess++;
          
          // Log for top 50
          if (company.globalRank && company.globalRank <= 50) {
            const dateStr = nextActionDate.toISOString().split('T')[0];
            const topPersonInfo = topPerson ? ` (Top: ${topPerson.fullName})` : '';
            console.log(`   ✅ [Rank ${company.globalRank}] ${company.name}${topPersonInfo} → ${nextAction} (${dateStr})`);
          }
          
        } catch (error) {
          companiesErrors++;
          console.error(`   ❌ Error for company ${company.name}:`, error);
        }

        companiesProcessed++;
      }
    }

    const results = {
      people: {
        processed: peopleProcessed,
        success: peopleSuccess,
        errors: peopleErrors
      },
      companies: {
        processed: companiesProcessed,
        success: companiesSuccess,
        errors: companiesErrors
      },
      total: {
        processed: peopleProcessed + companiesProcessed,
        success: peopleSuccess + companiesSuccess,
        errors: peopleErrors + companiesErrors
      }
    };

    console.log(`✅ [REGENERATE API] Completed:`, results);

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        message: `Successfully regenerated next actions for ${results.total.success} records`,
        workspaceId,
        entityType,
        rankRange,
        force
      }
    });

  } catch (error) {
    console.error('❌ [REGENERATE API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate next actions' },
      { status: 500 }
    );
  }
}
