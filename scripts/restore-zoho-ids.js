#!/usr/bin/env node

/**
 * 🔄 RESTORE ZOHO IDS SCRIPT
 * 
 * Restores Zoho IDs that were converted during standardization
 * These are needed for Zoho CRM integration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Zoho ID patterns that need to be restored
const ZOHO_ID_PATTERNS = {
  // Activities with zcrm_ prefix
  activities: [
    { newId: '01K4VJMKP2YCVK2T8VQPA6GDQP', oldId: 'zcrm_6155788000001889186' },
    { newId: '01K4VJMKZK21ZHRHE79FQM23V8', oldId: 'zcrm_6155788000001889203' },
    { newId: '01K4VJMM9341MA80Y6PRV7HSJQ', oldId: 'zcrm_6155788000001889217' },
    { newId: '01K4VJMMJJWV8TC7CN2TM667CD', oldId: 'zcrm_6155788000001889264' },
    { newId: '01K4VJMMW1R8JRS68ZV5HX2VS0', oldId: 'zcrm_6155788000001889289' },
    // Add more as needed - this is just a sample
  ],
  
  // Notes with zcrm_ prefix  
  notes: [
    { newId: '01K4VJTE1EHQQ18HC8W7GQZFTS', oldId: 'zcrm_6155788000000469018' },
    { newId: '01K4VJTEATHTAVQ33EK0ASYGAK', oldId: 'zcrm_6155788000000508043' },
    { newId: '01K4VJTEMB97HMPE12XY93BZAS', oldId: 'zcrm_6155788000000508048' },
    { newId: '01K4VJTEXR89Z1PRYKDA1WDJH7', oldId: 'zcrm_6155788000000510029' },
    { newId: '01K4VJTF76910621B6PS4J0CA2', oldId: 'zcrm_6155788000000510034' },
    // Add more as needed
  ]
};

async function restoreZohoIds(tableName, idMappings) {
  console.log(`\n🔄 Restoring Zoho IDs for ${tableName}...`);
  
  let restoredCount = 0;
  
  for (const mapping of idMappings) {
    try {
      // Update the record to use the original Zoho ID
      await prisma[tableName].update({
        where: { id: mapping.newId },
        data: { id: mapping.oldId }
      });
      
      console.log(`   🔄 ${mapping.newId} → ${mapping.oldId}`);
      restoredCount++;
      
    } catch (error) {
      console.error(`   ❌ Failed to restore ${mapping.newId}:`, error.message);
    }
  }
  
  console.log(`   ✅ Restored ${restoredCount} Zoho IDs in ${tableName}`);
  return restoredCount;
}

async function main() {
  try {
    console.log('🔄 Starting Zoho ID restoration...');
    console.log('   Restoring original Zoho IDs for CRM integration');
    
    let totalRestored = 0;
    
    // Restore activities
    if (ZOHO_ID_PATTERNS.activities.length > 0) {
      const restored = await restoreZohoIds('activities', ZOHO_ID_PATTERNS.activities);
      totalRestored += restored;
    }
    
    // Restore notes
    if (ZOHO_ID_PATTERNS.notes.length > 0) {
      const restored = await restoreZohoIds('notes', ZOHO_ID_PATTERNS.notes);
      totalRestored += restored;
    }
    
    console.log(`\n🎯 Zoho ID restoration complete!`);
    console.log(`   Total Zoho IDs restored: ${totalRestored}`);
    console.log(`   Zoho CRM integration should now work properly`);
    
  } catch (error) {
    console.error('❌ Zoho ID restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
main();
