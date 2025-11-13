/**
 * Apply Schema Streamlining Migrations
 * 
 * This script applies the schema streamlining changes:
 * 1. Removes duplicate linkedinnavigatorurl field from companies table
 * 2. Migrates title to jobTitle and removes title field from people table
 * 
 * Note: If permission errors occur (must be owner of table), the SQL can be run manually
 * by a database admin. The script will log what needs to be done.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigrations() {
  console.log('🔄 Applying Schema Streamlining Migrations...\n');

  try {
    // ============================================================
    // 1. Remove duplicate linkedinnavigatorurl from companies
    // ============================================================
    console.log('1. Removing duplicate linkedinnavigatorurl field from companies table...\n');

    try {
      // Step 1: Migrate any data from linkedinnavigatorurl to linkedinNavigatorUrl
      const migrateResult = await prisma.$executeRawUnsafe(`
        UPDATE companies
        SET "linkedinNavigatorUrl" = linkedinnavigatorurl
        WHERE ("linkedinNavigatorUrl" IS NULL OR "linkedinNavigatorUrl" = '')
          AND linkedinnavigatorurl IS NOT NULL
          AND linkedinnavigatorurl != '';
      `);
      console.log(`   ✅ Migrated ${migrateResult} rows from linkedinnavigatorurl to linkedinNavigatorUrl\n`);

      // Step 2: Drop the duplicate column
      await prisma.$executeRawUnsafe(`
        ALTER TABLE companies DROP COLUMN IF EXISTS linkedinnavigatorurl;
      `);
      console.log('   ✅ Dropped linkedinnavigatorurl column from companies table\n');
    } catch (error) {
      if (error.code === 'P2010' && error.meta?.code === '42501') {
        console.log('   ⚠️  Permission error: Cannot drop column (must be owner of table)');
        console.log('   📝 Manual SQL required:');
        console.log('      ALTER TABLE companies DROP COLUMN IF EXISTS linkedinnavigatorurl;\n');
      } else {
        throw error;
      }
    }

    // ============================================================
    // 2. Remove title field from people table
    // ============================================================
    console.log('2. Migrating title to jobTitle and removing title field from people table...\n');

    try {
      // Step 1: Check if title column exists first
      const titleColumnCheck = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'people' 
          AND column_name = 'title';
      `);
      
      if (titleColumnCheck.length === 0) {
        console.log('   ℹ️  Title column does not exist (may have already been removed)\n');
        return;
      }

      // Step 2: Check what the jobTitle column is actually named in the database
      const jobTitleColumnCheck = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'people' 
          AND column_name IN ('jobTitle', 'job_title');
      `);
      
      const jobTitleColumnName = jobTitleColumnCheck[0]?.column_name || 'jobTitle';
      console.log(`   ℹ️  Using column name: ${jobTitleColumnName}\n`);

      // Step 3: Migrate any data from title to jobTitle (using correct column name)
      const migrateTitleResult = await prisma.$executeRawUnsafe(`
        UPDATE people
        SET "${jobTitleColumnName}" = title
        WHERE ("${jobTitleColumnName}" IS NULL OR "${jobTitleColumnName}" = '')
          AND title IS NOT NULL
          AND title != '';
      `);
      console.log(`   ✅ Migrated ${migrateTitleResult} rows from title to ${jobTitleColumnName}\n`);

      // Step 4: Verify migration (check if any rows still need migration)
      const verifyResult = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count
        FROM people
        WHERE title IS NOT NULL
          AND title != ''
          AND ("${jobTitleColumnName}" IS NULL OR "${jobTitleColumnName}" = '');
      `);
      const count = Number(verifyResult[0]?.count || 0);
      
      if (count > 0) {
        console.log(`   ⚠️  Warning: ${count} rows still have title but no job_title`);
        console.log('   📝 These rows may need manual review\n');
      } else {
        console.log('   ✅ All title data successfully migrated to job_title\n');
      }

      // Step 3: Drop the title column
      await prisma.$executeRawUnsafe(`
        ALTER TABLE people DROP COLUMN IF EXISTS title;
      `);
      console.log('   ✅ Dropped title column from people table\n');
    } catch (error) {
      if (error.code === 'P2010' && error.meta?.code === '42501') {
        console.log('   ⚠️  Permission error: Cannot drop column (must be owner of table)');
        console.log('   📝 Manual SQL required:');
        console.log('      ALTER TABLE people DROP COLUMN IF EXISTS title;\n');
      } else {
        throw error;
      }
    }

    console.log('✅ Schema streamlining migrations completed successfully!\n');
    console.log('📝 Note: If any columns could not be dropped due to permissions,');
    console.log('   run the manual SQL statements shown above as a database admin.\n');

  } catch (error) {
    console.error('❌ Error applying migrations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations
(async () => {
  try {
    await applyMigrations();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
})();

