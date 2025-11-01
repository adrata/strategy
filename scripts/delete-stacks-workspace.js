const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function deleteStacksWorkspace() {
  try {
    console.log('🔍 Finding Stacks workspace...');
    
    const stacksWorkspace = await prisma.workspaces.findUnique({
      where: { slug: 'stacks' }
    });

    if (!stacksWorkspace) {
      console.log('❌ Stacks workspace not found');
      return;
    }

    console.log(`✅ Found Stacks workspace: ${stacksWorkspace.name} (${stacksWorkspace.id})`);
    
    // Delete workspace memberships first (due to foreign key constraints)
    console.log('🗑️  Deleting workspace memberships...');
    await prisma.workspace_users.deleteMany({
      where: { workspaceId: stacksWorkspace.id }
    });
    
    // Delete the workspace
    console.log('🗑️  Deleting workspace...');
    await prisma.workspaces.delete({
      where: { id: stacksWorkspace.id }
    });
    
    console.log('✅ Stacks workspace deleted successfully');
    
  } catch (error) {
    console.error('❌ Error deleting workspace:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteStacksWorkspace()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

