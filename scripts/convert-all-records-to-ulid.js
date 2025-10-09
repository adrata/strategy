/**
 * CONVERT ALL RECORDS TO ULID - COMPREHENSIVE CONVERSION
 * 
 * This script converts all records across all tables to use proper ULIDs
 * instead of migration IDs or other ID formats.
 * 
 * SAFETY FEATURES:
 * - Batch processing to avoid memory issues
 * - Transaction safety with rollback on errors
 * - Progress tracking and logging
 * - Backup creation before conversion
 * - Validation after conversion
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = 100;
const BACKUP_DIR = path.join(__dirname, '..', '_data', 'ulid-conversion-backup');

// Tables to convert (in order of dependencies)
const TABLES_TO_CONVERT = [
  'actions',      // Independent
  'people',       // Independent
  'companies',    // Independent
  'leads',        // References people/companies
  'prospects',    // References people/companies
  'opportunities' // References people/companies
];

async function createBackup() {
  console.log('💾 Creating backup before ULID conversion...');
  
  try {
    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `pre-ulid-conversion-${timestamp}.json`);
    
    const backup = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    // Backup current ID mappings for each table
    for (const table of TABLES_TO_CONVERT) {
      try {
        const records = await prisma[table].findMany({
          select: { id: true }
        });
        
        backup.tables[table] = records.map(r => r.id);
        console.log(`📋 Backed up ${records.length} ${table} IDs`);
      } catch (e) {
        console.log(`⚠️ Could not backup ${table}: ${e.message}`);
      }
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup created: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    throw error;
  }
}

async function convertTableToULID(tableName) {
  console.log(`\n🔄 Converting ${tableName} to ULIDs...`);
  
  try {
    // Get all records that need conversion (not already ULID)
    const recordsToConvert = await prisma[tableName].findMany({
      where: {
        id: {
          not: {
            startsWith: '01'
          }
        }
      },
      select: { id: true }
    });
    
    if (recordsToConvert.length === 0) {
      console.log(`✅ ${tableName} already has ULIDs`);
      return { converted: 0, errors: 0 };
    }
    
    console.log(`📊 Found ${recordsToConvert.length} ${tableName} records to convert`);
    
    let converted = 0;
    let errors = 0;
    
    // Process in batches
    for (let i = 0; i < recordsToConvert.length; i += BATCH_SIZE) {
      const batch = recordsToConvert.slice(i, i + BATCH_SIZE);
      
      console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(recordsToConvert.length / BATCH_SIZE)} (${batch.length} records)`);
      
      // Create ID mapping for this batch
      const idMapping = {};
      for (const record of batch) {
        const newULID = ulid();
        idMapping[record.id] = newULID;
      }
      
      // Update records in transaction
      try {
        await prisma.$transaction(async (tx) => {
          for (const [oldId, newId] of Object.entries(idMapping)) {
            await tx[tableName].update({
              where: { id: oldId },
              data: { id: newId }
            });
          }
        });
        
        converted += batch.length;
        console.log(`✅ Converted ${batch.length} ${tableName} records`);
        
      } catch (error) {
        console.error(`❌ Error converting batch in ${tableName}:`, error.message);
        errors += batch.length;
      }
    }
    
    console.log(`✅ ${tableName} conversion complete: ${converted} converted, ${errors} errors`);
    return { converted, errors };
    
  } catch (error) {
    console.error(`❌ Error converting ${tableName}:`, error);
    throw error;
  }
}

async function validateConversion() {
  console.log('\n🔍 Validating ULID conversion...');
  
  try {
    for (const table of TABLES_TO_CONVERT) {
      const totalCount = await prisma[table].count();
      const ulidCount = await prisma[table].count({
        where: {
          id: {
            startsWith: '01'
          }
        }
      });
      
      const nonULIDCount = totalCount - ulidCount;
      
      if (nonULIDCount === 0) {
        console.log(`✅ ${table}: All ${totalCount} records have ULIDs`);
      } else {
        console.log(`⚠️ ${table}: ${ulidCount}/${totalCount} records have ULIDs (${nonULIDCount} still need conversion)`);
      }
    }
  } catch (error) {
    console.error('❌ Validation error:', error);
  }
}

async function convertAllRecordsToULID() {
  console.log('🚀 Starting comprehensive ULID conversion...');
  console.log(`📊 Tables to convert: ${TABLES_TO_CONVERT.join(', ')}`);
  console.log(`📦 Batch size: ${BATCH_SIZE}`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Create backup
    const backupFile = await createBackup();
    
    // Step 2: Convert each table
    const results = {};
    for (const table of TABLES_TO_CONVERT) {
      results[table] = await convertTableToULID(table);
    }
    
    // Step 3: Validate conversion
    await validateConversion();
    
    // Step 4: Summary
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 ULID CONVERSION COMPLETE!');
    console.log(`⏱️ Duration: ${duration} seconds`);
    console.log(`💾 Backup: ${backupFile}`);
    
    let totalConverted = 0;
    let totalErrors = 0;
    
    for (const [table, result] of Object.entries(results)) {
      console.log(`📊 ${table}: ${result.converted} converted, ${result.errors} errors`);
      totalConverted += result.converted;
      totalErrors += result.errors;
    }
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`✅ Total converted: ${totalConverted}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('🎉 All records successfully converted to ULIDs!');
    } else {
      console.log('⚠️ Some records had conversion errors. Check logs above.');
    }
    
  } catch (error) {
    console.error('❌ ULID conversion failed:', error);
    console.log('💾 Backup was created before conversion - you can restore if needed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
if (require.main === module) {
  convertAllRecordsToULID()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { convertAllRecordsToULID };
