/**
 * List Workspaces with Data
 * 
 * Quick script to see which workspaces have people and companies
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listWorkspaces() {
  try {
    console.log('🔍 Finding workspaces with data...\n');

    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            },
            companies: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Found ${workspaces.length} workspaces:\n`);

    for (const workspace of workspaces) {
      const peopleCount = workspace._count.people;
      const companiesCount = workspace._count.companies;
      
      if (peopleCount > 0 || companiesCount > 0) {
        console.log(`🏢 ${workspace.name}`);
        console.log(`   ID: ${workspace.id}`);
        console.log(`   People: ${peopleCount}`);
        console.log(`   Companies: ${companiesCount}`);
        console.log('');
      }
    }

    // Also check for people without workspace association (shouldn't happen but check)
    const peopleWithoutWorkspace = await prisma.people.count({
      where: {
        workspaceId: null,
        deletedAt: null
      }
    });

    if (peopleWithoutWorkspace > 0) {
      console.log(`⚠️  Found ${peopleWithoutWorkspace} people without workspace association`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

listWorkspaces()
  .then(() => {
    console.log('✅ Complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

