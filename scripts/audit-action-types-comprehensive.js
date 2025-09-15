const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditActionTypesComprehensive() {
  console.log('🔍 COMPREHENSIVE ACTION TYPES AUDIT');
  console.log('===================================');
  
  const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
  
  try {
    // 1. AUDIT ALL ACTION TYPES
    console.log('\n📊 ALL ACTION TYPES ANALYSIS:');
    const actionTypes = await prisma.actions.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { workspaceId },
      orderBy: { _count: { type: 'desc' } }
    });
    
    console.log('  Action Types and Counts:');
    actionTypes.forEach(type => {
      console.log(`    ${type.type}: ${type._count.type}`);
    });
    
    // 2. AUDIT EMAIL ACTIONS SPECIFICALLY
    console.log('\n📧 EMAIL ACTIONS AUDIT:');
    const emailActions = await prisma.actions.findMany({
      where: {
        workspaceId,
        type: { contains: 'email' }
      },
      select: {
        id: true,
        type: true,
        subject: true,
        personId: true,
        companyId: true,
        externalId: true,
        createdAt: true
      },
      take: 10
    });
    
    console.log(`  Total Email Actions: ${emailActions.length}`);
    console.log('  Sample Email Actions:');
    emailActions.forEach(action => {
      console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
    });
    
    // 3. AUDIT CALL ACTIONS SPECIFICALLY
    console.log('\n📞 CALL ACTIONS AUDIT:');
    const callActions = await prisma.actions.findMany({
      where: {
        workspaceId,
        type: { contains: 'call' }
      },
      select: {
        id: true,
        type: true,
        subject: true,
        personId: true,
        companyId: true,
        description: true,
        createdAt: true
      },
      take: 10
    });
    
    console.log(`  Total Call Actions: ${callActions.length}`);
    console.log('  Sample Call Actions:');
    callActions.forEach(action => {
      console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
    });
    
    // 4. AUDIT LINKEDIN ACTIONS
    console.log('\n💼 LINKEDIN ACTIONS AUDIT:');
    const linkedinActions = await prisma.actions.findMany({
      where: {
        workspaceId,
        type: { contains: 'linkedin' }
      },
      select: {
        id: true,
        type: true,
        subject: true,
        personId: true,
        companyId: true,
        description: true,
        createdAt: true
      },
      take: 10
    });
    
    console.log(`  Total LinkedIn Actions: ${linkedinActions.length}`);
    console.log('  Sample LinkedIn Actions:');
    linkedinActions.forEach(action => {
      console.log(`    - ${action.type}: ${action.subject} (personId: ${action.personId}, companyId: ${action.companyId})`);
    });
    
    // 5. CHECK FOR UNCONNECTED ACTIONS
    console.log('\n🔗 CONNECTION AUDIT:');
    const unconnectedActions = await prisma.actions.count({
      where: {
        workspaceId,
        personId: null,
        companyId: null,
        leadId: null,
        opportunityId: null,
        prospectId: null
      }
    });
    
    console.log(`  Unconnected Actions: ${unconnectedActions}`);
    
    // 6. CHECK EMAIL MESSAGES NOT LINKED TO ACTIONS
    console.log('\n📧 EMAIL MESSAGES NOT LINKED:');
    const emailAccounts = await prisma.email_accounts.findMany({
      where: { workspaceId },
      select: { id: true }
    });
    
    const accountIds = emailAccounts.map(account => account.id);
    const totalEmails = await prisma.email_messages.count({
      where: { accountId: { in: accountIds } }
    });
    
    const emailActionsCount = await prisma.actions.count({
      where: { workspaceId, externalId: { startsWith: 'email_' } }
    });
    
    console.log(`  Total Email Messages: ${totalEmails}`);
    console.log(`  Email Actions Created: ${emailActionsCount}`);
    console.log(`  Emails Not Linked: ${totalEmails - emailActionsCount}`);
    
    // 7. CHECK NOTES NOT LINKED TO ACTIONS
    console.log('\n📝 NOTES NOT LINKED:');
    const totalNotes = await prisma.notes.count({ where: { workspaceId } });
    const noteActionsCount = await prisma.actions.count({
      where: { workspaceId, externalId: { startsWith: 'note_' } }
    });
    
    console.log(`  Total Notes: ${totalNotes}`);
    console.log(`  Note Actions Created: ${noteActionsCount}`);
    console.log(`  Notes Not Linked: ${totalNotes - noteActionsCount}`);
    
    // 8. AUDIT LAST ACTION FIELDS
    console.log('\n🔄 LAST ACTION FIELDS AUDIT:');
    const peopleWithLastAction = await prisma.people.count({
      where: { workspaceId, lastAction: { not: null } }
    });
    const totalPeople = await prisma.people.count({ where: { workspaceId } });
    
    const companiesWithLastAction = await prisma.companies.count({
      where: { workspaceId, lastAction: { not: null } }
    });
    const totalCompanies = await prisma.companies.count({ where: { workspaceId } });
    
    console.log(`  People with lastAction: ${peopleWithLastAction}/${totalPeople} (${Math.round(peopleWithLastAction/totalPeople*100)}%)`);
    console.log(`  Companies with lastAction: ${companiesWithLastAction}/${totalCompanies} (${Math.round(companiesWithLastAction/totalCompanies*100)}%)`);
    
    // 9. AUDIT NEXT ACTION FIELDS
    console.log('\n🎯 NEXT ACTION FIELDS AUDIT:');
    const peopleWithNextAction = await prisma.people.count({
      where: { workspaceId, nextAction: { not: null } }
    });
    
    const companiesWithNextAction = await prisma.companies.count({
      where: { workspaceId, nextAction: { not: null } }
    });
    
    console.log(`  People with nextAction: ${peopleWithNextAction}/${totalPeople} (${Math.round(peopleWithNextAction/totalPeople*100)}%)`);
    console.log(`  Companies with nextAction: ${companiesWithNextAction}/${totalCompanies} (${Math.round(companiesWithNextAction/totalCompanies*100)}%)`);
    
    // 10. SAMPLE LAST/NEXT ACTIONS
    console.log('\n📋 SAMPLE LAST/NEXT ACTIONS:');
    const samplePeople = await prisma.people.findMany({
      where: { 
        workspaceId, 
        lastAction: { not: null },
        nextAction: { not: null }
      },
      select: {
        fullName: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true
      },
      take: 5
    });
    
    samplePeople.forEach(person => {
      console.log(`  ${person.fullName}:`);
      console.log(`    Last: ${person.lastAction} (${person.lastActionDate})`);
      console.log(`    Next: ${person.nextAction} (${person.nextActionDate})`);
    });
    
    // SUMMARY
    console.log('\n📊 AUDIT SUMMARY:');
    console.log(`  Total Actions: ${actionTypes.reduce((sum, type) => sum + type._count.type, 0)}`);
    console.log(`  Action Types: ${actionTypes.length}`);
    console.log(`  Unconnected Actions: ${unconnectedActions}`);
    console.log(`  Emails Not Linked: ${totalEmails - emailActionsCount}`);
    console.log(`  Notes Not Linked: ${totalNotes - noteActionsCount}`);
    console.log(`  People with lastAction: ${peopleWithLastAction}/${totalPeople} (${Math.round(peopleWithLastAction/totalPeople*100)}%)`);
    console.log(`  People with nextAction: ${peopleWithNextAction}/${totalPeople} (${Math.round(peopleWithNextAction/totalPeople*100)}%)`);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditActionTypesComprehensive();
