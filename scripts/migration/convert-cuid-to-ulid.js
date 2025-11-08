/**
 * Migration Script: Convert CUIDs to ULIDs
 * 
 * This script converts all existing CUID IDs to ULIDs across all models.
 * It handles foreign key relationships by creating a mapping and updating
 * all references in the correct order.
 * 
 * IMPORTANT: This script should be run in a transaction or with backups.
 * 
 * Usage: node scripts/migration/convert-cuid-to-ulid.js
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

// Mapping of old CUID -> new ULID for each table
const idMappings = {
  StacksProject: new Map(),
  StacksEpoch: new Map(),
  StacksEpic: new Map(),
  StacksStory: new Map(),
  StacksTask: new Map(),
  StacksComment: new Map(),
  OasisChannel: new Map(),
  OasisChannelMember: new Map(),
  OasisDirectMessage: new Map(),
  OasisDMParticipant: new Map(),
  OasisMessage: new Map(),
  OasisReaction: new Map(),
  OasisReadReceipt: new Map(),
};

// Helper to check if ID is a CUID (25 chars starting with 'c' followed by 24 lowercase alphanumeric)
function isCuid(id) {
  return id && id.length === 25 && /^c[a-z0-9]{24}$/.test(id);
}

// Helper to check if ID is already a ULID (26 chars)
function isUlid(id) {
  return id && id.length === 26 && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id);
}

async function convertTable(tableName, order, tx = prisma) {
  console.log(`\n🔄 Converting ${tableName}...`);
  
  try {
    // Get all records with CUIDs (25 chars starting with 'c')
    // Use raw query to find CUIDs more accurately
    const records = await tx.$queryRawUnsafe(
      `SELECT id FROM "${tableName}" WHERE LENGTH(id) = 25 AND id LIKE 'c%'`
    );

    if (records.length === 0) {
      console.log(`   ✅ No CUID records found in ${tableName}`);
      return;
    }

    console.log(`   📊 Found ${records.length} records to convert`);

    // Create ID mappings
    for (const record of records) {
      const oldId = record.id;
      if (isCuid(oldId)) {
        const newUlid = ulid();
        idMappings[tableName].set(oldId, newUlid);
      }
    }

    console.log(`   📝 Created ${idMappings[tableName].size} ID mappings`);

    // Update records using raw SQL (required for primary key updates)
    // Note: This must be done carefully to maintain referential integrity
    const mappings = Array.from(idMappings[tableName].entries());
    
    for (const [oldId, newId] of mappings) {
      // Use raw SQL to update the primary key
      // PostgreSQL requires special handling for primary key updates
      await tx.$executeRawUnsafe(
        `UPDATE "${tableName}" SET id = $1::text WHERE id = $2::text`,
        newId,
        oldId
      );
    }
    
    console.log(`   ✅ Updated ${mappings.length} records`);

    console.log(`   ✅ Completed conversion of ${tableName}`);
  } catch (error) {
    console.error(`   ❌ Error converting ${tableName}:`, error.message);
    throw error;
  }
}

async function updateForeignKeys(tableName, foreignKeyFields, tx = prisma) {
  console.log(`\n🔗 Updating foreign keys for ${tableName}...`);

  for (const { field, referencesTable } of foreignKeyFields) {
    const mapping = idMappings[referencesTable];
    if (!mapping || mapping.size === 0) {
      continue;
    }

    try {
      // Update foreign keys using raw SQL for better performance
      let updatedCount = 0;
      for (const [oldFkId, newFkId] of mapping.entries()) {
        const result = await tx.$executeRawUnsafe(
          `UPDATE "${tableName}" SET "${field}" = $1::text WHERE "${field}" = $2::text`,
          newFkId,
          oldFkId
        );
        updatedCount += result;
      }

      if (updatedCount > 0) {
        console.log(`   ✅ Updated ${updatedCount} foreign key references for ${field} -> ${referencesTable}`);
      } else {
        console.log(`   ✅ No foreign keys to update for ${field} -> ${referencesTable}`);
      }
    } catch (error) {
      console.error(`   ❌ Error updating foreign keys for ${field}:`, error.message);
      throw error;
    }
  }
}

async function main() {
  console.log('🚀 Starting CUID to ULID migration...\n');
  console.log('⚠️  WARNING: This will update all CUID IDs to ULIDs.');
  console.log('⚠️  Make sure you have a database backup before proceeding!\n');

  try {
    // Run everything in a transaction for safety
    await prisma.$transaction(async (tx) => {
      // Step 1: Convert parent tables first (no dependencies)
      await convertTable('StacksProject', 1, tx);
      await convertTable('OasisChannel', 2, tx);
      await convertTable('OasisDirectMessage', 3, tx);

      // Step 2: Convert tables that depend on Step 1
      await convertTable('StacksEpoch', 4, tx);
      await convertTable('StacksEpic', 5, tx);
      await convertTable('OasisChannelMember', 6, tx);
      await convertTable('OasisDMParticipant', 7, tx);
      await convertTable('OasisMessage', 8, tx);

      // Step 3: Convert tables that depend on Step 2
      await convertTable('StacksStory', 9, tx);
      await convertTable('OasisReaction', 10, tx);
      await convertTable('OasisReadReceipt', 11, tx);

      // Step 4: Convert tables that depend on Step 3
      await convertTable('StacksTask', 12, tx);
      await convertTable('StacksComment', 13, tx);

      // Step 5: Update all foreign key references
      console.log('\n🔗 Updating foreign key references...');

      await updateForeignKeys('StacksEpoch', [
        { field: 'projectId', referencesTable: 'StacksProject' },
      ], tx);

      await updateForeignKeys('StacksEpic', [
        { field: 'projectId', referencesTable: 'StacksProject' },
        { field: 'epochId', referencesTable: 'StacksEpoch' },
      ], tx);

      await updateForeignKeys('StacksStory', [
        { field: 'projectId', referencesTable: 'StacksProject' },
        { field: 'epicId', referencesTable: 'StacksEpic' },
        { field: 'epochId', referencesTable: 'StacksEpoch' },
      ], tx);

      await updateForeignKeys('StacksTask', [
        { field: 'projectId', referencesTable: 'StacksProject' },
        { field: 'storyId', referencesTable: 'StacksStory' },
      ], tx);

      await updateForeignKeys('StacksComment', [
        { field: 'storyId', referencesTable: 'StacksStory' },
        { field: 'parentId', referencesTable: 'StacksComment' },
      ], tx);

      await updateForeignKeys('OasisChannelMember', [
        { field: 'channelId', referencesTable: 'OasisChannel' },
      ], tx);

      await updateForeignKeys('OasisDMParticipant', [
        { field: 'dmId', referencesTable: 'OasisDirectMessage' },
      ], tx);

      await updateForeignKeys('OasisMessage', [
        { field: 'channelId', referencesTable: 'OasisChannel' },
        { field: 'dmId', referencesTable: 'OasisDirectMessage' },
        { field: 'parentMessageId', referencesTable: 'OasisMessage' },
      ], tx);

      await updateForeignKeys('OasisReaction', [
        { field: 'messageId', referencesTable: 'OasisMessage' },
      ], tx);

      await updateForeignKeys('OasisReadReceipt', [
        { field: 'messageId', referencesTable: 'OasisMessage' },
      ], tx);

      console.log('\n✅ Migration completed successfully!');
      console.log('\n📊 Summary:');
      for (const [tableName, mapping] of Object.entries(idMappings)) {
        if (mapping.size > 0) {
          console.log(`   ${tableName}: ${mapping.size} IDs converted`);
        }
      }
    }, {
      timeout: 600000, // 10 minute timeout for large migrations
    });
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('   The transaction has been rolled back.');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  main()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { main };

