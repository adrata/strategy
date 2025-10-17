#!/usr/bin/env node

/**
 * 🗑️ DELETE RECENT NOTARY ACTIONS SCRIPT
 * 
 * Backs up and deletes all actions from the past 4 days in Notary Everyday workspace
 * 
 * Usage: node scripts/delete-recent-notary-actions.js
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

class NotaryActionsCleanup {
  constructor() {
    this.workspaceId = null;
    this.results = {
      workspace: null,
      backup: {
        file: null,
        count: 0
      },
      deleted: {
        count: 0,
        byType: {},
        byStatus: {}
      },
      errors: []
    };
  }

  async run() {
    console.log('🗑️ Starting Notary Actions Cleanup...\n');
    
    try {
      await this.findNotaryEverydayWorkspace();
      await this.backupRecentActions();
      await this.deleteRecentActions();
      this.generateReport();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.results.errors.push(`Cleanup error: ${error.message}`);
    } finally {
      await prisma.$disconnect();
    }
  }

  async findNotaryEverydayWorkspace() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    this.workspaceId = workspace.id;
    this.results.workspace = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug
    };
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
  }

  async backupRecentActions() {
    console.log('💾 Backing up recent actions...');
    
    // Calculate date 4 days ago
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    console.log(`   Looking for actions created after: ${fourDaysAgo.toISOString()}`);
    
    // Get all actions from the past 4 days
    const recentActions = await prisma.actions.findMany({
      where: {
        workspaceId: this.workspaceId,
        createdAt: {
          gte: fourDaysAgo
        },
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    this.results.backup.count = recentActions.length;
    console.log(`   Found ${recentActions.length} actions to backup`);

    if (recentActions.length === 0) {
      console.log('   No recent actions found to backup\n');
      return;
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `notary-actions-backup-${timestamp}.json`);
    
    // Create backup data
    const backupData = {
      metadata: {
        workspace: this.results.workspace,
        backupDate: new Date().toISOString(),
        cutoffDate: fourDaysAgo.toISOString(),
        totalActions: recentActions.length
      },
      actions: recentActions
    };

    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    this.results.backup.file = backupFile;
    
    console.log(`   ✅ Backup saved to: ${backupFile}\n`);
  }

  async deleteRecentActions() {
    console.log('🗑️ Deleting recent actions...');
    
    if (this.results.backup.count === 0) {
      console.log('   No actions to delete\n');
      return;
    }

    // Calculate date 4 days ago
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    // Get actions to delete for counting by type/status
    const actionsToDelete = await prisma.actions.findMany({
      where: {
        workspaceId: this.workspaceId,
        createdAt: {
          gte: fourDaysAgo
        },
        deletedAt: null
      },
      select: {
        id: true,
        type: true,
        status: true
      }
    });

    // Count by type and status
    actionsToDelete.forEach(action => {
      this.results.deleted.byType[action.type] = (this.results.deleted.byType[action.type] || 0) + 1;
      this.results.deleted.byStatus[action.status] = (this.results.deleted.byStatus[action.status] || 0) + 1;
    });

    // Soft delete actions
    const deleteResult = await prisma.actions.updateMany({
      where: {
        workspaceId: this.workspaceId,
        createdAt: {
          gte: fourDaysAgo
        },
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    this.results.deleted.count = deleteResult.count;
    console.log(`   ✅ Soft deleted ${deleteResult.count} actions\n`);
  }

  generateReport() {
    console.log('📋 CLEANUP REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n🏢 Workspace: ${this.results.workspace.name} (${this.results.workspace.id})`);
    
    console.log(`\n💾 Backup Summary:`);
    if (this.results.backup.file) {
      console.log(`   File: ${this.results.backup.file}`);
      console.log(`   Actions backed up: ${this.results.backup.count}`);
    } else {
      console.log(`   No backup needed (no recent actions found)`);
    }
    
    console.log(`\n🗑️ Deletion Summary:`);
    console.log(`   Actions deleted: ${this.results.deleted.count}`);
    
    if (Object.keys(this.results.deleted.byType).length > 0) {
      console.log(`   By Type:`);
      Object.entries(this.results.deleted.byType).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
    }
    
    if (Object.keys(this.results.deleted.byStatus).length > 0) {
      console.log(`   By Status:`);
      Object.entries(this.results.deleted.byStatus).forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log(`\n💡 Next Steps:`);
    console.log('   1. Run the diagnostic script to check if actions are now loading');
    console.log('   2. If issues persist, check the backup file for data analysis');
    console.log('   3. Consider running a migration to create missing actions for old records');
    
    console.log('\n' + '='.repeat(50));
  }
}

// Run the cleanup
const cleanup = new NotaryActionsCleanup();
cleanup.run().catch(console.error);
