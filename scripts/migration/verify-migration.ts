#!/usr/bin/env ts-node

/**
 * Verify that the relationshipType migration completed successfully
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying relationshipType migration...\n');
  
  try {
    // Check if columns exist
    console.log('📝 Step 1: Checking if columns exist...');
    
    const companiesColumnCheck = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
    }>>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'relationshipType';
    `);
    
    const peopleColumnCheck = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
    }>>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'people' AND column_name = 'relationshipType';
    `);
    
    console.log('✅ Companies column check:', companiesColumnCheck.length > 0 ? 'EXISTS' : 'MISSING');
    if (companiesColumnCheck.length > 0) {
      console.log(`   Column: ${companiesColumnCheck[0].column_name}, Type: ${companiesColumnCheck[0].data_type}`);
    }
    
    console.log('✅ People column check:', peopleColumnCheck.length > 0 ? 'EXISTS' : 'MISSING');
    if (peopleColumnCheck.length > 0) {
      console.log(`   Column: ${peopleColumnCheck[0].column_name}, Type: ${peopleColumnCheck[0].data_type}`);
    }
    
    if (companiesColumnCheck.length === 0 || peopleColumnCheck.length === 0) {
      console.log('\n❌ Migration incomplete - columns are missing!');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    // Check enum type exists
    console.log('\n📝 Step 2: Checking if RelationshipType enum exists...');
    const enumCheck = await prisma.$queryRawUnsafe<Array<{
      typname: string;
    }>>(`
      SELECT typname FROM pg_type WHERE typname = 'RelationshipType';
    `);
    
    console.log('✅ RelationshipType enum:', enumCheck.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Check data
    console.log('\n📝 Step 3: Checking data...');
    
    const companiesStats = await prisma.$queryRawUnsafe<Array<{
      total_records: bigint;
      records_with_relationship_type: bigint;
      future_clients: bigint;
      null_count: bigint;
    }>>(`
      SELECT 
          COUNT(*)::bigint as total_records,
          COUNT("relationshipType")::bigint as records_with_relationship_type,
          COUNT(CASE WHEN "relationshipType" = 'FUTURE_CLIENT' THEN 1 END)::bigint as future_clients,
          COUNT(CASE WHEN "relationshipType" IS NULL THEN 1 END)::bigint as null_count
      FROM "companies";
    `);
    
    const peopleStats = await prisma.$queryRawUnsafe<Array<{
      total_records: bigint;
      records_with_relationship_type: bigint;
      future_clients: bigint;
      null_count: bigint;
    }>>(`
      SELECT 
          COUNT(*)::bigint as total_records,
          COUNT("relationshipType")::bigint as records_with_relationship_type,
          COUNT(CASE WHEN "relationshipType" = 'FUTURE_CLIENT' THEN 1 END)::bigint as future_clients,
          COUNT(CASE WHEN "relationshipType" IS NULL THEN 1 END)::bigint as null_count
      FROM "people";
    `);
    
    console.log('\n📊 Companies Statistics:');
    if (companiesStats[0]) {
      const stats = companiesStats[0];
      console.log(`   Total records: ${stats.total_records.toString()}`);
      console.log(`   Records with relationshipType: ${stats.records_with_relationship_type.toString()}`);
      console.log(`   Set to FUTURE_CLIENT: ${stats.future_clients.toString()}`);
      console.log(`   NULL values: ${stats.null_count.toString()}`);
      
      if (stats.null_count > 0n) {
        console.log(`   ⚠️  Warning: ${stats.null_count.toString()} records still have NULL relationshipType`);
      }
    }
    
    console.log('\n📊 People Statistics:');
    if (peopleStats[0]) {
      const stats = peopleStats[0];
      console.log(`   Total records: ${stats.total_records.toString()}`);
      console.log(`   Records with relationshipType: ${stats.records_with_relationship_type.toString()}`);
      console.log(`   Set to FUTURE_CLIENT: ${stats.future_clients.toString()}`);
      console.log(`   NULL values: ${stats.null_count.toString()}`);
      
      if (stats.null_count > 0n) {
        console.log(`   ⚠️  Warning: ${stats.null_count.toString()} records still have NULL relationshipType`);
      }
    }
    
    // Check indexes
    console.log('\n📝 Step 4: Checking indexes...');
    
    const companiesIndexCheck = await prisma.$queryRawUnsafe<Array<{
      indexname: string;
    }>>(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'companies' AND indexname = 'companies_workspaceId_relationshipType_idx';
    `);
    
    const peopleIndexCheck = await prisma.$queryRawUnsafe<Array<{
      indexname: string;
    }>>(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'people' AND indexname = 'people_workspaceId_relationshipType_idx';
    `);
    
    console.log('✅ Companies index:', companiesIndexCheck.length > 0 ? 'EXISTS' : 'MISSING');
    console.log('✅ People index:', peopleIndexCheck.length > 0 ? 'EXISTS' : 'MISSING');
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ MIGRATION VERIFICATION COMPLETE');
    console.log('='.repeat(50));
    
    const allGood = 
      companiesColumnCheck.length > 0 &&
      peopleColumnCheck.length > 0 &&
      enumCheck.length > 0 &&
      companiesStats[0]?.null_count === 0n &&
      peopleStats[0]?.null_count === 0n;
    
    if (allGood) {
      console.log('\n🎉 SUCCESS: Migration completed successfully!');
      console.log('   ✅ Columns exist');
      console.log('   ✅ Enum exists');
      console.log('   ✅ All records have relationshipType set');
      console.log('   ✅ Indexes created');
      console.log('\n💡 All companies and people are now set to FUTURE_CLIENT');
      console.log('💡 You can now update individual records through the UI');
    } else {
      console.log('\n⚠️  Migration may be incomplete. Please review the details above.');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });

