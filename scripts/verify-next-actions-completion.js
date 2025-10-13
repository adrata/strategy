/**
 * Verification Script - Check Next Actions Completion
 * 
 * This script verifies that all people and companies across all workspaces
 * have next actions populated with proper company-person linkage.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyNextActionsCompletion() {
  console.log('🔍 NEXT ACTIONS COMPLETION VERIFICATION');
  console.log('========================================\n');

  try {
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    console.log(`📊 Found ${workspaces.length} active workspaces\n`);

    let totalPeople = 0;
    let totalPeopleWithNextActions = 0;
    let totalCompanies = 0;
    let totalCompaniesWithNextActions = 0;
    let totalSpeedrunPeople = 0;
    let totalSpeedrunPeopleWithTodayActions = 0;

    for (const workspace of workspaces) {
      console.log(`\n🏢 Verifying workspace: ${workspace.name} (${workspace.id})`);
      console.log('─'.repeat(60));

      // Check People
      const peopleStats = await prisma.people.aggregate({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        },
        _count: {
          id: true
        }
      });

      const peopleWithNextActions = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          AND: [
            { nextAction: { not: null } },
            { nextAction: { not: '' } },
            { nextActionDate: { not: null } }
          ]
        }
      });

      const speedrunPeople = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          globalRank: { lte: 50 }
        }
      });

      const speedrunPeopleWithTodayActions = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          globalRank: { lte: 50 },
          AND: [
            { nextAction: { not: null } },
            { nextAction: { not: '' } },
            { nextActionDate: { not: null } }
          ]
        }
      });

      // Check Companies
      const companiesStats = await prisma.companies.aggregate({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        },
        _count: {
          id: true
        }
      });

      const companiesWithNextActions = await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          AND: [
            { nextAction: { not: null } },
            { nextAction: { not: '' } },
            { nextActionDate: { not: null } }
          ]
        }
      });

      // Display workspace results
      console.log(`👥 People:`);
      console.log(`   Total: ${peopleStats._count.id}`);
      console.log(`   With Next Actions: ${peopleWithNextActions}`);
      console.log(`   Completion: ${((peopleWithNextActions / peopleStats._count.id) * 100).toFixed(1)}%`);
      console.log(`   Speedrun (Top 50): ${speedrunPeople} total, ${speedrunPeopleWithTodayActions} with actions`);

      console.log(`🏢 Companies:`);
      console.log(`   Total: ${companiesStats._count.id}`);
      console.log(`   With Next Actions: ${companiesWithNextActions}`);
      console.log(`   Completion: ${((companiesWithNextActions / companiesStats._count.id) * 100).toFixed(1)}%`);

      // Check for company-person linkage
      const companiesWithPeople = await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          people: {
            some: {
              deletedAt: null
            }
          }
        }
      });

      const companiesWithPeopleAndActions = await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          AND: [
            { nextAction: { not: null } },
            { nextAction: { not: '' } },
            { nextActionDate: { not: null } },
            {
              people: {
                some: {
                  deletedAt: null
                }
              }
            }
          ]
        }
      });

      console.log(`🔗 Company-Person Linkage:`);
      console.log(`   Companies with people: ${companiesWithPeople}`);
      console.log(`   Companies with people + actions: ${companiesWithPeopleAndActions}`);

      // Accumulate totals
      totalPeople += peopleStats._count.id;
      totalPeopleWithNextActions += peopleWithNextActions;
      totalCompanies += companiesStats._count.id;
      totalCompaniesWithNextActions += companiesWithNextActions;
      totalSpeedrunPeople += speedrunPeople;
      totalSpeedrunPeopleWithTodayActions += speedrunPeopleWithTodayActions;
    }

    // Display overall results
    console.log('\n✅ OVERALL VERIFICATION RESULTS');
    console.log('================================');
    console.log(`📊 People:`);
    console.log(`   Total: ${totalPeople}`);
    console.log(`   With Next Actions: ${totalPeopleWithNextActions}`);
    console.log(`   Completion: ${((totalPeopleWithNextActions / totalPeople) * 100).toFixed(1)}%`);
    console.log(`   Speedrun (Top 50): ${totalSpeedrunPeople} total, ${totalSpeedrunPeopleWithTodayActions} with actions`);

    console.log(`📊 Companies:`);
    console.log(`   Total: ${totalCompanies}`);
    console.log(`   With Next Actions: ${totalCompaniesWithNextActions}`);
    console.log(`   Completion: ${((totalCompaniesWithNextActions / totalCompanies) * 100).toFixed(1)}%`);

    console.log(`📊 Overall:`);
    console.log(`   Total Records: ${totalPeople + totalCompanies}`);
    console.log(`   With Next Actions: ${totalPeopleWithNextActions + totalCompaniesWithNextActions}`);
    console.log(`   Overall Completion: ${(((totalPeopleWithNextActions + totalCompaniesWithNextActions) / (totalPeople + totalCompanies)) * 100).toFixed(1)}%`);

    // Check for any missing next actions
    const missingPeople = totalPeople - totalPeopleWithNextActions;
    const missingCompanies = totalCompanies - totalCompaniesWithNextActions;

    if (missingPeople > 0 || missingCompanies > 0) {
      console.log(`\n⚠️  MISSING NEXT ACTIONS:`);
      if (missingPeople > 0) {
        console.log(`   People missing next actions: ${missingPeople}`);
      }
      if (missingCompanies > 0) {
        console.log(`   Companies missing next actions: ${missingCompanies}`);
      }
    } else {
      console.log(`\n🎉 SUCCESS: All records have next actions!`);
    }

    // Sample some top-ranked records to verify quality
    console.log(`\n🔍 SAMPLE VERIFICATION (Top 10 People):`);
    const topPeople = await prisma.people.findMany({
      where: {
        deletedAt: null,
        globalRank: { lte: 10 }
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        nextAction: true,
        nextActionDate: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 10
    });

    for (const person of topPeople) {
      const dateStr = person.nextActionDate ? person.nextActionDate.toISOString().split('T')[0] : 'No date';
      console.log(`   [Rank ${person.globalRank}] ${person.fullName} (${person.company?.name || 'No company'})`);
      console.log(`      → ${person.nextAction || 'No action'} (${dateStr})`);
    }

    console.log(`\n🔍 SAMPLE VERIFICATION (Top 10 Companies):`);
    const topCompanies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        globalRank: { lte: 10 }
      },
      select: {
        id: true,
        name: true,
        globalRank: true,
        nextAction: true,
        nextActionDate: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 10
    });

    for (const company of topCompanies) {
      const dateStr = company.nextActionDate ? company.nextActionDate.toISOString().split('T')[0] : 'No date';
      console.log(`   [Rank ${company.globalRank}] ${company.name} (${company._count.people} people)`);
      console.log(`      → ${company.nextAction || 'No action'} (${dateStr})`);
    }

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyNextActionsCompletion()
  .then(() => {
    console.log('\n✨ Verification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });
