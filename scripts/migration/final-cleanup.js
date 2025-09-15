const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalCleanup() {
  console.log('🧹 FINAL CLEANUP');
  console.log('================');
  console.log('Removing legacy accountId/contactId fields from activities table...\n');

  try {
    // Check current state
    console.log('📊 Current activities table state:');
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

    // Remove legacy fields
    console.log('\n🗑️  Removing legacy fields...');
    
    // Drop accountId column
    await prisma.$executeRawUnsafe(`ALTER TABLE activities DROP COLUMN IF EXISTS "accountId";`);
    console.log('✅ Removed accountId column');
    
    // Drop contactId column
    await prisma.$executeRawUnsafe(`ALTER TABLE activities DROP COLUMN IF EXISTS "contactId";`);
    console.log('✅ Removed contactId column');
    
    // Drop any foreign key constraints
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE activities DROP CONSTRAINT IF EXISTS "activities_accountId_fkey";`);
      console.log('✅ Removed accountId foreign key constraint');
    } catch (e) {
      console.log('ℹ️  No accountId foreign key constraint found');
    }
    
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE activities DROP CONSTRAINT IF EXISTS "activities_contactId_fkey";`);
      console.log('✅ Removed contactId foreign key constraint');
    } catch (e) {
      console.log('ℹ️  No contactId foreign key constraint found');
    }

    // Verify cleanup
    console.log('\n✅ Cleanup verification:');
    const finalActivitiesCount = await prisma.activities.count();
    console.log(`  Total activities: ${finalActivitiesCount}`);
    
    const finalActivitiesWithPersonId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "personId" IS NOT NULL
    `;
    
    const finalActivitiesWithCompanyId = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM activities WHERE "companyId" IS NOT NULL
    `;
    
    console.log(`  Modern fields: ${finalActivitiesWithPersonId[0].count} with personId, ${finalActivitiesWithCompanyId[0].count} with companyId`);

    console.log('\n🎉 Final cleanup completed successfully!');
    console.log('The activities table now only uses modern personId/companyId fields.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

finalCleanup()
  .then(() => {
    console.log('\n✅ Final cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Final cleanup failed:', error);
    process.exit(1);
  });
