const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    // Check Southern Company
    const southern = await prisma.companies.findUnique({
      where: { id: '01K9QD2ST0C0TTG34EMRD3M69H' },
      select: {
        name: true,
        industry: true,
        description: true,
        descriptionEnriched: true,
        domain: true,
      },
    });

    console.log('=== SOUTHERN COMPANY ===');
    if (southern) {
      console.log('Name:', southern.name);
      console.log('Industry:', southern.industry);
      console.log('Domain:', southern.domain);
      console.log('Description:', southern.description ? southern.description.substring(0, 100) + '...' : 'NULL');
      console.log('Description Enriched:', southern.descriptionEnriched ? southern.descriptionEnriched.substring(0, 100) + '...' : 'NULL');
      
      const hasBadContent = 
        (southern.description && (southern.description.includes('ישראל') || southern.description.includes('כפר נופש'))) ||
        (southern.descriptionEnriched && (southern.descriptionEnriched.includes('ישראל') || southern.descriptionEnriched.includes('כפר נופש')));
      
      console.log('\nHas Israeli/resort content:', hasBadContent ? 'YES - ISSUE EXISTS' : 'NO - FIXED ✅');
    } else {
      console.log('Company not found');
    }

    // Check for any companies with Israeli content
    const withBadContent = await prisma.companies.findMany({
      where: {
        workspaceId: '01K75ZD7DWHG1XF16HAF2YVKCK',
        deletedAt: null,
        OR: [
          { description: { contains: 'ישראל' } },
          { description: { contains: 'כפר נופש' } },
          { descriptionEnriched: { contains: 'ישראל' } },
          { descriptionEnriched: { contains: 'כפר נופש' } },
        ],
      },
      select: { name: true },
      take: 10,
    });

    console.log('\n=== DATABASE STATUS ===');
    console.log('Companies with Israeli/resort content:', withBadContent.length);
    if (withBadContent.length > 0) {
      console.log('Companies:', withBadContent.map(c => c.name).join(', '));
    } else {
      console.log('✅ No companies with Israeli/resort content found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();

