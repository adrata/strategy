const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing connection...');
    
    // Try to find TOP workspace
    const workspaces = await prisma.workspaces.findMany({
      where: {
        name: {
          contains: 'TOP',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('Found workspaces:', workspaces);
    
    if (workspaces.length > 0) {
      const workspace = workspaces[0];
      console.log(`Using workspace: ${workspace.name} (${workspace.id})`);
      
      // Get basic counts
      const peopleCount = await prisma.people.count({
        where: { workspaceId: workspace.id }
      });
      
      const leadsCount = await prisma.leads.count({
        where: { workspaceId: workspace.id }
      });
      
      const prospectsCount = await prisma.prospects.count({
        where: { workspaceId: workspace.id }
      });
      
      console.log(`\nCounts:`);
      console.log(`People: ${peopleCount}`);
      console.log(`Leads: ${leadsCount}`);
      console.log(`Prospects: ${prospectsCount}`);
      console.log(`Expected leads: ${peopleCount - prospectsCount}`);
      console.log(`Difference: ${leadsCount - (peopleCount - prospectsCount)}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
