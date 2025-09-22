const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPeople() {
  console.log('🔍 Checking for 5 Bars Services people...');
  
  try {
    // Check for people with company ID
    const people = await prisma.people.findMany({
      where: {
        companyId: '01K5D5VGQ35SXGBPK5F2WSMFM2'
      }
    });
    
    console.log(`Found ${people.length} people for 5 Bars Services:`);
    people.forEach(person => {
      console.log(`- ${person.fullName} (${person.title}) - ID: ${person.id}`);
    });
    
    // Check for people by name
    const johnDelisi = await prisma.people.findFirst({
      where: {
        fullName: 'John Delisi'
      }
    });
    
    const dustinStephens = await prisma.people.findFirst({
      where: {
        fullName: 'Dustin Stephens'
      }
    });
    
    console.log('\n🔍 Checking specific executives:');
    console.log(`John Delisi: ${johnDelisi ? `Found (ID: ${johnDelisi.id})` : 'Not found'}`);
    console.log(`Dustin Stephens: ${dustinStephens ? `Found (ID: ${dustinStephens.id})` : 'Not found'}`);
    
    // Check prospects
    const prospects = await prisma.prospects.findMany({
      where: {
        company: '5 Bars Services, LLC'
      }
    });
    
    console.log(`\nFound ${prospects.length} prospects for 5 Bars Services:`);
    prospects.forEach(prospect => {
      console.log(`- ${prospect.fullName} (${prospect.title}) - ID: ${prospect.id}`);
    });
    
  } catch (error) {
    console.error('Error checking people:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeople();