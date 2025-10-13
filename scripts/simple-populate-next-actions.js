/**
 * Simple script to populate next actions using only basic fields
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BATCH_SIZE = 50;

/**
 * Calculate next action date based on global rank
 */
function calculateRankBasedDate(globalRank, lastActionDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Check if last action was today
  const lastActionToday = lastActionDate && 
    lastActionDate.getFullYear() === now.getFullYear() &&
    lastActionDate.getMonth() === now.getMonth() &&
    lastActionDate.getDate() === now.getDate();
  
  let targetDate;
  
  // Rank-based date calculation
  if (!globalRank || globalRank <= 50) {
    // Top 50: TODAY (or tomorrow if action already today)
    targetDate = lastActionToday ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : today;
  } else if (globalRank <= 200) {
    // High priority (51-200): THIS WEEK (3-7 days)
    const daysOut = lastActionToday ? 3 : 2;
    targetDate = new Date(today.getTime() + daysOut * 24 * 60 * 60 * 1000);
  } else if (globalRank <= 500) {
    // Medium priority (201-500): NEXT WEEK (7-14 days)
    targetDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else {
    // Lower priority (500+): THIS MONTH (14-30 days)
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
 * Generate next action based on recent actions
 */
function generateNextAction(fullName, recentActions, globalRank) {
  const actionTypes = ['Send LinkedIn connection request', 'Send follow-up email', 'Schedule phone call', 'Send LinkedIn InMail'];
  
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
  }
  
  return actionTypes[nextActionIndex];
}

async function populateNextActions() {
  console.log('🚀 SIMPLE NEXT ACTIONS POPULATION');
  console.log('==================================\n');

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
            const nextAction = generateNextAction(person.fullName, recentActions, person.globalRank);
            const nextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);

            // Update person with next action (using only basic fields)
            await prisma.people.update({
              where: { id: person.id },
              data: {
                nextAction: nextAction,
                nextActionDate: nextActionDate
              }
            });

            peopleSuccess++;
            
            // Show progress for top 50
            if (person.globalRank && person.globalRank <= 50) {
              const dateStr = nextActionDate.toISOString().split('T')[0];
              console.log(`   ✅ [Rank ${person.globalRank}] ${person.fullName} → ${nextAction} (${dateStr})`);
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
            const nextAction = generateNextAction(company.name, recentActions, company.globalRank);
            const nextActionDate = calculateRankBasedDate(company.globalRank, company.lastActionDate);

            // Update company with next action (using only basic fields)
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                nextAction: nextAction,
                nextActionDate: nextActionDate
              }
            });

            companiesSuccess++;
            
            // Show progress for top 50
            if (company.globalRank && company.globalRank <= 50) {
              const dateStr = nextActionDate.toISOString().split('T')[0];
              console.log(`   ✅ [Rank ${company.globalRank}] ${company.name} → ${nextAction} (${dateStr})`);
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
        }
      }

      console.log(`\n   📊 Companies Summary: ${companiesSuccess} success, ${companiesErrors} errors\n`);
    }

    console.log('\n✅ SIMPLE POPULATION COMPLETE');
    console.log('=====================================');
    
  } catch (error) {
    console.error('\n❌ POPULATION FAILED:', error);
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
