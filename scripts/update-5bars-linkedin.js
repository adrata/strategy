/**
 * 🔗 UPDATE 5BARS SERVICES WITH LINKEDIN URL
 * 
 * Updates the 5Bars Services company record with LinkedIn URL
 */

const { PrismaClient } = require('@prisma/client');

class Update5BarsLinkedIn {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.linkedinUrl = 'https://www.linkedin.com/company/5-bars-services-llc/';
  }

  async execute() {
    console.log('🔗 UPDATING 5BARS SERVICES WITH LINKEDIN URL');
    console.log('============================================');
    console.log(`Company ID: ${this.companyId}`);
    console.log(`LinkedIn URL: ${this.linkedinUrl}`);
    console.log('');

    try {
      // Get current company data
      const currentCompany = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        select: {
          id: true,
          name: true,
          website: true,
          notes: true,
          customFields: true,
          updatedAt: true
        }
      });

      if (!currentCompany) {
        throw new Error('Company not found in database');
      }

      console.log('📊 Current company data:');
      console.log(`   Name: ${currentCompany.name}`);
      console.log(`   Website: ${currentCompany.website || 'None'}`);
      console.log(`   Notes: ${currentCompany.notes || 'None'}`);
      console.log(`   Custom Fields: ${currentCompany.customFields ? 'Present' : 'None'}`);
      console.log(`   Last Updated: ${currentCompany.updatedAt}`);

      // Update with LinkedIn URL in customFields
      const currentCustomFields = currentCompany.customFields || {};
      const updatedCustomFields = {
        ...currentCustomFields,
        linkedinUrl: this.linkedinUrl,
        linkedinCompanyName: '5 Bars Services LLC'
      };

      const updatedCompany = await this.prisma.companies.update({
        where: { id: this.companyId },
        data: {
          customFields: updatedCustomFields,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          website: true,
          notes: true,
          customFields: true,
          updatedAt: true
        }
      });

      console.log('\n✅ Company updated successfully!');
      console.log('📊 Updated company data:');
      console.log(`   Name: ${updatedCompany.name}`);
      console.log(`   Website: ${updatedCompany.website || 'None'}`);
      console.log(`   LinkedIn URL: ${updatedCompany.customFields?.linkedinUrl || 'None'}`);
      console.log(`   LinkedIn Company Name: ${updatedCompany.customFields?.linkedinCompanyName || 'None'}`);
      console.log(`   Last Updated: ${updatedCompany.updatedAt}`);

      return updatedCompany;

    } catch (error) {
      console.error('❌ Update failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Execute the update
async function update5BarsLinkedIn() {
  const updater = new Update5BarsLinkedIn();
  const result = await updater.execute();
  
  console.log('\n🎉 5BARS SERVICES LINKEDIN UPDATE COMPLETE!');
  
  return result;
}

// Export for use
module.exports = { Update5BarsLinkedIn, update5BarsLinkedIn };

// Run if called directly
if (require.main === module) {
  update5BarsLinkedIn().catch(console.error);
}
