#!/usr/bin/env node

/**
 * 🔄 UPDATE YUQIANG TANG DATA
 * 
 * Update Yuqiang Tang's record with missing data found in raw export
 */

const { PrismaClient } = require('@prisma/client');

class YuqiangTangUpdater {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async updateYuqiangTangData() {
    console.log('🔄 UPDATING YUQIANG TANG DATA');
    console.log('=============================');
    
    try {
      // Get current data
      const currentPerson = await this.prisma.people.findUnique({
        where: { id: '01K5D6B8YE869KSN9NXKFRMV3Q' },
        include: { company: true }
      });

      if (!currentPerson) {
        console.log('❌ Person not found');
        return;
      }

      console.log('📊 CURRENT DATA:');
      console.log('================');
      console.log('Full Name:', currentPerson.fullName);
      console.log('Work Email:', currentPerson.workEmail || 'Not available');
      console.log('Address:', currentPerson.address || 'Not available');
      console.log('City:', currentPerson.city || 'Not available');
      console.log('State:', currentPerson.state || 'Not available');
      console.log('Postal Code:', currentPerson.postalCode || 'Not available');
      console.log('Tags:', currentPerson.tags || 'None');
      console.log('');

      // Update with missing data from raw export
      const updatedPerson = await this.prisma.people.update({
        where: { id: '01K5D6B8YE869KSN9NXKFRMV3Q' },
        data: {
          workEmail: 'yuqiang.tang@sce.com',
          address: 'P.O. Box 800',
          city: 'Rosemead',
          state: 'CA',
          country: 'United States',
          postalCode: '91770-0800',
          tags: ['25 UTC National Attendee'],
          updatedAt: new Date()
        }
      });

      console.log('✅ UPDATED DATA:');
      console.log('================');
      console.log('Full Name:', updatedPerson.fullName);
      console.log('Work Email:', updatedPerson.workEmail);
      console.log('Address:', updatedPerson.address);
      console.log('City:', updatedPerson.city);
      console.log('State:', updatedPerson.state);
      console.log('Country:', updatedPerson.country);
      console.log('Postal Code:', updatedPerson.postalCode);
      console.log('Tags:', updatedPerson.tags);
      console.log('Updated At:', updatedPerson.updatedAt);
      console.log('');

      console.log('🎯 SUMMARY OF CHANGES:');
      console.log('======================');
      console.log('✅ Added work email: yuqiang.tang@sce.com');
      console.log('✅ Added address: P.O. Box 800, Rosemead, CA 91770-0800');
      console.log('✅ Added tags: [\"25 UTC National Attendee\"]');
      console.log('✅ Updated timestamp:', updatedPerson.updatedAt);

      // Also check if we can find more info about his role
      console.log('\\n🔍 ADDITIONAL INSIGHTS:');
      console.log('========================');
      console.log('📧 Email Domain: sce.com (Southern California Edison)');
      console.log('🏢 Company: Southern California Edison Company');
      console.log('📍 Location: Rosemead, CA (SCE headquarters area)');
      console.log('🏷️ Tags: 25 UTC National Attendee (likely attended UTC conference)');
      console.log('📞 Phone: (949) 462-5448 (Orange County area code)');

    } catch (error) {
      console.error('❌ Error updating data:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the update
async function main() {
  const updater = new YuqiangTangUpdater();
  await updater.updateYuqiangTangData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = YuqiangTangUpdater;
