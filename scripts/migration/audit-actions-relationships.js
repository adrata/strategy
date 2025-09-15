const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditActionsRelationships() {
  console.log('🔍 AUDITING ACTIONS RELATIONSHIPS');
  console.log('==================================');
  console.log('Checking all action-related data and relationships...\n');

  let stats = {
    totalActions: 0,
    actionsWithPersonId: 0,
    actionsWithCompanyId: 0,
    actionsWithLeadId: 0,
    actionsWithOpportunityId: 0,
    actionsWithProspectId: 0,
    orphanedActions: 0,
    emailMessages: 0,
    notes: 0,
    webhookSubscriptions: 0,
    issues: []
  };

  try {
    // STEP 1: Audit the actions table structure
    console.log('📋 STEP 1: ACTIONS TABLE AUDIT');
    console.log('===============================');
    
    const totalActions = await prisma.actions.count();
    stats.totalActions = totalActions;
    console.log(`Total actions: ${totalActions}`);

    // Check actions with different relationship types
    const actionsWithPersonId = await prisma.actions.count({
      where: { personId: { not: null } }
    });
    stats.actionsWithPersonId = actionsWithPersonId;
    console.log(`Actions linked to people: ${actionsWithPersonId}`);

    const actionsWithCompanyId = await prisma.actions.count({
      where: { companyId: { not: null } }
    });
    stats.actionsWithCompanyId = actionsWithCompanyId;
    console.log(`Actions linked to companies: ${actionsWithCompanyId}`);

    const actionsWithLeadId = await prisma.actions.count({
      where: { leadId: { not: null } }
    });
    stats.actionsWithLeadId = actionsWithLeadId;
    console.log(`Actions linked to leads: ${actionsWithLeadId}`);

    const actionsWithOpportunityId = await prisma.actions.count({
      where: { opportunityId: { not: null } }
    });
    stats.actionsWithOpportunityId = actionsWithOpportunityId;
    console.log(`Actions linked to opportunities: ${actionsWithOpportunityId}`);

    const actionsWithProspectId = await prisma.actions.count({
      where: { prospectId: { not: null } }
    });
    stats.actionsWithProspectId = actionsWithProspectId;
    console.log(`Actions linked to prospects: ${actionsWithProspectId}`);

    // Check for orphaned actions (no relationships)
    const orphanedActions = await prisma.actions.count({
      where: {
        AND: [
          { personId: null },
          { companyId: null },
          { leadId: null },
          { opportunityId: null },
          { prospectId: null }
        ]
      }
    });
    stats.orphanedActions = orphanedActions;
    console.log(`Orphaned actions (no relationships): ${orphanedActions}`);

    // STEP 2: Check action types and statuses
    console.log('\n📋 STEP 2: ACTION TYPES & STATUSES');
    console.log('===================================');
    
    const actionTypes = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM actions
      GROUP BY type
      ORDER BY count DESC
    `;
    console.log('Action types:');
    actionTypes.forEach(type => {
      console.log(`  - ${type.type}: ${type.count} records`);
    });

    const actionStatuses = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM actions
      GROUP BY status
      ORDER BY count DESC
    `;
    console.log('\nAction statuses:');
    actionStatuses.forEach(status => {
      console.log(`  - ${status.status}: ${status.count} records`);
    });

    // STEP 3: Audit email_messages table
    console.log('\n📋 STEP 3: EMAIL MESSAGES AUDIT');
    console.log('===============================');
    
    const emailMessages = await prisma.email_messages.count();
    stats.emailMessages = emailMessages;
    console.log(`Total email messages: ${emailMessages}`);

    // Check if email_messages are properly linked to actions
    const emailsWithActions = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      INNER JOIN actions a ON em.id = a.id
    `;
    console.log(`Email messages linked to actions: ${emailsWithActions[0].count}`);

    // Check email_messages relationships (only has companyId)
    const emailsWithCompanyId = await prisma.email_messages.count({
      where: { companyId: { not: null } }
    });
    console.log(`Email messages with companyId: ${emailsWithCompanyId}`);

    // STEP 4: Audit notes table
    console.log('\n📋 STEP 4: NOTES AUDIT');
    console.log('======================');
    
    const notes = await prisma.notes.count();
    stats.notes = notes;
    console.log(`Total notes: ${notes}`);

    // Check if notes are properly linked to actions
    const notesWithActions = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM notes n
      INNER JOIN actions a ON n.id = a.id
    `;
    console.log(`Notes linked to actions: ${notesWithActions[0].count}`);

    // Check notes relationships
    const notesWithPersonId = await prisma.notes.count({
      where: { personId: { not: null } }
    });
    console.log(`Notes with personId: ${notesWithPersonId}`);

    const notesWithCompanyId = await prisma.notes.count({
      where: { companyId: { not: null } }
    });
    console.log(`Notes with companyId: ${notesWithCompanyId}`);

    // STEP 5: Check for potential action data in other tables
    console.log('\n📋 STEP 5: OTHER ACTION-RELATED TABLES');
    console.log('======================================');
    
    // Check webhook_subscriptions
    const webhookSubscriptions = await prisma.webhook_subscriptions.count();
    stats.webhookSubscriptions = webhookSubscriptions;
    console.log(`Webhook subscriptions: ${webhookSubscriptions}`);

    // Check if there are any remaining deprecated action tables
    console.log('\n📋 STEP 6: DEPRECATED TABLES CHECK');
    console.log('===================================');
    
    try {
      const speedrunActionLogs = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM speedrun_action_logs
      `;
      console.log(`❌ speedrun_action_logs still exists: ${speedrunActionLogs[0].count} records`);
      stats.issues.push('speedrun_action_logs table still exists');
    } catch (error) {
      console.log('✅ speedrun_action_logs table removed');
    }

    try {
      const leadInteractions = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM speedrun_lead_interactions
      `;
      console.log(`❌ speedrun_lead_interactions still exists: ${leadInteractions[0].count} records`);
      stats.issues.push('speedrun_lead_interactions table still exists');
    } catch (error) {
      console.log('✅ speedrun_lead_interactions table removed');
    }

    try {
      const strategicActions = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM strategic_action_outcomes
      `;
      console.log(`❌ strategic_action_outcomes still exists: ${strategicActions[0].count} records`);
      stats.issues.push('strategic_action_outcomes table still exists');
    } catch (error) {
      console.log('✅ strategic_action_outcomes table removed');
    }

    // STEP 7: Check data consistency
    console.log('\n📋 STEP 7: DATA CONSISTENCY CHECK');
    console.log('=================================');
    
    // Check if people with actions have the action fields populated
    const peopleWithActions = await prisma.people.count({
      where: {
        OR: [
          { lastAction: { not: null } },
          { nextAction: { not: null } }
        ]
      }
    });
    console.log(`People with action fields populated: ${peopleWithActions}`);

    // Check if companies with actions have the action fields populated
    const companiesWithActions = await prisma.companies.count({
      where: {
        OR: [
          { lastAction: { not: null } },
          { nextAction: { not: null } }
        ]
      }
    });
    console.log(`Companies with action fields populated: ${companiesWithActions}`);

    // Check for actions that should be linked to people but aren't
    const actionsWithPersonButNoPersonRecord = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM actions a
      LEFT JOIN people p ON a."personId" = p.id
      WHERE a."personId" IS NOT NULL AND p.id IS NULL
    `;
    console.log(`Actions with personId but no person record: ${actionsWithPersonButNoPersonRecord[0].count}`);

    // Check for actions that should be linked to companies but aren't
    const actionsWithCompanyButNoCompanyRecord = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM actions a
      LEFT JOIN companies c ON a."companyId" = c.id
      WHERE a."companyId" IS NOT NULL AND c.id IS NULL
    `;
    console.log(`Actions with companyId but no company record: ${actionsWithCompanyButNoCompanyRecord[0].count}`);

    // STEP 8: Sample data inspection
    console.log('\n📋 STEP 8: SAMPLE DATA INSPECTION');
    console.log('=================================');
    
    // Show sample actions with their relationships
    const sampleActions = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.type,
        a.subject,
        a.status,
        a."personId",
        a."companyId",
        a."leadId",
        a."opportunityId",
        a."prospectId",
        p."fullName" as person_name,
        c.name as company_name
      FROM actions a
      LEFT JOIN people p ON a."personId" = p.id
      LEFT JOIN companies c ON a."companyId" = c.id
      WHERE a."personId" IS NOT NULL OR a."companyId" IS NOT NULL
      LIMIT 5
    `;
    
    console.log('Sample actions with relationships:');
    sampleActions.forEach(action => {
      console.log(`  - ${action.type}: "${action.subject}" (${action.status})`);
      if (action.person_name) console.log(`    Person: ${action.person_name}`);
      if (action.company_name) console.log(`    Company: ${action.company_name}`);
    });

    // STEP 9: Summary and recommendations
    console.log('\n📋 AUDIT SUMMARY & RECOMMENDATIONS');
    console.log('===================================');
    
    console.log(`Total actions: ${stats.totalActions}`);
    console.log(`Actions with personId: ${stats.actionsWithPersonId}`);
    console.log(`Actions with companyId: ${stats.actionsWithCompanyId}`);
    console.log(`Actions with leadId: ${stats.actionsWithLeadId}`);
    console.log(`Actions with opportunityId: ${stats.actionsWithOpportunityId}`);
    console.log(`Actions with prospectId: ${stats.actionsWithProspectId}`);
    console.log(`Orphaned actions: ${stats.orphanedActions}`);
    console.log(`Email messages: ${stats.emailMessages}`);
    console.log(`Notes: ${stats.notes}`);
    console.log(`Webhook subscriptions: ${stats.webhookSubscriptions}`);
    
    if (stats.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      stats.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    } else {
      console.log('\n✅ No major issues found!');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (stats.orphanedActions > 0) {
      console.log(`  - Review ${stats.orphanedActions} orphaned actions and link them to appropriate records`);
    }
    if (stats.issues.length > 0) {
      console.log('  - Remove deprecated action tables');
    }
    console.log('  - Ensure all new actions are created with proper relationships');
    console.log('  - Consider adding indexes on action relationship fields for performance');

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

auditActionsRelationships()
  .then(() => {
    console.log('\n✅ Actions relationships audit completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Audit failed:', error);
    process.exit(1);
  });
