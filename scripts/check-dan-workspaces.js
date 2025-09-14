const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDanWorkspaces() {
  try {
    console.log('🔍 Checking Dan\'s workspaces...\n');
    
    const danUser = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });
    
    if (!danUser) {
      console.log('❌ Dan user not found');
      return;
    }
    
    console.log(`👤 Dan User: ${danUser.name} (${danUser.id})\n`);
    
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: { userId: danUser.id }
    });
    
    console.log('🏢 Dan\'s Workspaces:');
    for (const wu of workspaceUsers) {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: wu.workspaceId }
      });
      console.log(`   • ${workspace?.name || 'Unknown'} (${wu.workspaceId})`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDanWorkspaces();
