#!/usr/bin/env node

/**
 * 🔄 COMPREHENSIVE ORPHANED DATA CONSOLIDATION SCRIPT
 * 
 * This script consolidates all orphaned workspace data:
 * 1. demo-workspace-2025 → Adrata workspace (demo data)
 * 2. 01K4AEKHZ1KKDSVAGHVNG43DB3 → Demo Workspace (test data)
 * 3. 01K1VBYV8ETM2RCQA4GNN9EG75 → Retail Product Solutions (energy contacts)
 * 4. 01K1VBYV8ETM2RCQA4GNN9EG73 → Retail Product Solutions (energy contacts)
 * 
 * SAFETY FEATURES:
 * - Creates backup before any changes
 * - Validates data before migration
 * - Provides rollback capability
 * - Comprehensive logging
 * 
 * Usage: node scripts/consolidate-all-orphaned-data.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Consolidation mapping
const CONSOLIDATION_PLAN = [
  {
    orphanedId: 'demo-workspace-2025',
    targetId: '01K1VBYXHD0J895XAN0HGFBKJP', // Adrata workspace
    targetName: 'Adrata',
    reason: 'Demo data for Adrata company'
  },
  {
    orphanedId: '01K4AEKHZ1KKDSVAGHVNG43DB3',
    targetId: '01K1VBYX2YERMXBFJ60RC6J194', // Demo Workspace
    targetName: 'Demo Workspace',
    reason: 'Test/innovation data for demo purposes'
  },
  {
    orphanedId: '01K1VBYV8ETM2RCQA4GNN9EG75',
    targetId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Retail Product Solutions
    targetName: 'Retail Product Solutions',
    reason: 'Energy industry contacts (similar ID pattern)'
  },
  {
    orphanedId: '01K1VBYV8ETM2RCQA4GNN9EG73',
    targetId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Retail Product Solutions
    targetName: 'Retail Product Solutions',
    reason: 'Energy industry contacts (similar ID pattern)'
  }
];

// Backup directory
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'orphaned-data-consolidation');

async function createBackup() {
  console.log('💾 Creating comprehensive backup before consolidation...\n');
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `orphaned-data-backup-${timestamp}.json`);
  
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      consolidationPlan: CONSOLIDATION_PLAN,
      orphanedData: {}
    };
    
    // Backup data for each orphaned workspace
    for (const plan of CONSOLIDATION_PLAN) {
      const orphanedId = plan.orphanedId;
      
      const accounts = await prisma.accounts.findMany({
        where: { workspaceId: orphanedId, deletedAt: null }
      });
      
      const leads = await prisma.leads.findMany({
        where: { workspaceId: orphanedId, deletedAt: null }
      });
      
      const contacts = await prisma.contacts.findMany({
        where: { workspaceId: orphanedId, deletedAt: null }
      });
      
      const opportunities = await prisma.opportunities.findMany({
        where: { workspaceId: orphanedId, deletedAt: null }
      });
      
      const prospects = await prisma.prospects.findMany({
        where: { workspaceId: orphanedId, deletedAt: null }
      });
      
      backup.orphanedData[orphanedId] = {
        accounts,
        leads,
        contacts,
        opportunities,
        prospects,
        counts: {
          accounts: accounts.length,
          leads: leads.length,
          contacts: contacts.length,
          opportunities: opportunities.length,
          prospects: prospects.length
        }
      };
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    
    // Show backup summary
    for (const plan of CONSOLIDATION_PLAN) {
      const data = backup.orphanedData[plan.orphanedId];
      console.log(`   ${plan.orphanedId}: ${data.counts.accounts} accounts, ${data.counts.leads} leads, ${data.counts.contacts} contacts`);
    }
    console.log('');
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function validateConsolidation() {
  console.log('🔍 Validating consolidation requirements...\n');
  
  for (const plan of CONSOLIDATION_PLAN) {
    console.log(`🔍 Validating ${plan.orphanedId} → ${plan.targetName}...`);
    
    // Check that target workspace exists
    const targetWorkspace = await prisma.workspaces.findUnique({
      where: { id: plan.targetId }
    });
    
    if (!targetWorkspace) {
      throw new Error(`Target workspace ${plan.targetId} (${plan.targetName}) not found!`);
    }
    
    console.log(`   ✅ Target workspace found: ${targetWorkspace.name}`);
    
    // Check that orphaned workspace has data
    const accountCount = await prisma.accounts.count({
      where: { workspaceId: plan.orphanedId, deletedAt: null }
    });
    
    const leadCount = await prisma.leads.count({
      where: { workspaceId: plan.orphanedId, deletedAt: null }
    });
    
    const contactCount = await prisma.contacts.count({
      where: { workspaceId: plan.orphanedId, deletedAt: null }
    });
    
    if (accountCount === 0 && leadCount === 0 && contactCount === 0) {
      console.log(`   ⚠️  No data found in orphaned workspace ${plan.orphanedId}`);
      continue;
    }
    
    console.log(`   ✅ Orphaned workspace has data: ${accountCount} accounts, ${leadCount} leads, ${contactCount} contacts`);
    console.log(`   📝 Reason: ${plan.reason}\n`);
  }
}

async function consolidateData() {
  console.log('🔄 Starting data consolidation...\n');
  
  const results = {
    totalAccounts: 0,
    totalLeads: 0,
    totalContacts: 0,
    totalOpportunities: 0,
    totalProspects: 0,
    consolidations: [],
    errors: []
  };
  
  for (const plan of CONSOLIDATION_PLAN) {
    console.log(`🔄 Consolidating ${plan.orphanedId} → ${plan.targetName}...`);
    
    const consolidationResult = {
      orphanedId: plan.orphanedId,
      targetId: plan.targetId,
      targetName: plan.targetName,
      accounts: 0,
      leads: 0,
      contacts: 0,
      opportunities: 0,
      prospects: 0
    };
    
    try {
      // Migrate accounts
      const accountResult = await prisma.accounts.updateMany({
        where: { workspaceId: plan.orphanedId, deletedAt: null },
        data: { workspaceId: plan.targetId }
      });
      consolidationResult.accounts = accountResult.count;
      results.totalAccounts += accountResult.count;
      
      // Migrate leads
      const leadResult = await prisma.leads.updateMany({
        where: { workspaceId: plan.orphanedId, deletedAt: null },
        data: { workspaceId: plan.targetId }
      });
      consolidationResult.leads = leadResult.count;
      results.totalLeads += leadResult.count;
      
      // Migrate contacts
      const contactResult = await prisma.contacts.updateMany({
        where: { workspaceId: plan.orphanedId, deletedAt: null },
        data: { workspaceId: plan.targetId }
      });
      consolidationResult.contacts = contactResult.count;
      results.totalContacts += contactResult.count;
      
      // Migrate opportunities
      const opportunityResult = await prisma.opportunities.updateMany({
        where: { workspaceId: plan.orphanedId, deletedAt: null },
        data: { workspaceId: plan.targetId }
      });
      consolidationResult.opportunities = opportunityResult.count;
      results.totalOpportunities += opportunityResult.count;
      
      // Migrate prospects
      const prospectResult = await prisma.prospects.updateMany({
        where: { workspaceId: plan.orphanedId, deletedAt: null },
        data: { workspaceId: plan.targetId }
      });
      consolidationResult.prospects = prospectResult.count;
      results.totalProspects += prospectResult.count;
      
      console.log(`   ✅ Migrated: ${consolidationResult.accounts} accounts, ${consolidationResult.leads} leads, ${consolidationResult.contacts} contacts`);
      
      results.consolidations.push(consolidationResult);
      
    } catch (error) {
      console.error(`   ❌ Failed to consolidate ${plan.orphanedId}:`, error.message);
      results.errors.push({
        orphanedId: plan.orphanedId,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  return results;
}

async function verifyConsolidation() {
  console.log('🔍 Verifying consolidation results...\n');
  
  for (const plan of CONSOLIDATION_PLAN) {
    console.log(`🔍 Verifying ${plan.orphanedId} → ${plan.targetName}...`);
    
    // Check orphaned workspace is empty
    const orphanedAccounts = await prisma.accounts.count({
      where: { workspaceId: plan.orphanedId, deletedAt: null }
    });
    const orphanedLeads = await prisma.leads.count({
      where: { workspaceId: plan.orphanedId, deletedAt: null }
    });
    const orphanedContacts = await prisma.contacts.count({
      where: { workspaceId: plan.orphanedId, deletedAt: null }
    });
    
    // Check target workspace has the data
    const targetAccounts = await prisma.accounts.count({
      where: { workspaceId: plan.targetId, deletedAt: null }
    });
    const targetLeads = await prisma.leads.count({
      where: { workspaceId: plan.targetId, deletedAt: null }
    });
    const targetContacts = await prisma.contacts.count({
      where: { workspaceId: plan.targetId, deletedAt: null }
    });
    
    console.log(`   Orphaned workspace: ${orphanedAccounts} accounts, ${orphanedLeads} leads, ${orphanedContacts} contacts`);
    console.log(`   Target workspace: ${targetAccounts} accounts, ${targetLeads} leads, ${targetContacts} contacts`);
    
    if (orphanedAccounts === 0 && orphanedLeads === 0 && orphanedContacts === 0) {
      console.log(`   ✅ Consolidation successful!`);
    } else {
      console.log(`   ⚠️  Some data may still exist in orphaned workspace`);
    }
    console.log('');
  }
}

async function main() {
  console.log('🔄 COMPREHENSIVE ORPHANED DATA CONSOLIDATION');
  console.log('=' .repeat(60));
  console.log('Consolidating all orphaned workspace data to proper workspaces');
  console.log('');
  
  try {
    // Step 1: Create backup
    const backupFile = await createBackup();
    
    // Step 2: Validate consolidation
    await validateConsolidation();
    
    // Step 3: Consolidate data
    const results = await consolidateData();
    
    // Step 4: Verify consolidation
    await verifyConsolidation();
    
    console.log('🎉 ORPHANED DATA CONSOLIDATION COMPLETED!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Total consolidated:`);
    console.log(`   Accounts: ${results.totalAccounts}`);
    console.log(`   Leads: ${results.totalLeads}`);
    console.log(`   Contacts: ${results.totalContacts}`);
    console.log(`   Opportunities: ${results.totalOpportunities}`);
    console.log(`   Prospects: ${results.totalProspects}`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      results.errors.forEach(error => {
        console.log(`   ${error.orphanedId}: ${error.error}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ CONSOLIDATION FAILED:', error.message);
    console.log('💾 Backup was created before consolidation - you can restore if needed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, createBackup, validateConsolidation, consolidateData, verifyConsolidation };
