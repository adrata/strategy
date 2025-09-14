const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrphanedWorkspaces() {
  console.log('⚠️  ORPHANED RECORDS BY WORKSPACE');
  console.log('==================================\n');
  
  // Get orphaned records
  const orphanedLeads = await prisma.leads.findMany({
    where: { personId: null },
    select: { workspaceId: true }
  });
  
  const orphanedProspects = await prisma.prospects.findMany({
    where: { personId: null },
    select: { workspaceId: true }
  });
  
  const orphanedOpportunities = await prisma.opportunities.findMany({
    where: { personId: null },
    select: { workspaceId: true }
  });
  
  const orphanedClients = await prisma.clients.findMany({
    where: { personId: null },
    select: { workspaceId: true }
  });
  
  // Count by workspace
  const workspaceCounts = {};
  
  orphanedLeads.forEach(lead => {
    if (!workspaceCounts[lead.workspaceId]) {
      workspaceCounts[lead.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
    }
    workspaceCounts[lead.workspaceId].leads++;
  });
  
  orphanedProspects.forEach(prospect => {
    if (!workspaceCounts[prospect.workspaceId]) {
      workspaceCounts[prospect.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
    }
    workspaceCounts[prospect.workspaceId].prospects++;
  });
  
  orphanedOpportunities.forEach(opp => {
    if (!workspaceCounts[opp.workspaceId]) {
      workspaceCounts[opp.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
    }
    workspaceCounts[opp.workspaceId].opportunities++;
  });
  
  orphanedClients.forEach(client => {
    if (!workspaceCounts[client.workspaceId]) {
      workspaceCounts[client.workspaceId] = { leads: 0, prospects: 0, opportunities: 0, clients: 0 };
    }
    workspaceCounts[client.workspaceId].clients++;
  });
  
  // Display results
  Object.entries(workspaceCounts).forEach(([workspace, counts]) => {
    const total = counts.leads + counts.prospects + counts.opportunities + counts.clients;
    if (total > 0) {
      console.log(`Workspace: ${workspace}`);
      console.log(`  Leads: ${counts.leads}`);
      console.log(`  Prospects: ${counts.prospects}`);
      console.log(`  Opportunities: ${counts.opportunities}`);
      console.log(`  Clients: ${counts.clients}`);
      console.log(`  Total: ${total}`);
      console.log('');
    }
  });
  
  await prisma.$disconnect();
}

checkOrphanedWorkspaces().catch(console.error);
