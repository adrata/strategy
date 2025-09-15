const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('📊 Current Data Status:');
  console.log('======================');
  
  try {
    const companies = await prisma.companies.count();
    const people = await prisma.people.count();
    const leads = await prisma.leads.count();
    const prospects = await prisma.prospects.count();
    const opportunities = await prisma.opportunities.count();
    const actions = await prisma.actions.count();
    
    console.log(`Companies: ${companies}`);
    console.log(`People: ${people}`);
    console.log(`Leads: ${leads}`);
    console.log(`Prospects: ${prospects}`);
    console.log(`Opportunities: ${opportunities}`);
    console.log(`Actions: ${actions}`);
    
    // Check action connections
    const actionsWithCompanies = await prisma.actions.count({ where: { companyId: { not: null } } });
    const actionsWithPeople = await prisma.actions.count({ where: { personId: { not: null } } });
    const actionsWithLeads = await prisma.actions.count({ where: { leadId: { not: null } } });
    const actionsWithProspects = await prisma.actions.count({ where: { prospectId: { not: null } } });
    const actionsWithOpportunities = await prisma.actions.count({ where: { opportunityId: { not: null } } });
    
    console.log('\n🔗 Action Connections:');
    console.log(`Actions linked to companies: ${actionsWithCompanies}`);
    console.log(`Actions linked to people: ${actionsWithPeople}`);
    console.log(`Actions linked to leads: ${actionsWithLeads}`);
    console.log(`Actions linked to prospects: ${actionsWithProspects}`);
    console.log(`Actions linked to opportunities: ${actionsWithOpportunities}`);
    
    // Check last action fields
    console.log('\n📝 Last Action Fields Status:');
    const companiesWithLastAction = await prisma.companies.count({ where: { lastAction: { not: null } } });
    const peopleWithLastAction = await prisma.people.count({ where: { lastAction: { not: null } } });
    const leadsWithLastActionDate = await prisma.leads.count({ where: { lastActionDate: { not: null } } });
    const prospectsWithLastActionDate = await prisma.prospects.count({ where: { lastActionDate: { not: null } } });
    const opportunitiesWithLastActivityDate = await prisma.opportunities.count({ where: { lastActivityDate: { not: null } } });
    
    console.log(`Companies with lastAction: ${companiesWithLastAction}/${companies}`);
    console.log(`People with lastAction: ${peopleWithLastAction}/${people}`);
    console.log(`Leads with lastActionDate: ${leadsWithLastActionDate}/${leads}`);
    console.log(`Prospects with lastActionDate: ${prospectsWithLastActionDate}/${prospects}`);
    console.log(`Opportunities with lastActivityDate: ${opportunitiesWithLastActivityDate}/${opportunities}`);
    
    // Check next action fields
    console.log('\n🤖 Next Action Fields Status:');
    const companiesWithNextAction = await prisma.companies.count({ where: { nextAction: { not: null } } });
    const peopleWithNextAction = await prisma.people.count({ where: { nextAction: { not: null } } });
    const leadsWithNextAction = await prisma.leads.count({ where: { nextAction: { not: null } } });
    const prospectsWithNextAction = await prisma.prospects.count({ where: { nextAction: { not: null } } });
    const opportunitiesWithNextActivityDate = await prisma.opportunities.count({ where: { nextActivityDate: { not: null } } });
    
    console.log(`Companies with nextAction: ${companiesWithNextAction}/${companies}`);
    console.log(`People with nextAction: ${peopleWithNextAction}/${people}`);
    console.log(`Leads with nextAction: ${leadsWithNextAction}/${leads}`);
    console.log(`Prospects with nextAction: ${prospectsWithNextAction}/${prospects}`);
    console.log(`Opportunities with nextActivityDate: ${opportunitiesWithNextActivityDate}/${opportunities}`);
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
