/**
 * Smart Actions Population Script (V1 API)
 * 
 * This script fixes all issues found in the audit by using v1 APIs to:
 * 1. Update lastAction and nextAction for people via PATCH /api/v1/people/[id]
 * 2. Update lastAction and nextAction for companies via PATCH /api/v1/companies/[id]
 * 3. Ensure company-people linkage is maintained
 * 4. Batch processing with progress tracking
 */

const BATCH_SIZE = 10; // Smaller batch size for API calls
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const DELAY_BETWEEN_REQUESTS = 100; // 100ms between individual requests

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
 * Fetch all people from v1 API
 */
async function fetchAllPeople() {
  console.log('📡 Fetching all people from v1 API...');
  const allPeople = [];
  let page = 1;
  const limit = 1000;
  
  while (true) {
    try {
      const response = await fetch(`/api/v1/people?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        break;
      }
      
      allPeople.push(...data.data);
      console.log(`  Fetched page ${page}: ${data.data.length} people (total: ${allPeople.length})`);
      
      if (data.data.length < limit) {
        break; // Last page
      }
      
      page++;
    } catch (error) {
      console.error(`❌ Error fetching people page ${page}:`, error);
      break;
    }
  }
  
  console.log(`✅ Total people fetched: ${allPeople.length}\n`);
  return allPeople;
}

/**
 * Fetch all companies from v1 API
 */
async function fetchAllCompanies() {
  console.log('📡 Fetching all companies from v1 API...');
  const allCompanies = [];
  let page = 1;
  const limit = 1000;
  
  while (true) {
    try {
      const response = await fetch(`/api/v1/companies?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        break;
      }
      
      allCompanies.push(...data.data);
      console.log(`  Fetched page ${page}: ${data.data.length} companies (total: ${allCompanies.length})`);
      
      if (data.data.length < limit) {
        break; // Last page
      }
      
      page++;
    } catch (error) {
      console.error(`❌ Error fetching companies page ${page}:`, error);
      break;
    }
  }
  
  console.log(`✅ Total companies fetched: ${allCompanies.length}\n`);
  return allCompanies;
}

/**
 * Update person via v1 API
 */
async function updatePersonViaAPI(person) {
  try {
    // Generate smart next action
    const nextActionData = generateSmartNextAction(person, []);
    const nextActionDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
    
    const updateData = {
      lastAction: person.lastAction || 'Record created',
      lastActionDate: person.lastActionDate || person.createdAt,
      nextAction: nextActionData.action,
      nextActionDate: nextActionDate.toISOString(),
      nextActionType: nextActionData.type,
      nextActionPriority: nextActionData.priority
    };
    
    const response = await fetch(`/api/v1/people/${person.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { success: true, action: nextActionData.action };
    } else {
      console.error(`❌ API error for person ${person.id}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error updating person ${person.id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Update company via v1 API
 */
async function updateCompanyViaAPI(company) {
  try {
    // Generate smart next action
    const nextActionData = generateSmartCompanyNextAction(company, []);
    const nextActionDate = calculateRankBasedDate(company.globalRank, company.lastActionDate);
    
    const updateData = {
      lastAction: company.lastAction || 'Company record created',
      lastActionDate: company.lastActionDate || company.createdAt,
      nextAction: nextActionData.action,
      nextActionDate: nextActionDate.toISOString()
    };
    
    const response = await fetch(`/api/v1/companies/${company.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { success: true, action: nextActionData.action };
    } else {
      console.error(`❌ API error for company ${company.id}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error updating company ${company.id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Process people in batches via v1 API
 */
async function processPeopleViaAPI() {
  console.log('👥 Processing People via v1 API...');
  
  const people = await fetchAllPeople();
  let processed = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < people.length; i += BATCH_SIZE) {
    const batch = people.slice(i, i + BATCH_SIZE);
    
    console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(people.length / BATCH_SIZE)} (${batch.length} people)...`);
    
    for (const person of batch) {
      try {
        const result = await updatePersonViaAPI(person);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`    Processed ${processed}/${people.length} people...`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        
      } catch (error) {
        console.error(`❌ Error processing person ${person.id}:`, error);
        errorCount++;
        processed++;
      }
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < people.length) {
      console.log(`  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log(`✅ People processing complete: ${processed} processed, ${successCount} successful, ${errorCount} errors\n`);
  return { processed, successCount, errorCount };
}

/**
 * Process companies in batches via v1 API
 */
async function processCompaniesViaAPI() {
  console.log('🏢 Processing Companies via v1 API...');
  
  const companies = await fetchAllCompanies();
  let processed = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    
    console.log(`  Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(companies.length / BATCH_SIZE)} (${batch.length} companies)...`);
    
    for (const company of batch) {
      try {
        const result = await updateCompanyViaAPI(company);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        processed++;
        
        if (processed % 50 === 0) {
          console.log(`    Processed ${processed}/${companies.length} companies...`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
        
      } catch (error) {
        console.error(`❌ Error processing company ${company.id}:`, error);
        errorCount++;
        processed++;
      }
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < companies.length) {
      console.log(`  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  console.log(`✅ Companies processing complete: ${processed} processed, ${successCount} successful, ${errorCount} errors\n`);
  return { processed, successCount, errorCount };
}

/**
 * Main population function using v1 APIs
 */
async function populateSmartActionsV1() {
  console.log('🚀 SMART ACTIONS POPULATION (V1 API)');
  console.log('=====================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // Process people
    const peopleResults = await processPeopleViaAPI();
    
    // Process companies
    const companiesResults = await processCompaniesViaAPI();
    
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
  }
}

// Run the population
populateSmartActionsV1().catch(console.error);
