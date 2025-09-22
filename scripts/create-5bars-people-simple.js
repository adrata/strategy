const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createPeople() {
  console.log('Creating 5 Bars Services people...');
  
  const people = [
    {
      firstName: 'John',
      lastName: 'Delisi',
      fullName: 'John Delisi',
      title: 'Chief Executive Officer',
      email: 'john.delisi@5bars.net',
      phone: '800.905.7221',
      companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
      customFields: {
        coresignalId: '770302196',
        buyerGroupRole: 'Decision Maker',
        dataSource: 'External'
      }
    },
    {
      firstName: 'Dustin',
      lastName: 'Stephens',
      fullName: 'Dustin Stephens',
      title: 'Project Director',
      email: 'dustin.stephens@5bars.net',
      phone: '800.905.7221',
      companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
      customFields: {
        coresignalId: '770302197',
        buyerGroupRole: 'Champion',
        dataSource: 'External'
      }
    }
  ];

  for (const personData of people) {
    try {
      // Check if exists
      const existing = await prisma.people.findFirst({
        where: { fullName: personData.fullName }
      });

      if (existing) {
        console.log(`✅ ${personData.fullName} already exists`);
        // Update with company association
        await prisma.people.update({
          where: { id: existing.id },
          data: { companyId: personData.companyId }
        });
      } else {
        const person = await prisma.people.create({ data: personData });
        console.log(`✅ Created ${personData.fullName} (ID: ${person.id})`);
      }
    } catch (error) {
      console.error(`❌ Error with ${personData.fullName}:`, error.message);
    }
  }

  await prisma.$disconnect();
  console.log('Done!');
}

createPeople().catch(console.error);
