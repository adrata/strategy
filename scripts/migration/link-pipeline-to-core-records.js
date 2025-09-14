const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkPipelineToCoreRecords() {
  console.log('🔗 LINKING PIPELINE RECORDS TO CORE RECORDS');
  console.log('===========================================\n');
  
  let linkedCount = 0;
  let orphanedCount = 0;
  const orphanedByWorkspace = {};
  
  // Process LEADS
  console.log('📋 STEP 1: Processing LEADS...');
  const leads = await prisma.leads.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      workEmail: true,
      company: true,
      workspaceId: true,
      personId: true,
      companyId: true
    }
  });
  
  console.log(`Found ${leads.length} leads to process`);
  
  for (const lead of leads) {
    let personId = null;
    let companyId = null;
    
    // Try to find matching person by email or name
    if (lead.email || lead.workEmail) {
      const person = await prisma.person.findFirst({
        where: {
          OR: [
            { email: lead.email },
            { email: lead.workEmail }
          ]
        }
      });
      if (person) personId = person.id;
    }
    
    // Try to find matching company by name
    if (lead.company) {
      const company = await prisma.company.findFirst({
        where: { name: lead.company }
      });
      if (company) companyId = company.id;
    }
    
    if (personId || companyId) {
      // Link the lead to core records
      await prisma.leads.update({
        where: { id: lead.id },
        data: {
          personId: personId,
          companyId: companyId
        }
      });
      linkedCount++;
    } else {
      // Orphaned lead
      orphanedCount++;
      if (!orphanedByWorkspace[lead.workspaceId]) {
        orphanedByWorkspace[lead.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      }
      orphanedByWorkspace[lead.workspaceId].leads++;
    }
  }
  
  // Process PROSPECTS
  console.log('\n📋 STEP 2: Processing PROSPECTS...');
  const prospects = await prisma.prospects.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      workEmail: true,
      company: true,
      workspaceId: true,
      personId: true,
      companyId: true
    }
  });
  
  console.log(`Found ${prospects.length} prospects to process`);
  
  for (const prospect of prospects) {
    let personId = null;
    let companyId = null;
    
    // Try to find matching person by email or name
    if (prospect.email || prospect.workEmail) {
      const person = await prisma.person.findFirst({
        where: {
          OR: [
            { email: prospect.email },
            { email: prospect.workEmail }
          ]
        }
      });
      if (person) personId = person.id;
    }
    
    // Try to find matching company by name
    if (prospect.company) {
      const company = await prisma.company.findFirst({
        where: { name: prospect.company }
      });
      if (company) companyId = company.id;
    }
    
    if (personId || companyId) {
      // Link the prospect to core records
      await prisma.prospects.update({
        where: { id: prospect.id },
        data: {
          personId: personId,
          companyId: companyId
        }
      });
      linkedCount++;
    } else {
      // Orphaned prospect
      orphanedCount++;
      if (!orphanedByWorkspace[prospect.workspaceId]) {
        orphanedByWorkspace[prospect.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      }
      orphanedByWorkspace[prospect.workspaceId].prospects++;
    }
  }
  
  // Process OPPORTUNITIES
  console.log('\n📋 STEP 3: Processing OPPORTUNITIES...');
  const opportunities = await prisma.opportunities.findMany({
    select: {
      id: true,
      name: true,
      workspaceId: true,
      leadId: true,
      assignedUserId: true
    }
  });
  
  console.log(`Found ${opportunities.length} opportunities to process`);
  
  for (const opportunity of opportunities) {
    // Opportunities link through leadId, not directly to people/companies
    // So we just need to ensure the leadId is properly set
    if (opportunity.leadId) {
      linkedCount++;
      console.log(`✅ Opportunity ${opportunity.id} already linked to lead: ${opportunity.leadId}`);
    } else {
      orphanedCount++;
      if (!orphanedByWorkspace[opportunity.workspaceId]) {
        orphanedByWorkspace[opportunity.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      }
      orphanedByWorkspace[opportunity.workspaceId].opportunities++;
      console.log(`⚠️  Opportunity ${opportunity.id} has no leadId`);
    }
  }
  
  // Process CLIENTS
  console.log('\n📋 STEP 4: Processing CLIENTS...');
  const clients = await prisma.clients.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      workEmail: true,
      company: true,
      workspaceId: true,
      personId: true,
      companyId: true
    }
  });
  
  console.log(`Found ${clients.length} clients to process`);
  
  for (const client of clients) {
    let personId = null;
    let companyId = null;
    
    // Try to find matching person by email or name
    if (client.email || client.workEmail) {
      const person = await prisma.person.findFirst({
        where: {
          OR: [
            { email: client.email },
            { email: client.workEmail }
          ]
        }
      });
      if (person) personId = person.id;
    }
    
    // Try to find matching company by name
    if (client.company) {
      const company = await prisma.company.findFirst({
        where: { name: client.company }
      });
      if (company) companyId = company.id;
    }
    
    if (personId || companyId) {
      // Link the client to core records
      await prisma.clients.update({
        where: { id: client.id },
        data: {
          personId: personId,
          companyId: companyId
        }
      });
      linkedCount++;
    } else {
      // Orphaned client
      orphanedCount++;
      if (!orphanedByWorkspace[client.workspaceId]) {
        orphanedByWorkspace[client.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
      }
      orphanedByWorkspace[client.workspaceId].clients++;
    }
  }
  
  // Results
  console.log('\n✅ PIPELINE LINKING COMPLETE!');
  console.log('==============================');
  console.log(`  Pipeline records linked: ${linkedCount}`);
  console.log(`  Orphaned records: ${orphanedCount}`);
  
  // Show orphaned records by workspace
  if (orphanedCount > 0) {
    console.log('\n⚠️  ORPHANED RECORDS BY WORKSPACE:');
    console.log('===================================');
    for (const [workspaceId, counts] of Object.entries(orphanedByWorkspace)) {
      const total = counts.leads + counts.prospects + counts.opportunities + counts.clients;
      if (total > 0) {
        console.log(`\n  Workspace: ${workspaceId}`);
        console.log(`    Leads: ${counts.leads}`);
        console.log(`    Prospects: ${counts.prospects}`);
        console.log(`    Opportunities: ${counts.opportunities}`);
        console.log(`    Clients: ${counts.clients}`);
        console.log(`    Total: ${total}`);
      }
    }
  }
  
  // Final verification
  console.log('\n📊 FINAL VERIFICATION:');
  const finalLinkedLeads = await prisma.leads.count({ where: { personId: { not: null } } });
  const finalLinkedProspects = await prisma.prospects.count({ where: { personId: { not: null } } });
  const finalLinkedOpportunities = await prisma.opportunities.count({ where: { personId: { not: null } } });
  const finalLinkedClients = await prisma.clients.count({ where: { personId: { not: null } } });
  
  console.log(`  Linked leads: ${finalLinkedLeads}`);
  console.log(`  Linked prospects: ${finalLinkedProspects}`);
  console.log(`  Linked opportunities: ${finalLinkedOpportunities}`);
  console.log(`  Linked clients: ${finalLinkedClients}`);
  console.log(`  Total linked: ${finalLinkedLeads + finalLinkedProspects + finalLinkedOpportunities + finalLinkedClients}`);
  
  await prisma.$disconnect();
}

linkPipelineToCoreRecords().catch(console.error);
