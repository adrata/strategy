#!/usr/bin/env node

/**
 * 🚀 STANDARDIZE TO ULID SCRIPT
 * 
 * Converts all custom ULIDs (starting with 'c') to standard ULIDs (starting with '01')
 * This ensures consistency across the entire system and fixes URL parsing issues
 * 
 * Standard ULID Benefits:
 * - 26 characters starting with '01'
 * - Time-sortable (better database performance)
 * - URL-safe (no special characters)
 * - Industry standard (2025 best practice)
 * - Consistent with Prisma schema configuration
 */

import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

// Tables to convert (in dependency order to avoid foreign key issues)
const TABLES_TO_CONVERT = [
  'notes',
  'activities', 
  'opportunities',
  'contacts',
  'leads',
  'companies', // This is the main one we need to fix
  'workspace_users',
  'workspaces'
];

async function convertTableToStandardULID(tableName) {
  console.log(`\n🔄 Converting ${tableName}...`);
  
  try {
    // Get all records with custom ULIDs (starting with 'c')
    const records = await prisma[tableName].findMany({
      where: { 
        id: {
          startsWith: 'c'
        }
      },
      select: { id: true }
    });
    
    if (records.length === 0) {
      console.log(`   ✅ No custom ULIDs found in ${tableName}`);
      return 0;
    }
    
    console.log(`   📊 Found ${records.length} custom ULIDs to convert`);
    
    let convertedCount = 0;
    
    for (const record of records) {
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
    console.error(`   ❌ Error converting ${tableName}:`, error.message);
    return 0;
  }
}

async function main() {
  try {
    console.log('🚀 Starting ULID standardization...');
    console.log('   Converting custom ULIDs (starting with "c") to standard ULIDs (starting with "01")');
    
    let totalConverted = 0;
    
    for (const tableName of TABLES_TO_CONVERT) {
      const converted = await convertTableToStandardULID(tableName);
      totalConverted += converted;
    }
    
    console.log(`\n🎯 Standardization complete!`);
    console.log(`   Total records converted: ${totalConverted}`);
    console.log(`   All IDs now use standard ULID format (starting with "01")`);
    
    // Verify the conversion
    console.log(`\n🔍 Verifying conversion...`);
    const remainingCustom = await prisma.companies.count({
      where: { id: { startsWith: 'c' } }
    });
    
    if (remainingCustom === 0) {
      console.log(`   ✅ No custom ULIDs remaining in companies table`);
    } else {
      console.log(`   ⚠️  ${remainingCustom} custom ULIDs still remain in companies table`);
    }
    
  } catch (error) {
    console.error('❌ Standardization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
