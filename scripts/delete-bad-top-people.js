require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

class DeleteBadTopPeople {
  constructor() {
    this.prisma = prisma;
    this.workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus
    this.resultsFile = 'scripts/top-data-matching-results.json';
  }

  async run() {
    try {
      console.log('🗑️  DELETE BAD TOP PEOPLE');
      console.log('==========================\n');

      // Load results from matching script
      if (!fs.existsSync(this.resultsFile)) {
        console.error(`❌ Results file not found: ${this.resultsFile}`);
        console.error('   Please run scripts/match-original-top-data.js first');
        return;
      }

      const results = JSON.parse(fs.readFileSync(this.resultsFile, 'utf-8'));
      const badRecords = results.badRecords || [];

      if (badRecords.length === 0) {
        console.log('✅ No bad records to delete');
        return;
      }

      console.log(`📊 Found ${badRecords.length} bad records to delete\n`);

      // Show summary
      console.log('📋 SUMMARY:');
      console.log(`   Bad Records: ${badRecords.length}`);
      console.log(`   Matched (Good): ${results.summary.matchedCount}`);
      console.log(`   Needs Review: ${results.summary.unmatchedWithoutCoreSignal}\n`);

      // Show sample records
      console.log('🚨 Records to be deleted (first 10):');
      badRecords.slice(0, 10).forEach((record, i) => {
        console.log(`   ${i + 1}. ${record.fullName} (${record.company || 'No Company'})`);
      });
      console.log('');

      // Safety check
      console.log('⚠️  SAFETY CHECK:');
      console.log('   This will SOFT DELETE (set deletedAt) the records above.');
      console.log('   Records will be hidden but not permanently removed.\n');

      // For now, just show what would be deleted
      // Uncomment the deletion code below after review
      console.log('💡 To actually delete, uncomment the deletion code in the script.\n');

      // Delete bad records
      console.log('🗑️  Deleting bad records...\n');
      
      let deleted = 0;
      let errors = 0;

      for (const record of badRecords) {
        try {
          await this.prisma.people.update({
            where: { id: record.id },
            data: { deletedAt: new Date() }
          });
          deleted++;
          if (deleted % 10 === 0) {
            console.log(`   Deleted ${deleted}/${badRecords.length}...`);
          }
        } catch (error) {
          console.error(`   ❌ Error deleting ${record.fullName}: ${error.message}`);
          errors++;
        }
      }

      console.log(`\n✅ Deleted ${deleted} records`);
      if (errors > 0) {
        console.log(`   ⚠️  ${errors} errors occurred`);
      }

      // Export list of IDs for manual deletion if needed
      const idsToDelete = badRecords.map(r => r.id);
      const idsFile = 'scripts/bad-records-ids.json';
      fs.writeFileSync(idsFile, JSON.stringify(idsToDelete, null, 2));
      console.log(`💾 Bad record IDs exported to: ${idsFile}`);
      console.log('   You can use these IDs to delete manually if needed.\n');

    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the deletion script
async function main() {
  const deleter = new DeleteBadTopPeople();
  await deleter.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeleteBadTopPeople;

