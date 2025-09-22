const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createExecutives() {
  console.log('Creating 5 Bars Services executives...');
  
  const executives = [
    {
      firstName: 'John',
      lastName: 'Delisi',
      fullName: 'John Delisi',
      title: 'Chief Executive Officer',
      email: 'john.delisi@5bars.net',
      phone: '800.905.7221',
      department: 'Executive',
      companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
      tags: ['Buyer Group Member', 'Decision Maker', 'CEO'],
      customFields: {
        coresignalId: '770302196',
        buyerGroupRole: 'Decision Maker',
        influenceLevel: 'High',
        engagementPriority: 'High',
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
      department: 'Operations',
      companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
      workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
      tags: ['Buyer Group Member', 'Champion', 'Project Director'],
      customFields: {
        coresignalId: '770302197',
        buyerGroupRole: 'Champion',
        influenceLevel: 'High',
        engagementPriority: 'High',
        dataSource: 'External'
      }
    }
  ];

  for (const executive of executives) {
    try {
      // Check if person already exists
      const existing = await prisma.people.findFirst({
        where: {
          fullName: executive.fullName,
          workspaceId: executive.workspaceId
        }
      });

      if (existing) {
        console.log(`✅ ${executive.fullName} already exists (ID: ${existing.id})`);
        
        // Update with company association
        await prisma.people.update({
          where: { id: existing.id },
          data: {
            companyId: executive.companyId,
            customFields: {
              ...existing.customFields,
              ...executive.customFields
            }
          }
        });
      } else {
        // Create new person
        const person = await prisma.people.create({
          data: executive
        });
        console.log(`✅ Created ${executive.fullName} (ID: ${person.id})`);
      }

      // Create prospect record
      const prospectData = {
        firstName: executive.firstName,
        lastName: executive.lastName,
        fullName: executive.fullName,
        title: executive.title,
        email: executive.email,
        phone: executive.phone,
        company: '5 Bars Services, LLC',
        companyId: executive.companyId,
        workspaceId: executive.workspaceId,
        tags: ['Buyer Group Member', 'Cold Relationship'],
        customFields: executive.customFields
      };

      const existingProspect = await prisma.prospects.findFirst({
        where: {
          fullName: executive.fullName,
          workspaceId: executive.workspaceId
        }
      });

      if (!existingProspect) {
        const prospect = await prisma.prospects.create({
          data: prospectData
        });
        console.log(`✅ Created prospect for ${executive.fullName} (ID: ${prospect.id})`);
      } else {
        console.log(`✅ Prospect for ${executive.fullName} already exists`);
      }

    } catch (error) {
      console.error(`❌ Error with ${executive.fullName}:`, error);
    }
  }

  console.log('🎉 Executive creation completed!');
  await prisma.$disconnect();
}

createExecutives().catch(console.error);
