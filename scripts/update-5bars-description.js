/**
 * 📝 UPDATE 5BARS SERVICES DESCRIPTION
 * 
 * Updates the company description with the rich CoreSignal data
 */

const { PrismaClient } = require('@prisma/client');

class Update5BarsDescription {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    
    // Rich description from CoreSignal data
    this.description = `5 Bars Services is a single resource for the optimization of fiber infrastructure by connecting both structured cable and wireless infrastructure with expert engineering, installation, and maintenance. 

Today, we provide engineering and installation services for all transmission mediums including copper twisted pair, coax, fiber optic, and wireless to our growing customer base.

Founded in 2015, 5 Bars Services specializes in providing comprehensive construction services tailored to the telecommunications industry. They offer top-notch cabling services designed to enhance the connectivity and efficiency of telecommunications systems, including:

• Underground infrastructure
• Fiber installation
• Small cell & DAS installation
• Directional drilling
• Excavating & trenching
• Cable pulling & fiber blowing
• Duct proofing
• Maintenance & repair
• Structured cabling
• Manhole surveying
• Copper/fiber splicing
• Network design
• Construction services

The company operates from multiple locations across Texas and New Jersey, with their headquarters at 5 Cowboys Way, Suite 300 in Frisco, Texas. As a privately held company with 13 employees, they serve a growing customer base in the telecommunications sector.`;
  }

  async execute() {
    console.log('📝 UPDATING 5BARS SERVICES DESCRIPTION');
    console.log('=====================================');
    console.log(`Company ID: ${this.companyId}`);
    console.log('');

    try {
      // Get current company data
      const currentCompany = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true
        }
      });

      if (!currentCompany) {
        throw new Error('Company not found in database');
      }

      console.log('📊 Current company data:');
      console.log(`   Name: ${currentCompany.name}`);
      console.log(`   Current Description: ${currentCompany.description || 'None'}`);
      console.log(`   Last Updated: ${currentCompany.updatedAt}`);

      // Update with rich description
      const updatedCompany = await this.prisma.companies.update({
        where: { id: this.companyId },
        data: {
          description: this.description,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          description: true,
          updatedAt: true
        }
      });

      console.log('\n✅ Company description updated successfully!');
      console.log('📊 Updated company data:');
      console.log(`   Name: ${updatedCompany.name}`);
      console.log(`   Description Length: ${updatedCompany.description?.length || 0} characters`);
      console.log(`   Last Updated: ${updatedCompany.updatedAt}`);
      
      console.log('\n📝 New Description Preview:');
      console.log('=====================================');
      console.log(updatedCompany.description?.substring(0, 200) + '...');
      console.log('=====================================');

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
async function update5BarsDescription() {
  const updater = new Update5BarsDescription();
  const result = await updater.execute();
  
  console.log('\n🎉 5BARS SERVICES DESCRIPTION UPDATE COMPLETE!');
  console.log('The company profile should now show the rich description in the Overview page.');
  
  return result;
}

// Export for use
module.exports = { Update5BarsDescription, update5BarsDescription };

// Run if called directly
if (require.main === module) {
  update5BarsDescription().catch(console.error);
}
