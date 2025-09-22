const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPeople() {
  console.log('🔧 Fixing 5 Bars Services people records...');
  
  try {
    // First, check what people exist
    const existingPeople = await prisma.people.findMany({
      where: {
        OR: [
          { fullName: 'John Delisi' },
          { fullName: 'Dustin Stephens' },
          { companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2' }
        ]
      }
    });
    
    console.log(`Found ${existingPeople.length} existing people:`);
    existingPeople.forEach(person => {
      console.log(`- ${person.fullName} (ID: ${person.id}, Company ID: ${person.companyId})`);
    });
    
    // Create or update John Delisi
    const johnData = {
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
    };
    
    const john = await prisma.people.upsert({
      where: { fullName: 'John Delisi' },
      update: { 
        companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
        customFields: johnData.customFields
      },
      create: johnData
    });
    
    console.log(`✅ John Delisi: ${john.id}`);
    
    // Create or update Dustin Stephens
    const dustinData = {
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
    };
    
    const dustin = await prisma.people.upsert({
      where: { fullName: 'Dustin Stephens' },
      update: { 
        companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2',
        customFields: dustinData.customFields
      },
      create: dustinData
    });
    
    console.log(`✅ Dustin Stephens: ${dustin.id}`);
    
    // Verify the records
    const finalCheck = await prisma.people.findMany({
      where: { companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2' }
    });
    
    console.log(`\n🎉 Final verification: ${finalCheck.length} people for 5 Bars Services:`);
    finalCheck.forEach(person => {
      console.log(`- ${person.fullName} (${person.title}) - ID: ${person.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPeople();
