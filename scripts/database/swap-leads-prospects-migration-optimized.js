#!/usr/bin/env node

/**
 * 🔄 OPTIMIZED LEADS ↔ PROSPECTS DATA SWAP MIGRATION
 * 
 * This script permanently swaps ALL leads and prospects data using
 * a more efficient approach with smaller transactions and batch processing.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const BACKUP_DIR = path.join(__dirname, '../../_data/migration-backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = `leads-prospects-swap-backup-${TIMESTAMP}.json`;
const BATCH_SIZE = 100; // Process in smaller batches

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
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const [leads, prospects] = await Promise.all([
    prisma.leads.findMany(),
    prisma.prospects.findMany()
  ]);
  
  const backupData = {
    timestamp: new Date().toISOString(),
    migration: 'leads-prospects-swap-optimized',
    originalCounts: {
      leads: leads.length,
      prospects: prospects.length
    },
    data: { leads, prospects }
  };
  
  const backupPath = path.join(BACKUP_DIR, BACKUP_FILE);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  
  console.log(`✅ Backup created: ${backupPath}`);
  console.log(`   Backed up ${leads.length} leads and ${prospects.length} prospects`);
  
  return { backupPath, leads, prospects };
}

/**
 * 🔄 Process data in batches for memory efficiency
 */
function processBatch(items, batchSize, processor) {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches.map(processor);
}

/**
 * 🔄 Convert prospect to lead format
 */
function convertProspectToLead(prospect) {
  return {
    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_migrated`,
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
    updatedAt: new Date(),
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
  };
}

/**
 * 🔄 Convert lead to prospect format
 */
function convertLeadToProspect(lead) {
  return {
    id: `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_migrated`,
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
    updatedAt: new Date(),
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
  };
}

/**
 * 🔄 Perform the optimized data swap
 */
async function performOptimizedDataSwap(originalLeads, originalProspects) {
  console.log('🔄 Starting optimized data swap...');
  
  // Step 1: Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.leads.deleteMany({});
  await prisma.prospects.deleteMany({});
  
  // Step 2: Convert prospects to leads in batches
  console.log('📝 Converting prospects → leads...');
  if (originalProspects.length > 0) {
    const prospectBatches = [];
    for (let i = 0; i < originalProspects.length; i += BATCH_SIZE) {
      prospectBatches.push(originalProspects.slice(i, i + BATCH_SIZE));
    }
    
    for (let i = 0; i < prospectBatches.length; i++) {
      const batch = prospectBatches[i];
      const convertedBatch = batch.map(convertProspectToLead);
      
      await prisma.leads.createMany({
        data: convertedBatch,
        skipDuplicates: true
      });
      
      console.log(`   Processed batch ${i + 1}/${prospectBatches.length} (${convertedBatch.length} records)`);
    }
  }
  
  // Step 3: Convert leads to prospects in batches
  console.log('📝 Converting leads → prospects...');
  if (originalLeads.length > 0) {
    const leadBatches = [];
    for (let i = 0; i < originalLeads.length; i += BATCH_SIZE) {
      leadBatches.push(originalLeads.slice(i, i + BATCH_SIZE));
    }
    
    for (let i = 0; i < leadBatches.length; i++) {
      const batch = leadBatches[i];
      const convertedBatch = batch.map(convertLeadToProspect);
      
      await prisma.prospects.createMany({
        data: convertedBatch,
        skipDuplicates: true
      });
      
      console.log(`   Processed batch ${i + 1}/${leadBatches.length} (${convertedBatch.length} records)`);
    }
  }
  
  return {
    originalLeads: originalLeads.length,
    originalProspects: originalProspects.length,
    newLeads: originalProspects.length,
    newProspects: originalLeads.length
  };
}

/**
 * 🔍 Validate migration results
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
  console.log(`   New Leads Count: ${newLeadsCount} (should be ${originalCounts.prospectsCount}) ${validationResults.leadsCountMatch ? '✅' : '❌'}`);
  console.log(`   New Prospects Count: ${newProspectsCount} (should be ${originalCounts.leadsCount}) ${validationResults.prospectsCountMatch ? '✅' : '❌'}`);
  console.log(`   Total Records Preserved: ${validationResults.totalRecordsPreserved ? '✅' : '❌'}`);
  
  return validationResults.leadsCountMatch && validationResults.prospectsCountMatch && validationResults.totalRecordsPreserved;
}

/**
 * 🚀 Main migration function
 */
async function main() {
  try {
    console.log('🚀 Starting OPTIMIZED Leads ↔ Prospects Data Swap Migration');
    console.log('=========================================================');
    
    // Step 1: Get current counts
    const originalCounts = await getCurrentCounts();
    
    // Step 2: Create backup and get data
    const { backupPath, leads: originalLeads, prospects: originalProspects } = await createBackup();
    
    // Step 3: Confirm before proceeding
    console.log('\n⚠️  FINAL CONFIRMATION REQUIRED:');
    console.log('This will permanently swap ALL leads and prospects data.');
    console.log(`Backup created at: ${backupPath}`);
    console.log('\nTo proceed, you must manually confirm by running:');
    console.log('node scripts/database/swap-leads-prospects-migration-optimized.js --confirm');
    
    if (!process.argv.includes('--confirm')) {
      console.log('\n🛑 Migration halted. Use --confirm flag to proceed.');
      return;
    }
    
    console.log('\n🔄 Proceeding with optimized migration...');
    
    // Step 4: Perform migration
    const migrationResult = await performOptimizedDataSwap(originalLeads, originalProspects);
    
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

module.exports = { main };
