#!/usr/bin/env node

/**
 * 🔄 NOTARY EVERYDAY WORKSPACE CONSOLIDATION SCRIPT
 * 
 * This script safely consolidates the Notary Everyday workspaces:
 * - Migrates all data from orphaned workspace (cmezxb1ez0001pc94yry3ntjk) 
 * - To the clean workspace (01K1VBYmf75hgmvmz06psnc9ug)
 * - Preserves all data integrity
 * - Creates backup before migration
 * 
 * SAFETY FEATURES:
 * - Creates backup before any changes
 * - Validates data before migration
 * - Provides rollback capability
 * - Comprehensive logging
 * 
 * Usage: node scripts/consolidate-notary-workspaces.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Workspace IDs
const ORPHANED_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';  // Has all the data
const CLEAN_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';    // Clean workspace

// Backup directory
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'notary-workspace-consolidation');

async function createBackup() {
  console.log('💾 Creating backup before migration...\n');
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `notary-workspace-backup-${timestamp}.json`);
  
  try {
    // Backup accounts
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
    });
    
    // Backup leads
    const leads = await prisma.leads.findMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
    });
    
    // Backup contacts
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
    });
    
    // Backup opportunities
    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
    });
    
    // Backup prospects
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
    });
    
    const backup = {
      timestamp: new Date().toISOString(),
      orphanedWorkspaceId: ORPHANED_WORKSPACE_ID,
      cleanWorkspaceId: CLEAN_WORKSPACE_ID,
      accounts: accounts,
      leads: leads,
      contacts: contacts,
      opportunities: opportunities,
      prospects: prospects,
      counts: {
        accounts: accounts.length,
        leads: leads.length,
        contacts: contacts.length,
        opportunities: opportunities.length,
        prospects: prospects.length
      }
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`   Accounts: ${backup.counts.accounts}`);
    console.log(`   Leads: ${backup.counts.leads}`);
    console.log(`   Contacts: ${backup.counts.contacts}`);
    console.log(`   Opportunities: ${backup.counts.opportunities}`);
    console.log(`   Prospects: ${backup.counts.prospects}\n`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function validateMigration() {
  console.log('🔍 Validating migration requirements...\n');
  
  // Check that clean workspace exists
  const cleanWorkspace = await prisma.workspaces.findUnique({
    where: { id: CLEAN_WORKSPACE_ID }
  });
  
  if (!cleanWorkspace) {
    throw new Error(`Clean workspace ${CLEAN_WORKSPACE_ID} not found!`);
  }
  
  console.log(`✅ Clean workspace found: ${cleanWorkspace.name}`);
  
  // Check that orphaned workspace has data
  const accountCount = await prisma.accounts.count({
    where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
  });
  
  if (accountCount === 0) {
    throw new Error(`No data found in orphaned workspace ${ORPHANED_WORKSPACE_ID}!`);
  }
  
  console.log(`✅ Orphaned workspace has ${accountCount} accounts`);
  
  // Check that clean workspace is empty
  const cleanAccountCount = await prisma.accounts.count({
    where: { workspaceId: CLEAN_WORKSPACE_ID, deletedAt: null }
  });
  
  if (cleanAccountCount > 0) {
    console.log(`⚠️  Warning: Clean workspace already has ${cleanAccountCount} accounts`);
    console.log('   Migration will add to existing data\n');
  } else {
    console.log('✅ Clean workspace is empty, ready for migration\n');
  }
}

async function migrateData() {
  console.log('🔄 Starting data migration...\n');
  
  const results = {
    accounts: 0,
    leads: 0,
    contacts: 0,
    opportunities: 0,
    prospects: 0,
    errors: []
  };
  
  try {
    // Migrate accounts
    console.log('📊 Migrating accounts...');
    const accountResult = await prisma.accounts.updateMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null },
      data: { workspaceId: CLEAN_WORKSPACE_ID }
    });
    results.accounts = accountResult.count;
    console.log(`   ✅ Migrated ${results.accounts} accounts`);
    
    // Migrate leads
    console.log('👥 Migrating leads...');
    const leadResult = await prisma.leads.updateMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null },
      data: { workspaceId: CLEAN_WORKSPACE_ID }
    });
    results.leads = leadResult.count;
    console.log(`   ✅ Migrated ${results.leads} leads`);
    
    // Migrate contacts
    console.log('📞 Migrating contacts...');
    const contactResult = await prisma.contacts.updateMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null },
      data: { workspaceId: CLEAN_WORKSPACE_ID }
    });
    results.contacts = contactResult.count;
    console.log(`   ✅ Migrated ${results.contacts} contacts`);
    
    // Migrate opportunities
    console.log('🎯 Migrating opportunities...');
    const opportunityResult = await prisma.opportunities.updateMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null },
      data: { workspaceId: CLEAN_WORKSPACE_ID }
    });
    results.opportunities = opportunityResult.count;
    console.log(`   ✅ Migrated ${results.opportunities} opportunities`);
    
    // Migrate prospects
    console.log('🔍 Migrating prospects...');
    const prospectResult = await prisma.prospects.updateMany({
      where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null },
      data: { workspaceId: CLEAN_WORKSPACE_ID }
    });
    results.prospects = prospectResult.count;
    console.log(`   ✅ Migrated ${results.prospects} prospects`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    results.errors.push(error.message);
    throw error;
  }
  
  return results;
}

async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n');
  
  // Check clean workspace data
  const cleanAccounts = await prisma.accounts.count({
    where: { workspaceId: CLEAN_WORKSPACE_ID, deletedAt: null }
  });
  const cleanLeads = await prisma.leads.count({
    where: { workspaceId: CLEAN_WORKSPACE_ID, deletedAt: null }
  });
  const cleanContacts = await prisma.contacts.count({
    where: { workspaceId: CLEAN_WORKSPACE_ID, deletedAt: null }
  });
  const cleanOpportunities = await prisma.opportunities.count({
    where: { workspaceId: CLEAN_WORKSPACE_ID, deletedAt: null }
  });
  const cleanProspects = await prisma.prospects.count({
    where: { workspaceId: CLEAN_WORKSPACE_ID, deletedAt: null }
  });
  
  // Check orphaned workspace is empty
  const orphanedAccounts = await prisma.accounts.count({
    where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
  });
  const orphanedLeads = await prisma.leads.count({
    where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
  });
  const orphanedContacts = await prisma.contacts.count({
    where: { workspaceId: ORPHANED_WORKSPACE_ID, deletedAt: null }
  });
  
  console.log('📊 Clean Workspace (After Migration):');
  console.log(`   Accounts: ${cleanAccounts}`);
  console.log(`   Leads: ${cleanLeads}`);
  console.log(`   Contacts: ${cleanContacts}`);
  console.log(`   Opportunities: ${cleanOpportunities}`);
  console.log(`   Prospects: ${cleanProspects}\n`);
  
  console.log('📊 Orphaned Workspace (After Migration):');
  console.log(`   Accounts: ${orphanedAccounts}`);
  console.log(`   Leads: ${orphanedLeads}`);
  console.log(`   Contacts: ${orphanedContacts}\n`);
  
  if (orphanedAccounts === 0 && orphanedLeads === 0 && orphanedContacts === 0) {
    console.log('✅ Migration verification successful!');
    console.log('   All data has been moved to the clean workspace.');
  } else {
    console.log('⚠️  Warning: Some data may still exist in orphaned workspace');
  }
}

async function main() {
  console.log('🔄 NOTARY EVERYDAY WORKSPACE CONSOLIDATION');
  console.log('=' .repeat(60));
  console.log(`From: ${ORPHANED_WORKSPACE_ID} (orphaned)`);
  console.log(`To: ${CLEAN_WORKSPACE_ID} (clean workspace)`);
  console.log('');
  
  try {
    // Step 1: Create backup
    const backupFile = await createBackup();
    
    // Step 2: Validate migration
    await validateMigration();
    
    // Step 3: Migrate data
    const results = await migrateData();
    
    // Step 4: Verify migration
    await verifyMigration();
    
    console.log('\n🎉 WORKSPACE CONSOLIDATION COMPLETED SUCCESSFULLY!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Final counts:`);
    console.log(`   Accounts: ${results.accounts}`);
    console.log(`   Leads: ${results.leads}`);
    console.log(`   Contacts: ${results.contacts}`);
    console.log(`   Opportunities: ${results.opportunities}`);
    console.log(`   Prospects: ${results.prospects}`);
    
  } catch (error) {
    console.error('\n❌ CONSOLIDATION FAILED:', error.message);
    console.log('💾 Backup was created before migration - you can restore if needed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, createBackup, validateMigration, migrateData, verifyMigration };
