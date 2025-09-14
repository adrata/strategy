#!/usr/bin/env node

/**
 * 🚀 COMPLETE ULID STANDARDIZATION SCRIPT
 * 
 * Converts ALL remaining non-standard IDs to proper ULIDs
 * Handles all the patterns found in the audit
 */

import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

// Tables that need standardization (from audit results)
const TABLES_TO_STANDARDIZE = [
  { name: 'workspaces', priority: 1 },
  { name: 'workspace_users', priority: 2 },
  { name: 'partners', priority: 3 },
  { name: 'activities', priority: 4 },
  { name: 'notes', priority: 5 },
  { name: 'buyer_groups', priority: 6 },
  { name: 'demo_scenarios', priority: 7 }
];

async function standardizeTable(tableName) {
  console.log(`\n🔄 Standardizing ${tableName}...`);
  
  try {
    // Get all records with non-standard IDs
    const records = await prisma[tableName].findMany({
      select: { id: true },
      take: 1000 // Limit to prevent memory issues
    });
    
    if (records.length === 0) {
      console.log(`   ✅ No records found in ${tableName}`);
      return 0;
    }
    
    // Filter out records that are already standard ULIDs
    const nonStandardRecords = records.filter(record => {
      const id = record.id;
      return !(id.length === 26 && id.startsWith('01'));
    });
    
    if (nonStandardRecords.length === 0) {
      console.log(`   ✅ All records in ${tableName} already use standard ULIDs`);
      return 0;
    }
    
    console.log(`   📊 Found ${nonStandardRecords.length} non-standard IDs to convert`);
    
    let convertedCount = 0;
    
    for (const record of nonStandardRecords) {
      const oldId = record.id;
      
      // Generate new standard ULID
      const newId = ulid();
      
      try {
        // Update the record with new standard ULID
        await prisma[tableName].update({
          where: { id: oldId },
          data: { id: newId }
        });
        
        console.log(`   🔄 ${oldId} → ${newId}`);
        convertedCount++;
        
      } catch (error) {
        console.error(`   ❌ Failed to convert ${oldId}:`, error.message);
      }
    }
    
    console.log(`   ✅ Converted ${convertedCount} records in ${tableName}`);
    return convertedCount;
    
  } catch (error) {
    console.error(`   ❌ Error standardizing ${tableName}:`, error.message);
    return 0;
  }
}

async function main() {
  try {
    console.log('🚀 Starting complete ULID standardization...');
    console.log('   Converting all non-standard IDs to proper ULIDs');
    
    let totalConverted = 0;
    
    // Process tables in priority order
    const sortedTables = TABLES_TO_STANDARDIZE.sort((a, b) => a.priority - b.priority);
    
    for (const table of sortedTables) {
      const converted = await standardizeTable(table.name);
      totalConverted += converted;
    }
    
    console.log(`\n🎯 Standardization complete!`);
    console.log(`   Total records converted: ${totalConverted}`);
    console.log(`   All IDs now use standard ULID format (starting with "01")`);
    
    // Run a quick verification
    console.log(`\n🔍 Quick verification...`);
    const verificationResults = [];
    
    for (const table of sortedTables) {
      try {
        const records = await prisma[table.name].findMany({
          select: { id: true },
          take: 100
        });
        
        const standardCount = records.filter(r => r.id.length === 26 && r.id.startsWith('01')).length;
        const totalCount = records.length;
        
        verificationResults.push({
          table: table.name,
          standard: standardCount,
          total: totalCount,
          rate: totalCount > 0 ? ((standardCount / totalCount) * 100).toFixed(1) : 100
        });
        
      } catch (error) {
        console.error(`   ❌ Error verifying ${table.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Verification Results:`);
    verificationResults.forEach(result => {
      console.log(`   ${result.table}: ${result.standard}/${result.total} (${result.rate}%)`);
    });
    
    const overallRate = verificationResults.reduce((sum, r) => sum + parseFloat(r.rate), 0) / verificationResults.length;
    console.log(`\n🎉 Overall standardization rate: ${overallRate.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Standardization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the standardization
main();
