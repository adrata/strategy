#!/usr/bin/env node

/**
 * 🔄 COMPETITOR DATA MIGRATION SCRIPT
 * 
 * Migrates competitor data from old database (customFields.competitors) 
 * to new database (competitors field) for companies that lost this data during migration
 */

const { PrismaClient } = require('@prisma/client');

// Database connections
const OLD_DATABASE_URL = 'postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require';

const oldPrisma = new PrismaClient({
  datasources: {
    db: {
      url: OLD_DATABASE_URL
    }
  }
});

const newPrisma = new PrismaClient();

class CompetitorDataMigration {
  constructor() {
    this.stats = {
      totalChecked: 0,
      foundWithCompetitors: 0,
      successfullyMigrated: 0,
      alreadyMigrated: 0,
      notFoundInNew: 0,
      errors: 0
    };
    this.errors = [];
  }

  async migrate() {
    console.log('🚀 Starting Competitor Data Migration...\n');
    
    try {
      // Get all companies from old database with customFields
      const oldCompanies = await oldPrisma.$queryRaw`
        SELECT 
          id, 
          name, 
          "customFields"
        FROM companies 
        WHERE "customFields" IS NOT NULL 
        AND "customFields"::text != '{}';
      `;

      console.log(`📊 Found ${oldCompanies.length} companies with customFields in old database\n`);

      // Process each company
      for (const oldCompany of oldCompanies) {
        await this.processCompany(oldCompany);
      }

      // Print final results
      this.printResults();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await oldPrisma.$disconnect();
      await newPrisma.$disconnect();
    }
  }

  async processCompany(oldCompany) {
    this.stats.totalChecked++;

    const customFields = oldCompany.customFields;
    
    // Check for competitor data in various possible locations
    const oldCompetitors = customFields?.competitors || 
                          customFields?.coresignal?.competitors || 
                          customFields?.enrichedData?.competitors ||
                          customFields?.companyIntelligence?.competitors || [];

    // Only process if there's actual competitor data
    if (!oldCompetitors || !Array.isArray(oldCompetitors) || oldCompetitors.length === 0) {
      return;
    }

    this.stats.foundWithCompetitors++;

    try {
      // Check if company exists in new database
      const newCompany = await newPrisma.companies.findUnique({
        where: { id: oldCompany.id },
        select: { id: true, name: true, competitors: true }
      });

      if (!newCompany) {
        console.log(`❌ ${oldCompany.name} - Not found in new database`);
        this.stats.notFoundInNew++;
        return;
      }

      // Check if competitor data already exists in new database
      const newCompetitors = newCompany.competitors || [];
      if (newCompetitors.length > 0) {
        console.log(`✅ ${oldCompany.name} - Already has competitor data (${newCompetitors.length} competitors)`);
        this.stats.alreadyMigrated++;
        return;
      }

      // Migrate the competitor data
      await newPrisma.companies.update({
        where: { id: oldCompany.id },
        data: {
          competitors: oldCompetitors,
          updatedAt: new Date()
        }
      });

      console.log(`🔄 ${oldCompany.name} - Migrated ${oldCompetitors.length} competitors: ${JSON.stringify(oldCompetitors)}`);
      this.stats.successfullyMigrated++;

    } catch (error) {
      console.error(`❌ ${oldCompany.name} - Error:`, error.message);
      this.stats.errors++;
      this.errors.push({
        company: oldCompany.name,
        id: oldCompany.id,
        error: error.message
      });
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION RESULTS');
    console.log('='.repeat(60));
    console.log(`Total companies checked: ${this.stats.totalChecked}`);
    console.log(`Companies with competitor data in old DB: ${this.stats.foundWithCompetitors}`);
    console.log(`✅ Successfully migrated: ${this.stats.successfullyMigrated}`);
    console.log(`✅ Already had competitor data: ${this.stats.alreadyMigrated}`);
    console.log(`❌ Not found in new database: ${this.stats.notFoundInNew}`);
    console.log(`❌ Errors: ${this.stats.errors}`);

    if (this.stats.successfullyMigrated > 0) {
      console.log(`\n🎉 SUCCESS: Migrated competitor data for ${this.stats.successfullyMigrated} companies!`);
    }

    if (this.stats.errors > 0) {
      console.log(`\n⚠️  ERRORS encountered:`);
      this.errors.forEach(error => {
        console.log(`   - ${error.company}: ${error.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run the migration
async function main() {
  const migration = new CompetitorDataMigration();
  await migration.migrate();
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { CompetitorDataMigration };
