#!/usr/bin/env node

/**
 * APPLY ADDITIONAL STATUSES MIGRATION
 * 
 * Applies the migration to add additionalStatuses column to companies and people tables
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🚀 Applying additionalStatuses migration...\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Apply migration SQL
    console.log('📋 Adding additionalStatuses column to companies table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS "additionalStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    console.log('✅ Companies table updated!\n');

    console.log('📋 Adding additionalStatuses column to people table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE people 
      ADD COLUMN IF NOT EXISTS "additionalStatuses" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    console.log('✅ People table updated!\n');

    // Verify the columns were added
    console.log('🔍 Verifying migration...');
    const companiesCheck = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'additionalStatuses';
    `);
    
    const peopleCheck = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'people' AND column_name = 'additionalStatuses';
    `);

    if (companiesCheck && companiesCheck.length > 0 && peopleCheck && peopleCheck.length > 0) {
      console.log('✅ Migration verified successfully!');
      console.log('   - Companies table has additionalStatuses column');
      console.log('   - People table has additionalStatuses column\n');
    } else {
      console.warn('⚠️  Migration may not have applied correctly. Please verify manually.');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log('🏁 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration };

