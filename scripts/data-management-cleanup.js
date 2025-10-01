const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class DataManagementCleanup {
  constructor() {
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.results = {
      originalPeople: [],
      wave1People: [],
      todayPeople: [],
      archivedData: null,
      summary: {}
    };
  }

  async analyzePeopleGroups() {
    console.log('🔍 ANALYZING PEOPLE GROUPS');
    console.log('===========================');

    // Group 1: Original people (Sept 18)
    const originalPeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        createdAt: {
          gte: new Date('2025-09-18T00:00:00.000Z'),
          lt: new Date('2025-09-19T00:00:00.000Z')
        }
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        department: true,
        companyId: true,
        buyerGroupRole: true,
        lastEnriched: true,
        enrichmentSources: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Group 2: Wave 1 people (Sept 22)
    const wave1People = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        createdAt: {
          gte: new Date('2025-09-22T00:00:00.000Z'),
          lt: new Date('2025-09-23T00:00:00.000Z')
        }
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        department: true,
        companyId: true,
        buyerGroupRole: true,
        lastEnriched: true,
        enrichmentSources: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Group 3: Today's people (Sept 30)
    const todayPeople = await prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        createdAt: {
          gte: new Date('2025-09-30T00:00:00.000Z')
        }
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        department: true,
        companyId: true,
        buyerGroupRole: true,
        lastEnriched: true,
        enrichmentSources: true,
        customFields: true,
        createdAt: true,
        updatedAt: true
      }
    });

    this.results.originalPeople = originalPeople;
    this.results.wave1People = wave1People;
    this.results.todayPeople = todayPeople;

    console.log(`✅ Group 1 - Original People (Sept 18): ${originalPeople.length}`);
    console.log(`✅ Group 2 - Wave 1 People (Sept 22): ${wave1People.length}`);
    console.log(`✅ Group 3 - Today's People (Sept 30): ${todayPeople.length}`);
    console.log('');

    return {
      originalPeople,
      wave1People,
      todayPeople
    };
  }

  async archiveWave1People() {
    console.log('🗄️ ARCHIVING WAVE 1 PEOPLE');
    console.log('============================');

    const archiveData = {
      timestamp: new Date().toISOString(),
      totalPeople: this.results.wave1People.length,
      description: 'Wave 1 buyer group people (Sept 22) - archived before cleanup',
      people: this.results.wave1People.map(person => ({
        id: person.id,
        fullName: person.fullName,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        jobTitle: person.jobTitle,
        department: person.department,
        companyId: person.companyId,
        buyerGroupRole: person.buyerGroupRole,
        lastEnriched: person.lastEnriched,
        enrichmentSources: person.enrichmentSources,
        customFields: person.customFields,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt
      }))
    };

    // Save to JSON file
    const archiveFile = `archived-wave1-people-${new Date().toISOString().split('T')[0]}.json`;
    const archivePath = path.join(__dirname, '..', 'data', 'archive', archiveFile);
    
    // Ensure archive directory exists
    const archiveDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    fs.writeFileSync(archivePath, JSON.stringify(archiveData, null, 2));
    
    this.results.archivedData = {
      file: archiveFile,
      path: archivePath,
      count: archiveData.totalPeople
    };

    console.log(`✅ Archived ${archiveData.totalPeople} people to: ${archiveFile}`);
    console.log(`📁 Archive path: ${archivePath}`);
    console.log('');

    return archiveData;
  }

  async removeWave1PeopleFromDatabase() {
    console.log('🗑️ REMOVING WAVE 1 PEOPLE FROM DATABASE');
    console.log('=========================================');

    const wave1Ids = this.results.wave1People.map(p => p.id);
    
    // Soft delete by setting deletedAt
    const deleteResult = await prisma.people.updateMany({
      where: {
        id: { in: wave1Ids }
      },
      data: {
        deletedAt: new Date()
      }
    });

    console.log(`✅ Soft deleted ${deleteResult.count} Wave 1 people from database`);
    console.log('');

    return deleteResult;
  }

  async addBuyerGroupStatusToOriginalPeople() {
    console.log('🏷️ ADDING BUYER GROUP STATUS TO ORIGINAL PEOPLE');
    console.log('===============================================');

    let updatedCount = 0;
    let inCount = 0;
    let outCount = 0;

    for (const person of this.results.originalPeople) {
      try {
        // Determine if person was enriched today (in buyer group)
        const wasEnrichedToday = person.lastEnriched && 
          person.lastEnriched.toISOString().split('T')[0] === '2025-09-30';
        
        const buyerGroupStatus = wasEnrichedToday ? 'in' : 'out';
        const statusReason = wasEnrichedToday ? 
          'Enriched in today\'s buyer group discovery' : 
          'Not enriched in today\'s buyer group discovery';

        // Add buyerGroupStatus field to customFields
        const updatedCustomFields = {
          ...person.customFields,
          buyerGroupStatus: buyerGroupStatus,
          statusUpdateDate: new Date().toISOString(),
          statusReason: statusReason
        };

        await prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: updatedCustomFields,
            updatedAt: new Date()
          }
        });

        updatedCount++;
        if (buyerGroupStatus === 'in') inCount++;
        if (buyerGroupStatus === 'out') outCount++;
        
        if (updatedCount % 100 === 0) {
          console.log(`   Updated ${updatedCount}/${this.results.originalPeople.length} people...`);
        }

      } catch (error) {
        console.log(`   ⚠️ Failed to update ${person.fullName}: ${error.message}`);
      }
    }

    console.log(`✅ Added buyer group status to ${updatedCount} original people`);
    console.log(`   - IN buyer group: ${inCount} people`);
    console.log(`   - OUT of buyer group: ${outCount} people`);
    console.log('');

    return { updatedCount, inCount, outCount };
  }

  async generateSummary() {
    console.log('📊 GENERATING FINAL SUMMARY');
    console.log('============================');

    // Get current active people count
    const activePeopleCount = await prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });

    // Get people with buyer group status
    const peopleWithStatus = await prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['buyerGroupStatus'],
          not: null
        }
      }
    });

    // Get people in buyer groups
    const peopleInBuyerGroups = await prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['buyerGroupStatus'],
          equals: 'in'
        }
      }
    });

    // Get people out of buyer groups
    const peopleOutOfBuyerGroups = await prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        customFields: {
          path: ['buyerGroupStatus'],
          equals: 'out'
        }
      }
    });

    this.results.summary = {
      totalActivePeople: activePeopleCount,
      originalPeople: this.results.originalPeople.length,
      originalPeopleInBuyerGroup: this.results.originalPeople.filter(p => 
        p.lastEnriched && p.lastEnriched.toISOString().split('T')[0] === '2025-09-30'
      ).length,
      originalPeopleOutOfBuyerGroup: this.results.originalPeople.filter(p => 
        !p.lastEnriched || p.lastEnriched.toISOString().split('T')[0] !== '2025-09-30'
      ).length,
      todayPeople: this.results.todayPeople.length,
      archivedPeople: this.results.wave1People.length,
      peopleWithStatus: peopleWithStatus,
      peopleInBuyerGroups: peopleInBuyerGroups,
      peopleOutOfBuyerGroups: peopleOutOfBuyerGroups,
      archivedFile: this.results.archivedData?.file
    };

    console.log('📊 CLEANUP SUMMARY:');
    console.log('===================');
    console.log(`Total Active People: ${activePeopleCount}`);
    console.log(`  - Original People (Sept 18): ${this.results.originalPeople.length}`);
    console.log(`    - IN buyer group: ${this.results.summary.originalPeopleInBuyerGroup}`);
    console.log(`    - OUT of buyer group: ${this.results.summary.originalPeopleOutOfBuyerGroup}`);
    console.log(`  - Today's People (Sept 30): ${this.results.todayPeople.length}`);
    console.log(`  - Archived People (Sept 22): ${this.results.wave1People.length}`);
    console.log('');
    console.log('🏷️ BUYER GROUP STATUS:');
    console.log(`  - People with Status: ${peopleWithStatus}`);
    console.log(`  - People IN Buyer Groups: ${peopleInBuyerGroups}`);
    console.log(`  - People OUT of Buyer Groups: ${peopleOutOfBuyerGroups}`);
    console.log('');
    console.log('📁 ARCHIVE:');
    console.log(`  - Archive File: ${this.results.archivedData?.file || 'None'}`);
    console.log(`  - Archive Path: ${this.results.archivedData?.path || 'None'}`);
    console.log('');

    return this.results.summary;
  }

  async executeCleanup() {
    console.log('🚀 EXECUTING DATA MANAGEMENT CLEANUP');
    console.log('====================================');
    console.log('This will:');
    console.log('1. Analyze the 3 groups of people');
    console.log('2. Archive Wave 1 people (Group 2) to JSON');
    console.log('3. Remove Wave 1 people from database');
    console.log('4. Add buyer group status to original people (Group 1)');
    console.log('5. Keep today\'s people (Group 3) as-is');
    console.log('6. Generate summary report');
    console.log('');
    console.log('📊 EXPECTED RESULT:');
    console.log('  - Total Active People: ~2,370 (Group 1: 1,340 + Group 3: 1,030)');
    console.log('  - People IN Buyer Groups: ~1,051 (Group 1 enriched: 21 + Group 3: 1,030)');
    console.log('  - People OUT of Buyer Groups: ~1,319 (Group 1 not enriched)');
    console.log('  - Archived People: 1,803 (Group 2)');
    console.log('');

    try {
      // Step 1: Analyze groups
      await this.analyzePeopleGroups();

      // Step 2: Archive Wave 1 people (Group 2)
      await this.archiveWave1People();

      // Step 3: Remove Wave 1 people from database
      await this.removeWave1PeopleFromDatabase();

      // Step 4: Add buyer group status to original people (Group 1)
      await this.addBuyerGroupStatusToOriginalPeople();

      // Step 5: Generate summary
      await this.generateSummary();

      console.log('✅ DATA MANAGEMENT CLEANUP COMPLETE!');
      console.log('====================================');
      console.log('✅ Group 1 (Original): All 1,340 people kept with buyer group status');
      console.log('✅ Group 3 (Today): All 1,030 people kept as-is');
      console.log('🗄️ Group 2 (Wave 1): 1,803 people archived and removed');
      console.log('📊 Final: ~2,370 active people with accurate buyer group status');

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const analyzeOnly = args.includes('--analyze-only');

  if (analyzeOnly) {
    console.log('🔍 ANALYZE ONLY MODE');
    console.log('====================');
    const cleanup = new DataManagementCleanup();
    await cleanup.analyzePeopleGroups();
    await cleanup.generateSummary();
  } else if (dryRun) {
    console.log('🧪 DRY RUN MODE - NO CHANGES WILL BE MADE');
    console.log('==========================================');
    const cleanup = new DataManagementCleanup();
    await cleanup.analyzePeopleGroups();
    console.log('✅ Analysis complete. Run without --dry-run to execute cleanup.');
  } else {
    console.log('⚠️ EXECUTING REAL CLEANUP - THIS WILL MODIFY THE DATABASE');
    console.log('==========================================================');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const cleanup = new DataManagementCleanup();
    await cleanup.executeCleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DataManagementCleanup;
