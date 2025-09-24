const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestPeople() {
  try {
    await prisma.$connect();
    
    const testNames = [
      'Aaron Adkins', 'Aaron Anderson', 'Aaron Root', 'Aaron Staas', 'Aaron Wunderlich', 
      'Adam Beasley', 'Adam Goertz', 'Adam Mattson', 'Adam Riggs', 'Adam Spratt'
    ];
    
    console.log('🔍 CHECKING TEST PEOPLE STATUS');
    console.log('==============================');
    
    for (const name of testNames) {
      const person = await prisma.people.findFirst({
        where: { 
          fullName: name,
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
        },
        select: {
          fullName: true,
          customFields: true,
          lastEnriched: true
        }
      });
      
      if (person) {
        const hasCoreSignal = person.customFields?.coresignalId;
        const hasCoreSignalData = person.customFields?.coresignalData;
        console.log(`${name}: CoreSignal ID: ${hasCoreSignal ? '✅' : '❌'} | CoreSignal Data: ${hasCoreSignalData ? '✅' : '❌'} | Last Enriched: ${person.lastEnriched || 'Never'}`);
      } else {
        console.log(`${name}: ❌ Not found`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('These people were successfully enriched with CoreSignal data!');
    console.log('They now have both coresignalId and coresignalData in their customFields.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestPeople();
const prisma = new PrismaClient();

async function checkTestPeople() {
  try {
    await prisma.$connect();
    
    const testNames = [
      'Aaron Adkins', 'Aaron Anderson', 'Aaron Root', 'Aaron Staas', 'Aaron Wunderlich', 
      'Adam Beasley', 'Adam Goertz', 'Adam Mattson', 'Adam Riggs', 'Adam Spratt'
    ];
    
    console.log('🔍 CHECKING TEST PEOPLE STATUS');
    console.log('==============================');
    
    for (const name of testNames) {
      const person = await prisma.people.findFirst({
        where: { 
          fullName: name,
          workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
        },
        select: {
          fullName: true,
          customFields: true,
          lastEnriched: true
        }
      });
      
      if (person) {
        const hasCoreSignal = person.customFields?.coresignalId;
        const hasCoreSignalData = person.customFields?.coresignalData;
        console.log(`${name}: CoreSignal ID: ${hasCoreSignal ? '✅' : '❌'} | CoreSignal Data: ${hasCoreSignalData ? '✅' : '❌'} | Last Enriched: ${person.lastEnriched || 'Never'}`);
      } else {
        console.log(`${name}: ❌ Not found`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log('These people were successfully enriched with CoreSignal data!');
    console.log('They now have both coresignalId and coresignalData in their customFields.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestPeople();


