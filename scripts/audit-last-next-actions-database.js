/**
 * Comprehensive Last Action & Next Action Audit Script (Database Direct)
 * 
 * This script audits all people and company records using direct database access to ensure:
 * 1. Last actions are accurate, properly dated, and human-readable
 * 2. Next actions are AI-generated, smart, properly timed based on Speedrun tiers
 * 3. Company-people relationships are properly maintained in action logic
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

async function auditLastNextActionsDatabase() {
  console.log('🔍 LAST ACTION & NEXT ACTION AUDIT (DATABASE DIRECT)');
  console.log('===================================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    // 1. DATABASE SUMMARY
    console.log('📊 DATABASE SUMMARY:');
    const peopleCount = await prisma.people.count();
    const companiesCount = await prisma.companies.count();
    const actionsCount = await prisma.actions.count();
    
    console.log(`  Total People: ${peopleCount.toLocaleString()}`);
    console.log(`  Total Companies: ${companiesCount.toLocaleString()}`);
    console.log(`  Total Actions: ${actionsCount.toLocaleString()}\n`);
    
    // 2. PEOPLE LAST ACTION AUDIT
    console.log('📅 PEOPLE LAST ACTION AUDIT:');
    
    // Check people with missing lastAction
    const peopleNoLastAction = await prisma.people.count({
      where: { lastAction: null }
    });
    
    // Check people with missing lastActionDate
    const peopleNoLastActionDate = await prisma.people.count({
      where: { lastActionDate: null }
    });
    
    // Get sample of people with actions to check accuracy
    const peopleWithActions = await prisma.people.findMany({
      where: { 
        lastAction: { not: null },
        lastActionDate: { not: null }
      },
      include: {
        actions: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { subject: true, completedAt: true, type: true }
        }
      },
      take: 1000 // Sample for performance
    });
    
    // Find mismatches between stored lastAction and actual last action
    const lastActionMismatches = peopleWithActions.filter(person => {
      const actualLastAction = person.actions[0];
      if (!actualLastAction) return person.lastAction !== null;
      return person.lastAction !== actualLastAction.subject;
    });
    
    // Check for non-human-readable actions
    const peopleBadActions = peopleWithActions.filter(person => 
      !isHumanReadable(person.lastAction)
    );
    
    console.log(`  ✅ People with valid lastAction: ${peopleCount - peopleNoLastAction} (${Math.round((peopleCount - peopleNoLastAction) / peopleCount * 100)}%)`);
    console.log(`  ❌ People missing lastAction: ${peopleNoLastAction} (${Math.round(peopleNoLastAction / peopleCount * 100)}%)`);
    console.log(`  ❌ People missing lastActionDate: ${peopleNoLastActionDate} (${Math.round(peopleNoLastActionDate / peopleCount * 100)}%)`);
    console.log(`  ⚠️  People with outdated lastAction: ${lastActionMismatches.length} (${Math.round(lastActionMismatches.length / peopleWithActions.length * 100)}%)`);
    console.log(`  ⚠️  People with non-human-readable lastAction: ${peopleBadActions.length} (${Math.round(peopleBadActions.length / peopleWithActions.length * 100)}%)\n`);
    
    // 3. COMPANIES LAST ACTION AUDIT
    console.log('📅 COMPANIES LAST ACTION AUDIT:');
    
    const companiesNoLastAction = await prisma.companies.count({
      where: { lastAction: null }
    });
    
    const companiesNoLastActionDate = await prisma.companies.count({
      where: { lastActionDate: null }
    });
    
    console.log(`  ✅ Companies with valid lastAction: ${companiesCount - companiesNoLastAction} (${Math.round((companiesCount - companiesNoLastAction) / companiesCount * 100)}%)`);
    console.log(`  ❌ Companies missing lastAction: ${companiesNoLastAction} (${Math.round(companiesNoLastAction / companiesCount * 100)}%)`);
    console.log(`  ❌ Companies missing lastActionDate: ${companiesNoLastActionDate} (${Math.round(companiesNoLastActionDate / companiesCount * 100)}%)\n`);
    
    // 4. PEOPLE NEXT ACTION AUDIT
    console.log('🎯 PEOPLE NEXT ACTION AUDIT:');
    
    const peopleNoNextAction = await prisma.people.count({
      where: { nextAction: null }
    });
    
    const peopleNoNextActionDate = await prisma.people.count({
      where: { nextActionDate: null }
    });
    
    // Get people with next actions to check timing
    const peopleWithNextActions = await prisma.people.findMany({
      where: { 
        nextAction: { not: null },
        nextActionDate: { not: null },
        globalRank: { not: null }
      },
      take: 1000 // Sample for performance
    });
    
    // Validate next action dates match rank tiers
    const peopleIncorrectTiming = peopleWithNextActions.filter(person => {
      const expectedDate = calculateRankBasedDate(person.globalRank, person.lastActionDate);
      const actualDate = person.nextActionDate;
      if (!actualDate) return true;
      // Allow 1 day variance
      const diff = Math.abs(new Date(actualDate).getTime() - expectedDate.getTime());
      return diff > 24 * 60 * 60 * 1000;
    });
    
    // Check for generic next actions
    const peopleGenericActions = peopleWithNextActions.filter(person => 
      !isSmartAction(person.nextAction)
    );
    
    console.log(`  ✅ People with valid nextAction: ${peopleCount - peopleNoNextAction} (${Math.round((peopleCount - peopleNoNextAction) / peopleCount * 100)}%)`);
    console.log(`  ❌ People missing nextAction: ${peopleNoNextAction} (${Math.round(peopleNoNextAction / peopleCount * 100)}%)`);
    console.log(`  ❌ People missing nextActionDate: ${peopleNoNextActionDate} (${Math.round(peopleNoNextActionDate / peopleCount * 100)}%)`);
    console.log(`  ⚠️  People with incorrect timing: ${peopleIncorrectTiming.length} (${Math.round(peopleIncorrectTiming.length / peopleWithNextActions.length * 100)}%)`);
    console.log(`  ⚠️  People with generic nextAction: ${peopleGenericActions.length} (${Math.round(peopleGenericActions.length / peopleWithNextActions.length * 100)}%)\n`);
    
    // 5. COMPANIES NEXT ACTION AUDIT
    console.log('🎯 COMPANIES NEXT ACTION AUDIT:');
    
    const companiesNoNextAction = await prisma.companies.count({
      where: { nextAction: null }
    });
    
    const companiesNoNextActionDate = await prisma.companies.count({
      where: { nextActionDate: null }
    });
    
    console.log(`  ✅ Companies with valid nextAction: ${companiesCount - companiesNoNextAction} (${Math.round((companiesCount - companiesNoNextAction) / companiesCount * 100)}%)`);
    console.log(`  ❌ Companies missing nextAction: ${companiesNoNextAction} (${Math.round(companiesNoNextAction / companiesCount * 100)}%)`);
    console.log(`  ❌ Companies missing nextActionDate: ${companiesNoNextActionDate} (${Math.round(companiesNoNextActionDate / companiesCount * 100)}%)\n`);
    
    // 6. SAMPLE DATA REVIEW
    console.log('📋 SAMPLE DATA (Top 20 Speedrun People):');
    const topPeople = await prisma.people.findMany({
      where: { globalRank: { lte: 50 } },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        company: {
          select: { name: true }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 20
    });
    
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
    
    // 7. ISSUES SUMMARY
    console.log('❌ ISSUES FOUND:');
    const totalIssues = peopleNoLastAction + peopleNoLastActionDate + companiesNoLastAction + 
                       companiesNoLastActionDate + peopleNoNextAction + peopleNoNextActionDate + 
                       companiesNoNextAction + companiesNoNextActionDate + 
                       lastActionMismatches.length + peopleBadActions.length + 
                       peopleIncorrectTiming.length + peopleGenericActions.length;
    
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
      if (lastActionMismatches.length > 0) console.log(`  - ${lastActionMismatches.length} people have outdated lastAction`);
      if (peopleBadActions.length > 0) console.log(`  - ${peopleBadActions.length} people have non-human-readable lastAction`);
      if (peopleIncorrectTiming.length > 0) console.log(`  - ${peopleIncorrectTiming.length} people have nextActionDate not matching their globalRank tier`);
      if (peopleGenericActions.length > 0) console.log(`  - ${peopleGenericActions.length} people have generic/non-smart nextAction`);
    }
    
    console.log('\n💡 RECOMMENDATION:');
    if (totalIssues > 0) {
      console.log('  Run `node scripts/populate-smart-actions-database.js` to fix all issues using database updates');
    } else {
      console.log('  All records are properly configured! No action needed.');
    }
    
    console.log(`\n✅ Audit completed at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditLastNextActionsDatabase().catch(console.error);
