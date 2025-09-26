#!/usr/bin/env node

/**
 * CLEANUP SCRIPT: Remove Incorrect CoreSignal Data
 * 
 * This script removes all CoreSignal data that was incorrectly matched
 * and resets people to a clean state for re-enrichment
 */

const { PrismaClient } = require('@prisma/client');

class CoreSignalDataCleanup {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.results = {
      peopleCleaned: 0,
      peopleSkipped: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🧹 CLEANING UP INCORRECT CORESIGNAL DATA');
    console.log('========================================');
    console.log('Removing all CoreSignal data for re-enrichment');
    console.log('');

    try {
      // Get all people with CoreSignal data
      const peopleWithCoreSignal = await this.prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null,
          customFields: { path: ['coresignalData'], not: null }
        },
        select: {
          id: true,
          fullName: true,
          customFields: true
        }
      });

      console.log(`📊 Found ${peopleWithCoreSignal.length} people with CoreSignal data`);
      console.log('');

      // Clean up each person
      for (const person of peopleWithCoreSignal) {
        await this.cleanupPersonCoreSignalData(person);
      }

      // Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async cleanupPersonCoreSignalData(person) {
    try {
      console.log(`🧹 Cleaning: ${person.fullName} (ID: ${person.id})`);
      
      // Remove CoreSignal-related fields from customFields
      const cleanedCustomFields = { ...person.customFields };
      
      // Remove CoreSignal data
      delete cleanedCustomFields.coresignalData;
      delete cleanedCustomFields.rawData;
      delete cleanedCustomFields.coresignalId;
      delete cleanedCustomFields.lastEnriched;
      delete cleanedCustomFields.enrichmentSource;
      delete cleanedCustomFields.enrichmentStatus;
      delete cleanedCustomFields.enrichmentConfidence;
      delete cleanedCustomFields.enrichmentMethod;
      delete cleanedCustomFields.note;
      
      // Update the person record
      await this.prisma.people.update({
        where: { id: person.id },
        data: {
          customFields: cleanedCustomFields
        }
      });

      console.log(`   ✅ Cleaned CoreSignal data for ${person.fullName}`);
      this.results.peopleCleaned++;

    } catch (error) {
      console.error(`   ❌ Failed to clean ${person.fullName}:`, error.message);
      this.results.errors.push(`${person.fullName}: ${error.message}`);
      this.results.peopleSkipped++;
    }
  }

  async generateFinalReport() {
    console.log('📊 CLEANUP REPORT');
    console.log('=================');
    console.log(`   People cleaned: ${this.results.peopleCleaned}`);
    console.log(`   People skipped: ${this.results.peopleSkipped}`);
    console.log(`   Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('');
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('');
    console.log('✅ CLEANUP COMPLETE!');
    console.log('   🧹 All incorrect CoreSignal data removed');
    console.log('   🎯 People are now ready for improved re-enrichment');
    console.log('   📈 Next step: Run the improved enrichment script');
  }
}

// Execute the cleanup
async function main() {
  const cleanup = new CoreSignalDataCleanup();
  await cleanup.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CoreSignalDataCleanup };
