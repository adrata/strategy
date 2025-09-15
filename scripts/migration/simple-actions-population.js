const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simpleActionsPopulation() {
  console.log('🔧 SIMPLE ACTIONS POPULATION');
  console.log('============================');
  console.log('Populating action fields with proper undefined handling...\n');

  let stats = {
    peopleUpdated: 0,
    companiesUpdated: 0,
    errors: 0
  };

  try {
    // STEP 1: Update people with their latest completed action
    console.log('🔄 STEP 1: Updating people with completed actions...');
    
    const peopleWithCompletedActions = await prisma.$queryRaw`
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
    
    console.log(`Found ${peopleWithCompletedActions.length} people with completed actions`);
    
    for (const person of peopleWithCompletedActions) {
      if (person.id && person.lastaction && person.lastactiondate) {
        try {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              lastAction: person.lastaction,
              lastActionDate: person.lastactiondate,
              actionStatus: 'completed'
            }
          });
          stats.peopleUpdated++;
          console.log(`  ✅ Updated person ${person.id}: ${person.lastaction}`);
        } catch (error) {
          console.error(`  ❌ Failed to update person ${person.id}:`, error.message);
          stats.errors++;
        }
      }
    }

    // STEP 2: Update people with their next planned action
    console.log('\n🔄 STEP 2: Updating people with planned actions...');
    
    const peopleWithPlannedActions = await prisma.$queryRaw`
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
    
    console.log(`Found ${peopleWithPlannedActions.length} people with planned actions`);
    
    for (const person of peopleWithPlannedActions) {
      if (person.id && person.nextaction && person.nextactiondate) {
        try {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              nextAction: person.nextaction,
              nextActionDate: person.nextactiondate,
              actionStatus: 'pending'
            }
          });
          stats.peopleUpdated++;
          console.log(`  ✅ Updated person ${person.id}: ${person.nextaction}`);
        } catch (error) {
          console.error(`  ❌ Failed to update person ${person.id}:`, error.message);
          stats.errors++;
        }
      }
    }

    // STEP 3: Update companies with their latest completed action
    console.log('\n🔄 STEP 3: Updating companies with completed actions...');
    
    const companiesWithCompletedActions = await prisma.$queryRaw`
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
    
    console.log(`Found ${companiesWithCompletedActions.length} companies with completed actions`);
    
    for (const company of companiesWithCompletedActions) {
      if (company.id && company.lastaction && company.lastactiondate) {
        try {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              lastAction: company.lastaction,
              lastActionDate: company.lastactiondate,
              actionStatus: 'completed'
            }
          });
          stats.companiesUpdated++;
          console.log(`  ✅ Updated company ${company.id}: ${company.lastaction}`);
        } catch (error) {
          console.error(`  ❌ Failed to update company ${company.id}:`, error.message);
          stats.errors++;
        }
      }
    }

    // STEP 4: Update companies with their next planned action
    console.log('\n🔄 STEP 4: Updating companies with planned actions...');
    
    const companiesWithPlannedActions = await prisma.$queryRaw`
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
    
    console.log(`Found ${companiesWithPlannedActions.length} companies with planned actions`);
    
    for (const company of companiesWithPlannedActions) {
      if (company.id && company.nextaction && company.nextactiondate) {
        try {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              nextAction: company.nextaction,
              nextActionDate: company.nextactiondate,
              actionStatus: 'pending'
            }
          });
          stats.companiesUpdated++;
          console.log(`  ✅ Updated company ${company.id}: ${company.nextaction}`);
        } catch (error) {
          console.error(`  ❌ Failed to update company ${company.id}:`, error.message);
          stats.errors++;
        }
      }
    }

    // STEP 5: Summary
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

    // STEP 6: Verification
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

simpleActionsPopulation()
  .then(() => {
    console.log('\n✅ Actions population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Population failed:', error);
    process.exit(1);
  });
