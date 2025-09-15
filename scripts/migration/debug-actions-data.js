const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugActionsData() {
  console.log('🔍 DEBUGGING ACTIONS DATA');
  console.log('=========================');
  console.log('Examining the actual data structure...\n');

  try {
    // Check what's in the actions table
    console.log('📋 ACTIONS TABLE SAMPLE:');
    const sampleActions = await prisma.$queryRaw`
      SELECT 
        id,
        "personId",
        "companyId",
        subject,
        "completedAt",
        "scheduledAt",
        status
      FROM actions 
      WHERE "personId" IS NOT NULL OR "companyId" IS NOT NULL
      LIMIT 5
    `;
    
    console.log('Sample actions:', JSON.stringify(sampleActions, null, 2));

    // Check people with actions
    console.log('\n📋 PEOPLE WITH ACTIONS:');
    const peopleWithActions = await prisma.$queryRaw`
      SELECT DISTINCT ON (a."personId") 
        a."personId" as id,
        a."subject" as lastAction,
        a."completedAt" as lastActionDate,
        a."status"
      FROM actions a
      WHERE a."personId" IS NOT NULL 
      AND a."completedAt" IS NOT NULL
      AND a."status" = 'completed'
      ORDER BY a."personId", a."completedAt" DESC
      LIMIT 3
    `;
    
    console.log('People with actions:', JSON.stringify(peopleWithActions, null, 2));

    // Check companies with actions
    console.log('\n📋 COMPANIES WITH ACTIONS:');
    const companiesWithActions = await prisma.$queryRaw`
      SELECT DISTINCT ON (a."companyId") 
        a."companyId" as id,
        a."subject" as lastAction,
        a."completedAt" as lastActionDate,
        a."status"
      FROM actions a
      WHERE a."companyId" IS NOT NULL 
      AND a."completedAt" IS NOT NULL
      AND a."status" = 'completed'
      ORDER BY a."companyId", a."completedAt" DESC
      LIMIT 3
    `;
    
    console.log('Companies with actions:', JSON.stringify(companiesWithActions, null, 2));

    // Try to update one person manually
    if (peopleWithActions.length > 0) {
      console.log('\n🧪 TESTING MANUAL UPDATE:');
      const testPerson = peopleWithActions[0];
      console.log('Testing with person:', testPerson.id);
      
      try {
        const result = await prisma.people.update({
          where: { id: testPerson.id },
          data: {
            lastAction: testPerson.lastAction,
            lastActionDate: testPerson.lastActionDate,
            actionStatus: 'completed'
          }
        });
        console.log('✅ Manual update successful:', result.id);
      } catch (error) {
        console.error('❌ Manual update failed:', error.message);
      }
    }

    // Try to update one company manually
    if (companiesWithActions.length > 0) {
      console.log('\n🧪 TESTING MANUAL COMPANY UPDATE:');
      const testCompany = companiesWithActions[0];
      console.log('Testing with company:', testCompany.id);
      
      try {
        const result = await prisma.companies.update({
          where: { id: testCompany.id },
          data: {
            lastAction: testCompany.lastAction,
            lastActionDate: testCompany.lastActionDate,
            actionStatus: 'completed'
          }
        });
        console.log('✅ Manual company update successful:', result.id);
      } catch (error) {
        console.error('❌ Manual company update failed:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugActionsData()
  .then(() => {
    console.log('\n✅ Debug completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  });
