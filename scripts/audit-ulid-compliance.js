#!/usr/bin/env node

/**
 * AUDIT ULID COMPLIANCE
 * 
 * This script audits the database to find any IDs that are not ULIDs.
 * ULIDs are 26 characters long and follow a specific pattern.
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

// ULID validation pattern
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function isValidULIDFormat(str) {
  if (!str || typeof str !== 'string') return false;
  if (str.length !== 26) return false;
  return ULID_PATTERN.test(str);
}

async function auditTable(tableName, idColumn = 'id') {
  console.log(`\n📊 Auditing table: ${tableName}`);
  
  try {
    // Get all records
    const records = await prisma.$queryRawUnsafe(
      `SELECT "${idColumn}" FROM "${tableName}" LIMIT 10000`
    );
    
    const invalidIds = [];
    const validCount = 0;
    
    for (const record of records) {
      const id = record[idColumn];
      if (!isValidULIDFormat(id)) {
        invalidIds.push({
          id,
          length: id?.length,
          pattern: id?.substring(0, 10) + '...'
        });
      }
    }
    
    console.log(`  ✅ Valid ULIDs: ${records.length - invalidIds.length}`);
    console.log(`  ❌ Invalid IDs: ${invalidIds.length}`);
    
    if (invalidIds.length > 0) {
      console.log(`  📋 Sample invalid IDs:`);
      invalidIds.slice(0, 10).forEach(item => {
        console.log(`     - ${item.id} (length: ${item.length})`);
      });
    }
    
    return {
      tableName,
      total: records.length,
      valid: records.length - invalidIds.length,
      invalid: invalidIds.length,
      invalidIds: invalidIds.slice(0, 100) // Limit to first 100
    };
  } catch (error) {
    console.error(`  ❌ Error auditing ${tableName}:`, error.message);
    return {
      tableName,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 ULID Compliance Audit');
  console.log('========================\n');
  
  const tables = [
    'people',
    'companies',
    'stacks_story',
    'stacks_task',
    'stacks_epic',
    'stacks_project',
    'stacks_epoch',
    'actions',
    'entities',
    'users',
    'workspaces'
  ];
  
  const results = [];
  
  for (const table of tables) {
    const result = await auditTable(table);
    results.push(result);
  }
  
  console.log('\n📊 SUMMARY');
  console.log('===========\n');
  
  let totalInvalid = 0;
  let totalValid = 0;
  let totalRecords = 0;
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.tableName}: ${result.error}`);
    } else {
      console.log(`${result.tableName}:`);
      console.log(`  Total: ${result.total}`);
      console.log(`  Valid ULIDs: ${result.valid}`);
      console.log(`  Invalid IDs: ${result.invalid}`);
      totalInvalid += result.invalid;
      totalValid += result.valid;
      totalRecords += result.total;
    }
  });
  
  console.log(`\n📈 Overall:`);
  console.log(`  Total records: ${totalRecords}`);
  console.log(`  Valid ULIDs: ${totalValid} (${((totalValid / totalRecords) * 100).toFixed(2)}%)`);
  console.log(`  Invalid IDs: ${totalInvalid} (${((totalInvalid / totalRecords) * 100).toFixed(2)}%)`);
  
  if (totalInvalid > 0) {
    console.log(`\n⚠️  Found ${totalInvalid} non-ULID IDs. Consider running migration script.`);
  } else {
    console.log(`\n✅ All IDs are valid ULIDs!`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);

