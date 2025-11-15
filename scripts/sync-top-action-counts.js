/**
 * 🔧 FIX: Sync Action Counts Between People and Companies
 * 
 * This script ensures that when people have actions, their companies also get
 * those actions linked. This fixes the issue where companies show "-" for actions
 * even when their people have actions.
 * 
 * Usage:
 *   node scripts/sync-top-action-counts.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class SyncActionCounts {
  constructor() {
    this.stats = {
      actionsUpdated: 0,
      actionsCreated: 0,
      companiesFixed: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async run() {
    try {
      this.log('SYNCING ACTION COUNTS BETWEEN PEOPLE AND COMPANIES', 'info');
      this.log('='.repeat(60), 'info');
      
      await this.syncActionsToCompanies();
      
      this.printSummary();
    } catch (error) {
      this.log(`Error during sync: ${error.message}`, 'error');
      console.error(error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async syncActionsToCompanies() {
    this.log('\n🔄 Syncing actions to companies', 'info');
    
    // Find all actions with personId but no companyId
    const actionsWithoutCompany = await prisma.actions.findMany({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        personId: { not: null },
        companyId: null
      },
      select: {
        id: true,
        personId: true,
        type: true,
        subject: true
      }
    });

    this.log(`Found ${actionsWithoutCompany.length} actions with personId but no companyId`, 'info');

    // Group by personId to batch process
    const actionsByPerson = {};
    for (const action of actionsWithoutCompany) {
      if (!actionsByPerson[action.personId]) {
        actionsByPerson[action.personId] = [];
      }
      actionsByPerson[action.personId].push(action);
    }

    // Process each person's actions
    for (const [personId, actions] of Object.entries(actionsByPerson)) {
      try {
        // Get the person's companyId
        const person = await prisma.people.findUnique({
          where: { id: personId },
          select: {
            id: true,
            fullName: true,
            companyId: true,
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        if (!person) {
          this.log(`  Person ${personId} not found, skipping`, 'warn');
          continue;
        }

        if (!person.companyId) {
          this.log(`  Person ${person.fullName} has no companyId, skipping ${actions.length} actions`, 'warn');
          continue;
        }

        // Update all actions for this person to include companyId
        for (const action of actions) {
          try {
            await prisma.actions.update({
              where: { id: action.id },
              data: {
                companyId: person.companyId
              }
            });
            this.stats.actionsUpdated++;
          } catch (error) {
            this.stats.errors.push({
              type: 'update_action',
              actionId: action.id,
              personId: personId,
              error: error.message
            });
            this.log(`  Failed to update action ${action.id}: ${error.message}`, 'error');
          }
        }

        this.stats.companiesFixed++;
        this.log(`  ✅ Linked ${actions.length} actions for ${person.fullName} to company ${person.company?.name || person.companyId}`, 'success');
      } catch (error) {
        this.stats.errors.push({
          type: 'process_person',
          personId: personId,
          error: error.message
        });
        this.log(`  Failed to process person ${personId}: ${error.message}`, 'error');
      }
    }

    this.log(`\n✅ Updated ${this.stats.actionsUpdated} actions with companyId`, 'success');
    this.log(`✅ Fixed ${this.stats.companiesFixed} companies`, 'success');
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('SYNC SUMMARY', 'info');
    this.log('='.repeat(60), 'info');
    
    this.log(`\n✅ Actions updated: ${this.stats.actionsUpdated}`, 'success');
    this.log(`✅ Companies fixed: ${this.stats.companiesFixed}`, 'success');
    
    if (this.stats.errors.length > 0) {
      this.log(`\n⚠️  Errors: ${this.stats.errors.length}`, 'warn');
      this.stats.errors.slice(0, 10).forEach((error, idx) => {
        this.log(`  ${idx + 1}. ${error.type}: ${error.error}`, 'warn');
      });
      if (this.stats.errors.length > 10) {
        this.log(`  ... and ${this.stats.errors.length - 10} more errors`, 'warn');
      }
    }
  }
}

// Run the sync
if (require.main === module) {
  const sync = new SyncActionCounts();
  sync.run().catch(console.error);
}

module.exports = SyncActionCounts;

