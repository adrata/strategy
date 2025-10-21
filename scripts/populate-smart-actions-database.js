/**
 * Smart Actions Population Script (Database Direct)
 * 
 * This script fixes all issues found in the audit by using direct database updates to:
 * 1. Update lastAction and nextAction for people
 * 2. Update lastAction and nextAction for companies
 * 3. Ensure company-people linkage is maintained
 * 4. Batch processing with progress tracking
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BATCH_SIZE = 100; // Process in batches
const DELAY_BETWEEN_BATCHES = 1000; // 1 second between batches

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
 * Process people in batches
 */
async function processPeople() {
  console.log('👥 Processing People...');
  
  let processed = 0;
  let successCount = 0;
  let errorCount = 0;
  
  // Get total count for progress tracking
  const totalPeople = await prisma.people.count();
  console.log(`  Total people to process: ${totalPeople.toLocaleString()}`);
  
  let offset = 0;
  
  while (offset < totalPeople) {
    try {
      // Fetch batch of people
      const people = await prisma.people.findMany({
        skip: offset,
        take: BATCH_SIZE,
        include: {
          actions: {
            where: { status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            take: 3,
            select: { subject: true, completedAt: true, type: true }
          }
        }
      });
      
      if (people.length === 0) break;
      
      console.log(`  Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(totalPeople / BATCH_SIZE)} (${people.length} people)...`);
      
      // Process each person in the batch
      for (const person of people) {
        try {
          // Get the most recent completed action for lastAction
          const lastAction = person.actions[0];
          const lastActionText = lastAction?.subject || 'Record created';
          const lastActionDate = lastAction?.completedAt || person.createdAt;
          
          // Generate smart next action
          const nextActionData = generateSmartNextAction(person, person.actions);
          const nextActionDate = calculateRankBasedDate(person.globalRank, lastActionDate);
          
          // Update person record
          await prisma.people.update({
            where: { id: person.id },
            data: {
              lastAction: lastActionText,
              lastActionDate: lastActionDate,
              nextAction: nextActionData.action,
              nextActionDate: nextActionDate,
              nextActionType: nextActionData.type,
              nextActionPriority: nextActionData.priority
            }
          });
          
          successCount++;
          
        } catch (error) {
          console.error(`❌ Error processing person ${person.id}:`, error);
          errorCount++;
        }
        
        processed++;
        
        if (processed % 1000 === 0) {
          console.log(`    Processed ${processed}/${totalPeople} people...`);
        }
      }
      
      offset += BATCH_SIZE;
      
      // Delay between batches
      if (offset < totalPeople) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
      
    } catch (error) {
      console.error(`❌ Error processing people batch at offset ${offset}:`, error);
      errorCount += BATCH_SIZE;
      offset += BATCH_SIZE;
    }
  }
  
  console.log(`✅ People processing complete: ${processed} processed, ${successCount} successful, ${errorCount} errors\n`);
  return { processed, successCount, errorCount };
}

/**
 * Process companies in batches
 */
async function processCompanies() {
  console.log('🏢 Processing Companies...');
  
  let processed = 0;
  let successCount = 0;
  let errorCount = 0;
  
  // Get total count for progress tracking
  const totalCompanies = await prisma.companies.count();
  console.log(`  Total companies to process: ${totalCompanies.toLocaleString()}`);
  
  let offset = 0;
  
  while (offset < totalCompanies) {
    try {
      // Fetch batch of companies
      const companies = await prisma.companies.findMany({
        skip: offset,
        take: BATCH_SIZE,
        include: {
          actions: {
            where: { status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            take: 3,
            select: { subject: true, completedAt: true, type: true }
          }
        }
      });
      
      if (companies.length === 0) break;
      
      console.log(`  Processing batch ${Math.floor(offset / BATCH_SIZE) + 1}/${Math.ceil(totalCompanies / BATCH_SIZE)} (${companies.length} companies)...`);
      
      // Process each company in the batch
      for (const company of companies) {
        try {
          // Get the most recent completed action for lastAction
          const lastAction = company.actions[0];
          const lastActionText = lastAction?.subject || 'Company record created';
          const lastActionDate = lastAction?.completedAt || company.createdAt;
          
          // Generate smart next action
          const nextActionData = generateSmartCompanyNextAction(company, company.actions);
          const nextActionDate = calculateRankBasedDate(company.globalRank, lastActionDate);
          
          // Update company record
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              lastAction: lastActionText,
              lastActionDate: lastActionDate,
              nextAction: nextActionData.action,
              nextActionDate: nextActionDate
            }
          });
          
          successCount++;
          
        } catch (error) {
          console.error(`❌ Error processing company ${company.id}:`, error);
          errorCount++;
        }
        
        processed++;
        
        if (processed % 500 === 0) {
          console.log(`    Processed ${processed}/${totalCompanies} companies...`);
        }
      }
      
      offset += BATCH_SIZE;
      
      // Delay between batches
      if (offset < totalCompanies) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
      
    } catch (error) {
      console.error(`❌ Error processing companies batch at offset ${offset}:`, error);
      errorCount += BATCH_SIZE;
      offset += BATCH_SIZE;
    }
  }
  
  console.log(`✅ Companies processing complete: ${processed} processed, ${successCount} successful, ${errorCount} errors\n`);
  return { processed, successCount, errorCount };
}

/**
 * Main population function
 */
async function populateSmartActionsDatabase() {
  console.log('🚀 SMART ACTIONS POPULATION (DATABASE DIRECT)');
  console.log('============================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Process people
    const peopleResults = await processPeople();
    
    // Process companies
    const companiesResults = await processCompanies();
    
    // Summary
    console.log('📊 POPULATION SUMMARY:');
    console.log(`  People: ${peopleResults.processed} processed, ${peopleResults.successCount} successful, ${peopleResults.errorCount} errors`);
    console.log(`  Companies: ${companiesResults.processed} processed, ${companiesResults.successCount} successful, ${companiesResults.errorCount} errors`);
    
    const totalProcessed = peopleResults.processed + companiesResults.processed;
    const totalSuccess = peopleResults.successCount + companiesResults.successCount;
    const totalErrors = peopleResults.errorCount + companiesResults.errorCount;
    
    console.log(`\n🎯 TOTAL RESULTS:`);
    console.log(`  Records processed: ${totalProcessed.toLocaleString()}`);
    console.log(`  Successful updates: ${totalSuccess.toLocaleString()}`);
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
populateSmartActionsDatabase().catch(console.error);
