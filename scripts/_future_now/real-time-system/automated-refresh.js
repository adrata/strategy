#!/usr/bin/env node

/**
 * Automated Data Refresh System
 * 
 * Runs on schedule (cron) to maintain real-time data accuracy:
 * - Red (Daily): High churn risk, leaving this month
 * - Orange (Weekly): Medium churn risk, leaving this quarter
 * - Green (Monthly): Low churn risk, stable
 * 
 * Schedule with cron:
 * - Daily at 2am: node automated-refresh.js --priority red
 * - Weekly on Monday: node automated-refresh.js --priority orange
 * - Monthly on 1st: node automated-refresh.js --priority green
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { RealTimeDataManager } = require('./RealTimeDataManager');

const prisma = new PrismaClient();

class AutomatedRefresh {
  constructor(options = {}) {
    this.workspaceId = options.workspaceId;
    this.priority = options.priority || 'all'; // red, orange, green, all
    this.dryRun = options.dryRun || false;
    this.maxPerRun = options.maxPerRun || 100; // Limit for cost control
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log('\n' + '='.repeat(80));
      console.log('🤖 AUTOMATED DATA REFRESH');
      console.log('='.repeat(80));
      console.log(`\n📊 Configuration:`);
      console.log(`   Workspace: ${this.workspaceId || 'All workspaces'}`);
      console.log(`   Priority: ${this.priority}`);
      console.log(`   Dry Run: ${this.dryRun ? 'Yes (no actual refresh)' : 'No (will refresh)'}`);
      console.log(`   Max per run: ${this.maxPerRun}`);
      
      // Get workspaces to process
      const workspaces = this.workspaceId
        ? [await prisma.workspaces.findUnique({ where: { id: this.workspaceId } })]
        : await prisma.workspaces.findMany({ where: { deletedAt: null, isActive: true } });
      
      console.log(`\n🏢 Processing ${workspaces.length} workspace(s)\n`);
      
      const allStats = {
        workspaces: workspaces.length,
        red: { checked: 0, refreshed: 0, changes: 0 },
        orange: { checked: 0, refreshed: 0, changes: 0 },
        green: { checked: 0, refreshed: 0, changes: 0 }
      };
      
      for (const workspace of workspaces) {
        if (!workspace) continue;
        
        console.log(`\n📦 Workspace: ${workspace.name}`);
        console.log('-'.repeat(80));
        
        const manager = new RealTimeDataManager({ workspaceId: workspace.id });
        
        // Run refresh based on priority
        if (this.priority === 'all') {
          const stats = await manager.runScheduledRefresh();
          this.aggregateStats(allStats, stats);
        } else {
          const stats = await this.runSinglePriority(manager, this.priority);
          this.aggregateStats(allStats, stats);
        }
      }
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      console.log('\n' + '='.repeat(80));
      console.log('📊 AUTOMATED REFRESH COMPLETE');
      console.log('='.repeat(80));
      console.log(`\n🏢 Workspaces: ${allStats.workspaces}`);
      console.log(`🔴 Red (Daily): ${allStats.red.checked} checked, ${allStats.red.refreshed} refreshed, ${allStats.red.changes} changes`);
      console.log(`🟠 Orange (Weekly): ${allStats.orange.checked} checked, ${allStats.orange.refreshed} refreshed, ${allStats.orange.changes} changes`);
      console.log(`🟢 Green (Monthly): ${allStats.green.checked} checked, ${allStats.green.refreshed} refreshed, ${allStats.green.changes} changes`);
      console.log(`\n⏱️  Duration: ${minutes}m ${seconds}s`);
      console.log('='.repeat(80) + '\n');
      
    } catch (error) {
      console.error('❌ Automated refresh failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }

  async runSinglePriority(manager, priority) {
    const colorMap = {
      red: 'red',
      orange: 'orange',
      green: 'green'
    };
    
    const color = colorMap[priority];
    const people = await manager.getPeopleByRefreshColor(color);
    
    console.log(`   ${this.getColorEmoji(color)} ${color.toUpperCase()} - ${people.length} people`);
    
    const stats = {
      [color]: { checked: 0, refreshed: 0, changes: 0 }
    };
    
    for (const person of people.slice(0, this.maxPerRun)) {
      const result = await manager.refreshPersonData(person, color);
      stats[color].checked++;
      if (result.refreshed) stats[color].refreshed++;
      if (result.changes.length > 0) stats[color].changes++;
    }
    
    return stats;
  }

  getColorEmoji(color) {
    const emojis = {
      red: '🔴',
      orange: '🟠',
      green: '🟢'
    };
    return emojis[color] || '⚪';
  }

  aggregateStats(allStats, newStats) {
    if (newStats.red) {
      allStats.red.checked += newStats.red.checked;
      allStats.red.refreshed += newStats.red.refreshed;
      allStats.red.changes += newStats.red.changes;
    }
    if (newStats.orange) {
      allStats.orange.checked += newStats.orange.checked;
      allStats.orange.refreshed += newStats.orange.refreshed;
      allStats.orange.changes += newStats.orange.changes;
    }
    if (newStats.green) {
      allStats.green.checked += newStats.green.checked;
      allStats.green.refreshed += newStats.green.refreshed;
      allStats.green.changes += newStats.green.changes;
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  let workspaceId = null;
  let priority = 'all';
  let dryRun = false;
  let maxPerRun = 100;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--workspace-id') workspaceId = args[++i];
    else if (args[i] === '--priority') priority = args[++i];
    else if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--max') maxPerRun = parseInt(args[++i]);
  }
  
  const refresh = new AutomatedRefresh({ workspaceId, priority, dryRun, maxPerRun });
  refresh.run().catch(console.error);
}

module.exports = { AutomatedRefresh };

