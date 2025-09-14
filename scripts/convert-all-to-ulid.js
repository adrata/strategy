#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE UUID TO ULID CONVERSION SCRIPT
 * 
 * Converts ALL UUIDs to ULIDs across the entire database
 * This will fix Next.js routing issues and standardize the ID system
 * 
 * ULID Benefits:
 * - 26 characters (Next.js compatible)
 * - Time-sortable (better database performance)
 * - URL-safe (no special characters)
 * - Industry standard (2025 best practice)
 */

import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

// Configuration - Convert BOTH workspaces
const WORKSPACES = [
  { id: 'cmezxb1ez0001pc94yry3ntjk', name: 'Notary Everyday' },
  { id: 'cmezxb1ez0001pc94yry3ntjk', name: 'Retail Product Solutions' } // We'll find the actual ID
];

// Tables to convert (in dependency order to avoid foreign key issues)
const TABLES_TO_CONVERT = [
  'notes',
  'activities', 
  'opportunities',
  'contacts',
  'leads',
  'accounts',
  'workspace_users',
  'workspaces'
];

async function findRetailWorkspaceId() {
  console.log('🔍 Finding Retail Product Solutions workspace ID...');
  
  const retailWorkspace = await prisma.workspaces.findFirst({
    where: { 
      name: { contains: 'Retail' }
    },
    select: { id: true, name: true }
  });
  
  if (retailWorkspace) {
    console.log(`✅ Found: ${retailWorkspace.name} (ID: ${retailWorkspace.id})`);
    return retailWorkspace.id;
  } else {
    console.log('❌ Retail Product Solutions workspace not found');
    return null;
  }
}

async function convertTableToULID(tableName, workspaceId) {
  console.log(`\n🔄 Converting ${tableName} table for workspace ${workspaceId}...`);
  
  try {
    // Get all records for this workspace
    const records = await prisma[tableName].findMany({
      where: { 
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: { id: true }
    });
    
    if (records.length === 0) {
      console.log(`   ⚠️  No records found in ${tableName}`);
      return 0;
    }
    
    console.log(`   📊 Found ${records.length} records to convert`);
    
    let convertedCount = 0;
    
    for (const record of records) {
      const oldId = record.id;
      
      // Skip if already ULID format (26 chars, starts with 01)
      if (oldId.length === 26 && oldId.startsWith('01')) {
        console.log(`   ✅ ${oldId} already ULID format, skipping`);
        continue;
      }
      
      // Generate new ULID
      const newId = ulid();
      
      try {
        // Update the record with new ID
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
    console.log('🚀 Starting comprehensive UUID to ULID conversion...\n');
    
    // Find Retail Product Solutions workspace ID
    const retailWorkspaceId = await findRetailWorkspaceId();
    
    // Update workspaces array with actual ID
    if (retailWorkspaceId) {
      WORKSPACES[1].id = retailWorkspaceId;
    }
    
    let totalConverted = 0;
    
    // Convert each workspace
    for (const workspace of WORKSPACES) {
      if (!workspace.id) continue;
      
      console.log(`\n🎯 Converting workspace: ${workspace.name} (${workspace.id})`);
      console.log('=' .repeat(60));
      
      // Convert each table
      for (const tableName of TABLES_TO_CONVERT) {
        const converted = await convertTableToULID(tableName, workspace.id);
        totalConverted += converted;
      }
    }
    
    console.log('\n🎉 CONVERSION COMPLETE!');
    console.log(`📊 Total records converted: ${totalConverted}`);
    console.log('\n✨ Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Test lead and contact pages');
    console.log('   3. Verify all IDs are now 26 characters');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
main();
