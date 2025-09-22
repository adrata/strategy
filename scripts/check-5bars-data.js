const { PrismaClient } = require('@prisma/client');

async function checkAndUpdate5BarsData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking 5Bars Services data...');
    
    const company = await prisma.companies.findUnique({
      where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
      select: {
        id: true,
        name: true,
        website: true,
        description: true,
        customFields: true
      }
    });
    
    console.log('📊 Current data:');
    console.log('Name:', company?.name);
    console.log('Website:', company?.website);
    console.log('Description:', company?.description ? 'EXISTS' : 'MISSING');
    console.log('LinkedIn URL:', company?.customFields?.linkedinUrl);
    
    // Update website if missing
    if (!company?.website) {
      console.log('🔧 Updating website...');
      await prisma.companies.update({
        where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
        data: {
          website: 'https://www.5bars.net'
        }
      });
      console.log('✅ Website updated to: https://www.5bars.net');
    }
    
    // Update LinkedIn if missing
    if (!company?.customFields?.linkedinUrl) {
      console.log('🔧 Updating LinkedIn...');
      const currentCustomFields = company?.customFields || {};
      await prisma.companies.update({
        where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
        data: {
          customFields: {
            ...currentCustomFields,
            linkedinUrl: 'https://www.linkedin.com/company/5-bars-services-llc/',
            linkedinCompanyName: '5 Bars Services LLC'
          }
        }
      });
      console.log('✅ LinkedIn updated');
    }
    
    // Update description if missing
    if (!company?.description) {
      console.log('🔧 Updating description...');
      const strategicDescription = '5 Bars Services is a 10-year telecom infrastructure specialist serving Texas and New Jersey markets, specializing in fiber and wireless infrastructure optimization for telecommunications companies. Their key services include underground infrastructure, fiber installation, small cell & DAS deployment, directional drilling, and structured cabling. As a privately held company with 13 employees across multiple locations (primary headquarters in Frisco, TX), they serve a growing customer base in the telecommunications sector with comprehensive construction services tailored to telecom infrastructure needs.';
      
      await prisma.companies.update({
        where: { id: '01K5D5VGQ35SXGBPK5F2WSMFM2' },
        data: {
          description: strategicDescription
        }
      });
      console.log('✅ Description updated');
    }
    
    console.log('🎉 All data updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdate5BarsData();
