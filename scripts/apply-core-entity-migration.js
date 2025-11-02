#!/usr/bin/env node

/**
 * Apply Core Entity Architecture Migration
 * Safely applies the migration SQL to add core_companies and core_people tables
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🚀 Applying Core Entity Architecture Migration...\n');
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../prisma/migrations/20250202083356_add_core_entity_architecture/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📋 Migration SQL loaded successfully');
    console.log('🔍 Executing migration...\n');
    
    // Execute migration in a transaction
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Verifying migration...');
    
    // Verify tables were created
    const coreCompaniesExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'core_companies'
      );
    `;
    
    const corePeopleExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'core_people'
      );
    `;
    
    // Check if columns were added
    const companiesHasCoreId = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'companies' 
        AND column_name = 'coreCompanyId'
      );
    `;
    
    const peopleHasCoreId = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'people' 
        AND column_name = 'corePersonId'
      );
    `;
    
    console.log('\n✅ Verification Results:');
    console.log(`   core_companies table: ${coreCompaniesExists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   core_people table: ${corePeopleExists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   companies.coreCompanyId: ${companiesHasCoreId[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   people.corePersonId: ${peopleHasCoreId[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (coreCompaniesExists[0].exists && corePeopleExists[0].exists && 
        companiesHasCoreId[0].exists && peopleHasCoreId[0].exists) {
      console.log('\n🎉 All migration steps completed successfully!');
      return true;
    } else {
      console.log('\n⚠️ Some migration steps may have failed. Please check the output above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
applyMigration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

