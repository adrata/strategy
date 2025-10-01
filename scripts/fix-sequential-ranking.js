require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSequentialRanking() {
  try {
    console.log('🏆 Fixing Sequential Ranking for All Record Types...\n');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP workspace ID

    // Fix People ranking
    console.log('👥 Fixing People ranking...');
    const people = await prisma.people.findMany({
      where: { workspaceId },
      orderBy: [{ updatedAt: 'desc' }], // Sort by most recent first
      select: { id: true, fullName: true, rank: true }
    });

    console.log(`Found ${people.length} people records`);

    // Update people with sequential ranks
    for (let i = 0; i < people.length; i++) {
      await prisma.people.update({
        where: { id: people[i].id },
        data: { rank: i + 1 }
      });
    }

    console.log(`✅ Updated ${people.length} people with sequential ranks (1-${people.length})`);

    // Fix Leads ranking
    console.log('\n🎯 Fixing Leads ranking...');
    const leads = await prisma.leads.findMany({
      where: { workspaceId },
      orderBy: [{ updatedAt: 'desc' }], // Sort by most recent first
      select: { id: true, fullName: true, rank: true }
    });

    console.log(`Found ${leads.length} leads records`);

    // Update leads with sequential ranks
    for (let i = 0; i < leads.length; i++) {
      await prisma.leads.update({
        where: { id: leads[i].id },
        data: { rank: i + 1 }
      });
    }

    console.log(`✅ Updated ${leads.length} leads with sequential ranks (1-${leads.length})`);

    // Fix Prospects ranking
    console.log('\n💼 Fixing Prospects ranking...');
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId },
      orderBy: [{ updatedAt: 'desc' }], // Sort by most recent first
      select: { id: true, fullName: true, rank: true }
    });

    console.log(`Found ${prospects.length} prospects records`);

    // Update prospects with sequential ranks
    for (let i = 0; i < prospects.length; i++) {
      await prisma.prospects.update({
        where: { id: prospects[i].id },
        data: { rank: i + 1 }
      });
    }

    console.log(`✅ Updated ${prospects.length} prospects with sequential ranks (1-${prospects.length})`);

    // Fix Companies ranking
    console.log('\n🏢 Fixing Companies ranking...');
    const companies = await prisma.companies.findMany({
      where: { workspaceId },
      orderBy: [{ updatedAt: 'desc' }], // Sort by most recent first
      select: { id: true, name: true, rank: true }
    });

    console.log(`Found ${companies.length} companies records`);

    // Update companies with sequential ranks
    for (let i = 0; i < companies.length; i++) {
      await prisma.companies.update({
        where: { id: companies[i].id },
        data: { rank: i + 1 }
      });
    }

    console.log(`✅ Updated ${companies.length} companies with sequential ranks (1-${companies.length})`);

    // Verify the fixes
    console.log('\n🔍 Verifying ranking fixes...');
    
    const samplePeople = await prisma.people.findMany({
      where: { workspaceId },
      orderBy: [{ rank: 'asc' }],
      take: 5,
      select: { fullName: true, rank: true }
    });

    const sampleLeads = await prisma.leads.findMany({
      where: { workspaceId },
      orderBy: [{ rank: 'asc' }],
      take: 5,
      select: { fullName: true, rank: true }
    });

    const sampleProspects = await prisma.prospects.findMany({
      where: { workspaceId },
      orderBy: [{ rank: 'asc' }],
      take: 5,
      select: { fullName: true, rank: true }
    });

    console.log('\n📊 Sample People (should be 1, 2, 3, 4, 5):');
    samplePeople.forEach(p => console.log(`  ${p.rank}. ${p.fullName}`));

    console.log('\n📊 Sample Leads (should be 1, 2, 3, 4, 5):');
    sampleLeads.forEach(l => console.log(`  ${l.rank}. ${l.fullName}`));

    console.log('\n📊 Sample Prospects (should be 1, 2, 3, 4, 5):');
    sampleProspects.forEach(p => console.log(`  ${p.rank}. ${p.fullName}`));

    console.log('\n🎉 Sequential ranking fix complete!');
    console.log('All records should now display in proper sequential order (1, 2, 3, 4, 5...).');

  } catch (error) {
    console.error('❌ Error fixing sequential ranking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSequentialRanking();
