#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLegacyTables() {
  console.log('🔍 Checking for legacy email tables...\n');
  
  try {
    const legacyTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%Email%' OR table_name LIKE '%email%' OR table_name LIKE '%Provider%')
      AND table_name != 'email_messages'
    `;
    
    if (legacyTables.length > 0) {
      console.log('⚠️ Found legacy email tables:');
      legacyTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('\n📋 To clean up these tables, run:');
      console.log('   psql -d your_database -f scripts/cleanup-legacy-email-tables.sql');
    } else {
      console.log('✅ No legacy email tables found - cleanup not needed');
    }
    
    return { success: true, legacyTables };
    
  } catch (error) {
    console.log('ℹ️ Could not check for legacy tables (this is expected if they were already removed)');
    return { success: true, legacyTables: [] };
  } finally {
    await prisma.$disconnect();
  }
}

checkLegacyTables().then(result => {
  if (result.success) {
    console.log('\n✅ Legacy table check completed!');
    process.exit(0);
  } else {
    console.log('\n❌ Check failed');
    process.exit(1);
  }
});
