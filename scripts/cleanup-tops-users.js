const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTopsUsers() {
  try {
    console.log('🧹 CLEANING UP TOPS USERS...\n');
    
    // Find Justin Johnson (wrong domain)
    const justinJohnson = await prisma.users.findFirst({
      where: { email: 'jjohnson@cloudcaddieconsulting.com' }
    });
    
    if (justinJohnson) {
      console.log('❌ Found Justin Johnson with wrong domain - removing from TOPS workspace...');
      
      // Remove workspace access
      await prisma.workspace_users.deleteMany({
        where: { 
          userId: justinJohnson.id,
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG75' // New TOPS workspace
        }
      });
      
      console.log('   ✅ Removed Justin Johnson from TOPS workspace access');
    } else {
      console.log('   ✅ Justin Johnson not found in TOPS workspace');
    }
    
    // Verify current TOPS users
    const topsWorkspaceUsers = await prisma.workspace_users.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG75' }
    });
    
    console.log('\n👥 CURRENT TOPS WORKSPACE USERS:');
    for (const wu of topsWorkspaceUsers) {
      const user = await prisma.users.findUnique({
        where: { id: wu.userId }
      });
      console.log(`   • ${user?.name || 'Unknown'} (${user?.email || 'No email'})`);
    }
    
    console.log('\n🎉 TOPS users cleaned up successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning up TOPS users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTopsUsers();
