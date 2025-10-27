#!/usr/bin/env node

/**
 * 🔄 RESTORE ACTIONS FROM BACKUP SCRIPT
 * 
 * Restores actions from the backup file created by delete-recent-notary-actions.js
 * 
 * Usage: node scripts/restore-actions-from-backup.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

class ActionsRestore {
  constructor() {
    this.backupFile = path.join(__dirname, 'backups', 'notary-actions-backup-2025-10-27T15-26-13-962Z.json');
    this.results = {
      restored: 0,
      errors: []
    };
  }

  async run() {
    console.log('🔄 Starting Actions Restore...\n');
    
    try {
      await this.loadBackup();
      await this.restoreActions();
      this.generateReport();
    } catch (error) {
      console.error('❌ Restore failed:', error);
      this.results.errors.push(`Restore error: ${error.message}`);
    } finally {
      await prisma.$disconnect();
    }
  }

  async loadBackup() {
    console.log('📂 Loading backup file...');
    
    if (!fs.existsSync(this.backupFile)) {
      throw new Error(`Backup file not found: ${this.backupFile}`);
    }

    const backupData = JSON.parse(fs.readFileSync(this.backupFile, 'utf8'));
    this.backupActions = backupData.actions;
    
    console.log(`   ✅ Loaded ${this.backupActions.length} actions from backup\n`);
  }

  async restoreActions() {
    console.log('🔄 Restoring actions...');
    
    for (const action of this.backupActions) {
      try {
        // Remove the deletedAt field to restore the action
        const { deletedAt, ...actionData } = action;
        
        // Update the action to remove the deletedAt timestamp
        await prisma.actions.update({
          where: { id: action.id },
          data: {
            deletedAt: null,
            updatedAt: new Date()
          }
        });
        
        this.results.restored++;
      } catch (error) {
        console.error(`   ❌ Failed to restore action ${action.id}:`, error.message);
        this.results.errors.push(`Failed to restore action ${action.id}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Restored ${this.results.restored} actions\n`);
  }

  generateReport() {
    console.log('📋 RESTORE REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🔄 Restore Summary:`);
    console.log(`   Actions restored: ${this.results.restored}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the restore
const restore = new ActionsRestore();
restore.run().catch(console.error);
