/**
 * CONVERT LEADS AND PROSPECTS TO ULID - TARGETED CONVERSION
 * 
 * This script converts leads and prospects to use proper ULIDs
 * instead of migration IDs. This is the most critical conversion
 * for fixing the current URL/ID mismatch issues.
 * 
 * SAFETY FEATURES:
 * - Small batch processing
 * - Transaction safety
 * - Progress tracking
 * - Validation
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

// Configuration
const BATCH_SIZE = 50;

async function convertLeadsToULID() {
  console.log('🔄 Converting leads to ULIDs...');
  
  try {
    // Get leads that need conversion (migration IDs)
    const leadsToConvert = await prisma.leads.findMany({
      where: {
        id: {
          contains: '_migrated'
        }
      },
      select: { id: true, fullName: true }
    });
    
    if (leadsToConvert.length === 0) {
      console.log('✅ All leads already have ULIDs');
      return { converted: 0, errors: 0 };
    }
    
    console.log(`📊 Found ${leadsToConvert.length} leads to convert`);
    
    let converted = 0;
    let errors = 0;
    
    // Process in small batches
    for (let i = 0; i < leadsToConvert.length; i += BATCH_SIZE) {
      const batch = leadsToConvert.slice(i, i + BATCH_SIZE);
      
      console.log(`🔄 Processing leads batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(leadsToConvert.length / BATCH_SIZE)}`);
      
      // Create ID mapping for this batch
      const idMapping = {};
      for (const lead of batch) {
        const newULID = ulid();
        idMapping[lead.id] = newULID;
        console.log(`  📝 ${lead.fullName}: ${lead.id} → ${newULID}`);
      }
      
      // Update records in transaction
      try {
        await prisma.$transaction(async (tx) => {
          for (const [oldId, newId] of Object.entries(idMapping)) {
            await tx.leads.update({
              where: { id: oldId },
              data: { id: newId }
            });
          }
        });
        
        converted += batch.length;
        console.log(`✅ Converted ${batch.length} leads`);
        
      } catch (error) {
        console.error(`❌ Error converting leads batch:`, error.message);
        errors += batch.length;
      }
    }
    
    console.log(`✅ Leads conversion complete: ${converted} converted, ${errors} errors`);
    return { converted, errors };
    
  } catch (error) {
    console.error('❌ Error converting leads:', error);
    throw error;
  }
}

async function convertProspectsToULID() {
  console.log('🔄 Converting prospects to ULIDs...');
  
  try {
    // Get prospects that need conversion (migration IDs)
    const prospectsToConvert = await prisma.prospects.findMany({
      where: {
        id: {
          contains: '_migrated'
        }
      },
      select: { id: true, fullName: true }
    });
    
    if (prospectsToConvert.length === 0) {
      console.log('✅ All prospects already have ULIDs');
      return { converted: 0, errors: 0 };
    }
    
    console.log(`📊 Found ${prospectsToConvert.length} prospects to convert`);
    
    let converted = 0;
    let errors = 0;
    
    // Process in small batches
    for (let i = 0; i < prospectsToConvert.length; i += BATCH_SIZE) {
      const batch = prospectsToConvert.slice(i, i + BATCH_SIZE);
      
      console.log(`🔄 Processing prospects batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(prospectsToConvert.length / BATCH_SIZE)}`);
      
      // Create ID mapping for this batch
      const idMapping = {};
      for (const prospect of batch) {
        const newULID = ulid();
        idMapping[prospect.id] = newULID;
        console.log(`  📝 ${prospect.fullName}: ${prospect.id} → ${newULID}`);
      }
      
      // Update records in transaction
      try {
        await prisma.$transaction(async (tx) => {
          for (const [oldId, newId] of Object.entries(idMapping)) {
            await tx.prospects.update({
              where: { id: oldId },
              data: { id: newId }
            });
          }
        });
        
        converted += batch.length;
        console.log(`✅ Converted ${batch.length} prospects`);
        
      } catch (error) {
        console.error(`❌ Error converting prospects batch:`, error.message);
        errors += batch.length;
      }
    }
    
    console.log(`✅ Prospects conversion complete: ${converted} converted, ${errors} errors`);
    return { converted, errors };
    
  } catch (error) {
    console.error('❌ Error converting prospects:', error);
    throw error;
  }
}

async function validateConversion() {
  console.log('\n🔍 Validating conversion...');
  
  try {
    const leadsTotal = await prisma.leads.count();
    const leadsULID = await prisma.leads.count({
      where: { id: { startsWith: '01' } }
    });
    const leadsMigration = await prisma.leads.count({
      where: { id: { contains: '_migrated' } }
    });
    
    const prospectsTotal = await prisma.prospects.count();
    const prospectsULID = await prisma.prospects.count({
      where: { id: { startsWith: '01' } }
    });
    const prospectsMigration = await prisma.prospects.count({
      where: { id: { contains: '_migrated' } }
    });
    
    console.log(`📊 Leads: ${leadsULID}/${leadsTotal} ULID (${leadsMigration} migration remaining)`);
    console.log(`📊 Prospects: ${prospectsULID}/${prospectsTotal} ULID (${prospectsMigration} migration remaining)`);
    
    if (leadsMigration === 0 && prospectsMigration === 0) {
      console.log('🎉 All leads and prospects now have ULIDs!');
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error);
  }
}

async function convertLeadsAndProspectsToULID() {
  console.log('🚀 Starting leads and prospects ULID conversion...');
  
  const startTime = Date.now();
  
  try {
    // Convert leads first
    const leadsResult = await convertLeadsToULID();
    
    // Convert prospects
    const prospectsResult = await convertProspectsToULID();
    
    // Validate
    await validateConversion();
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 CONVERSION COMPLETE!');
    console.log(`⏱️ Duration: ${duration} seconds`);
    console.log(`📊 Leads: ${leadsResult.converted} converted, ${leadsResult.errors} errors`);
    console.log(`📊 Prospects: ${prospectsResult.converted} converted, ${prospectsResult.errors} errors`);
    
    const totalConverted = leadsResult.converted + prospectsResult.converted;
    const totalErrors = leadsResult.errors + prospectsResult.errors;
    
    console.log(`\n📈 SUMMARY: ${totalConverted} total converted, ${totalErrors} errors`);
    
    if (totalErrors === 0) {
      console.log('🎉 All leads and prospects successfully converted to ULIDs!');
    }
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the conversion
if (require.main === module) {
  convertLeadsAndProspectsToULID()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { convertLeadsAndProspectsToULID };
