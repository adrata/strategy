const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMisassignedRoles() {
  console.log('🔧 FIXING MISASSIGNED ROLES FOR GROUP 1 PEOPLE');
  console.log('==============================================');
  console.log('Re-assigning roles for people who should be Decision Makers');
  console.log('');

  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Get all people from Group 1 (Sept 18) who are misassigned
    const misassignedPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        createdAt: {
          gte: new Date('2025-09-18T00:00:00.000Z'),
          lt: new Date('2025-09-19T00:00:00.000Z')
        },
        OR: [
          { buyerGroupRole: 'Stakeholder' },
          { buyerGroupRole: 'Champion' },
          { buyerGroupRole: 'Blocker' },
          { buyerGroupRole: 'Introducer' }
        ]
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        buyerGroupRole: true,
        companyId: true,
        customFields: true
      }
    });

    console.log(`Found ${misassignedPeople.length} Group 1 people to analyze`);

    let fixedCount = 0;
    let decisionMakerCount = 0;

    for (const person of misassignedPeople) {
      const title = (person.jobTitle || '').toLowerCase();
      
      // Check if this person should be a Decision Maker
      const shouldBeDecisionMaker = 
        title.includes('ceo') ||
        title.includes('chief') ||
        title.includes('president') ||
        title.includes('vp') ||
        title.includes('vice president') ||
        title.includes('director') ||
        title.includes('head of') ||
        title.includes('svp') ||
        title.includes('senior vice president') ||
        title.includes('owner') ||
        title.includes('boss');

      if (shouldBeDecisionMaker) {
        console.log(`🔧 Fixing: ${person.fullName} (${person.jobTitle})`);
        console.log(`   Current Role: ${person.buyerGroupRole}`);
        console.log(`   Should Be: Decision Maker`);
        
        // Update the person's role
        await prisma.people.update({
          where: { id: person.id },
          data: {
            buyerGroupRole: 'Decision Maker',
            updatedAt: new Date(),
            customFields: {
              ...person.customFields,
              roleCorrection: {
                originalRole: person.buyerGroupRole,
                correctedRole: 'Decision Maker',
                correctedDate: new Date().toISOString(),
                reason: 'Title-based decision maker identification'
              }
            }
          }
        });

        // Update the buyer group role distribution
        const buyerGroup = await prisma.buyer_groups.findFirst({
          where: {
            companyId: person.companyId,
            workspaceId: workspace.id
          },
          select: {
            id: true,
            customFields: true
          }
        });

        if (buyerGroup) {
          const roleDistribution = buyerGroup.customFields?.roleDistribution || {
            decisionMakers: 0,
            champions: 0,
            stakeholders: 0,
            blockers: 0,
            introducers: 0
          };

          // Decrease the old role count
          if (person.buyerGroupRole === 'Champion') roleDistribution.champions = Math.max(0, roleDistribution.champions - 1);
          else if (person.buyerGroupRole === 'Stakeholder') roleDistribution.stakeholders = Math.max(0, roleDistribution.stakeholders - 1);
          else if (person.buyerGroupRole === 'Blocker') roleDistribution.blockers = Math.max(0, roleDistribution.blockers - 1);
          else if (person.buyerGroupRole === 'Introducer') roleDistribution.introducers = Math.max(0, roleDistribution.introducers - 1);

          // Increase decision maker count
          roleDistribution.decisionMakers = (roleDistribution.decisionMakers || 0) + 1;

          // Update the buyer group
          await prisma.buyer_groups.update({
            where: { id: buyerGroup.id },
            data: {
              customFields: {
                ...buyerGroup.customFields,
                roleDistribution: roleDistribution,
                roleCorrectionDate: new Date().toISOString()
              },
              updatedAt: new Date()
            }
          });

          console.log(`   ✅ Updated buyer group role distribution`);
        }

        fixedCount++;
        decisionMakerCount++;
        console.log('');
      }
    }

    console.log('📊 ROLE CORRECTION SUMMARY:');
    console.log(`   People Analyzed: ${misassignedPeople.length}`);
    console.log(`   Roles Fixed: ${fixedCount}`);
    console.log(`   New Decision Makers: ${decisionMakerCount}`);
    console.log('');

    // Now check how many companies still have no decision makers
    const companiesWithoutDecisionMakers = await prisma.buyer_groups.findMany({
      where: {
        workspaceId: workspace.id,
        customFields: {
          path: ['roleDistribution', 'decisionMakers'],
          equals: 0
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });

    console.log(`📈 REMAINING COMPANIES WITHOUT DECISION MAKERS: ${companiesWithoutDecisionMakers.length}`);
    if (companiesWithoutDecisionMakers.length > 0) {
      console.log('   These companies may need deeper analysis or different search criteria');
    }

  } catch (error) {
    console.error('❌ Error fixing roles:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMisassignedRoles().catch(console.error);
