const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class DuplicateOrphanedCleanup {
  constructor() {
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.results = {
      orphanedLeads: [],
      orphanedProspects: [],
      duplicateLeads: [],
      duplicateProspects: [],
      summary: {}
    };
  }

  async findOrphanedRecords() {
    console.log('🔍 FINDING ORPHANED RECORDS');
    console.log('============================');

    // Get all leads
    const allLeads = await prisma.leads.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        personId: true,
        email: true,
        fullName: true
      }
    });

    // Get all prospects
    const allProspects = await prisma.prospects.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        personId: true,
        email: true,
        fullName: true
      }
    });

    // Get existing people
    const leadPersonIds = allLeads.map(lead => lead.personId).filter(id => id);
    const prospectPersonIds = allProspects.map(prospect => prospect.personId).filter(id => id);
    
    const existingPeople = await prisma.people.findMany({
      where: {
        id: { in: [...leadPersonIds, ...prospectPersonIds] },
        deletedAt: null
      },
      select: { id: true }
    });
    
    const existingPersonIds = new Set(existingPeople.map(p => p.id));
    
    // Find orphaned records
    const orphanedLeads = allLeads.filter(lead => 
      lead.personId && !existingPersonIds.has(lead.personId)
    );
    const orphanedProspects = allProspects.filter(prospect => 
      prospect.personId && !existingPersonIds.has(prospect.personId)
    );

    this.results.orphanedLeads = orphanedLeads;
    this.results.orphanedProspects = orphanedProspects;

    console.log(`📊 ORPHANED RECORDS FOUND:`);
    console.log(`   Orphaned Leads: ${orphanedLeads.length}`);
    console.log(`   Orphaned Prospects: ${orphanedProspects.length}`);
    console.log(`   Total Orphaned: ${orphanedLeads.length + orphanedProspects.length}`);
    console.log('');

    return { orphanedLeads, orphanedProspects };
  }

  async findDuplicateRecords() {
    console.log('🔍 FINDING DUPLICATE RECORDS');
    console.log('=============================');

    // Get all leads with person IDs
    const allLeads = await prisma.leads.findMany({
      where: { 
        workspaceId: this.workspaceId,
        personId: { not: null }
      },
      select: {
        id: true,
        personId: true,
        email: true,
        fullName: true,
        createdAt: true
      }
    });

    // Get all prospects with person IDs
    const allProspects = await prisma.prospects.findMany({
      where: { 
        workspaceId: this.workspaceId,
        personId: { not: null }
      },
      select: {
        id: true,
        personId: true,
        email: true,
        fullName: true,
        createdAt: true
      }
    });

    // Find duplicates by personId
    const leadPersonCounts = {};
    const prospectPersonCounts = {};

    allLeads.forEach(lead => {
      if (!leadPersonCounts[lead.personId]) {
        leadPersonCounts[lead.personId] = [];
      }
      leadPersonCounts[lead.personId].push(lead);
    });

    allProspects.forEach(prospect => {
      if (!prospectPersonCounts[prospect.personId]) {
        prospectPersonCounts[prospect.personId] = [];
      }
      prospectPersonCounts[prospect.personId].push(prospect);
    });

    // Find people with multiple records
    const duplicateLeads = Object.entries(leadPersonCounts)
      .filter(([personId, records]) => records.length > 1)
      .map(([personId, records]) => ({ personId, records }));

    const duplicateProspects = Object.entries(prospectPersonCounts)
      .filter(([personId, records]) => records.length > 1)
      .map(([personId, records]) => ({ personId, records }));

    this.results.duplicateLeads = duplicateLeads;
    this.results.duplicateProspects = duplicateProspects;

    console.log(`📊 DUPLICATE RECORDS FOUND:`);
    console.log(`   People with Multiple Leads: ${duplicateLeads.length}`);
    console.log(`   People with Multiple Prospects: ${duplicateProspects.length}`);
    console.log('');

    return { duplicateLeads, duplicateProspects };
  }

  async removeOrphanedRecords() {
    console.log('🗑️ REMOVING ORPHANED RECORDS');
    console.log('==============================');

    const orphanedLeadIds = this.results.orphanedLeads.map(lead => lead.id);
    const orphanedProspectIds = this.results.orphanedProspects.map(prospect => prospect.id);

    let leadsRemoved = 0;
    let prospectsRemoved = 0;

    // Remove orphaned leads
    if (orphanedLeadIds.length > 0) {
      const deleteResult = await prisma.leads.deleteMany({
        where: {
          id: { in: orphanedLeadIds }
        }
      });
      leadsRemoved = deleteResult.count;
    }

    // Remove orphaned prospects
    if (orphanedProspectIds.length > 0) {
      const deleteResult = await prisma.prospects.deleteMany({
        where: {
          id: { in: orphanedProspectIds }
        }
      });
      prospectsRemoved = deleteResult.count;
    }

    console.log(`✅ Removed ${leadsRemoved} orphaned lead records`);
    console.log(`✅ Removed ${prospectsRemoved} orphaned prospect records`);
    console.log('');

    return { leadsRemoved, prospectsRemoved };
  }

  async removeDuplicateRecords() {
    console.log('🗑️ REMOVING DUPLICATE RECORDS');
    console.log('===============================');

    let leadsRemoved = 0;
    let prospectsRemoved = 0;

    // Remove duplicate leads (keep the oldest one)
    for (const duplicate of this.results.duplicateLeads) {
      const { personId, records } = duplicate;
      
      // Sort by creation date, keep the oldest
      const sortedRecords = records.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Remove all but the first (oldest) record
      const recordsToRemove = sortedRecords.slice(1);
      const recordIdsToRemove = recordsToRemove.map(record => record.id);
      
      if (recordIdsToRemove.length > 0) {
        const deleteResult = await prisma.leads.deleteMany({
          where: {
            id: { in: recordIdsToRemove }
          }
        });
        leadsRemoved += deleteResult.count;
      }
    }

    // Remove duplicate prospects (keep the oldest one)
    for (const duplicate of this.results.duplicateProspects) {
      const { personId, records } = duplicate;
      
      // Sort by creation date, keep the oldest
      const sortedRecords = records.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Remove all but the first (oldest) record
      const recordsToRemove = sortedRecords.slice(1);
      const recordIdsToRemove = recordsToRemove.map(record => record.id);
      
      if (recordIdsToRemove.length > 0) {
        const deleteResult = await prisma.prospects.deleteMany({
          where: {
            id: { in: recordIdsToRemove }
          }
        });
        prospectsRemoved += deleteResult.count;
      }
    }

    console.log(`✅ Removed ${leadsRemoved} duplicate lead records`);
    console.log(`✅ Removed ${prospectsRemoved} duplicate prospect records`);
    console.log('');

    return { leadsRemoved, prospectsRemoved };
  }

  async generateSummary() {
    console.log('📊 GENERATING CLEANUP SUMMARY');
    console.log('==============================');

    // Get final counts
    const totalLeads = await prisma.leads.count({
      where: { workspaceId: this.workspaceId }
    });

    const totalProspects = await prisma.prospects.count({
      where: { workspaceId: this.workspaceId }
    });

    const totalActivePeople = await prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });

    this.results.summary = {
      totalLeads: totalLeads,
      totalProspects: totalProspects,
      totalActivePeople: totalActivePeople,
      orphanedLeadsRemoved: this.results.orphanedLeads.length,
      orphanedProspectsRemoved: this.results.orphanedProspects.length,
      duplicateLeadsRemoved: this.results.duplicateLeads.reduce((sum, dup) => sum + (dup.records.length - 1), 0),
      duplicateProspectsRemoved: this.results.duplicateProspects.reduce((sum, dup) => sum + (dup.records.length - 1), 0)
    };

    console.log('📊 CLEANUP SUMMARY:');
    console.log('===================');
    console.log(`Total Active People: ${totalActivePeople}`);
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`Total Prospects: ${totalProspects}`);
    console.log(`Total Lead/Prospect Records: ${totalLeads + totalProspects}`);
    console.log('');
    console.log('🗑️ RECORDS REMOVED:');
    console.log(`   Orphaned Leads: ${this.results.orphanedLeads.length}`);
    console.log(`   Orphaned Prospects: ${this.results.orphanedProspects.length}`);
    console.log(`   Duplicate Leads: ${this.results.duplicateLeads.reduce((sum, dup) => sum + (dup.records.length - 1), 0)}`);
    console.log(`   Duplicate Prospects: ${this.results.duplicateProspects.reduce((sum, dup) => sum + (dup.records.length - 1), 0)}`);
    console.log('');
    
    const ratio = Math.round(((totalLeads + totalProspects) / totalActivePeople) * 100);
    console.log(`📊 FINAL RATIO: ${ratio}% (${totalLeads + totalProspects} records / ${totalActivePeople} people)`);
    
    if (ratio === 100) {
      console.log('✅ PERFECT: Lead/prospect records = active people');
    } else if (ratio < 100) {
      console.log('⚠️ WARNING: Some people may not have lead/prospect records');
    } else {
      console.log('❌ ISSUE: Still more records than people');
    }
    console.log('');

    return this.results.summary;
  }

  async executeCleanup() {
    console.log('🚀 EXECUTING DUPLICATE/ORPHANED CLEANUP');
    console.log('========================================');
    console.log('This will:');
    console.log('1. Find orphaned records (pointing to deleted people)');
    console.log('2. Find duplicate records (multiple records per person)');
    console.log('3. Remove orphaned records');
    console.log('4. Remove duplicate records (keep oldest)');
    console.log('5. Generate summary report');
    console.log('');

    try {
      // Step 1: Find orphaned records
      await this.findOrphanedRecords();

      // Step 2: Find duplicate records
      await this.findDuplicateRecords();

      // Step 3: Remove orphaned records
      await this.removeOrphanedRecords();

      // Step 4: Remove duplicate records
      await this.removeDuplicateRecords();

      // Step 5: Generate summary
      await this.generateSummary();

      console.log('✅ DUPLICATE/ORPHANED CLEANUP COMPLETE!');
      console.log('========================================');
      console.log('✅ Orphaned records removed');
      console.log('✅ Duplicate records removed');
      console.log('📊 Lead/prospect records now align with active people');

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
    const cleanup = new DuplicateOrphanedCleanup();
    await cleanup.findOrphanedRecords();
    await cleanup.findDuplicateRecords();
    await cleanup.generateSummary();
  } else if (dryRun) {
    console.log('🧪 DRY RUN MODE - NO CHANGES WILL BE MADE');
    console.log('==========================================');
    const cleanup = new DuplicateOrphanedCleanup();
    await cleanup.findOrphanedRecords();
    await cleanup.findDuplicateRecords();
    console.log('✅ Analysis complete. Run without --dry-run to execute cleanup.');
  } else {
    console.log('⚠️ EXECUTING REAL CLEANUP - THIS WILL MODIFY THE DATABASE');
    console.log('==========================================================');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const cleanup = new DuplicateOrphanedCleanup();
    await cleanup.executeCleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DuplicateOrphanedCleanup;
