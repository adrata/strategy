const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testActionInheritanceModel() {
  console.log('🧪 TESTING ACTION INHERITANCE MODEL');
  console.log('===================================');
  
  const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
  
  try {
    // TEST 1: Check orphaned actions
    console.log('\n🔍 TEST 1: Checking orphaned actions...');
    const orphanedCount = await prisma.actions.count({
      where: {
        workspaceId,
        personId: null,
        companyId: null,
        leadId: null,
        opportunityId: null,
        prospectId: null
      }
    });
    console.log(`  Orphaned Actions: ${orphanedCount} (should be < 100)`);
    
    // TEST 2: Check action types standardization
    console.log('\n🏷️ TEST 2: Checking action types standardization...');
    const actionTypes = await prisma.actions.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { workspaceId },
      orderBy: { _count: { type: 'desc' } }
    });
    
    console.log('  Action Types:');
    actionTypes.slice(0, 10).forEach(type => {
      console.log(`    ${type.type}: ${type._count.type}`);
    });
    
    // TEST 3: Check lastAction fields on core records
    console.log('\n🔄 TEST 3: Checking lastAction fields on core records...');
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
    
    // TEST 4: Test timeline inheritance for a lead
    console.log('\n📊 TEST 4: Testing timeline inheritance for a lead...');
    const testLead = await prisma.leads.findFirst({
      where: { workspaceId },
      select: { id: true, fullName: true, personId: true, companyId: true }
    });
    
    if (testLead) {
      console.log(`  Testing with lead: ${testLead.fullName} (ID: ${testLead.id})`);
      console.log(`    Person ID: ${testLead.personId}`);
      console.log(`    Company ID: ${testLead.companyId}`);
      
      // Get actions for this lead's core records
      const leadActions = await prisma.actions.findMany({
        where: {
          workspaceId,
          OR: [
            { personId: testLead.personId },
            { companyId: testLead.companyId }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          type: true,
          subject: true,
          createdAt: true,
          personId: true,
          companyId: true
        }
      });
      
      console.log(`    Found ${leadActions.length} actions for this lead's core records:`);
      leadActions.forEach(action => {
        const source = action.personId ? 'person' : 'company';
        console.log(`      - ${action.type}: ${action.subject} (from ${source})`);
      });
    } else {
      console.log('  No leads found for testing');
    }
    
    // TEST 5: Check email/note linking
    console.log('\n📧📝 TEST 5: Checking email/note linking...');
    const emailActions = await prisma.actions.count({
      where: { workspaceId, externalId: { startsWith: 'email_' } }
    });
    const noteActions = await prisma.actions.count({
      where: { workspaceId, externalId: { startsWith: 'note_' } }
    });
    
    console.log(`  Email actions created: ${emailActions}`);
    console.log(`  Note actions created: ${noteActions}`);
    
    // TEST 6: Check action distribution
    console.log('\n📈 TEST 6: Checking action distribution...');
    const actionsWithPeople = await prisma.actions.count({ where: { workspaceId, personId: { not: null } } });
    const actionsWithCompanies = await prisma.actions.count({ where: { workspaceId, companyId: { not: null } } });
    const actionsWithLeads = await prisma.actions.count({ where: { workspaceId, leadId: { not: null } } });
    const actionsWithOpportunities = await prisma.actions.count({ where: { workspaceId, opportunityId: { not: null } } });
    const actionsWithProspects = await prisma.actions.count({ where: { workspaceId, prospectId: { not: null } } });
    
    const totalActions = await prisma.actions.count({ where: { workspaceId } });
    
    console.log(`  Actions with People: ${actionsWithPeople} (${Math.round(actionsWithPeople/totalActions*100)}%)`);
    console.log(`  Actions with Companies: ${actionsWithCompanies} (${Math.round(actionsWithCompanies/totalActions*100)}%)`);
    console.log(`  Actions with Leads: ${actionsWithLeads} (${Math.round(actionsWithLeads/totalActions*100)}%)`);
    console.log(`  Actions with Opportunities: ${actionsWithOpportunities} (${Math.round(actionsWithOpportunities/totalActions*100)}%)`);
    console.log(`  Actions with Prospects: ${actionsWithProspects} (${Math.round(actionsWithProspects/totalActions*100)}%)`);
    
    // SUMMARY
    console.log('\n📋 SUMMARY:');
    console.log(`  ✅ Total Actions: ${totalActions}`);
    console.log(`  ✅ Orphaned Actions: ${orphanedCount} (${orphanedCount < 100 ? 'GOOD' : 'NEEDS WORK'})`);
    console.log(`  ✅ People with lastAction: ${peopleWithLastAction}/${totalPeople} (${Math.round(peopleWithLastAction/totalPeople*100)}%)`);
    console.log(`  ✅ Companies with lastAction: ${companiesWithLastAction}/${totalCompanies} (${Math.round(companiesWithLastAction/totalCompanies*100)}%)`);
    console.log(`  ✅ Email Actions: ${emailActions}`);
    console.log(`  ✅ Note Actions: ${noteActions}`);
    
    if (orphanedCount < 100 && peopleWithLastAction > totalPeople * 0.1) {
      console.log('\n🎉 ACTION INHERITANCE MODEL IS WORKING WELL!');
    } else {
      console.log('\n⚠️ ACTION INHERITANCE MODEL NEEDS MORE WORK');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActionInheritanceModel();
