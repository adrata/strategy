#!/usr/bin/env node

/**
 * COMPREHENSIVE ACTION SYSTEM AUDIT
 * 
 * This script performs a complete audit of all action types and their connections
 * to ensure the action system is properly integrated across all data sources.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveActionSystemAudit() {
  console.log('🔍 COMPREHENSIVE ACTION SYSTEM AUDIT');
  console.log('=====================================\n');

  try {
    // 1. AUDIT ALL ACTION TYPES IN ACTIONS TABLE
    await auditActionsTable();
    
    // 2. AUDIT EMAIL MESSAGES AND THEIR ACTION CONNECTIONS
    await auditEmailMessages();
    
    // 3. AUDIT NOTES AND THEIR ACTION CONNECTIONS
    await auditNotes();
    
    // 4. AUDIT CALLS AND THEIR ACTION CONNECTIONS
    await auditCalls();
    
    // 5. AUDIT LINKEDIN ACTIVITIES AND THEIR ACTION CONNECTIONS
    await auditLinkedInActivities();
    
    // 6. AUDIT MEETINGS AND THEIR ACTION CONNECTIONS
    await auditMeetings();
    
    // 7. AUDIT CRUD OPERATIONS (CREATE/UPDATE/DELETE)
    await auditCrudOperations();
    
    // 8. AUDIT PERSON/COMPANY RELATIONSHIPS
    await auditPersonCompanyRelationships();
    
    // 9. AUDIT ACTION INHERITANCE MODEL
    await auditActionInheritance();
    
    // 10. AUDIT LAST/NEXT ACTION FIELDS
    await auditLastNextActionFields();
    
    // 11. FINAL SUMMARY AND RECOMMENDATIONS
    await generateFinalSummary();

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function auditActionsTable() {
  console.log('📊 ACTIONS TABLE COMPREHENSIVE ANALYSIS:');
  console.log('=========================================');
  
  // Get total actions
  const totalActions = await prisma.actions.count();
  console.log(`  Total Actions: ${totalActions}`);
  
  // Get action types breakdown
  const actionTypes = await prisma.actions.groupBy({
    by: ['type'],
    _count: { type: true },
    orderBy: { _count: { type: 'desc' } }
  });
  
  console.log('\n  📋 Action Types Breakdown:');
  actionTypes.forEach(type => {
    console.log(`    ${type.type}: ${type._count.type}`);
  });
  
  // Get connection breakdown
  const connections = await prisma.actions.groupBy({
    by: ['personId', 'companyId', 'leadId', 'opportunityId', 'prospectId'],
    _count: true
  });
  
  let withPerson = 0, withCompany = 0, withLead = 0, withOpportunity = 0, withProspect = 0, orphaned = 0;
  
  connections.forEach(conn => {
    if (conn.personId) withPerson++;
    if (conn.companyId) withCompany++;
    if (conn.leadId) withLead++;
    if (conn.opportunityId) withOpportunity++;
    if (conn.prospectId) withProspect++;
    if (!conn.personId && !conn.companyId && !conn.leadId && !conn.opportunityId && !conn.prospectId) {
      orphaned++;
    }
  });
  
  console.log('\n  🔗 Connection Analysis:');
  console.log(`    With People: ${withPerson}`);
  console.log(`    With Companies: ${withCompany}`);
  console.log(`    With Leads: ${withLead}`);
  console.log(`    With Opportunities: ${withOpportunity}`);
  console.log(`    With Prospects: ${withProspect}`);
  console.log(`    Orphaned Actions: ${orphaned}`);
  
  // Get workspace breakdown
  const workspaceBreakdown = await prisma.actions.groupBy({
    by: ['workspaceId'],
    _count: { workspaceId: true }
  });
  
  console.log('\n  🏢 Workspace Breakdown:');
  workspaceBreakdown.forEach(ws => {
    console.log(`    ${ws.workspaceId}: ${ws._count.workspaceId} actions`);
  });
  
  console.log('');
}

async function auditEmailMessages() {
  console.log('📧 EMAIL MESSAGES AUDIT:');
  console.log('========================');
  
  // Get total email messages
  const totalEmails = await prisma.email_messages.count();
  console.log(`  Total Email Messages: ${totalEmails}`);
  
  // Get email accounts
  const emailAccounts = await prisma.email_accounts.findMany({
    select: {
      id: true,
      email: true,
      workspaceId: true
    }
  });
  
  console.log(`  Email Accounts: ${emailAccounts.length}`);
  emailAccounts.forEach(account => {
    console.log(`    - ${account.email} (workspace: ${account.workspaceId})`);
  });
  
  // Check for email actions
  const emailActions = await prisma.actions.findMany({
    where: {
      OR: [
        { type: 'email' },
        { type: 'email_sent' },
        { type: 'email_conversation' },
        { externalId: { contains: 'email' } }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      externalId: true,
      personId: true,
      companyId: true
    },
    take: 10
  });
  
  console.log(`\n  📨 Email Actions Found: ${emailActions.length}`);
  emailActions.forEach(action => {
    console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
  });
  
  // Check for unlinked emails
  const unlinkedEmails = await prisma.email_messages.findMany({
    where: {
      NOT: {
        id: {
          in: await prisma.actions.findMany({
            where: { externalId: { contains: 'email' } },
            select: { externalId: true }
          }).then(actions => actions.map(a => a.externalId?.replace('email_', '')).filter(Boolean))
        }
      }
    },
    take: 5
  });
  
  console.log(`\n  🔗 Unlinked Emails: ${unlinkedEmails.length} (showing first 5)`);
  unlinkedEmails.forEach(email => {
    console.log(`    - ${email.subject} (${email.fromEmail} -> ${email.toEmail})`);
  });
  
  console.log('');
}

async function auditNotes() {
  console.log('📝 NOTES AUDIT:');
  console.log('===============');
  
  // Get total notes
  const totalNotes = await prisma.notes.count();
  console.log(`  Total Notes: ${totalNotes}`);
  
  // Get notes with relationships
  const notesWithRelations = await prisma.notes.groupBy({
    by: ['personId', 'companyId', 'leadId', 'opportunityId', 'prospectId'],
    _count: true
  });
  
  let withPerson = 0, withCompany = 0, withLead = 0, withOpportunity = 0, withProspect = 0, orphaned = 0;
  
  notesWithRelations.forEach(note => {
    if (note.personId) withPerson++;
    if (note.companyId) withCompany++;
    if (note.leadId) withLead++;
    if (note.opportunityId) withOpportunity++;
    if (note.prospectId) withProspect++;
    if (!note.personId && !note.companyId && !note.leadId && !note.opportunityId && !note.prospectId) {
      orphaned++;
    }
  });
  
  console.log('\n  🔗 Notes Relationship Analysis:');
  console.log(`    With People: ${withPerson}`);
  console.log(`    With Companies: ${withCompany}`);
  console.log(`    With Leads: ${withLead}`);
  console.log(`    With Opportunities: ${withOpportunity}`);
  console.log(`    With Prospects: ${withProspect}`);
  console.log(`    Orphaned Notes: ${orphaned}`);
  
  // Check for note actions
  const noteActions = await prisma.actions.findMany({
    where: {
      OR: [
        { type: 'note_added' },
        { externalId: { contains: 'note' } }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      externalId: true,
      personId: true,
      companyId: true
    },
    take: 10
  });
  
  console.log(`\n  📝 Note Actions Found: ${noteActions.length}`);
  noteActions.forEach(action => {
    console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
  });
  
  console.log('');
}

async function auditCalls() {
  console.log('📞 CALLS AUDIT:');
  console.log('===============');
  
  // Check for call actions
  const callActions = await prisma.actions.findMany({
    where: {
      OR: [
        { type: 'phone_call' },
        { type: 'call' },
        { externalId: { contains: 'call' } }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      description: true,
      personId: true,
      companyId: true,
      outcome: true
    },
    take: 10
  });
  
  console.log(`  📞 Call Actions Found: ${callActions.length}`);
  callActions.forEach(action => {
    console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
    if (action.outcome) {
      console.log(`      Outcome: ${action.outcome}`);
    }
  });
  
  // Check for separate calls table
  const callsTable = await prisma.calls.count().catch(() => 0);
  console.log(`\n  📋 Separate Calls Table: ${callsTable} records`);
  
  console.log('');
}

async function auditLinkedInActivities() {
  console.log('💼 LINKEDIN ACTIVITIES AUDIT:');
  console.log('=============================');
  
  // Check for LinkedIn actions
  const linkedinActions = await prisma.actions.findMany({
    where: {
      OR: [
        { type: 'linkedin_connection_request' },
        { type: 'linkedin_inmail' },
        { type: 'linkedin_message' },
        { externalId: { contains: 'linkedin' } }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      personId: true,
      companyId: true,
      outcome: true
    },
    take: 10
  });
  
  console.log(`  💼 LinkedIn Actions Found: ${linkedinActions.length}`);
  linkedinActions.forEach(action => {
    console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
    if (action.outcome) {
      console.log(`      Outcome: ${action.outcome}`);
    }
  });
  
  // Check for separate LinkedIn activities table
  const linkedinTable = await prisma.linkedin_activities.count().catch(() => 0);
  console.log(`\n  📋 Separate LinkedIn Activities Table: ${linkedinTable} records`);
  
  console.log('');
}

async function auditMeetings() {
  console.log('🤝 MEETINGS AUDIT:');
  console.log('==================');
  
  // Check for meeting actions
  const meetingActions = await prisma.actions.findMany({
    where: {
      OR: [
        { type: 'meeting' },
        { type: 'demo' },
        { type: 'presentation' },
        { externalId: { contains: 'meeting' } }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      personId: true,
      companyId: true,
      scheduledAt: true,
      completedAt: true
    },
    take: 10
  });
  
  console.log(`  🤝 Meeting Actions Found: ${meetingActions.length}`);
  meetingActions.forEach(action => {
    console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
    if (action.scheduledAt) {
      console.log(`      Scheduled: ${action.scheduledAt}`);
    }
  });
  
  // Check for separate meetings table
  const meetingsTable = await prisma.meetings.count().catch(() => 0);
  console.log(`\n  📋 Separate Meetings Table: ${meetingsTable} records`);
  
  console.log('');
}

async function auditCrudOperations() {
  console.log('🔄 CRUD OPERATIONS AUDIT:');
  console.log('=========================');
  
  // Check for CRUD actions
  const crudActions = await prisma.actions.findMany({
    where: {
      OR: [
        { type: 'person_created' },
        { type: 'company_created' },
        { type: 'lead_created' },
        { type: 'opportunity_created' },
        { type: 'prospect_created' },
        { type: 'record_created' }
      ]
    },
    select: {
      id: true,
      type: true,
      subject: true,
      personId: true,
      companyId: true,
      leadId: true,
      opportunityId: true,
      prospectId: true
    },
    take: 10
  });
  
  console.log(`  🔄 CRUD Actions Found: ${crudActions.length}`);
  crudActions.forEach(action => {
    console.log(`    - ${action.type}: ${action.subject}`);
    if (action.personId) console.log(`      PersonId: ${action.personId}`);
    if (action.companyId) console.log(`      CompanyId: ${action.companyId}`);
    if (action.leadId) console.log(`      LeadId: ${action.leadId}`);
    if (action.opportunityId) console.log(`      OpportunityId: ${action.opportunityId}`);
    if (action.prospectId) console.log(`      ProspectId: ${action.prospectId}`);
  });
  
  console.log('');
}

async function auditPersonCompanyRelationships() {
  console.log('👥 PERSON/COMPANY RELATIONSHIPS AUDIT:');
  console.log('======================================');
  
  // Get total people and companies
  const totalPeople = await prisma.people.count();
  const totalCompanies = await prisma.companies.count();
  
  console.log(`  Total People: ${totalPeople}`);
  console.log(`  Total Companies: ${totalCompanies}`);
  
  // Get people with company relationships
  const peopleWithCompanies = await prisma.people.count({
    where: { companyId: { not: null } }
  });
  
  console.log(`  People with Company Relationships: ${peopleWithCompanies}`);
  
  // Get companies with people
  const companiesWithPeople = await prisma.companies.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { people: true }
      }
    },
    where: {
      people: {
        some: {}
      }
    },
    take: 10
  });
  
  console.log(`\n  🏢 Companies with People (showing first 10):`);
  companiesWithPeople.forEach(company => {
    console.log(`    - ${company.name}: ${company._count.people} people`);
  });
  
  // Check for orphaned people (no company relationship)
  const orphanedPeople = await prisma.people.count({
    where: { companyId: null }
  });
  
  console.log(`\n  👤 Orphaned People (no company): ${orphanedPeople}`);
  
  console.log('');
}

async function auditActionInheritance() {
  console.log('🔄 ACTION INHERITANCE MODEL AUDIT:');
  console.log('==================================');
  
  // Check leads with person/company relationships
  const leadsWithRelations = await prisma.leads.findMany({
    where: {
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    },
    select: {
      id: true,
      personId: true,
      companyId: true,
      _count: {
        select: { actions: true }
      }
    },
    take: 10
  });
  
  console.log(`  🎯 Leads with Person/Company Relationships: ${leadsWithRelations.length}`);
  leadsWithRelations.forEach(lead => {
    console.log(`    - Lead ${lead.id}: PersonId: ${lead.personId}, CompanyId: ${lead.companyId}, Actions: ${lead._count.actions}`);
  });
  
  // Check prospects with person/company relationships
  const prospectsWithRelations = await prisma.prospects.findMany({
    where: {
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    },
    select: {
      id: true,
      personId: true,
      companyId: true,
      _count: {
        select: { actions: true }
      }
    },
    take: 10
  });
  
  console.log(`\n  🎯 Prospects with Person/Company Relationships: ${prospectsWithRelations.length}`);
  prospectsWithRelations.forEach(prospect => {
    console.log(`    - Prospect ${prospect.id}: PersonId: ${prospect.personId}, CompanyId: ${prospect.companyId}, Actions: ${prospect._count.actions}`);
  });
  
  // Check opportunities with person/company relationships
  const opportunitiesWithRelations = await prisma.opportunities.findMany({
    where: {
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    },
    select: {
      id: true,
      personId: true,
      companyId: true,
      _count: {
        select: { actions: true }
      }
    },
    take: 10
  });
  
  console.log(`\n  🎯 Opportunities with Person/Company Relationships: ${opportunitiesWithRelations.length}`);
  opportunitiesWithRelations.forEach(opportunity => {
    console.log(`    - Opportunity ${opportunity.id}: PersonId: ${opportunity.personId}, CompanyId: ${opportunity.companyId}, Actions: ${opportunity._count.actions}`);
  });
  
  console.log('');
}

async function auditLastNextActionFields() {
  console.log('🔄 LAST/NEXT ACTION FIELDS AUDIT:');
  console.log('=================================');
  
  // Check people with lastAction/nextAction
  const peopleStats = await prisma.people.groupBy({
    by: ['lastAction', 'nextAction'],
    _count: true,
    where: {
      OR: [
        { lastAction: { not: null } },
        { nextAction: { not: null } }
      ]
    }
  });
  
  const peopleWithLastAction = await prisma.people.count({
    where: { lastAction: { not: null } }
  });
  
  const peopleWithNextAction = await prisma.people.count({
    where: { nextAction: { not: null } }
  });
  
  const peopleWithNextActionReasoning = await prisma.people.count({
    where: { nextActionReasoning: { not: null } }
  });
  
  console.log(`  👤 People Action Fields:`);
  console.log(`    With lastAction: ${peopleWithLastAction}`);
  console.log(`    With nextAction: ${peopleWithNextAction}`);
  console.log(`    With nextActionReasoning: ${peopleWithNextActionReasoning}`);
  
  // Check companies with lastAction/nextAction
  const companiesWithLastAction = await prisma.companies.count({
    where: { lastAction: { not: null } }
  });
  
  const companiesWithNextAction = await prisma.companies.count({
    where: { nextAction: { not: null } }
  });
  
  const companiesWithNextActionReasoning = await prisma.companies.count({
    where: { nextActionReasoning: { not: null } }
  });
  
  console.log(`\n  🏢 Companies Action Fields:`);
  console.log(`    With lastAction: ${companiesWithLastAction}`);
  console.log(`    With nextAction: ${companiesWithNextAction}`);
  console.log(`    With nextActionReasoning: ${companiesWithNextActionReasoning}`);
  
  // Sample some intelligent nextActions
  const sampleIntelligentActions = await prisma.people.findMany({
    where: {
      nextActionReasoning: { not: null }
    },
    select: {
      fullName: true,
      lastAction: true,
      lastActionDate: true,
      nextAction: true,
      nextActionDate: true,
      nextActionReasoning: true,
      nextActionPriority: true,
      nextActionType: true
    },
    take: 5
  });
  
  console.log(`\n  🧠 Sample Intelligent NextActions:`);
  sampleIntelligentActions.forEach(person => {
    console.log(`    ${person.fullName}:`);
    console.log(`      Last: ${person.lastAction} (${person.lastActionDate})`);
    console.log(`      Next: ${person.nextAction} (${person.nextActionDate})`);
    console.log(`      Reasoning: ${person.nextActionReasoning}`);
    console.log(`      Priority: ${person.nextActionPriority}, Type: ${person.nextActionType}`);
  });
  
  console.log('');
}

async function generateFinalSummary() {
  console.log('📊 FINAL AUDIT SUMMARY:');
  console.log('=======================');
  
  // Get final counts
  const totalActions = await prisma.actions.count();
  const totalPeople = await prisma.people.count();
  const totalCompanies = await prisma.companies.count();
  const totalLeads = await prisma.leads.count();
  const totalOpportunities = await prisma.opportunities.count();
  const totalProspects = await prisma.prospects.count();
  
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
  
  const peopleWithLastAction = await prisma.people.count({
    where: { lastAction: { not: null } }
  });
  
  const peopleWithNextAction = await prisma.people.count({
    where: { nextAction: { not: null } }
  });
  
  const companiesWithLastAction = await prisma.companies.count({
    where: { lastAction: { not: null } }
  });
  
  const companiesWithNextAction = await prisma.companies.count({
    where: { nextAction: { not: null } }
  });
  
  console.log(`  📈 Core Metrics:`);
  console.log(`    Total Actions: ${totalActions}`);
  console.log(`    Total People: ${totalPeople}`);
  console.log(`    Total Companies: ${totalCompanies}`);
  console.log(`    Total Leads: ${totalLeads}`);
  console.log(`    Total Opportunities: ${totalOpportunities}`);
  console.log(`    Total Prospects: ${totalProspects}`);
  
  console.log(`\n  🔗 Connection Health:`);
  console.log(`    Orphaned Actions: ${orphanedActions} (${((orphanedActions / totalActions) * 100).toFixed(1)}%)`);
  
  console.log(`\n  🎯 Action Field Completion:`);
  console.log(`    People with lastAction: ${peopleWithLastAction}/${totalPeople} (${((peopleWithLastAction / totalPeople) * 100).toFixed(1)}%)`);
  console.log(`    People with nextAction: ${peopleWithNextAction}/${totalPeople} (${((peopleWithNextAction / totalPeople) * 100).toFixed(1)}%)`);
  console.log(`    Companies with lastAction: ${companiesWithLastAction}/${totalCompanies} (${((companiesWithLastAction / totalCompanies) * 100).toFixed(1)}%)`);
  console.log(`    Companies with nextAction: ${companiesWithNextAction}/${totalCompanies} (${((companiesWithNextAction / totalCompanies) * 100).toFixed(1)}%)`);
  
  // Calculate overall health score
  const connectionScore = Math.max(0, 100 - ((orphanedActions / totalActions) * 100));
  const peopleLastActionScore = (peopleWithLastAction / totalPeople) * 100;
  const peopleNextActionScore = (peopleWithNextAction / totalPeople) * 100;
  const companiesLastActionScore = (companiesWithLastAction / totalCompanies) * 100;
  const companiesNextActionScore = (companiesWithNextAction / totalCompanies) * 100;
  
  const overallScore = (connectionScore + peopleLastActionScore + peopleNextActionScore + companiesLastActionScore + companiesNextActionScore) / 5;
  
  console.log(`\n  🎯 OVERALL ACTION SYSTEM HEALTH: ${overallScore.toFixed(1)}/100`);
  
  if (overallScore >= 90) {
    console.log('  ✅ EXCELLENT! Action system is highly optimized');
  } else if (overallScore >= 75) {
    console.log('  ✅ GOOD! Action system is well connected');
  } else if (overallScore >= 50) {
    console.log('  ⚠️  FAIR! Action system needs improvement');
  } else {
    console.log('  ❌ POOR! Action system needs significant work');
  }
  
  console.log('\n🎉 COMPREHENSIVE ACTION SYSTEM AUDIT COMPLETE!');
}

// Run the audit
comprehensiveActionSystemAudit().catch(console.error);
