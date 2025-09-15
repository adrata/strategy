const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function safeDataMigration() {
  console.log('🛡️  SAFE DATA MIGRATION');
  console.log('=======================');
  console.log('Migrating legacy accountId/contactId to personId/companyId before cleanup...\n');

  let stats = {
    activitiesMigrated: 0,
    dataPreserved: 0,
    errors: 0
  };

  try {
    // STEP 1: Check current state
    console.log('📊 STEP 1: Analyzing current data...');
    
    const activitiesCount = await prisma.activities.count();
    console.log(`  Total activities: ${activitiesCount}`);
    
    const activitiesWithAccountId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "accountId" IS NOT NULL
    `;
    
    const activitiesWithContactId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "contactId" IS NOT NULL
    `;
    
    const activitiesWithPersonId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "personId" IS NOT NULL
    `;
    
    const activitiesWithCompanyId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "companyId" IS NOT NULL
    `;
    
    console.log(`  Legacy: ${activitiesWithAccountId[0].count} with accountId, ${activitiesWithContactId[0].count} with contactId`);
    console.log(`  Modern: ${activitiesWithPersonId[0].count} with personId, ${activitiesWithCompanyId[0].count} with companyId`);

    // STEP 2: Migrate accountId to companyId (if not already set)
    console.log('\n🔄 STEP 2: Migrating accountId to companyId...');
    
    const activitiesToMigrate = await prisma.$queryRaw`
      SELECT id, "accountId", "companyId" 
      FROM activities 
      WHERE "accountId" IS NOT NULL 
      AND ("companyId" IS NULL OR "companyId" = '')
    `;
    
    console.log(`  Found ${activitiesToMigrate.length} activities to migrate from accountId to companyId`);
    
    for (const activity of activitiesToMigrate) {
      try {
        await prisma.activities.update({
          where: { id: activity.id },
          data: { companyId: activity.accountId }
        });
        stats.activitiesMigrated++;
        console.log(`  ✅ Migrated activity ${activity.id}: accountId ${activity.accountId} → companyId`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate activity ${activity.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 3: Migrate contactId to personId (if not already set)
    console.log('\n🔄 STEP 3: Migrating contactId to personId...');
    
    const activitiesToMigrateContact = await prisma.$queryRaw`
      SELECT id, "contactId", "personId" 
      FROM activities 
      WHERE "contactId" IS NOT NULL 
      AND ("personId" IS NULL OR "personId" = '')
    `;
    
    console.log(`  Found ${activitiesToMigrateContact.length} activities to migrate from contactId to personId`);
    
    for (const activity of activitiesToMigrateContact) {
      try {
        await prisma.activities.update({
          where: { id: activity.id },
          data: { personId: activity.contactId }
        });
        stats.activitiesMigrated++;
        console.log(`  ✅ Migrated activity ${activity.id}: contactId ${activity.contactId} → personId`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate activity ${activity.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 4: Verify all data is preserved
    console.log('\n✅ STEP 4: Verifying data preservation...');
    
    const finalActivitiesWithPersonId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "personId" IS NOT NULL
    `;
    
    const finalActivitiesWithCompanyId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "companyId" IS NOT NULL
    `;
    
    const remainingWithAccountId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "accountId" IS NOT NULL
    `;
    
    const remainingWithContactId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "contactId" IS NOT NULL
    `;
    
    console.log(`  Final state:`);
    console.log(`    Modern: ${finalActivitiesWithPersonId[0].count} with personId, ${finalActivitiesWithCompanyId[0].count} with companyId`);
    console.log(`    Legacy: ${remainingWithAccountId[0].count} with accountId, ${remainingWithContactId[0].count} with contactId`);
    
    // Check if we have any data that couldn't be migrated
    const unmigratedData = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities 
      WHERE ("accountId" IS NOT NULL AND ("companyId" IS NULL OR "companyId" = ''))
      OR ("contactId" IS NOT NULL AND ("personId" IS NULL OR "personId" = ''))
    `;
    
    if (unmigratedData[0].count > 0) {
      console.log(`  ⚠️  WARNING: ${unmigratedData[0].count} activities have legacy data that couldn't be migrated`);
      console.log(`  This might indicate missing people/companies records.`);
      
      // Show examples of unmigrated data
      const examples = await prisma.$queryRaw`
        SELECT id, "accountId", "contactId", "companyId", "personId" 
        FROM activities 
        WHERE ("accountId" IS NOT NULL AND ("companyId" IS NULL OR "companyId" = ''))
        OR ("contactId" IS NOT NULL AND ("personId" IS NULL OR "personId" = ''))
        LIMIT 5
      `;
      
      console.log(`  Examples of unmigrated data:`);
      examples.forEach(example => {
        console.log(`    Activity ${example.id}: accountId=${example.accountId}, contactId=${example.contactId}, companyId=${example.companyId}, personId=${example.personId}`);
      });
    } else {
      console.log(`  ✅ All legacy data successfully migrated!`);
    }

    // STEP 5: Summary
    console.log('\n📋 MIGRATION SUMMARY');
    console.log('====================');
    console.log(`Activities migrated: ${stats.activitiesMigrated}`);
    console.log(`Errors encountered: ${stats.errors}`);
    console.log(`Data preservation: ${stats.activitiesMigrated > 0 ? 'SUCCESS' : 'NO MIGRATION NEEDED'}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Safe migration completed successfully!');
      console.log('All legacy data has been preserved in modern fields.');
      console.log('You can now safely remove the legacy accountId/contactId columns.');
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
      console.log('Please review the errors above before proceeding with cleanup.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

safeDataMigration()
  .then(() => {
    console.log('\n✅ Safe data migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Safe data migration failed:', error);
    process.exit(1);
  });
