const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getWorkspaceNames() {
  try {
    console.log('🏢 GETTING WORKSPACE NAMES BY ID\n');

    const workspaceIds = [
      '01K1VBYXHD0J895XAN0HGFBKJP',
      '01K1VBYV8ETM2RCQA4GNN9EG72'
    ];

    console.log('🔍 Looking up workspace names...\n');

    for (const workspaceId of workspaceIds) {
      try {
        const workspace = await prisma.workspaces.findUnique({
          where: { id: workspaceId }
        });

        if (workspace) {
          console.log(`✅ Workspace ID: ${workspaceId}`);
          console.log(`   🏷️  Name: ${workspace.name}`);
          console.log(`   📝 Description: ${workspace.description || 'No description'}`);
          console.log(`   🏢 Company ID: ${workspace.companyId || 'None'}`);
          console.log(`   📅 Created: ${workspace.createdAt}`);
          console.log('');
        } else {
          console.log(`❌ Workspace ID: ${workspaceId} - NOT FOUND`);
          console.log('');
        }
      } catch (error) {
        console.log(`❌ Error looking up workspace ${workspaceId}: ${error.message}`);
        console.log('');
      }
    }

    // Also check if there are any other workspaces
    console.log('🔍 Checking for other workspaces in the system...\n');
    
    const allWorkspaces = await prisma.workspaces.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${allWorkspaces.length} workspaces in system:`);
    allWorkspaces.forEach(workspace => {
      console.log(`   • ${workspace.id}: ${workspace.name}`);
    });

  } catch (error) {
    console.error('❌ Error getting workspace names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the lookup
if (require.main === module) {
  getWorkspaceNames();
}

module.exports = { getWorkspaceNames };
