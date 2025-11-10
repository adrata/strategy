/**
 * Show Per-Seller Counts for Top-Temp Workspace
 * Displays companies and people counts grouped by mainSellerId
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_SLUG = 'top-temp';

async function showPerSellerCounts() {
  try {
    console.log('📊 Per-Seller Counts for Top-Temp Workspace\n');
    console.log('='.repeat(60));

    // Get workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`Workspace: ${workspace.name} (${workspace.id})\n`);

    // Get all users in the workspace
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Per-Seller Counts:\n');

    for (const workspaceUser of workspaceUsers) {
      const userId = workspaceUser.userId;
      const userName = workspaceUser.user.name || workspaceUser.user.email || 'Unknown';

      // Count companies for this seller
      const companiesCount = await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ]
        }
      });

      // Count people for this seller
      const peopleCount = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ]
        }
      });

      // Count companies specifically assigned to this seller (not NULL)
      const assignedCompaniesCount = await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          mainSellerId: userId
        }
      });

      // Count people specifically assigned to this seller (not NULL)
      const assignedPeopleCount = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          mainSellerId: userId
        }
      });

      console.log(`${userName}:`);
      console.log(`  Companies: ${assignedCompaniesCount} assigned, ${companiesCount} total (including unassigned)`);
      console.log(`  People: ${assignedPeopleCount} assigned, ${peopleCount} total (including unassigned)`);
      console.log('');
    }

    // Also show unassigned counts
    const unassignedCompaniesCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        mainSellerId: null
      }
    });

    const unassignedPeopleCount = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        mainSellerId: null
      }
    });

    console.log('Unassigned (NULL mainSellerId):');
    console.log(`  Companies: ${unassignedCompaniesCount}`);
    console.log(`  People: ${unassignedPeopleCount}`);
    console.log('');

    // Total counts
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    console.log('Totals:');
    console.log(`  Companies: ${totalCompanies}`);
    console.log(`  People: ${totalPeople}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
async function main() {
  await showPerSellerCounts();
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { showPerSellerCounts };

