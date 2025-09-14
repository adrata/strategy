const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveAudit() {
  console.log('🔍 COMPREHENSIVE DATABASE AUDIT');
  console.log('================================\n');

  // 1. CORE RECORDS STATUS
  console.log('📊 CORE RECORDS STATUS');
  console.log('======================');
  
  const totalPeople = await prisma.person.count();
  const totalCompanies = await prisma.company.count();
  const totalContacts = await prisma.contacts.count();
  const totalAccounts = await prisma.accounts.count();
  
  console.log(`✅ People: ${totalPeople}`);
  console.log(`✅ Companies: ${totalCompanies}`);
  console.log(`✅ Contacts: ${totalContacts}`);
  console.log(`✅ Accounts: ${totalAccounts}`);
  
  // Check 1:1 mapping
  const peopleWithContacts = await prisma.person.count({
    where: { contacts: { some: {} } }
  });
  const companiesWithAccounts = await prisma.company.count({
    where: { accounts: { some: {} } }
  });
  
  console.log(`\n🎯 1:1 MAPPING STATUS:`);
  console.log(`  People with contacts: ${peopleWithContacts}/${totalPeople} (${((peopleWithContacts/totalPeople)*100).toFixed(1)}%)`);
  console.log(`  Companies with accounts: ${companiesWithAccounts}/${totalCompanies} (${((companiesWithAccounts/totalCompanies)*100).toFixed(1)}%)`);

  // 2. PIPELINE RECORDS STATUS
  console.log('\n📊 PIPELINE RECORDS STATUS');
  console.log('===========================');
  
  const totalLeads = await prisma.leads.count();
  const totalProspects = await prisma.prospects.count();
  const totalOpportunities = await prisma.opportunities.count();
  const totalClients = await prisma.clients.count();
  
  console.log(`✅ Leads: ${totalLeads}`);
  console.log(`✅ Prospects: ${totalProspects}`);
  console.log(`✅ Opportunities: ${totalOpportunities}`);
  console.log(`✅ Clients: ${totalClients}`);
  
  const totalPipeline = totalLeads + totalProspects + totalOpportunities + totalClients;
  console.log(`\n📈 Total Pipeline Records: ${totalPipeline}`);

  // 3. LINKING STATUS
  console.log('\n📊 PIPELINE LINKING STATUS');
  console.log('===========================');
  
  const linkedLeads = await prisma.leads.count({ where: { personId: { not: null } } });
  const linkedProspects = await prisma.prospects.count({ where: { personId: { not: null } } });
  const linkedOpportunities = await prisma.opportunities.count({ where: { personId: { not: null } } });
  const linkedClients = await prisma.clients.count({ where: { personId: { not: null } } });
  
  const totalLinked = linkedLeads + linkedProspects + linkedOpportunities + linkedClients;
  
  console.log(`✅ Linked Leads: ${linkedLeads}/${totalLeads} (${((linkedLeads/totalLeads)*100).toFixed(1)}%)`);
  console.log(`✅ Linked Prospects: ${linkedProspects}/${totalProspects} (${((linkedProspects/totalProspects)*100).toFixed(1)}%)`);
  console.log(`✅ Linked Opportunities: ${linkedOpportunities}/${totalOpportunities} (${((linkedOpportunities/totalOpportunities)*100).toFixed(1)}%)`);
  console.log(`✅ Linked Clients: ${linkedClients}/${totalClients} (${((linkedClients/totalClients)*100).toFixed(1)}%)`);
  console.log(`\n🎯 TOTAL LINKED: ${totalLinked}/${totalPipeline} (${((totalLinked/totalPipeline)*100).toFixed(1)}%)`);

  // 4. ORPHANED RECORDS ANALYSIS
  console.log('\n⚠️  ORPHANED RECORDS ANALYSIS');
  console.log('=============================');
  
  const orphanedLeads = await prisma.leads.count({ where: { personId: null } });
  const orphanedProspects = await prisma.prospects.count({ where: { personId: null } });
  const orphanedOpportunities = await prisma.opportunities.count({ where: { personId: null } });
  const orphanedClients = await prisma.clients.count({ where: { personId: null } });
  
  const totalOrphaned = orphanedLeads + orphanedProspects + orphanedOpportunities + orphanedClients;
  
  console.log(`❌ Orphaned Leads: ${orphanedLeads}`);
  console.log(`❌ Orphaned Prospects: ${orphanedProspects}`);
  console.log(`❌ Orphaned Opportunities: ${orphanedOpportunities}`);
  console.log(`❌ Orphaned Clients: ${orphanedClients}`);
  console.log(`\n🚨 TOTAL ORPHANED: ${totalOrphaned}`);

  // 5. ORPHANED BY WORKSPACE
  if (totalOrphaned > 0) {
    console.log('\n📋 ORPHANED RECORDS BY WORKSPACE');
    console.log('=================================');
    
    // Get orphaned records by workspace
    const orphanedLeadsByWorkspace = await prisma.leads.groupBy({
      by: ['workspaceId'],
      where: { personId: null },
      _count: { id: true }
    });
    
    const orphanedProspectsByWorkspace = await prisma.prospects.groupBy({
      by: ['workspaceId'],
      where: { personId: null },
      _count: { id: true }
    });
    
    const orphanedOpportunitiesByWorkspace = await prisma.opportunities.groupBy({
      by: ['workspaceId'],
      where: { personId: null },
      _count: { id: true }
    });
    
    const orphanedClientsByWorkspace = await prisma.clients.groupBy({
      by: ['workspaceId'],
      where: { personId: null },
      _count: { id: true }
    });
    
    // Combine workspace data
    const workspaceData = {};
    
    orphanedLeadsByWorkspace.forEach(item => {
      if (!workspaceData[item.workspaceId]) workspaceData[item.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      workspaceData[item.workspaceId].leads = item._count.id;
    });
    
    orphanedProspectsByWorkspace.forEach(item => {
      if (!workspaceData[item.workspaceId]) workspaceData[item.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      workspaceData[item.workspaceId].prospects = item._count.id;
    });
    
    orphanedOpportunitiesByWorkspace.forEach(item => {
      if (!workspaceData[item.workspaceId]) workspaceData[item.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      workspaceData[item.workspaceId].opportunities = item._count.id;
    });
    
    orphanedClientsByWorkspace.forEach(item => {
      if (!workspaceData[item.workspaceId]) workspaceData[item.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      workspaceData[item.workspaceId].clients = item._count.id;
    });
    
    Object.entries(workspaceData).forEach(([workspace, counts]) => {
      const total = counts.leads + counts.prospects + counts.opportunities + counts.clients;
      if (total > 0) {
        console.log(`\nWorkspace: ${workspace}`);
        console.log(`  Leads: ${counts.leads}`);
        console.log(`  Prospects: ${counts.prospects}`);
        console.log(`  Opportunities: ${counts.opportunities}`);
        console.log(`  Clients: ${counts.clients}`);
        console.log(`  Total: ${total}`);
      }
    });
  }

  // 6. DATA QUALITY SUMMARY
  console.log('\n🎯 DATA QUALITY SUMMARY');
  console.log('========================');
  console.log(`✅ Core Records: ${totalPeople} people, ${totalCompanies} companies`);
  console.log(`✅ Business Records: ${totalContacts} contacts, ${totalAccounts} accounts`);
  console.log(`✅ Pipeline Records: ${totalPipeline} total`);
  console.log(`✅ Linked Pipeline: ${totalLinked}/${totalPipeline} (${((totalLinked/totalPipeline)*100).toFixed(1)}%)`);
  console.log(`⚠️  Orphaned Pipeline: ${totalOrphaned}/${totalPipeline} (${((totalOrphaned/totalPipeline)*100).toFixed(1)}%)`);
  
  if (totalOrphaned === 0) {
    console.log('\n🎉 PERFECT! All pipeline records are linked to core records!');
  } else {
    console.log(`\n🔧 NEXT STEPS: Link or clean up ${totalOrphaned} orphaned pipeline records`);
  }

  await prisma.$disconnect();
}

comprehensiveAudit().catch(console.error);
