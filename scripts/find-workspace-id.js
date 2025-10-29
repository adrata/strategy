const { PrismaClient } = require('@prisma/client');

async function findWorkspaceId() {
  const prisma = new PrismaClient();
  
  try {
    const workspaces = await prisma.workspaces.findMany({
      select: { id: true, name: true, slug: true }
    });
    
    console.log('Available workspaces:');
    workspaces.forEach(w => {
      console.log(`  ${w.id}: ${w.name} (${w.slug})`);
    });
    
    if (workspaces.length === 0) {
      console.log('No workspaces found. Creating a test workspace...');
      const newWorkspace = await prisma.workspaces.create({
        data: {
          name: 'Adrata Test Workspace',
          slug: 'adrata-test',
          description: 'Test workspace for buyer group discovery'
        }
      });
      console.log(`Created workspace: ${newWorkspace.id}: ${newWorkspace.name}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findWorkspaceId();
