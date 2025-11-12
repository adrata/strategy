const { getPrismaClient } = require('../../lib/prisma-client');

/**
 * Find or create E&I Cooperative Services workspace
 * @param {PrismaClient} prismaClient - Optional Prisma client instance. If not provided, uses shared client.
 * @returns {Promise<string>} Workspace ID
 */
async function findEIWorkspace(prismaClient = null) {
  const prisma = prismaClient || getPrismaClient();
  const shouldDisconnect = false; // Never disconnect shared clients
  
  try {
    // Search for E&I workspace
    const workspaces = await prisma.workspaces.findMany({
      where: {
        OR: [
          { name: { contains: 'E&I', mode: 'insensitive' } },
          { name: { contains: 'ei', mode: 'insensitive' } },
          { slug: { contains: 'ei', mode: 'insensitive' } },
          { name: { contains: 'Cooperative', mode: 'insensitive' } }
        ]
      }
    });

    if (workspaces.length > 0) {
      console.log('Found E&I workspace:');
      workspaces.forEach(w => {
        console.log(`  ID: ${w.id}`);
        console.log(`  Name: ${w.name}`);
        console.log(`  Slug: ${w.slug}`);
        console.log('');
      });
      return workspaces[0].id;
    } else {
      console.log('E&I workspace not found. Creating new workspace...');
      const newWorkspace = await prisma.workspaces.create({
        data: {
          name: 'E&I Cooperative Services',
          slug: 'ei-cooperative',
          description: 'E&I Cooperative Services workspace for buyer group discovery',
          timezone: 'UTC',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`Created workspace: ${newWorkspace.id}`);
      return newWorkspace.id;
    }
  } catch (error) {
    console.error('Error finding/creating E&I workspace:', error.message);
    
    // Provide helpful error context
    if (error.message && (
      error.message.includes('connection') || 
      error.message.includes('P1001') ||
      error.message.includes('ECONNREFUSED')
    )) {
      console.error('   This appears to be a database connection issue.');
      console.error('   Ensure DATABASE_URL is set correctly and the database is accessible.');
    }
    
    throw error;
  }
  // Note: We don't disconnect here because we're using shared client
  // The shared client will be disconnected at script exit
}

if (require.main === module) {
  findEIWorkspace().then(id => {
    console.log(`\nWorkspace ID: ${id}`);
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { findEIWorkspace };

