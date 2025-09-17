const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeActionTerminology() {
  console.log('🔍 ACTION TERMINOLOGY ANALYSIS');
  console.log('==============================');
  console.log('Analyzing different action-related terms in the data model...\n');

  try {
    // 1. ACTIVITIES TABLE
    console.log('📋 1. ACTIVITIES TABLE');
    console.log('======================');
    const activitiesCount = await prisma.activities.count();
    console.log(`Total activities: ${activitiesCount}`);
    
    // Get activity types
    const activityTypes = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count 
      FROM activities 
      GROUP BY type 
      ORDER BY count DESC
    `;
    
    console.log('Activity types:');
    activityTypes.forEach(type => {
      console.log(`  - ${type.type}: ${type.count} records`);
    });
    
    // Get activity statuses
    const activityStatuses = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM activities 
      GROUP BY status 
      ORDER BY count DESC
    `;
    
    console.log('Activity statuses:');
    activityStatuses.forEach(status => {
      console.log(`  - ${status.status}: ${status.count} records`);
    });

    // 2. SPEEDRUN ACTION LOGS
    console.log('\n📋 2. SPEEDRUN ACTION LOGS');
    console.log('==========================');
    const speedrunActionLogsCount = await prisma.speedrun_action_logs.count();
    console.log(`Total speedrun action logs: ${speedrunActionLogsCount}`);
    
    // Get action log types
    const actionLogTypes = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count 
      FROM speedrun_action_logs 
      GROUP BY type 
      ORDER BY count DESC
    `;
    
    console.log('Action log types:');
    actionLogTypes.forEach(type => {
      console.log(`  - ${type.type}: ${type.count} records`);
    });

    // 3. SPEEDRUN LEAD INTERACTIONS
    console.log('\n📋 3. SPEEDRUN LEAD INTERACTIONS');
    console.log('===============================');
    const leadInteractionsCount = await prisma.speedrun_lead_interactions.count();
    console.log(`Total lead interactions: ${leadInteractionsCount}`);
    
    // Get interaction types
    const interactionTypes = await prisma.$queryRaw`
      SELECT "interactionType", COUNT(*) as count 
      FROM speedrun_lead_interactions 
      GROUP BY "interactionType" 
      ORDER BY count DESC
    `;
    
    console.log('Interaction types:');
    interactionTypes.forEach(type => {
      console.log(`  - ${type.interactionType}: ${type.count} records`);
    });

    // 4. STRATEGIC ACTION OUTCOMES
    console.log('\n📋 4. STRATEGIC ACTION OUTCOMES');
    console.log('==============================');
    const strategicActionsCount = await prisma.strategic_action_outcomes.count();
    console.log(`Total strategic actions: ${strategicActionsCount}`);
    
    // Get strategic action types
    const strategicActionTypes = await prisma.$queryRaw`
      SELECT "actionType", COUNT(*) as count 
      FROM strategic_action_outcomes 
      GROUP BY "actionType" 
      ORDER BY count DESC
    `;
    
    console.log('Strategic action types:');
    strategicActionTypes.forEach(type => {
      console.log(`  - ${type.actionType}: ${type.count} records`);
    });

    // 5. PIPELINE RECORDS WITH ACTION FIELDS
    console.log('\n📋 5. PIPELINE RECORDS WITH ACTION FIELDS');
    console.log('==========================================');
    
    // Check leads with nextAction
    const leadsWithNextAction = await prisma.leads.count({
      where: { nextAction: { not: null } }
    });
    console.log(`Leads with nextAction: ${leadsWithNextAction}`);
    
    // Check prospects with nextAction
    const prospectsWithNextAction = await prisma.prospects.count({
      where: { nextAction: { not: null } }
    });
    console.log(`Prospects with nextAction: ${prospectsWithNextAction}`);
    
    // Check opportunities with nextActions
    const opportunitiesWithNextActions = await prisma.opportunities.count({
      where: { nextActions: { not: null } }
    });
    console.log(`Opportunities with nextActions: ${opportunitiesWithNextActions}`);

    // 6. CUSTOMERS WITH ACTION FIELDS
    console.log('\n📋 6. CUSTOMERS WITH ACTION FIELDS');
    console.log('==================================');
    
    const clientsWithNextBestAction = await prisma.clients.count({
      where: { nextBestAction: { not: null } }
    });
    console.log(`Customers with nextBestAction: ${clientsWithNextBestAction}`);

    // 7. SUMMARY AND RECOMMENDATIONS
    console.log('\n📋 7. TERMINOLOGY ANALYSIS SUMMARY');
    console.log('===================================');
    
    console.log('\n🔍 CURRENT TERMINOLOGY USAGE:');
    console.log('• ACTIVITIES: General task/action tracking (1,385 records)');
    console.log('• SPEEDRUN ACTION LOGS: Speedrun-specific actions (tracking user actions)');
    console.log('• SPEEDRUN LEAD INTERACTIONS: Lead-specific interactions');
    console.log('• STRATEGIC ACTION OUTCOMES: Strategic planning actions');
    console.log('• NEXT ACTION: Pipeline record fields (leads, prospects)');
    console.log('• NEXT ACTIONS: Opportunities (plural)');
    console.log('• NEXT BEST ACTION: Customers (marketing terminology)');
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. STANDARDIZE TERMINOLOGY:');
    console.log('   • Use "ACTIVITY" for all user-performed actions');
    console.log('   • Use "NEXT ACTION" consistently across all pipeline records');
    console.log('   • Use "ACTION LOG" for system-generated action tracking');
    
    console.log('\n2. CONSOLIDATE SIMILAR CONCEPTS:');
    console.log('   • Merge speedrun_action_logs into activities table');
    console.log('   • Merge speedrun_lead_interactions into activities table');
    console.log('   • Use consistent field names across all pipeline records');
    
    console.log('\n3. IMPLEMENT UNIFIED ACTION SYSTEM:');
    console.log('   • Single "activities" table for all action tracking');
    console.log('   • Consistent "nextAction" field across all pipeline records');
    console.log('   • Unified action types and statuses');
    
    console.log('\n4. FIELD STANDARDIZATION:');
    console.log('   • nextAction (singular) for all pipeline records');
    console.log('   • nextActionDate for scheduling');
    console.log('   • actionType for categorization');
    console.log('   • actionStatus for tracking completion');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

analyzeActionTerminology()
  .then(() => {
    console.log('\n✅ Action terminology analysis completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Analysis failed:', error);
    process.exit(1);
  });
