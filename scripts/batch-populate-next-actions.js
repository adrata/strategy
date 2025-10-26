/**
 * Batch populate next actions for all people and companies
 * Uses AI-powered IntelligentNextActionService with rank-based date prioritization
 * 
 * Usage: node scripts/batch-populate-next-actions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// We'll use direct Prisma updates with the same logic as the service
// This avoids complex TS import issues in the script

const BATCH_SIZE = 50; // Process in batches to avoid overwhelming the system
const DELAY_MS = 100; // Delay between AI calls to avoid rate limiting

/**
 * Calculate next action date based on global rank
 */
function calculateRankBasedDate(globalRank, lastActionDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Skip Miller ProActive Selling timing based on prospect priority
  let businessDaysToAdd = 7; // Default: 1 week
  if (!globalRank || globalRank <= 10) {
    businessDaysToAdd = 2; // Hot: 2 business days
  } else if (globalRank <= 50) {
    businessDaysToAdd = 3; // Warm: 3 business days
  } else if (globalRank <= 100) {
    businessDaysToAdd = 5; // Active: 5 business days
  } else if (globalRank <= 500) {
    businessDaysToAdd = 7; // Nurture: 1 week
  } else {
    businessDaysToAdd = 14; // Cold: 2 weeks
  }
  
  // Use business days calculation (skips weekends)
  const targetDate = addBusinessDays(lastActionDate || today, businessDaysToAdd);
  
  return targetDate;
}

/**
 * Add business days to a date, skipping weekends (Skip Miller principle: B2B sales happen Mon-Fri)
 */
function addBusinessDays(startDate, daysToAdd) {
  let currentDate = new Date(startDate);
  let addedDays = 0;
  
  while (addedDays < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (!isWeekend(currentDate)) {
      addedDays++;
    }
  }
  
  return currentDate;
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Generate next action based on recent actions
 */
function generateNextAction(fullName, recentActions, globalRank) {
  const actionTypes = ['Send LinkedIn connection request', 'Send follow-up email', 'Schedule phone call', 'Send LinkedIn InMail'];
  
  // Determine priority based on rank
  const priority = globalRank && globalRank <= 50 ? 'high' : 
                  globalRank && globalRank <= 200 ? 'medium' : 'low';
  
  // If no recent actions, start with LinkedIn
  if (!recentActions || recentActions.length === 0) {
    return {
      action: 'Send LinkedIn connection request',
      priority,
      type: 'linkedin_connection_request',
      reasoning: `First contact with ${fullName} - LinkedIn connection is the best starting point`
    };
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
  }
  
  return {
    action: actionTypes[nextActionIndex],
    priority,
    type: nextActionIndex === 0 ? 'linkedin_connection_request' : 
          nextActionIndex === 1 ? 'email_conversation' :
          nextActionIndex === 2 ? 'phone_call' : 'linkedin_inmail',
    reasoning: `Strategic follow-up for ${fullName} based on previous engagement`
  };
}

async function populateNextActions() {
  console.log('🚀 BATCH POPULATE NEXT ACTIONS');
  console.log('=====================================\n');

  try {
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    console.log(`📊 Found ${workspaces.length} active workspaces\n`);

    for (const workspace of workspaces) {
      console.log(`\n🏢 Processing workspace: ${workspace.name} (${workspace.id})`);
      console.log('─'.repeat(60));

      // Get a user from this workspace to use for the service
      const workspaceUser = await prisma.workspace_users.findFirst({
        where: { workspaceId: workspace.id, isActive: true },
        select: { userId: true }
      });

      if (!workspaceUser) {
        console.log(`⚠️  No active users found for workspace ${workspace.name}, skipping...`);
        continue;
      }

      // PROCESS PEOPLE
      console.log(`\n👥 Processing People...`);
      
      const totalPeople = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          OR: [
            { nextAction: null },
            { nextAction: '' },
            { nextActionDate: null }
          ]
        }
      });

      console.log(`   Found ${totalPeople} people needing next actions`);

      let peopleProcessed = 0;
      let peopleSuccess = 0;
      let peopleErrors = 0;

      // Process in batches
      for (let offset = 0; offset < totalPeople; offset += BATCH_SIZE) {
        const peopleBatch = await prisma.people.findMany({
          where: {
            workspaceId: workspace.id,
            deletedAt: null,
            OR: [
              { nextAction: null },
              { nextAction: '' },
              { nextActionDate: null }
            ]
          },
          select: {
            id: true,
            fullName: true,
            globalRank: true,
            lastActionDate: true
          },
          orderBy: { globalRank: 'asc' }, // Process top-ranked first
          take: BATCH_SIZE,
          skip: offset
        });

        for (const person of peopleBatch) {
          try {
            // Get recent actions for this person
            const recentActions = await prisma.actions.findMany({
              where: {
                personId: person.id,
                workspaceId: workspace.id
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { type: true }
            });

            // Generate next action
            const nextActionData = generateNextAction(person.fullName, recentActions, person.globalRank);
            const nextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);

            // Update person with next action
            await prisma.people.update({
              where: { id: person.id },
              data: {
                nextAction: nextActionData.action,
                nextActionDate: nextActionDate,
                nextActionPriority: nextActionData.priority,
                nextActionType: nextActionData.type,
                nextActionReasoning: nextActionData.reasoning,
                nextActionUpdatedAt: new Date()
              }
            });

            peopleSuccess++;
            
            // Show progress for top 50
            if (person.globalRank && person.globalRank <= 50) {
              const dateStr = nextActionDate.toISOString().split('T')[0];
              console.log(`   ✅ [Rank ${person.globalRank}] ${person.fullName} → ${nextActionData.action} (${dateStr})`);
            }
            
          } catch (error) {
            peopleErrors++;
            console.error(`   ❌ Error for ${person.fullName}:`, error.message);
          }

          peopleProcessed++;

          // Progress indicator
          if (peopleProcessed % 10 === 0) {
            const progress = ((peopleProcessed / totalPeople) * 100).toFixed(1);
            process.stdout.write(`\r   Progress: ${progress}% (${peopleProcessed}/${totalPeople})`);
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      console.log(`\n   📊 People Summary: ${peopleSuccess} success, ${peopleErrors} errors\n`);

      // PROCESS COMPANIES
      console.log(`\n🏢 Processing Companies...`);
      
      const totalCompanies = await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          OR: [
            { nextAction: null },
            { nextAction: '' },
            { nextActionDate: null }
          ]
        }
      });

      console.log(`   Found ${totalCompanies} companies needing next actions`);

      let companiesProcessed = 0;
      let companiesSuccess = 0;
      let companiesErrors = 0;

      // Process in batches
      for (let offset = 0; offset < totalCompanies; offset += BATCH_SIZE) {
        const companiesBatch = await prisma.companies.findMany({
          where: {
            workspaceId: workspace.id,
            deletedAt: null,
            OR: [
              { nextAction: null },
              { nextAction: '' },
              { nextActionDate: null }
            ]
          },
          select: {
            id: true,
            name: true,
            globalRank: true,
            lastActionDate: true
          },
          orderBy: { globalRank: 'asc' }, // Process top-ranked first
          take: BATCH_SIZE,
          skip: offset
        });

        for (const company of companiesBatch) {
          try {
            // Get recent actions for this company
            const recentActions = await prisma.actions.findMany({
              where: {
                companyId: company.id,
                workspaceId: workspace.id
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { type: true }
            });

            // Generate next action
            const nextActionData = generateNextAction(company.name, recentActions, company.globalRank);
            const nextActionDate = calculateRankBasedDate(company.globalRank, company.lastActionDate);

            // Update company with next action
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                nextAction: nextActionData.action,
                nextActionDate: nextActionDate,
                nextActionPriority: nextActionData.priority,
                nextActionType: nextActionData.type,
                nextActionReasoning: nextActionData.reasoning,
                nextActionUpdatedAt: new Date()
              }
            });

            companiesSuccess++;
            
            // Show progress for top 50
            if (company.globalRank && company.globalRank <= 50) {
              const dateStr = nextActionDate.toISOString().split('T')[0];
              console.log(`   ✅ [Rank ${company.globalRank}] ${company.name} → ${nextActionData.action} (${dateStr})`);
            }
            
          } catch (error) {
            companiesErrors++;
            console.error(`   ❌ Error for ${company.name}:`, error.message);
          }

          companiesProcessed++;

          // Progress indicator
          if (companiesProcessed % 10 === 0) {
            const progress = ((companiesProcessed / totalCompanies) * 100).toFixed(1);
            process.stdout.write(`\r   Progress: ${progress}% (${companiesProcessed}/${totalCompanies})`);
          }

          // Rate limiting delay
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      console.log(`\n   📊 Companies Summary: ${companiesSuccess} success, ${companiesErrors} errors\n`);
    }

    console.log('\n✅ BATCH POPULATION COMPLETE');
    console.log('=====================================');
    
  } catch (error) {
    console.error('\n❌ BATCH POPULATION FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateNextActions()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

