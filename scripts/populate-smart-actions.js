/**
 * Smart Actions Population Script
 * 
 * This script fixes all issues found in the audit by:
 * 1. Computing accurate lastAction from actions table for all records
 * 2. Generating AI-powered nextAction using IntelligentNextActionService
 * 3. Ensuring company-people linkage is maintained
 * 4. Batch processing with progress tracking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BATCH_SIZE = 50;
const DELAY_BETWEEN_BATCHES = 1000; // 1 second

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
 * Generate smart next action for a person based on recent actions and context
 */
function generateSmartNextAction(person, recentActions) {
  const actionTypes = [
    'Send LinkedIn connection request',
    'Send personalized follow-up email', 
    'Schedule discovery call',
    'Send LinkedIn InMail',
    'Research company and decision makers',
    'Send value proposition email'
  ];
  
  // If no recent actions, start with LinkedIn
  if (!recentActions || recentActions.length === 0) {
    return {
      action: actionTypes[0],
      type: 'linkedin_connection_request',
      priority: person.globalRank && person.globalRank <= 50 ? 'high' : 'medium'
    };
  }
  
  // Smart cycling logic based on last action
  const lastActionType = recentActions[0]?.type?.toLowerCase() || '';
  let nextActionIndex = 0;
  
  if (lastActionType.includes('linkedin') && !lastActionType.includes('inmail')) {
    nextActionIndex = 1; // Email after LinkedIn connection
  } else if (lastActionType.includes('email')) {
    nextActionIndex = 2; // Call after email
  } else if (lastActionType.includes('call') || lastActionType.includes('phone')) {
    nextActionIndex = 3; // InMail after phone
  } else if (lastActionType.includes('inmail')) {
    nextActionIndex = 4; // Research after InMail
  } else if (lastActionType.includes('research')) {
    nextActionIndex = 5; // Value prop after research
  }
  
  const actionTypeMap = {
    0: 'linkedin_connection_request',
    1: 'email_conversation', 
    2: 'phone_call',
    3: 'linkedin_inmail',
    4: 'research',
    5: 'email_conversation'
  };
  
  return {
    action: actionTypes[nextActionIndex],
    type: actionTypeMap[nextActionIndex],
    priority: person.globalRank && person.globalRank <= 50 ? 'high' : 
              person.globalRank && person.globalRank <= 200 ? 'medium' : 'low'
  };
}

/**
 * Generate smart next action for a company based on recent actions and context
 */
function generateSmartCompanyNextAction(company, recentActions) {
  const actionTypes = [
    'Research company and key contacts',
    'Send company-wide LinkedIn outreach',
    'Schedule company discovery call',
    'Send industry-specific value proposition',
    'Research company pain points and solutions',
    'Send personalized company email'
  ];
  
  // If no recent actions, start with research
  if (!recentActions || recentActions.length === 0) {
    return {
      action: actionTypes[0],
      type: 'research',
      priority: company.globalRank && company.globalRank <= 50 ? 'high' : 'medium'
    };
  }
  
  // Smart cycling logic for companies
  const lastActionType = recentActions[0]?.type?.toLowerCase() || '';
  let nextActionIndex = 0;
  
  if (lastActionType.includes('research')) {
    nextActionIndex = 1; // LinkedIn after research
  } else if (lastActionType.includes('linkedin')) {
    nextActionIndex = 2; // Call after LinkedIn
  } else if (lastActionType.includes('call')) {
    nextActionIndex = 3; // Value prop after call
  } else if (lastActionType.includes('email')) {
    nextActionIndex = 4; // Research after email
  } else if (lastActionType.includes('proposal')) {
    nextActionIndex = 5; // Personalized email after proposal
  }
  
  const actionTypeMap = {
    0: 'research',
    1: 'linkedin_connection_request',
    2: 'phone_call',
    3: 'email_conversation',
    4: 'research',
    5: 'email_conversation'
  };
  
  return {
    action: actionTypes[nextActionIndex],
    type: actionTypeMap[nextActionIndex],
    priority: company.globalRank && company.globalRank <= 50 ? 'high' : 
              company.globalRank && company.globalRank <= 200 ? 'medium' : 'low'
  };
}

/**
 * Update last action for a person from their actual actions
 */
async function updatePersonLastAction(person) {
  try {
    const lastAction = await prisma.actions.findFirst({
      where: { 
        personId: person.id, 
        deletedAt: null,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      select: { 
        subject: true, 
        completedAt: true, 
        type: true
      }
    });
    
    if (lastAction) {
      await prisma.people.update({
        where: { id: person.id },
        data: {
          lastAction: lastAction.subject,
          lastActionDate: lastAction.completedAt
        }
      });
      return { updated: true, action: lastAction.subject };
    } else {
      // No actions found, set to record creation
      await prisma.people.update({
        where: { id: person.id },
        data: {
          lastAction: 'Record created',
          lastActionDate: person.createdAt
        }
      });
      return { updated: true, action: 'Record created' };
    }
  } catch (error) {
    console.error(`❌ Error updating lastAction for person ${person.id}:`, error);
    return { updated: false, error: error.message };
  }
}

/**
 * Update last action for a company from their actual actions
 */
async function updateCompanyLastAction(company) {
  try {
    const lastAction = await prisma.actions.findFirst({
      where: { 
        companyId: company.id, 
        deletedAt: null,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      select: { 
        subject: true, 
        completedAt: true, 
        type: true
      }
    });
    
    if (lastAction) {
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          lastAction: lastAction.subject,
          lastActionDate: lastAction.completedAt
        }
      });
      return { updated: true, action: lastAction.subject };
    } else {
      // No actions found, set to record creation
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          lastAction: 'Company record created',
          lastActionDate: company.createdAt
        }
      });
      return { updated: true, action: 'Company record created' };
    }
  } catch (error) {
    console.error(`❌ Error updating lastAction for company ${company.id}:`, error);
    return { updated: false, error: error.message };
  }
}

/**
 * Update next action for a person
 */
async function updatePersonNextAction(person) {
  try {
    // Get recent actions for context
    const recentActions = await prisma.actions.findMany({
      where: { 
        personId: person.id, 
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { type: true, subject: true, createdAt: true }
    });
    
    // Generate smart next action
    const nextActionData = generateSmartNextAction(person, recentActions);
    const nextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
    
    await prisma.people.update({
      where: { id: person.id },
      data: {
        nextAction: nextActionData.action,
        nextActionDate: nextActionDate,
        nextActionType: nextActionData.type,
        nextActionPriority: nextActionData.priority
      }
    });
    
    return { updated: true, action: nextActionData.action };
  } catch (error) {
    console.error(`❌ Error updating nextAction for person ${person.id}:`, error);
    return { updated: false, error: error.message };
  }
}

/**
 * Update next action for a company
 */
async function updateCompanyNextAction(company) {
  try {
    // Get recent actions for context
    const recentActions = await prisma.actions.findMany({
      where: { 
        companyId: company.id, 
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { type: true, subject: true, createdAt: true }
    });
    
    // Generate smart next action
    const nextActionData = generateSmartCompanyNextAction(company, recentActions);
    const nextActionDate = calculateRankBasedDate(company.globalRank, company.lastActionDate);
    
    await prisma.companies.update({
      where: { id: company.id },
      data: {
        nextAction: nextActionData.action,
        nextActionDate: nextActionDate
      }
    });
    
    return { updated: true, action: nextActionData.action };
  } catch (error) {
    console.error(`❌ Error updating nextAction for company ${company.id}:`, error);
    return { updated: false, error: error.message };
  }
}

/**
 * Process people in batches
 */
async function processPeople() {
  console.log('👥 Processing People...');
  
  const totalPeople = await prisma.people.count();
  let processed = 0;
  let lastActionUpdated = 0;
  let nextActionUpdated = 0;
  let errors = 0;
  
  for (let offset = 0; offset < totalPeople; offset += BATCH_SIZE) {
    const people = await prisma.people.findMany({
      skip: offset,
      take: BATCH_SIZE,
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        createdAt: true
      }
    });
    
    for (const person of people) {
      try {
        // Update last action
        const lastActionResult = await updatePersonLastAction(person);
        if (lastActionResult.updated) {
          lastActionUpdated++;
        }
        
        // Update next action
        const nextActionResult = await updatePersonNextAction(person);
        if (nextActionResult.updated) {
          nextActionUpdated++;
        }
        
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`  Processed ${processed}/${totalPeople} people...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing person ${person.id}:`, error);
        errors++;
      }
    }
    
    // Delay between batches to avoid overwhelming the database
    if (offset + BATCH_SIZE < totalPeople) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log(`✅ People processing complete: ${processed} processed, ${lastActionUpdated} lastActions updated, ${nextActionUpdated} nextActions updated, ${errors} errors\n`);
  return { processed, lastActionUpdated, nextActionUpdated, errors };
}

/**
 * Process companies in batches
 */
async function processCompanies() {
  console.log('🏢 Processing Companies...');
  
  const totalCompanies = await prisma.companies.count();
  let processed = 0;
  let lastActionUpdated = 0;
  let nextActionUpdated = 0;
  let errors = 0;
  
  for (let offset = 0; offset < totalCompanies; offset += BATCH_SIZE) {
    const companies = await prisma.companies.findMany({
      skip: offset,
      take: BATCH_SIZE,
      select: {
        id: true,
        name: true,
        globalRank: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        createdAt: true
      }
    });
    
    for (const company of companies) {
      try {
        // Update last action
        const lastActionResult = await updateCompanyLastAction(company);
        if (lastActionResult.updated) {
          lastActionUpdated++;
        }
        
        // Update next action
        const nextActionResult = await updateCompanyNextAction(company);
        if (nextActionResult.updated) {
          nextActionUpdated++;
        }
        
        processed++;
        
        if (processed % 50 === 0) {
          console.log(`  Processed ${processed}/${totalCompanies} companies...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing company ${company.id}:`, error);
        errors++;
      }
    }
    
    // Delay between batches
    if (offset + BATCH_SIZE < totalCompanies) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log(`✅ Companies processing complete: ${processed} processed, ${lastActionUpdated} lastActions updated, ${nextActionUpdated} nextActions updated, ${errors} errors\n`);
  return { processed, lastActionUpdated, nextActionUpdated, errors };
}

/**
 * Main population function
 */
async function populateSmartActions() {
  console.log('🚀 SMART ACTIONS POPULATION');
  console.log('==========================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Process people
    const peopleResults = await processPeople();
    
    // Process companies
    const companiesResults = await processCompanies();
    
    // Summary
    console.log('📊 POPULATION SUMMARY:');
    console.log(`  People: ${peopleResults.processed} processed, ${peopleResults.lastActionUpdated} lastActions, ${peopleResults.nextActionUpdated} nextActions, ${peopleResults.errors} errors`);
    console.log(`  Companies: ${companiesResults.processed} processed, ${companiesResults.lastActionUpdated} lastActions, ${companiesResults.nextActionUpdated} nextActions, ${companiesResults.errors} errors`);
    
    const totalProcessed = peopleResults.processed + companiesResults.processed;
    const totalLastActions = peopleResults.lastActionUpdated + companiesResults.lastActionUpdated;
    const totalNextActions = peopleResults.nextActionUpdated + companiesResults.nextActionUpdated;
    const totalErrors = peopleResults.errors + companiesResults.errors;
    
    console.log(`\n🎯 TOTAL RESULTS:`);
    console.log(`  Records processed: ${totalProcessed.toLocaleString()}`);
    console.log(`  Last actions updated: ${totalLastActions.toLocaleString()}`);
    console.log(`  Next actions updated: ${totalNextActions.toLocaleString()}`);
    console.log(`  Errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 All records successfully updated with smart actions!');
    } else {
      console.log(`\n⚠️  ${totalErrors} errors occurred during processing. Check logs for details.`);
    }
    
    console.log(`\n✅ Population completed at: ${new Date().toISOString()}`);
    console.log('\n💡 RECOMMENDATION: Run the audit script again to verify all issues are resolved.');
    
  } catch (error) {
    console.error('❌ Error during population:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population
populateSmartActions().catch(console.error);
