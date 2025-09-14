const { PrismaClient } = require('@prisma/client');

async function checkWorkspace() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking workspaces...');
    
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { id: 'retail-product-solutions' },
          { slug: 'retail-product-solutions' },
          { id: 'retailproductsolutions' },
          { slug: 'retailproductsolutions' }
        ]
      }
    });
    
    console.log('Found workspaces:', workspaces);
    
    // Also check for any workspace with "retail" in the name
    const retailWorkspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { name: { contains: 'retail', mode: 'insensitive' } },
          { slug: { contains: 'retail', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log('\nRetail-related workspaces:', retailWorkspaces);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkspace(); 