const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function implementActionsArchitecture() {
  console.log('🚀 IMPLEMENTING ACTIONS ARCHITECTURE');
  console.log('====================================');
  console.log('Migrating to optimal actions-based data model...\n');

  let stats = {
    activitiesRenamed: 0,
    actionFieldsAdded: 0,
    peopleUpdated: 0,
    companiesUpdated: 0,
    deprecatedTablesRemoved: 0,
    errors: 0
  };

  try {
    // STEP 1: Rename activities table to actions
    console.log('🔄 STEP 1: Renaming activities table to actions...');
    
    try {
      // Check if actions table already exists
      const actionsExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'actions'
        );
      `;
      
      if (!actionsExists[0].exists) {
        // Rename activities table to actions
        await prisma.$executeRawUnsafe(`ALTER TABLE activities RENAME TO actions;`);
        console.log('✅ Successfully renamed activities table to actions');
        stats.activitiesRenamed = 1;
      } else {
        console.log('ℹ️  Actions table already exists, skipping rename');
      }
    } catch (error) {
      console.error('❌ Failed to rename activities table:', error.message);
      stats.errors++;
    }

    // STEP 2: Add action fields to people table
    console.log('\n🔄 STEP 2: Adding action fields to people table...');
    
    try {
      // Check if fields already exist
      const peopleColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'people' 
        AND column_name IN ('lastAction', 'lastActionDate', 'nextAction', 'nextActionDate', 'actionStatus');
      `;
      
      const existingFields = peopleColumns.map(col => col.column_name);
      
      if (!existingFields.includes('lastAction')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE people ADD COLUMN "lastAction" TEXT;`);
        console.log('✅ Added lastAction field to people table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('lastActionDate')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE people ADD COLUMN "lastActionDate" TIMESTAMP;`);
        console.log('✅ Added lastActionDate field to people table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('nextAction')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE people ADD COLUMN "nextAction" TEXT;`);
        console.log('✅ Added nextAction field to people table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('nextActionDate')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE people ADD COLUMN "nextActionDate" TIMESTAMP;`);
        console.log('✅ Added nextActionDate field to people table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('actionStatus')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE people ADD COLUMN "actionStatus" TEXT;`);
        console.log('✅ Added actionStatus field to people table');
        stats.actionFieldsAdded++;
      }
      
    } catch (error) {
      console.error('❌ Failed to add action fields to people table:', error.message);
      stats.errors++;
    }

    // STEP 3: Add action fields to companies table
    console.log('\n🔄 STEP 3: Adding action fields to companies table...');
    
    try {
      // Check if fields already exist
      const companiesColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        AND column_name IN ('lastAction', 'lastActionDate', 'nextAction', 'nextActionDate', 'actionStatus');
      `;
      
      const existingFields = companiesColumns.map(col => col.column_name);
      
      if (!existingFields.includes('lastAction')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE companies ADD COLUMN "lastAction" TEXT;`);
        console.log('✅ Added lastAction field to companies table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('lastActionDate')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE companies ADD COLUMN "lastActionDate" TIMESTAMP;`);
        console.log('✅ Added lastActionDate field to companies table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('nextAction')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE companies ADD COLUMN "nextAction" TEXT;`);
        console.log('✅ Added nextAction field to companies table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('nextActionDate')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE companies ADD COLUMN "nextActionDate" TIMESTAMP;`);
        console.log('✅ Added nextActionDate field to companies table');
        stats.actionFieldsAdded++;
      }
      
      if (!existingFields.includes('actionStatus')) {
        await prisma.$executeRawUnsafe(`ALTER TABLE companies ADD COLUMN "actionStatus" TEXT;`);
        console.log('✅ Added actionStatus field to companies table');
        stats.actionFieldsAdded++;
      }
      
    } catch (error) {
      console.error('❌ Failed to add action fields to companies table:', error.message);
      stats.errors++;
    }

    // STEP 4: Populate action fields from existing actions data
    console.log('\n🔄 STEP 4: Populating action fields from existing data...');
    
    try {
      // Update people with their last and next actions
      const peopleWithActions = await prisma.$queryRaw`
        SELECT 
          p.id,
          p."fullName",
          last_action."lastAction",
          last_action."lastActionDate",
          next_action."nextAction",
          next_action."nextActionDate"
        FROM people p
        LEFT JOIN (
          SELECT 
            "personId",
            "subject" as "lastAction",
            "completedAt" as "lastActionDate"
          FROM actions 
          WHERE "personId" IS NOT NULL 
          AND "completedAt" IS NOT NULL
          AND "status" = 'completed'
          ORDER BY "completedAt" DESC
        ) last_action ON p.id = last_action."personId"
        LEFT JOIN (
          SELECT 
            "personId",
            "subject" as "nextAction",
            "scheduledAt" as "nextActionDate"
          FROM actions 
          WHERE "personId" IS NOT NULL 
          AND "scheduledAt" IS NOT NULL
          AND "status" = 'planned'
          ORDER BY "scheduledAt" ASC
        ) next_action ON p.id = next_action."personId"
        WHERE last_action."personId" IS NOT NULL OR next_action."personId" IS NOT NULL
      `;
      
      for (const person of peopleWithActions) {
        try {
          await prisma.$executeRawUnsafe(`
            UPDATE people 
            SET 
              "lastAction" = $1,
              "lastActionDate" = $2,
              "nextAction" = $3,
              "nextActionDate" = $4,
              "actionStatus" = CASE 
                WHEN $3 IS NOT NULL THEN 'pending'
                WHEN $1 IS NOT NULL THEN 'completed'
                ELSE NULL
              END
            WHERE id = $5
          `, [
            person.lastAction,
            person.lastActionDate,
            person.nextAction,
            person.nextActionDate,
            person.id
          ]);
          stats.peopleUpdated++;
        } catch (error) {
          console.error(`❌ Failed to update person ${person.id}:`, error.message);
          stats.errors++;
        }
      }
      
      console.log(`✅ Updated ${stats.peopleUpdated} people with action data`);
      
    } catch (error) {
      console.error('❌ Failed to populate people action fields:', error.message);
      stats.errors++;
    }

    // Update companies with their last and next actions
    try {
      const companiesWithActions = await prisma.$queryRaw`
        SELECT 
          c.id,
          c.name,
          last_action."lastAction",
          last_action."lastActionDate",
          next_action."nextAction",
          next_action."nextActionDate"
        FROM companies c
        LEFT JOIN (
          SELECT 
            "companyId",
            "subject" as "lastAction",
            "completedAt" as "lastActionDate"
          FROM actions 
          WHERE "companyId" IS NOT NULL 
          AND "completedAt" IS NOT NULL
          AND "status" = 'completed'
          ORDER BY "completedAt" DESC
        ) last_action ON c.id = last_action."companyId"
        LEFT JOIN (
          SELECT 
            "companyId",
            "subject" as "nextAction",
            "scheduledAt" as "nextActionDate"
          FROM actions 
          WHERE "companyId" IS NOT NULL 
          AND "scheduledAt" IS NOT NULL
          AND "status" = 'planned'
          ORDER BY "scheduledAt" ASC
        ) next_action ON c.id = next_action."companyId"
        WHERE last_action."companyId" IS NOT NULL OR next_action."companyId" IS NOT NULL
      `;
      
      for (const company of companiesWithActions) {
        try {
          await prisma.$executeRawUnsafe(`
            UPDATE companies 
            SET 
              "lastAction" = $1,
              "lastActionDate" = $2,
              "nextAction" = $3,
              "nextActionDate" = $4,
              "actionStatus" = CASE 
                WHEN $3 IS NOT NULL THEN 'pending'
                WHEN $1 IS NOT NULL THEN 'completed'
                ELSE NULL
              END
            WHERE id = $5
          `, [
            company.lastAction,
            company.lastActionDate,
            company.nextAction,
            company.nextActionDate,
            company.id
          ]);
          stats.companiesUpdated++;
        } catch (error) {
          console.error(`❌ Failed to update company ${company.id}:`, error.message);
          stats.errors++;
        }
      }
      
      console.log(`✅ Updated ${stats.companiesUpdated} companies with action data`);
      
    } catch (error) {
      console.error('❌ Failed to populate companies action fields:', error.message);
      stats.errors++;
    }

    // STEP 5: Remove deprecated action tables
    console.log('\n🔄 STEP 5: Removing deprecated action tables...');
    
    try {
      // Remove speedrun_action_logs (data already migrated)
      const speedrunActionLogsExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'speedrun_action_logs'
        );
      `;
      
      if (speedrunActionLogsExists[0].exists) {
        await prisma.$executeRawUnsafe(`DROP TABLE speedrun_action_logs;`);
        console.log('✅ Removed speedrun_action_logs table');
        stats.deprecatedTablesRemoved++;
      }
      
      // Remove speedrun_lead_interactions (empty table)
      const leadInteractionsExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'speedrun_lead_interactions'
        );
      `;
      
      if (leadInteractionsExists[0].exists) {
        await prisma.$executeRawUnsafe(`DROP TABLE speedrun_lead_interactions;`);
        console.log('✅ Removed speedrun_lead_interactions table');
        stats.deprecatedTablesRemoved++;
      }
      
      // Remove strategic_action_outcomes (empty table)
      const strategicActionsExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'strategic_action_outcomes'
        );
      `;
      
      if (strategicActionsExists[0].exists) {
        await prisma.$executeRawUnsafe(`DROP TABLE strategic_action_outcomes;`);
        console.log('✅ Removed strategic_action_outcomes table');
        stats.deprecatedTablesRemoved++;
      }
      
    } catch (error) {
      console.error('❌ Failed to remove deprecated tables:', error.message);
      stats.errors++;
    }

    // STEP 6: Summary
    console.log('\n📋 ACTIONS ARCHITECTURE IMPLEMENTATION SUMMARY');
    console.log('==============================================');
    console.log(`Activities table renamed: ${stats.activitiesRenamed}`);
    console.log(`Action fields added: ${stats.actionFieldsAdded}`);
    console.log(`People updated: ${stats.peopleUpdated}`);
    console.log(`Companies updated: ${stats.companiesUpdated}`);
    console.log(`Deprecated tables removed: ${stats.deprecatedTablesRemoved}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Actions architecture implementation completed successfully!');
      console.log('\n✅ NEW DATA STRUCTURE:');
      console.log('• actions table (renamed from activities)');
      console.log('• people table with lastAction, lastActionDate, nextAction, nextActionDate, actionStatus');
      console.log('• companies table with lastAction, lastActionDate, nextAction, nextActionDate, actionStatus');
      console.log('• Deprecated action tables removed');
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Update Prisma schema file');
      console.log('2. Update codebase to use new actions structure');
      console.log('3. Test the new architecture');
    } else {
      console.log('\n⚠️  Implementation completed with some errors.');
      console.log('Please review the errors above before proceeding.');
    }

  } catch (error) {
    console.error('❌ Implementation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

implementActionsArchitecture()
  .then(() => {
    console.log('\n✅ Actions architecture implementation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Implementation failed:', error);
    process.exit(1);
  });
