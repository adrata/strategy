import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { rankContacts } from '@/products/speedrun/ranking';
import { getDefaultUserSettings } from '@/products/speedrun/state';
import { StateRankingService } from '@/products/speedrun/state-ranking';
// 🏆 ENHANCED RANKING: Import sophisticated scoring algorithms
import { 
  calculateIndividualScore, 
  calculateDaysSinceContact,
  calculateTimingUrgency,
  detectEmailEngagement,
  calculateSpeedScore,
  calculateRevenueScore,
  calculateCombinedScore,
  generateEnhancedRankingReason,
  determineCompanySize,
  extractDealValue,
  calculateFreshnessFactor
} from '@/products/speedrun/scoring';

// Force dynamic rendering for API routes (required for authentication)
export const dynamic = 'force-dynamic';

/**
 * Calculate next action date based on global rank
 * This matches the logic from /api/v1/next-action/regenerate/route.ts
 */
function calculateRankBasedDate(globalRank: number | null, lastActionDate: Date | null): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if last action was today
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate: Date;
  
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { completedCount, triggerAutoFetch, isDailyReset, manualRankUpdate, trigger, personId, actionType, timestamp } = body;

    // Handle manual rank update
    if (manualRankUpdate) {
      console.log(`🔄 Manual rank update: Person ${manualRankUpdate.personId} to rank ${manualRankUpdate.newRank}`);
      return await handleManualRankUpdate(request, manualRankUpdate);
    }

    // 🎯 AUTO RE-RANKING: Log trigger information for debugging
    if (trigger) {
      console.log(`🎯 [AUTO RE-RANKING] Triggered by: ${trigger}`, {
        personId,
        actionType,
        timestamp,
        completedCount
      });
    }

    console.log(`🔄 Re-ranking speedrun data for user. Completed: ${completedCount}`);

    // Get workspace and user context
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace or user context' },
        { status: 400 }
      );
    }

    // Get user settings for ranking
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        timezone: true,
        name: true,
        email: true,
        // Note: These fields will be available after schema migration
        // speedrunRankingMode: true,
        // stateRankingOrder: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get ranking mode and state ordering
    const rankingMode = 'global'; // (user.speedrunRankingMode as 'global' | 'state-based') || 'global';
    const stateOrder: string[] = []; // (user.stateRankingOrder as string[]) || [];

    console.log(`🔄 [RE-RANK] Using ranking mode: ${rankingMode}`, {
      stateOrderLength: stateOrder.length,
      userId
    });

    // 🎯 PER-USER RANKING: Get companies and people assigned to this user (mainSellerId = userId)
    // This ensures each user gets their own ranked list 1-N for both companies and people
    
    // First, get companies assigned to this user
    // 🎯 ENHANCED: Include opportunity fields for value-based ranking
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        mainSellerId: userId // Only rank companies assigned to this specific user
      },
      select: {
        id: true,
        name: true,
        industry: true,
        size: true,
        opportunityAmount: true,
        opportunityStage: true,
        opportunityProbability: true,
        _count: {
          select: { people: true }
        }
      },
      take: 1000
    });

    // 🎯 SMART FILTERING: Exclude people contacted today or yesterday
    // Calculate date thresholds for filtering
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Then, get people assigned to this user
    // Exclude people who were contacted today or yesterday
    // 🎯 ENHANCED: Include all fields needed for comprehensive ranking
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null, // Only active (non-deleted) people
        mainSellerId: userId, // Only rank people assigned to this specific user
        // Exclude people contacted today or yesterday (include only those contacted before yesterday or never contacted)
        OR: [
          { lastActionDate: null }, // No action date = include them
          { lastActionDate: { lt: yesterday } }, // Action before yesterday = include them
        ]
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        name: true,
        status: true,
        priority: true,
        buyerGroupRole: true,
        influenceScore: true,
        engagementScore: true,
        jobTitle: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        nextActionPriority: true,
        nextActionType: true,
        actionStatus: true,
        notes: true,
        companyId: true,
        email: true,
        phone: true,
        mobilePhone: true,
        linkedin: true,
        linkedinUrl: true,
        profilePictureUrl: true,
        relationshipType: true,
        bio: true,
        company: {
          select: {
            id: true,
            name: true,
            size: true,
            industry: true,
            opportunityAmount: true,
            opportunityStage: true,
            opportunityProbability: true
          }
        },
        actions: {
          where: {
            workspaceId,
            userId
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      take: 1000 // Get more than 50 to ensure we have enough for ranking
    });

    if (allPeople.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No available people to rank' },
        { status: 404 }
      );
    }

    console.log(`🔄 [RE-RANK] Found ${allPeople.length} people to rank (excluding those contacted today or yesterday)`);
    console.log(`🔍 [RE-RANK] Filter criteria: yesterday threshold = ${yesterday.toISOString()}, today = ${today.toISOString()}`);

    console.log(`🔄 [RE-RANK] Found ${allCompanies.length} companies and ${allPeople.length} people to rank`);

    // 🎯 UNIFIED RANKING: Combine companies and people into a single ranked list
    // This ensures no duplicate ranks across entity types
    console.log(`🔄 [RE-RANK] Creating unified ranking (people first, then companies)...`);
    
    // Step 1: Prepare companies without people for ranking
    const companiesWithoutPeople = allCompanies.filter(company => 
      company._count.people === 0 || 
      !allPeople.some(person => person.companyId === company.id)
    );
    
    // Step 2: Prepare people from companies that have people
    const peopleFromCompaniesWithPeople = allPeople.filter(person => 
      person.companyId !== null &&
      allCompanies.some(company => company.id === person.companyId)
    );
    
    // Step 3: Sort companies by priority (enhanced with opportunity data)
    const sortedCompanies = companiesWithoutPeople.sort((a, b) => {
      // 🎯 ENHANCED: Primary sort by opportunity value (highest first)
      const aOpportunityAmount = a.opportunityAmount ? parseFloat(a.opportunityAmount.toString()) : 0;
      const bOpportunityAmount = b.opportunityAmount ? parseFloat(b.opportunityAmount.toString()) : 0;
      if (Math.abs(aOpportunityAmount - bOpportunityAmount) > 1000) {
        return bOpportunityAmount - aOpportunityAmount;
      }
      
      // 🎯 ENHANCED: Secondary sort by opportunity stage (late-stage first)
      const stagePriority: Record<string, number> = {
        'negotiation': 5,
        'proposal': 5,
        'decision': 5,
        'closed': 4,
        'qualified': 3,
        'demo': 3,
        'evaluation': 3,
        'discovery': 2,
        'initial': 1
      };
      const aStage = (a.opportunityStage || '').toLowerCase();
      const bStage = (b.opportunityStage || '').toLowerCase();
      const aStagePriority = Object.entries(stagePriority).find(([key]) => aStage.includes(key))?.[1] || 0;
      const bStagePriority = Object.entries(stagePriority).find(([key]) => bStage.includes(key))?.[1] || 0;
      if (aStagePriority !== bStagePriority) {
        return bStagePriority - aStagePriority;
      }
      
      // Tertiary: Industry score
      const industryScore = (company: any) => {
        const industry = (company.industry || '').toLowerCase();
        if (industry.includes('title') || industry.includes('real estate') || industry.includes('escrow')) return 3;
        if (industry.includes('insurance') || industry.includes('legal')) return 2;
        return 1;
      };
      
      const industryDiff = industryScore(b) - industryScore(a);
      if (industryDiff !== 0) return industryDiff;
      
      // Quaternary: Size score
      const sizeScore = (company: any) => {
        const size = (company.size || '').toLowerCase();
        if (size.includes('large') || size.includes('enterprise')) return 3;
        if (size.includes('medium') || size.includes('mid')) return 2;
        return 1;
      };
      
      const sizeDiff = sizeScore(b) - sizeScore(a);
      if (sizeDiff !== 0) return sizeDiff;
      
      // Quinary: People count
      return (b._count.people || 0) - (a._count.people || 0);
    });
    
    // Step 4: Sort people by company priority, then within company
    const companyRankMap = new Map();
    sortedCompanies.forEach((company, index) => {
      companyRankMap.set(company.id, index + 1);
    });
    
    // Group people by company
    const peopleByCompany = new Map();
    peopleFromCompaniesWithPeople.forEach(person => {
      const companyId = person.companyId || 'unknown';
      if (!peopleByCompany.has(companyId)) {
        peopleByCompany.set(companyId, []);
      }
      peopleByCompany.get(companyId)!.push(person);
    });
    
    // Sort people within each company
    const sortedPeopleByCompany = Array.from(peopleByCompany.entries())
      .sort(([companyIdA], [companyIdB]) => {
        const rankA = companyRankMap.get(companyIdA) || 999999;
        const rankB = companyRankMap.get(companyIdB) || 999999;
        return rankA - rankB;
      });
    
    // 🏆 ENHANCED RANKING: Use sophisticated scoring algorithms instead of simple sorting
    const userSettings = getDefaultUserSettings();
    
    // Sort people within each company using comprehensive scoring
    for (const [companyId, companyPeople] of sortedPeopleByCompany) {
      // Convert Prisma person records to RankedContact format for scoring
      const scoredPeople = companyPeople.map(person => {
        const daysSinceContact = calculateDaysSinceContact(person.lastActionDate?.toISOString());
        const emailEngagement = detectEmailEngagement({
          notes: person.notes || '',
          nextAction: person.nextAction || '',
          recentActivity: '',
          lastEmail: '',
          lastActionDate: person.lastActionDate?.toISOString()
        });
        
        // 🎯 ENHANCED: Calculate opportunity value from company
        const opportunityAmount = person.company?.opportunityAmount 
          ? parseFloat(person.company.opportunityAmount.toString()) 
          : 0;
        
        // 🎯 ENHANCED: Calculate deal value boost
        let opportunityValueBoost = 0;
        if (opportunityAmount > 50000) {
          opportunityValueBoost = 50; // High-value (>$50K)
        } else if (opportunityAmount > 25000) {
          opportunityValueBoost = 25; // Medium-value ($25K-$50K)
        } else if (opportunityAmount > 0) {
          opportunityValueBoost = 10; // Low-value (<$25K)
        }
        
        // 🎯 ENHANCED: Calculate deal stage priority boost
        const opportunityStage = (person.company?.opportunityStage || '').toLowerCase();
        let dealStageBoost = 0;
        if (opportunityStage.includes('negotiation') || 
            opportunityStage.includes('proposal') || 
            opportunityStage.includes('decision') ||
            opportunityStage.includes('closed')) {
          dealStageBoost = 30; // Late-stage
        } else if (opportunityStage.includes('qualified') || 
                   opportunityStage.includes('demo') ||
                   opportunityStage.includes('evaluation')) {
          dealStageBoost = 15; // Mid-stage
        } else if (opportunityStage.includes('discovery') ||
                   opportunityStage.includes('initial')) {
          dealStageBoost = 5; // Early-stage
        }
        
        // 🎯 ENHANCED: Calculate next action urgency boost
        let nextActionUrgencyBoost = 0;
        if (person.nextActionDate) {
          const nextActionDate = new Date(person.nextActionDate);
          const currentDate = new Date();
          const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          const daysUntilNextAction = Math.floor((nextActionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilNextAction < 0) {
            nextActionUrgencyBoost = 20; // Overdue
          } else if (daysUntilNextAction === 0) {
            nextActionUrgencyBoost = 10; // Today
          } else if (daysUntilNextAction <= 7) {
            nextActionUrgencyBoost = 5; // This week
          }
        }
        
        // 🎯 ENHANCED: Calculate priority field boost
        let priorityBoost = 0;
        const priority = (person.priority || '').toUpperCase();
        if (priority === 'HIGH') {
          priorityBoost = 15;
        } else if (priority === 'MEDIUM') {
          priorityBoost = 5;
        }
        
        // 🎯 ENHANCED: Check if lastAction is meaningful (not "Record created" etc.)
        const lastAction = (person.lastAction || '').toLowerCase();
        const isMeaningfulAction = lastAction && 
          !lastAction.includes('record created') &&
          !lastAction.includes('company record created') &&
          !lastAction.includes('record added') &&
          !lastAction.includes('no action taken');
        
        // Create RankedContact-like object for scoring
        const contactForScoring: any = {
          ...person,
          daysSinceLastContact: daysSinceContact,
          estimatedDealValue: opportunityAmount || extractDealValue({ value: '', dealValue: '', revenue: '' }),
          companySize: determineCompanySize({ 
            size: person.company?.size || '', 
            industry: person.company?.industry || '',
            notes: '',
            value: ''
          }),
          freshnessFactor: calculateFreshnessFactor(person.id),
          emailEngagementScore: emailEngagement.emailScore,
          readyToBuyScore: emailEngagement.readyToBuyScore,
          relationship: '', // Will be inferred from status
          buyerGroupRole: person.buyerGroupRole || '',
          dealStage: person.status || '',
          title: person.jobTitle || '',
          company: person.company?.name || ''
        };
        
        // Calculate comprehensive individual score
        const individualScore = calculateIndividualScore(contactForScoring, userSettings);
        
        // 🎯 ENHANCED: Add all boost factors to the score
        const enhancedScore = individualScore + 
          opportunityValueBoost + 
          dealStageBoost + 
          nextActionUrgencyBoost + 
          priorityBoost;
        
        return {
          ...person,
          calculatedScore: enhancedScore,
          daysSinceLastContact: daysSinceContact,
          emailEngagementScore: emailEngagement.emailScore,
          readyToBuyScore: emailEngagement.readyToBuyScore,
          opportunityValueBoost,
          dealStageBoost,
          nextActionUrgencyBoost,
          priorityBoost,
          isMeaningfulAction
        };
      });
      
      // 🎯 ENHANCED: Sort by enhanced score (highest first), then by status, then by title
      scoredPeople.sort((a, b) => {
        // Primary: Enhanced comprehensive score (includes opportunity value, deal stage, urgency, priority)
        const scoreDiff = (b.calculatedScore || 0) - (a.calculatedScore || 0);
        if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
        
        // Secondary: Status priority (heavily weighted - PROSPECT/OPPORTUNITY should rank higher)
        const statusPriority: Record<string, number> = { 
          'OPPORTUNITY': 10,  // Highest priority - real business discussion
          'PROSPECT': 8,      // High priority - they've engaged (replied or contacted us)
          'CLIENT': 7,
          'SUPERFAN': 6,
          'PARTNER': 5,
          'LEAD': 2,          // Lower priority - no engagement yet
          'ACTIVE': 3,
          'INACTIVE': 1
        };
        const statusDiff = (statusPriority[b.status] || 1) - (statusPriority[a.status] || 1);
        // Status difference should have significant impact (multiply by 100 to ensure it overrides small score differences)
        if (Math.abs(statusDiff) > 0) return statusDiff * 100;
        
        // Tertiary: Title/role priority
        const titleScore = (title: string | null) => {
          const t = (title || '').toLowerCase();
          if (t.includes('ceo') || t.includes('president') || t.includes('founder') || t.includes('owner')) return 5;
          if (t.includes('vp') || t.includes('vice president') || t.includes('director')) return 4;
          if (t.includes('manager') || t.includes('head')) return 3;
          if (t.includes('senior') || t.includes('lead')) return 2;
          return 1;
        };
        
        const titleDiff = titleScore(b.jobTitle) - titleScore(a.jobTitle);
        if (titleDiff !== 0) return titleDiff;
        
        // Quaternary: Days since last contact (longer = higher priority for re-engagement)
        const daysDiff = (a.daysSinceLastContact || 999) - (b.daysSinceLastContact || 999);
        return daysDiff;
      });
      
      // 🎯 ENHANCED: Log scoring factors for top 5 people in each company (for debugging)
      if (scoredPeople.length > 0 && companyId) {
        const top5 = scoredPeople.slice(0, 5);
        console.log(`📊 [RE-RANK] Top 5 scoring factors for company ${companyId}:`, 
          top5.map(p => ({
            name: p.fullName,
            status: p.status,
            baseScore: (p.calculatedScore || 0) - (p.opportunityValueBoost || 0) - (p.dealStageBoost || 0) - (p.nextActionUrgencyBoost || 0) - (p.priorityBoost || 0),
            opportunityValueBoost: p.opportunityValueBoost,
            dealStageBoost: p.dealStageBoost,
            nextActionUrgencyBoost: p.nextActionUrgencyBoost,
            priorityBoost: p.priorityBoost,
            totalScore: p.calculatedScore
          }))
        );
      }
      
      // Replace companyPeople array with scored and sorted version
      companyPeople.length = 0;
      companyPeople.push(...scoredPeople.map(p => ({
        ...p,
        calculatedScore: undefined // Remove calculatedScore before storing
      })));
    }
    
    // Step 5: Create unified ranked list (people first, then companies)
    const rankedPeople: Array<any> = [];
    let unifiedRank = 1;
    
    // Add people first (higher priority)
    for (const [companyId, companyPeople] of sortedPeopleByCompany) {
      for (const person of companyPeople) {
        rankedPeople.push({
          ...person,
          globalRank: unifiedRank,
          companyRank: companyRankMap.get(companyId) || 999999
        });
        unifiedRank++;
      }
    }
    
    // Step 6: Update people ranks in database
    console.log(`👥 [RE-RANK] Updating ${rankedPeople.length} people with unified ranks...`);
    for (const person of rankedPeople) {
      const nextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
      
      await prisma.people.update({
        where: { id: person.id },
        data: { 
          globalRank: person.globalRank,
          nextActionDate: nextActionDate
        }
      });
    }
    
    // Step 7: Add companies after people (lower priority, but still sequential)
    const rankedCompanies: Array<any> = [];
    for (const company of sortedCompanies) {
      rankedCompanies.push({
        ...company,
        globalRank: unifiedRank,
        companyRank: unifiedRank
      });
      unifiedRank++;
    }
    
    // Step 8: Update company ranks in database (only assign ranks 1-50 if people didn't fill all slots)
    console.log(`🏢 [RE-RANK] Updating company ranks (only top 50 total)...`);
    const remainingSlots = Math.max(0, 50 - rankedPeople.length);
    const companiesToRank = rankedCompanies.slice(0, remainingSlots);
    
    for (const company of companiesToRank) {
      await prisma.companies.update({
        where: { id: company.id },
        data: { globalRank: company.globalRank }
      });
    }
    
    // Clear ranks for companies beyond top 50
    if (rankedCompanies.length > remainingSlots) {
      const companiesToClear = rankedCompanies.slice(remainingSlots);
      await prisma.companies.updateMany({
        where: {
          id: { in: companiesToClear.map(c => c.id) }
        },
        data: { globalRank: null }
      });
      console.log(`🧹 [RE-RANK] Cleared ranks for ${companiesToClear.length} companies beyond top 50`);
    }
    
    console.log(`✅ [RE-RANK] Updated ${rankedPeople.length} people ranks (1-${rankedPeople.length})`);
    console.log(`✅ [RE-RANK] Updated ${companiesToRank.length} company ranks (${rankedPeople.length + 1}-${rankedPeople.length + companiesToRank.length})`);
    console.log(`✅ [RE-RANK] Total unified ranks: ${rankedPeople.length + companiesToRank.length}`);

    // Step 9: Take the top 50 for the new batch
    const allRankedRecords = [...rankedPeople, ...companiesToRank];
    const newBatch = allRankedRecords.slice(0, 50);

    // 🎯 DEBUG: Log ranking changes for recently contacted people
    console.log(`🔄 [RE-RANK] Top 10 after re-ranking:`, 
      newBatch.slice(0, 10).map((person, i) => ({
        rank: person.globalRank,
        name: person.fullName,
        company: person.company?.name,
        companyRank: person.companyRank,
        status: person.status,
        title: person.jobTitle
      }))
    );

    console.log(`✅ Successfully re-ranked ${rankedPeople.length} people and ${sortedCompanies.length} companies`);

    // 🎯 AUTO RE-RANKING: Log completion for debugging
    if (trigger) {
      console.log(`🎯 [AUTO RE-RANKING] Completed successfully`, {
        trigger,
        personId,
        actionType,
        recordsUpdated: newBatch.length,
        timestamp: new Date().toISOString()
      });
    }

    // Return the new batch data
    return NextResponse.json({
      success: true,
      data: {
        newBatch: newBatch.map(contact => ({
          id: contact.id,
          name: contact.name || contact.fullName,
          company: contact.company,
          title: contact.jobTitle,
          email: contact.email,
          phone: contact.phone,
          mobilePhone: contact.mobilePhone,
          linkedin: contact.linkedin || contact.linkedinUrl,
          photo: contact.profilePictureUrl,
          priority: contact.priority,
          status: contact.status,
          lastContact: contact.lastActionDate,
          nextAction: contact.nextAction,
          relationship: contact.relationshipType,
          bio: contact.bio,
          globalRank: contact.globalRank,
          rankingMode: rankingMode
        })),
        batchNumber: Math.floor(completedCount / 50) + 1,
        totalCompleted: completedCount,
        message: `Successfully fetched batch ${Math.floor(completedCount / 50) + 1} with ${newBatch.length} new records`
      }
    });

  } catch (error) {
    console.error('❌ Error in re-ranking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle manual rank updates with automatic re-ranking of other prospects
 */
async function handleManualRankUpdate(request: NextRequest, manualRankUpdate: { personId: string, oldRank?: number, newRank: number }) {
  try {
    const workspaceId = request.headers.get('x-workspace-id');
    const userId = request.headers.get('x-user-id');

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing workspace or user context' },
        { status: 400 }
      );
    }

    const { personId, oldRank, newRank } = manualRankUpdate;

    // Get the person being updated
    const person = await prisma.people.findUnique({
      where: { 
        id: personId,
        workspaceId,
        deletedAt: null
      }
    });

    if (!person) {
      return NextResponse.json(
        { success: false, error: 'Person not found' },
        { status: 404 }
      );
    }

    const currentRank = person.globalRank || 0;
    const actualOldRank = oldRank || currentRank;

    console.log(`🔄 Manual rank update: ${person.fullName} from rank ${actualOldRank} to ${newRank}`);

    // Get all people in the workspace that need rank adjustment
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        globalRank: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true
      },
      orderBy: { globalRank: 'asc' }
    });

    // Calculate rank adjustments
    const rankAdjustments: Array<{ id: string, newRank: number }> = [];
    
    if (newRank < actualOldRank) {
      // Moving up: shift people at positions [newRank..oldRank-1] down by 1
      allPeople.forEach(p => {
        if (p.globalRank && p.globalRank >= newRank && p.globalRank < actualOldRank) {
          rankAdjustments.push({ id: p.id, newRank: p.globalRank + 1 });
        }
      });
    } else if (newRank > actualOldRank) {
      // Moving down: shift people at positions [oldRank+1..newRank] up by 1
      allPeople.forEach(p => {
        if (p.globalRank && p.globalRank > actualOldRank && p.globalRank <= newRank) {
          rankAdjustments.push({ id: p.id, newRank: p.globalRank - 1 });
        }
      });
    }

    // Add the target person's new rank
    rankAdjustments.push({ id: personId, newRank });

    console.log(`🔄 Applying ${rankAdjustments.length} rank adjustments`);

    // Apply all rank updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const adjustment of rankAdjustments) {
        await tx.people.update({
          where: { id: adjustment.id },
          data: { 
            globalRank: adjustment.newRank,
            updatedAt: new Date()
          }
        });
      }
    });

    console.log(`✅ Successfully updated ranks for ${rankAdjustments.length} people`);

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully updated rank for ${person.fullName} and adjusted ${rankAdjustments.length - 1} other prospects`,
        personId,
        oldRank: actualOldRank,
        newRank,
        adjustmentsCount: rankAdjustments.length - 1
      }
    });

  } catch (error) {
    console.error('❌ Error in manual rank update:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update rank' },
      { status: 500 }
    );
  }
}
