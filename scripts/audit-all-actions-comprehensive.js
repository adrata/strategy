const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveActionAudit() {
  console.log('🔍 COMPREHENSIVE ACTION MODEL AUDIT');
  console.log('====================================');
  
  // 1. ACTIONS TABLE ANALYSIS
  console.log('\n📊 ACTIONS TABLE ANALYSIS:');
  const actionCount = await prisma.actions.count();
  console.log(`  Total Actions: ${actionCount}`);
  
  const actionsWithPeople = await prisma.actions.count({ where: { personId: { not: null } } });
  const actionsWithCompanies = await prisma.actions.count({ where: { companyId: { not: null } } });
  const actionsWithLeads = await prisma.actions.count({ where: { leadId: { not: null } } });
  const actionsWithOpportunities = await prisma.actions.count({ where: { opportunityId: { not: null } } });
  const actionsWithProspects = await prisma.actions.count({ where: { prospectId: { not: null } } });
  
  console.log(`  - With People: ${actionsWithPeople}`);
  console.log(`  - With Companies: ${actionsWithCompanies}`);
  console.log(`  - With Leads: ${actionsWithLeads}`);
  console.log(`  - With Opportunities: ${actionsWithOpportunities}`);
  console.log(`  - With Prospects: ${actionsWithProspects}`);
  
  // Check orphaned actions
  const orphanedActions = await prisma.actions.count({
    where: {
      personId: null,
      companyId: null,
      leadId: null,
      opportunityId: null,
      prospectId: null
    }
  });
  console.log(`  - Orphaned Actions: ${orphanedActions}`);
  
  // 2. EMAIL MESSAGES ANALYSIS
  console.log('\n📧 EMAIL MESSAGES ANALYSIS:');
  const emailCount = await prisma.email_messages.count();
  console.log(`  Total Email Messages: ${emailCount}`);
  
  // Check email accounts
  const emailAccounts = await prisma.email_accounts.findMany({
    select: { id: true, workspaceId: true, email: true }
  });
  console.log(`  Email Accounts: ${emailAccounts.length}`);
  emailAccounts.forEach(account => {
    console.log(`    - ${account.email} (workspace: ${account.workspaceId})`);
  });
  
  // 3. NOTES ANALYSIS
  console.log('\n📝 NOTES ANALYSIS:');
  const noteCount = await prisma.notes.count();
  console.log(`  Total Notes: ${noteCount}`);
  
  const notesWithPeople = await prisma.notes.count({ where: { personId: { not: null } } });
  const notesWithCompanies = await prisma.notes.count({ where: { companyId: { not: null } } });
  const notesWithLeads = await prisma.notes.count({ where: { leadId: { not: null } } });
  const notesWithOpportunities = await prisma.notes.count({ where: { opportunityId: { not: null } } });
  const notesWithProspects = await prisma.notes.count({ where: { prospectId: { not: null } } });
  
  console.log(`  - With People: ${notesWithPeople}`);
  console.log(`  - With Companies: ${notesWithCompanies}`);
  console.log(`  - With Leads: ${notesWithLeads}`);
  console.log(`  - With Opportunities: ${notesWithOpportunities}`);
  console.log(`  - With Prospects: ${notesWithProspects}`);
  
  // 4. CORE ENTITIES ANALYSIS
  console.log('\n🏢 CORE ENTITIES ANALYSIS:');
  const peopleCount = await prisma.people.count();
  const companiesCount = await prisma.companies.count();
  const leadsCount = await prisma.leads.count();
  const opportunitiesCount = await prisma.opportunities.count();
  const prospectsCount = await prisma.prospects.count();
  
  console.log(`  People: ${peopleCount}`);
  console.log(`  Companies: ${companiesCount}`);
  console.log(`  Leads: ${leadsCount}`);
  console.log(`  Opportunities: ${opportunitiesCount}`);
  console.log(`  Prospects: ${prospectsCount}`);
  
  // 5. ACTION TYPES ANALYSIS
  console.log('\n🏷️ ACTION TYPES ANALYSIS:');
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  actionTypes.forEach(type => {
    console.log(`  ${type.type}: ${type._count.type}`);
  });
  
  // 6. CHECK FOR MISSING ACTION TYPES
  console.log('\n🔍 MISSING ACTION TYPES ANALYSIS:');
  
  // Check for calls (should be in actions or separate table)
  const callActions = await prisma.actions.count({ where: { type: { contains: 'call' } } });
  console.log(`  Call Actions: ${callActions}`);
  
  // Check for LinkedIn activities
  const linkedinActions = await prisma.actions.count({ where: { type: { contains: 'linkedin' } } });
  console.log(`  LinkedIn Actions: ${linkedinActions}`);
  
  // Check for meetings
  const meetingActions = await prisma.actions.count({ where: { type: { contains: 'meeting' } } });
  console.log(`  Meeting Actions: ${meetingActions}`);
  
  // Check for emails in actions
  const emailActions = await prisma.actions.count({ where: { type: { contains: 'email' } } });
  console.log(`  Email Actions: ${emailActions}`);
  
  // 7. CHECK FOR SEPARATE TABLES THAT SHOULD BE ACTIONS
  console.log('\n🔍 CHECKING FOR SEPARATE ACTION TABLES:');
  
  // Check if there are separate call/meeting tables
  try {
    const callCount = await prisma.calls?.count() || 0;
    console.log(`  Calls Table: ${callCount} records`);
  } catch (e) {
    console.log(`  Calls Table: Not found`);
  }
  
  try {
    const meetingCount = await prisma.meetings?.count() || 0;
    console.log(`  Meetings Table: ${meetingCount} records`);
  } catch (e) {
    console.log(`  Meetings Table: Not found`);
  }
  
  try {
    const linkedinCount = await prisma.linkedin_activities?.count() || 0;
    console.log(`  LinkedIn Activities Table: ${linkedinCount} records`);
  } catch (e) {
    console.log(`  LinkedIn Activities Table: Not found`);
  }
  
  // 8. CHECK LAST/NEXT ACTION FIELDS
  console.log('\n🔄 LAST/NEXT ACTION FIELDS ANALYSIS:');
  
  const peopleWithLastAction = await prisma.people.count({ where: { lastAction: { not: null } } });
  const peopleWithNextAction = await prisma.people.count({ where: { nextAction: { not: null } } });
  console.log(`  People with lastAction: ${peopleWithLastAction}/${peopleCount}`);
  console.log(`  People with nextAction: ${peopleWithNextAction}/${peopleCount}`);
  
  const companiesWithLastAction = await prisma.companies.count({ where: { lastAction: { not: null } } });
  const companiesWithNextAction = await prisma.companies.count({ where: { nextAction: { not: null } } });
  console.log(`  Companies with lastAction: ${companiesWithLastAction}/${companiesCount}`);
  console.log(`  Companies with nextAction: ${companiesWithNextAction}/${companiesCount}`);
  
  const leadsWithLastAction = await prisma.leads.count({ where: { lastAction: { not: null } } });
  const leadsWithNextAction = await prisma.leads.count({ where: { nextAction: { not: null } } });
  console.log(`  Leads with lastAction: ${leadsWithLastAction}/${leadsCount}`);
  console.log(`  Leads with nextAction: ${leadsWithNextAction}/${leadsCount}`);
  
  await prisma.$disconnect();
}

comprehensiveActionAudit().catch(console.error);
