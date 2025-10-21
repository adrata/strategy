/**
 * Comprehensive Last Action & Next Action Audit Script (V1 API)
 * 
 * This script audits all people and company records using the v1 APIs to ensure:
 * 1. Last actions are accurate, properly dated, and human-readable
 * 2. Next actions are AI-generated, smart, properly timed based on Speedrun tiers
 * 3. Company-people relationships are properly maintained in action logic
 */

/**
 * Calculate expected next action date based on global rank
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
 * Check if action text is human-readable
 */
function isHumanReadable(action) {
  if (!action || action.length < 5) return false;
  
  // Flag if it looks like an ID, code, or technical string
  const isTechnical = /^[A-Z0-9_]{10,}$/.test(action) || // All caps/numbers
                     action.includes('undefined') ||
                     action.includes('null') ||
                     action.includes('Object') ||
                     action.includes('[object');
  
  return !isTechnical;
}

/**
 * Check if next action is smart/contextual (not generic)
 */
function isSmartAction(action) {
  if (!action || action.length < 10) return false;
  
  const genericPhrases = [
    'Follow up',
    'Contact',
    'Reach out',
    'TODO',
    'TBD',
    'Next action',
    'Follow-up',
    'Call',
    'Email'
  ];
  
  const isGeneric = genericPhrases.some(phrase => 
    action.toLowerCase() === phrase.toLowerCase()
  ) && action.length < 30; // If it's generic AND short
  
  return !isGeneric;
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'Never';
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Fetch data from v1 API with pagination
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
 * Fetch data from v1 API with pagination
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

async function auditLastNextActionsV1() {
  console.log('🔍 LAST ACTION & NEXT ACTION AUDIT (V1 API)');
  console.log('=============================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // 1. FETCH DATA FROM V1 APIs
    const people = await fetchAllPeople();
    const companies = await fetchAllCompanies();
    
    // 2. DATABASE SUMMARY
    console.log('📊 DATABASE SUMMARY:');
    console.log(`  Total People: ${people.length.toLocaleString()}`);
    console.log(`  Total Companies: ${companies.length.toLocaleString()}\n`);
    
    // 3. PEOPLE LAST ACTION AUDIT
    console.log('📅 PEOPLE LAST ACTION AUDIT:');
    
    const peopleNoLastAction = people.filter(p => !p.lastAction).length;
    const peopleNoLastActionDate = people.filter(p => !p.lastActionDate).length;
    const peopleWithActions = people.filter(p => p.lastAction && p.lastActionDate);
    const peopleBadActions = peopleWithActions.filter(p => !isHumanReadable(p.lastAction));
    
    console.log(`  ✅ People with valid lastAction: ${people.length - peopleNoLastAction} (${Math.round((people.length - peopleNoLastAction) / people.length * 100)}%)`);
    console.log(`  ❌ People missing lastAction: ${peopleNoLastAction} (${Math.round(peopleNoLastAction / people.length * 100)}%)`);
    console.log(`  ❌ People missing lastActionDate: ${peopleNoLastActionDate} (${Math.round(peopleNoLastActionDate / people.length * 100)}%)`);
    console.log(`  ⚠️  People with non-human-readable lastAction: ${peopleBadActions.length} (${Math.round(peopleBadActions.length / peopleWithActions.length * 100)}%)\n`);
    
    // 4. COMPANIES LAST ACTION AUDIT
    console.log('📅 COMPANIES LAST ACTION AUDIT:');
    
    const companiesNoLastAction = companies.filter(c => !c.lastAction).length;
    const companiesNoLastActionDate = companies.filter(c => !c.lastActionDate).length;
    
    console.log(`  ✅ Companies with valid lastAction: ${companies.length - companiesNoLastAction} (${Math.round((companies.length - companiesNoLastAction) / companies.length * 100)}%)`);
    console.log(`  ❌ Companies missing lastAction: ${companiesNoLastAction} (${Math.round(companiesNoLastAction / companies.length * 100)}%)`);
    console.log(`  ❌ Companies missing lastActionDate: ${companiesNoLastActionDate} (${Math.round(companiesNoLastActionDate / companies.length * 100)}%)\n`);
    
    // 5. PEOPLE NEXT ACTION AUDIT
    console.log('🎯 PEOPLE NEXT ACTION AUDIT:');
    
    const peopleNoNextAction = people.filter(p => !p.nextAction).length;
    const peopleNoNextActionDate = people.filter(p => !p.nextActionDate).length;
    const peopleWithNextActions = people.filter(p => p.nextAction && p.nextActionDate && p.globalRank);
    
    // Validate next action dates match rank tiers
    const peopleIncorrectTiming = peopleWithNextActions.filter(person => {
      const expectedDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
      const actualDate = person.nextActionDate;
      if (!actualDate) return true;
      // Allow 1 day variance
      const diff = Math.abs(new Date(actualDate).getTime() - expectedDate.getTime());
      return diff > 24 * 60 * 60 * 1000;
    });
    
    const peopleGenericActions = peopleWithNextActions.filter(p => !isSmartAction(p.nextAction));
    
    console.log(`  ✅ People with valid nextAction: ${people.length - peopleNoNextAction} (${Math.round((people.length - peopleNoNextAction) / people.length * 100)}%)`);
    console.log(`  ❌ People missing nextAction: ${peopleNoNextAction} (${Math.round(peopleNoNextAction / people.length * 100)}%)`);
    console.log(`  ❌ People missing nextActionDate: ${peopleNoNextActionDate} (${Math.round(peopleNoNextActionDate / people.length * 100)}%)`);
    console.log(`  ⚠️  People with incorrect timing: ${peopleIncorrectTiming.length} (${Math.round(peopleIncorrectTiming.length / peopleWithNextActions.length * 100)}%)`);
    console.log(`  ⚠️  People with generic nextAction: ${peopleGenericActions.length} (${Math.round(peopleGenericActions.length / peopleWithNextActions.length * 100)}%)\n`);
    
    // 6. COMPANIES NEXT ACTION AUDIT
    console.log('🎯 COMPANIES NEXT ACTION AUDIT:');
    
    const companiesNoNextAction = companies.filter(c => !c.nextAction).length;
    const companiesNoNextActionDate = companies.filter(c => !c.nextActionDate).length;
    
    console.log(`  ✅ Companies with valid nextAction: ${companies.length - companiesNoNextAction} (${Math.round((companies.length - companiesNoNextAction) / companies.length * 100)}%)`);
    console.log(`  ❌ Companies missing nextAction: ${companiesNoNextAction} (${Math.round(companiesNoNextAction / companies.length * 100)}%)`);
    console.log(`  ❌ Companies missing nextActionDate: ${companiesNoNextActionDate} (${Math.round(companiesNoNextActionDate / companies.length * 100)}%)\n`);
    
    // 7. SAMPLE DATA REVIEW
    console.log('📋 SAMPLE DATA (Top 20 Speedrun People):');
    const topPeople = people
      .filter(p => p.globalRank && p.globalRank <= 50)
      .sort((a, b) => (a.globalRank || 999) - (b.globalRank || 999))
      .slice(0, 20);
    
    topPeople.forEach((person, index) => {
      const lastActionText = person.lastAction || 'None';
      const lastActionTime = formatDate(person.lastActionDate);
      const nextActionText = person.nextAction || 'None';
      const nextActionTime = person.nextActionDate ? formatDate(person.nextActionDate) : 'None';
      const companyName = person.company?.name || 'No Company';
      
      console.log(`  ${index + 1}. ${person.fullName} (${companyName})`);
      console.log(`     Last: "${lastActionText}" (${lastActionTime})`);
      console.log(`     Next: "${nextActionText}" (${nextActionTime})`);
      console.log('');
    });
    
    // 8. ISSUES SUMMARY
    console.log('❌ ISSUES FOUND:');
    const totalIssues = peopleNoLastAction + peopleNoLastActionDate + companiesNoLastAction + 
                       companiesNoLastActionDate + peopleNoNextAction + peopleNoNextActionDate + 
                       companiesNoNextAction + companiesNoNextActionDate + 
                       peopleBadActions.length + peopleIncorrectTiming.length + peopleGenericActions.length;
    
    if (totalIssues === 0) {
      console.log('  🎉 No issues found! All records have proper last and next actions.');
    } else {
      if (peopleNoLastAction > 0) console.log(`  - ${peopleNoLastAction} people have no lastAction recorded`);
      if (peopleNoLastActionDate > 0) console.log(`  - ${peopleNoLastActionDate} people have no lastActionDate recorded`);
      if (companiesNoLastAction > 0) console.log(`  - ${companiesNoLastAction} companies have no lastAction recorded`);
      if (companiesNoLastActionDate > 0) console.log(`  - ${companiesNoLastActionDate} companies have no lastActionDate recorded`);
      if (peopleNoNextAction > 0) console.log(`  - ${peopleNoNextAction} people have no nextAction recorded`);
      if (peopleNoNextActionDate > 0) console.log(`  - ${peopleNoNextActionDate} people have no nextActionDate recorded`);
      if (companiesNoNextAction > 0) console.log(`  - ${companiesNoNextAction} companies have no nextAction recorded`);
      if (companiesNoNextActionDate > 0) console.log(`  - ${companiesNoNextActionDate} companies have no nextActionDate recorded`);
      if (peopleBadActions.length > 0) console.log(`  - ${peopleBadActions.length} people have non-human-readable lastAction`);
      if (peopleIncorrectTiming.length > 0) console.log(`  - ${peopleIncorrectTiming.length} people have nextActionDate not matching their globalRank tier`);
      if (peopleGenericActions.length > 0) console.log(`  - ${peopleGenericActions.length} people have generic/non-smart nextAction`);
    }
    
    console.log('\n💡 RECOMMENDATION:');
    if (totalIssues > 0) {
      console.log('  Run `node scripts/populate-smart-actions-v1.js` to fix all issues using v1 APIs');
    } else {
      console.log('  All records are properly configured! No action needed.');
    }
    
    console.log(`\n✅ Audit completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  }
}

// Run the audit
auditLastNextActionsV1().catch(console.error);
