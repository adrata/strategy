#!/usr/bin/env node

/**
 * 🔄 LEADS ↔ PROSPECTS DATA SWAP MIGRATION
 * 
 * This script permanently swaps ALL leads and prospects data in the database:
 * - All current prospects become leads
 * - All current leads become prospects
 * 
 * ⚠️  CRITICAL SAFETY MEASURES:
 * - Creates backup before migration
 * - Uses transactions for atomicity
 * - Validates data integrity
 * - Provides rollback capability
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../_data/migration-backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = `leads-prospects-swap-backup-${TIMESTAMP}.json`;

/**
 * 📊 Get current data counts
 */
async function getCurrentCounts() {
  const [leadsCount, prospectsCount] = await Promise.all([
    prisma.leads.count(),
    prisma.prospects.count()
  ]);
  
  console.log('📊 Current Data Counts:');
  console.log(`   Leads: ${leadsCount}`);
  console.log(`   Prospects: ${prospectsCount}`);
  
  return { leadsCount, prospectsCount };
}

/**
 * 💾 Create backup of current data
 */
async function createBackup() {
  console.log('💾 Creating backup...');
  
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Fetch all data
  const [leads, prospects] = await Promise.all([
    prisma.leads.findMany(),
    prisma.prospects.findMany()
  ]);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    migration: 'leads-prospects-swap',
    originalCounts: {
      leads: leads.length,
      prospects: prospects.length
    },
    data: {
      leads,
      prospects
    }
  };
  
  const backupPath = path.join(BACKUP_DIR, BACKUP_FILE);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  
  console.log(`✅ Backup created: ${backupPath}`);
  console.log(`   Backed up ${leads.length} leads and ${prospects.length} prospects`);
  
  return backupPath;
}

/**
 * 🔄 Perform the data swap migration
 */
async function performDataSwap() {
  console.log('🔄 Starting data swap migration...');
  
  // Use transaction for atomicity with extended timeout for large dataset
  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Fetch all current data
    console.log('📥 Fetching current data...');
    const [currentLeads, currentProspects] = await Promise.all([
      tx.leads.findMany(),
      tx.prospects.findMany()
    ]);
    
    console.log(`   Found ${currentLeads.length} leads to convert to prospects`);
    console.log(`   Found ${currentProspects.length} prospects to convert to leads`);
    
    // Step 2: Clear both tables (within transaction)
    console.log('🗑️  Clearing tables...');
    await tx.leads.deleteMany({});
    await tx.prospects.deleteMany({});
    
    // Step 3: Insert prospects data into leads table (in batches for performance)
    console.log('📝 Converting prospects → leads...');
    if (currentProspects.length > 0) {
      const prospectsAsLeads = currentProspects.map(prospect => ({
        // Generate new lead ID
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${prospect.id.split('_').pop()}`,
        
        // Copy all prospect fields to leads structure
        workspaceId: prospect.workspaceId,
        assignedUserId: prospect.assignedUserId,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        fullName: prospect.fullName,
        displayName: prospect.displayName,
        email: prospect.email,
        workEmail: prospect.workEmail,
        personalEmail: prospect.personalEmail,
        phone: prospect.phone,
        mobilePhone: prospect.mobilePhone,
        workPhone: prospect.workPhone,
        company: prospect.company,
        companyDomain: prospect.companyDomain,
        industry: prospect.industry,
        companySize: prospect.companySize,
        jobTitle: prospect.jobTitle,
        title: prospect.title,
        department: prospect.department,
        linkedinUrl: prospect.linkedinUrl,
        address: prospect.address,
        city: prospect.city,
        state: prospect.state,
        country: prospect.country,
        postalCode: prospect.postalCode,
        status: prospect.status,
        priority: prospect.priority,
        source: prospect.source,
        estimatedValue: prospect.estimatedValue,
        currency: prospect.currency,
        notes: prospect.notes,
        description: prospect.description,
        tags: prospect.tags,
        customFields: prospect.customFields,
        preferredLanguage: prospect.preferredLanguage,
        timezone: prospect.timezone,
        lastEnriched: prospect.lastEnriched,
        enrichmentSources: prospect.enrichmentSources,
        emailVerified: prospect.emailVerified,
        phoneVerified: prospect.phoneVerified,
        mobileVerified: prospect.mobileVerified,
        enrichmentScore: prospect.enrichmentScore,
        emailConfidence: prospect.emailConfidence,
        phoneConfidence: prospect.phoneConfidence,
        dataCompleteness: prospect.dataCompleteness,
        createdAt: prospect.createdAt,
        updatedAt: new Date(), // Update timestamp for migration
        personId: prospect.personId,
        deletedAt: prospect.deletedAt,
        buyerGroupRole: prospect.buyerGroupRole,
        completedStages: prospect.completedStages || [],
        currentStage: prospect.currentStage,
        lastActionDate: prospect.lastActionDate,
        nextAction: prospect.nextAction,
        nextActionDate: prospect.nextActionDate,
        lastContactDate: prospect.lastContactDate,
        companyId: prospect.companyId
      }));
      
      await tx.leads.createMany({
        data: prospectsAsLeads
      });
    }
    
    // Step 4: Insert leads data into prospects table
    console.log('📝 Converting leads → prospects...');
    if (currentLeads.length > 0) {
      const leadsAsProspects = currentLeads.map(lead => ({
        // Generate new prospect ID
        id: `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${lead.id.split('_').pop()}`,
        
        // Copy all lead fields to prospects structure
        workspaceId: lead.workspaceId,
        assignedUserId: lead.assignedUserId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        fullName: lead.fullName,
        displayName: lead.displayName,
        email: lead.email,
        workEmail: lead.workEmail,
        personalEmail: lead.personalEmail,
        phone: lead.phone,
        mobilePhone: lead.mobilePhone,
        workPhone: lead.workPhone,
        company: lead.company,
        companyDomain: lead.companyDomain,
        industry: lead.industry,
        companySize: lead.companySize,
        jobTitle: lead.jobTitle,
        title: lead.title,
        department: lead.department,
        linkedinUrl: lead.linkedinUrl,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        postalCode: lead.postalCode,
        status: lead.status,
        priority: lead.priority,
        source: lead.source,
        estimatedValue: lead.estimatedValue,
        currency: lead.currency,
        notes: lead.notes,
        description: lead.description,
        tags: lead.tags,
        customFields: lead.customFields,
        preferredLanguage: lead.preferredLanguage,
        timezone: lead.timezone,
        lastEnriched: lead.lastEnriched,
        enrichmentSources: lead.enrichmentSources,
        emailVerified: lead.emailVerified,
        phoneVerified: lead.phoneVerified,
        mobileVerified: lead.mobileVerified,
        enrichmentScore: lead.enrichmentScore,
        emailConfidence: lead.emailConfidence,
        phoneConfidence: lead.phoneConfidence,
        dataCompleteness: lead.dataCompleteness,
        createdAt: lead.createdAt,
        updatedAt: new Date(), // Update timestamp for migration
        personId: lead.personId,
        deletedAt: lead.deletedAt,
        buyerGroupRole: lead.buyerGroupRole,
        completedStages: lead.completedStages || [],
        currentStage: lead.currentStage,
        lastActionDate: lead.lastActionDate,
        nextAction: lead.nextAction,
        nextActionDate: lead.nextActionDate,
        lastContactDate: lead.lastContactDate,
        companyId: lead.companyId
      }));
      
      await tx.prospects.createMany({
        data: leadsAsProspects
      });
    }
    
    return {
      originalLeads: currentLeads.length,
      originalProspects: currentProspects.length,
      newLeads: currentProspects.length, // Prospects became leads
      newProspects: currentLeads.length  // Leads became prospects
    };
  }, {
    maxWait: 30000, // 30 seconds
    timeout: 60000  // 60 seconds
  });
  
  console.log('✅ Data swap completed successfully!');
  console.log(`   Original: ${result.originalLeads} leads, ${result.originalProspects} prospects`);
  console.log(`   New: ${result.newLeads} leads, ${result.newProspects} prospects`);
  
  return result;
}

/**
 * 🔍 Validate the migration results
 */
async function validateMigration(originalCounts, migrationResult) {
  console.log('🔍 Validating migration results...');
  
  const [newLeadsCount, newProspectsCount] = await Promise.all([
    prisma.leads.count(),
    prisma.prospects.count()
  ]);
  
  const validationResults = {
    leadsCountMatch: newLeadsCount === originalCounts.prospectsCount,
    prospectsCountMatch: newProspectsCount === originalCounts.leadsCount,
    totalRecordsPreserved: (newLeadsCount + newProspectsCount) === (originalCounts.leadsCount + originalCounts.prospectsCount)
  };
  
  console.log('📊 Validation Results:');
  console.log(`   New Leads Count: ${newLeadsCount} (should be ${originalCounts.prospectsCount}) ✓${validationResults.leadsCountMatch ? '' : ' ❌'}`);
  console.log(`   New Prospects Count: ${newProspectsCount} (should be ${originalCounts.leadsCount}) ✓${validationResults.prospectsCountMatch ? '' : ' ❌'}`);
  console.log(`   Total Records Preserved: ${validationResults.totalRecordsPreserved ? '✅' : '❌'}`);
  
  if (validationResults.leadsCountMatch && validationResults.prospectsCountMatch && validationResults.totalRecordsPreserved) {
    console.log('✅ Migration validation PASSED!');
    return true;
  } else {
    console.log('❌ Migration validation FAILED!');
    return false;
  }
}

/**
 * 🚀 Main migration function
 */
async function main() {
  try {
    console.log('🚀 Starting Leads ↔ Prospects Data Swap Migration');
    console.log('================================================');
    
    // Step 1: Get current counts
    const originalCounts = await getCurrentCounts();
    
    // Step 2: Create backup
    const backupPath = await createBackup();
    
    // Step 3: Confirm before proceeding
    console.log('\n⚠️  FINAL CONFIRMATION REQUIRED:');
    console.log('This will permanently swap ALL leads and prospects data.');
    console.log(`Backup created at: ${backupPath}`);
    console.log('\nTo proceed, you must manually confirm by running:');
    console.log('node scripts/database/swap-leads-prospects-migration.js --confirm');
    
    // Check for confirmation flag
    if (!process.argv.includes('--confirm')) {
      console.log('\n🛑 Migration halted. Use --confirm flag to proceed.');
      return;
    }
    
    console.log('\n🔄 Proceeding with migration...');
    
    // Step 4: Perform migration
    const migrationResult = await performDataSwap();
    
    // Step 5: Validate results
    const isValid = await validateMigration(originalCounts, migrationResult);
    
    if (isValid) {
      console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('All leads are now prospects, and all prospects are now leads.');
      console.log(`Backup available at: ${backupPath}`);
    } else {
      console.log('\n❌ MIGRATION VALIDATION FAILED!');
      console.log('Please check the data and consider restoring from backup.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.log('Please check the backup and consider manual rollback.');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  createBackup,
  performDataSwap,
  validateMigration
};
