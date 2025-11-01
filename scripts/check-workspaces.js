const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkWorkspaces() {
  try {
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('Available workspaces:');
    console.table(workspaces);
    
    // Check if Stacks workspace exists
    const stacksWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Stacks', mode: 'insensitive' } },
          { slug: { contains: 'stacks', mode: 'insensitive' } }
        ]
      }
    });
    
    if (stacksWorkspace) {
      console.log('\n✅ Stacks workspace found:');
      console.log(JSON.stringify(stacksWorkspace, null, 2));
    } else {
      console.log('\n❌ No Stacks workspace found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkspaces();
