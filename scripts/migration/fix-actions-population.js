const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixActionsPopulation() {
  console.log('🔧 FIXING ACTIONS POPULATION');
  console.log('============================');
  console.log('Fixing the data population with proper SQL syntax...\n');

  let stats = {
    peopleUpdated: 0,
    companiesUpdated: 0,
    errors: 0
  };

  try {
    // STEP 1: Populate people action fields with simpler approach
    console.log('🔄 STEP 1: Populating people action fields...');
    
    // Get people with their latest completed action
    const peopleWithLastActions = await prisma.$queryRaw`
      SELECT DISTINCT ON (a."personId") 
        a."personId" as id,
        a."subject" as lastAction,
        a."completedAt" as lastActionDate
      FROM actions a
      WHERE a."personId" IS NOT NULL 
      AND a."completedAt" IS NOT NULL
      AND a."status" = 'completed'
      ORDER BY a."personId", a."completedAt" DESC
    `;
    
    console.log(`Found ${peopleWithLastActions.length} people with completed actions`);
    
    for (const person of peopleWithLastActions) {
      try {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            lastAction: person.lastAction,
            lastActionDate: person.lastActionDate,
            actionStatus: 'completed'
          }
        });
        stats.peopleUpdated++;
        console.log(`  ✅ Updated person ${person.id}: ${person.lastAction}`);
      } catch (error) {
        console.error(`  ❌ Failed to update person ${person.id}:`, error.message);
        stats.errors++;
      }
    }

    // Get people with their next planned action
    const peopleWithNextActions = await prisma.$queryRaw`
      SELECT DISTINCT ON (a."personId") 
        a."personId" as id,
        a."subject" as nextAction,
        a."scheduledAt" as nextActionDate
      FROM actions a
      WHERE a."personId" IS NOT NULL 
      AND a."scheduledAt" IS NOT NULL
      AND a."status" = 'planned'
      ORDER BY a."personId", a."scheduledAt" ASC
    `;
    
    console.log(`Found ${peopleWithNextActions.length} people with planned actions`);
    
    for (const person of peopleWithNextActions) {
      try {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            nextAction: person.nextAction,
            nextActionDate: person.nextActionDate,
            actionStatus: 'pending'
          }
        });
        stats.peopleUpdated++;
        console.log(`  ✅ Updated person ${person.id}: ${person.nextAction}`);
      } catch (error) {
        console.error(`  ❌ Failed to update person ${person.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 2: Populate companies action fields
    console.log('\n🔄 STEP 2: Populating companies action fields...');
    
    // Get companies with their latest completed action
    const companiesWithLastActions = await prisma.$queryRaw`
      SELECT DISTINCT ON (a."companyId") 
        a."companyId" as id,
        a."subject" as lastAction,
        a."completedAt" as lastActionDate
      FROM actions a
      WHERE a."companyId" IS NOT NULL 
      AND a."completedAt" IS NOT NULL
      AND a."status" = 'completed'
      ORDER BY a."companyId", a."completedAt" DESC
    `;
    
    console.log(`Found ${companiesWithLastActions.length} companies with completed actions`);
    
    for (const company of companiesWithLastActions) {
      try {
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            lastAction: company.lastAction,
            lastActionDate: company.lastActionDate,
            actionStatus: 'completed'
          }
        });
        stats.companiesUpdated++;
        console.log(`  ✅ Updated company ${company.id}: ${company.lastAction}`);
      } catch (error) {
        console.error(`  ❌ Failed to update company ${company.id}:`, error.message);
        stats.errors++;
      }
    }

    // Get companies with their next planned action
    const companiesWithNextActions = await prisma.$queryRaw`
      SELECT DISTINCT ON (a."companyId") 
        a."companyId" as id,
        a."subject" as nextAction,
        a."scheduledAt" as nextActionDate
      FROM actions a
      WHERE a."companyId" IS NOT NULL 
      AND a."scheduledAt" IS NOT NULL
      AND a."status" = 'planned'
      ORDER BY a."companyId", a."scheduledAt" ASC
    `;
    
    console.log(`Found ${companiesWithNextActions.length} companies with planned actions`);
    
    for (const company of companiesWithNextActions) {
      try {
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            nextAction: company.nextAction,
            nextActionDate: company.nextActionDate,
            actionStatus: 'pending'
          }
        });
        stats.companiesUpdated++;
        console.log(`  ✅ Updated company ${company.id}: ${company.nextAction}`);
      } catch (error) {
        console.error(`  ❌ Failed to update company ${company.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 3: Summary
    console.log('\n📋 ACTIONS POPULATION SUMMARY');
    console.log('=============================');
    console.log(`People updated: ${stats.peopleUpdated}`);
    console.log(`Companies updated: ${stats.companiesUpdated}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Actions population completed successfully!');
      console.log('People and companies now have their action fields populated.');
    } else {
      console.log('\n⚠️  Population completed with some errors.');
      console.log('Please review the errors above.');
    }

    // STEP 4: Verify the results
    console.log('\n🔍 VERIFICATION:');
    
    const peopleWithActions = await prisma.people.count({
      where: {
        OR: [
          { lastAction: { not: null } },
          { nextAction: { not: null } }
        ]
      }
    });
    
    const companiesWithActions = await prisma.companies.count({
      where: {
        OR: [
          { lastAction: { not: null } },
          { nextAction: { not: null } }
        ]
      }
    });
    
    console.log(`People with action data: ${peopleWithActions}`);
    console.log(`Companies with action data: ${companiesWithActions}`);

  } catch (error) {
    console.error('❌ Population failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixActionsPopulation()
  .then(() => {
    console.log('\n✅ Actions population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Population failed:', error);
    process.exit(1);
  });
