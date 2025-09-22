#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

class FiveBarsExecutivesCreator {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's workspace
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2'; // 5 Bars Services
  }

  async createExecutives() {
    console.log('🚀 Creating 5 Bars Services executives in database...');
    
    const executives = [
      {
        firstName: 'John',
        lastName: 'Delisi',
        fullName: 'John Delisi',
        title: 'Chief Executive Officer',
        email: 'john.delisi@5bars.net',
        phone: '800.905.7221',
        department: 'Executive',
        companyId: this.companyId,
        workspaceId: this.workspaceId,
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
        companyId: this.companyId,
        workspaceId: this.workspaceId,
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
        const existingPerson = await this.prisma.people.findFirst({
          where: {
            fullName: executive.fullName,
            workspaceId: this.workspaceId
          }
        });

        if (existingPerson) {
          console.log(`✅ ${executive.fullName} already exists (ID: ${existingPerson.id})`);
          
          // Update the existing person with company association
          await this.prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              companyId: this.companyId,
              customFields: {
                ...existingPerson.customFields,
                ...executive.customFields
              }
            }
          });
          console.log(`🔄 Updated ${executive.fullName} with company association`);
        } else {
          // Create new person
          const person = await this.prisma.people.create({
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
          companyId: this.companyId,
          workspaceId: this.workspaceId,
          tags: ['Buyer Group Member', 'Cold Relationship'],
          customFields: executive.customFields
        };

        // Check if prospect already exists
        const existingProspect = await this.prisma.prospects.findFirst({
          where: {
            fullName: executive.fullName,
            workspaceId: this.workspaceId
          }
        });

        if (!existingProspect) {
          const prospect = await this.prisma.prospects.create({
            data: prospectData
          });
          console.log(`✅ Created prospect record for ${executive.fullName} (ID: ${prospect.id})`);
        } else {
          console.log(`✅ Prospect record for ${executive.fullName} already exists`);
        }

      } catch (error) {
        console.error(`❌ Error creating ${executive.fullName}:`, error);
      }
    }

    console.log('🎉 Executive creation process completed!');
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Run the script
async function main() {
  const creator = new FiveBarsExecutivesCreator();
  try {
    await creator.createExecutives();
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await creator.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = FiveBarsExecutivesCreator;
