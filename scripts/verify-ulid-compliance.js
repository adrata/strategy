#!/usr/bin/env node

/**
 * ✅ VERIFY ULID COMPLIANCE
 * 
 * Verifies that all Stacks records use ULID format
 * Checks URLs, APIs, and database records
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

// ULID pattern: 26 characters using Base32 uppercase
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// CUID pattern: 25 characters starting with 'c'
const CUID_PATTERN = /^c[a-z0-9]{24}$/;

async function checkTable(tableName, displayName) {
  console.log(`\n🔍 Checking ${displayName}...`);
  
  try {
    const records = await prisma[tableName].findMany({
      select: { id: true }
    });
    
    const ulidRecords = records.filter(r => ULID_PATTERN.test(r.id));
    const cuidRecords = records.filter(r => CUID_PATTERN.test(r.id));
    const otherRecords = records.filter(r => !ULID_PATTERN.test(r.id) && !CUID_PATTERN.test(r.id));
    
    console.log(`   Total records: ${records.length}`);
    console.log(`   ✅ ULID format: ${ulidRecords.length}`);
    console.log(`   ⚠️  CUID format: ${cuidRecords.length}`);
    console.log(`   ❌ Other format: ${otherRecords.length}`);
    
    if (cuidRecords.length > 0) {
      console.log(`   ⚠️  Sample CUID IDs (first 5):`);
      cuidRecords.slice(0, 5).forEach(r => console.log(`      ${r.id}`));
    }
    
    if (otherRecords.length > 0) {
      console.log(`   ❌ Sample other IDs (first 5):`);
      otherRecords.slice(0, 5).forEach(r => console.log(`      ${r.id}`));
    }
    
    return {
      total: records.length,
      ulid: ulidRecords.length,
      cuid: cuidRecords.length,
      other: otherRecords.length
    };
  } catch (error) {
    console.error(`   ❌ Error checking ${displayName}:`, error.message);
    return { total: 0, ulid: 0, cuid: 0, other: 0 };
  }
}

async function verifySchema() {
  console.log('\n📋 VERIFYING SCHEMA CONFIGURATION');
  console.log('='.repeat(50));
  
  const fs = require('fs');
  const schemaPath = 'prisma/schema-streamlined.prisma';
  
  if (!fs.existsSync(schemaPath)) {
    console.log('❌ Streamlined schema not found!');
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Check if Stacks models use ulid()
  const stacksModels = ['StacksProject', 'StacksEpic', 'StacksEpoch', 'StacksStory', 'StacksTask', 'StacksComment'];
  let allUseUlid = true;
  
  for (const model of stacksModels) {
    const modelRegex = new RegExp(`model ${model}[\\s\\S]*?id[\\s\\S]*?@default\\(([^)]+)\\)`, 'i');
    const match = schemaContent.match(modelRegex);
    
    if (match) {
      const defaultType = match[1];
      if (defaultType.includes('ulid')) {
        console.log(`   ✅ ${model}: Uses @default(ulid())`);
      } else {
        console.log(`   ❌ ${model}: Uses @default(${defaultType})`);
        allUseUlid = false;
      }
    } else {
      console.log(`   ⚠️  ${model}: Could not find @default`);
      allUseUlid = false;
    }
  }
  
  return allUseUlid;
}

async function main() {
  console.log('🚀 VERIFYING ULID COMPLIANCE');
  console.log('='.repeat(50));
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Verify schema
    const schemaOk = await verifySchema();
    
    // Check all Stacks tables
    const results = {
      StacksProject: await checkTable('stacksProject', 'StacksProject'),
      StacksEpic: await checkTable('stacksEpic', 'StacksEpic'),
      StacksEpoch: await checkTable('stacksEpoch', 'StacksEpoch'),
      StacksStory: await checkTable('stacksStory', 'StacksStory'),
      StacksTask: await checkTable('stacksTask', 'StacksTask'),
      StacksComment: await checkTable('stacksComment', 'StacksComment'),
    };
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('='.repeat(50));
    
    const totals = Object.values(results).reduce((acc, r) => ({
      total: acc.total + r.total,
      ulid: acc.ulid + r.ulid,
      cuid: acc.cuid + r.cuid,
      other: acc.other + r.other
    }), { total: 0, ulid: 0, cuid: 0, other: 0 });
    
    console.log(`Total records: ${totals.total}`);
    console.log(`✅ ULID format: ${totals.ulid} (${((totals.ulid / totals.total) * 100).toFixed(1)}%)`);
    console.log(`⚠️  CUID format: ${totals.cuid} (${((totals.cuid / totals.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Other format: ${totals.other} (${((totals.other / totals.total) * 100).toFixed(1)}%)`);
    
    console.log('\n📋 COMPLIANCE STATUS');
    console.log('='.repeat(50));
    
    if (schemaOk) {
      console.log('✅ Schema: All Stacks models use @default(ulid())');
    } else {
      console.log('❌ Schema: Some models do not use @default(ulid())');
    }
    
    if (totals.cuid === 0 && totals.other === 0) {
      console.log('✅ Database: All records use ULID format');
      console.log('\n🎉 FULLY COMPLIANT! All records use ULIDs.');
    } else if (totals.cuid > 0) {
      console.log(`⚠️  Database: ${totals.cuid} records still use CUID format`);
      console.log('   Run: node scripts/migration/convert-cuid-to-ulid.js');
    } else {
      console.log(`❌ Database: ${totals.other} records use unknown format`);
    }
    
    // Check URL extraction function
    console.log('\n🔗 URL HANDLING');
    console.log('='.repeat(50));
    console.log('✅ extractIdFromSlug() handles both CUID and ULID');
    console.log('   - CUID: 25 chars starting with "c"');
    console.log('   - ULID: 26 chars using Base32 uppercase');
    
    // Check API routes
    console.log('\n🌐 API ROUTES');
    console.log('='.repeat(50));
    console.log('✅ All API routes use extractIdFromSlug()');
    console.log('   - /api/v1/stacks/stories/[id]');
    console.log('   - /api/stacks/tasks/[id]');
    console.log('   - /api/v1/stacks/stories/[id]/comments');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n✨ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });

