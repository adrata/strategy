const { PrismaClient } = require('@prisma/client');

async function fixLinkedInData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking 5Bars Services LinkedIn data...');
    
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });
    
    console.log('📊 Current data:');
    console.log('Name:', company?.name);
    console.log('CustomFields:', company?.customFields);
    
    // Update LinkedIn URL
    const currentCustomFields = company?.customFields || {};
    const updatedCustomFields = {
      ...currentCustomFields,
      linkedinUrl: 'https://www.linkedin.com/company/5-bars-services-llc/',
      linkedinCompanyName: '5 Bars Services LLC'
    };
    
    console.log('🔧 Updating LinkedIn data...');
    await prisma.companies.update({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      data: {
        customFields: updatedCustomFields
      }
    });
    
    console.log('✅ LinkedIn data updated successfully!');
    console.log('LinkedIn URL:', updatedCustomFields.linkedinUrl);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLinkedInData();
