/**
 * Check Victoria's associations in top-temp workspace
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WORKSPACE_SLUG = 'top-temp';
const VICTORIA_EMAIL = 'temp-victoria@top-temp.com';

async function checkVictoriaAssociations() {
  try {
    console.log('🔍 Checking Victoria\'s associations...\n');

    // Get workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    // Get Victoria user
    const victoria = await prisma.users.findUnique({
      where: { email: VICTORIA_EMAIL }
    });

    if (!victoria) {
      throw new Error(`User "${VICTORIA_EMAIL}" not found`);
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log(`✅ Found user: ${victoria.name} (${victoria.id})\n`);

    // Count companies assigned to Victoria
    const companiesCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: victoria.id,
        deletedAt: null
      }
    });

    // Count all companies in workspace
    const allCompaniesCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    // Count people assigned to Victoria
    const peopleCount = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: victoria.id,
        deletedAt: null
      }
    });

    // Count all people in workspace
    const allPeopleCount = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    // Get breakdown by main seller
    const companiesBySeller = await prisma.companies.groupBy({
      by: ['mainSellerId'],
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      _count: { id: true }
    });

    const peopleBySeller = await prisma.people.groupBy({
      by: ['mainSellerId'],
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      _count: { id: true }
    });

    console.log('='.repeat(60));
    console.log('📊 VICTORIA\'S ASSOCIATIONS');
    console.log('='.repeat(60));
    console.log(`\n🏢 COMPANIES:`);
    console.log(`   Assigned to Victoria: ${companiesCount}`);
    console.log(`   Total in workspace: ${allCompaniesCount}`);
    console.log(`   Percentage: ${((companiesCount / allCompaniesCount) * 100).toFixed(1)}%`);

    console.log(`\n👤 PEOPLE:`);
    console.log(`   Assigned to Victoria: ${peopleCount}`);
    console.log(`   Total in workspace: ${allPeopleCount}`);
    console.log(`   Percentage: ${((peopleCount / allPeopleCount) * 100).toFixed(1)}%`);

    console.log(`\n📋 BREAKDOWN BY MAIN SELLER:`);
    console.log(`\n   Companies:`);
    for (const group of companiesBySeller) {
      const seller = group.mainSellerId ? await prisma.users.findUnique({
        where: { id: group.mainSellerId },
        select: { name: true, email: true }
      }) : null;
      const sellerName = seller ? seller.name : 'Unassigned';
      const isVictoria = group.mainSellerId === victoria.id;
      console.log(`   ${isVictoria ? '→' : ' '} ${sellerName}: ${group._count.id}${isVictoria ? ' (Victoria)' : ''}`);
    }

    console.log(`\n   People:`);
    for (const group of peopleBySeller) {
      const seller = group.mainSellerId ? await prisma.users.findUnique({
        where: { id: group.mainSellerId },
        select: { name: true, email: true }
      }) : null;
      const sellerName = seller ? seller.name : 'Unassigned';
      const isVictoria = group.mainSellerId === victoria.id;
      console.log(`   ${isVictoria ? '→' : ' '} ${sellerName}: ${group._count.id}${isVictoria ? ' (Victoria)' : ''}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('💡 EXPLANATION:');
    console.log('='.repeat(60));
    console.log('The left panel shows counts filtered by mainSellerId (assigned to current user).');
    console.log('The main view shows all records in the workspace.');
    console.log(`\nVictoria sees ${companiesCount} companies and ${peopleCount} people in the left panel,`);
    console.log(`but the workspace has ${allCompaniesCount} companies and ${allPeopleCount} people total.`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkVictoriaAssociations()
    .then(() => {
      console.log('\n✅ Check completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Check failed:', error);
      process.exit(1);
    });
}

module.exports = checkVictoriaAssociations;

