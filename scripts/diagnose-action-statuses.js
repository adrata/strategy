#!/usr/bin/env node

/**
 * Diagnose Action Status Inconsistencies
 * 
 * This script analyzes action status inconsistencies without making any changes:
 * - Finds actions with completedAt dates but status still PLANNED
 * - Exports affected records to backup files
 * - Generates detailed report of what needs to be changed
 * - Provides safety validation before migration
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function diagnoseActionStatuses() {
  console.log('🔍 Starting action status diagnostic...');
  
  try {
    // Get all actions with their current state
    const allActions = await prisma.actions.findMany({
      select: {
        id: true,
        status: true,
        completedAt: true,
        scheduledAt: true,
        subject: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        personId: true,
        companyId: true,
        userId: true,
        workspaceId: true
      },
      where: {
        deletedAt: null // Only analyze non-deleted actions
      }
    });

    console.log(`📊 Found ${allActions.length} total actions to analyze`);

    // Categorize actions by their status consistency
    const analysis = {
      total: allActions.length,
      consistent: 0,
      inconsistent: 0,
      needsUpdate: [],
      alreadyCorrect: [],
      inProgress: [],
      cancelled: [],
      completed: [],
      planned: [],
      stats: {
        byStatus: {},
        byType: {},
        byWorkspace: {}
      }
    };

    // Analyze each action
    for (const action of allActions) {
      // Count by status
      analysis.stats.byStatus[action.status] = (analysis.stats.byStatus[action.status] || 0) + 1;
      
      // Count by type
      analysis.stats.byType[action.type] = (analysis.stats.byType[action.type] || 0) + 1;
      
      // Count by workspace
      analysis.stats.byWorkspace[action.workspaceId] = (analysis.stats.byWorkspace[action.workspaceId] || 0) + 1;

      // Categorize by status
      if (action.status === 'COMPLETED') {
        analysis.completed.push(action);
        analysis.consistent++;
      } else if (action.status === 'CANCELLED') {
        analysis.cancelled.push(action);
        analysis.consistent++;
      } else if (action.status === 'IN_PROGRESS') {
        analysis.inProgress.push(action);
        analysis.consistent++;
      } else if (action.status === 'PLANNED') {
        analysis.planned.push(action);
        
        // Check if this PLANNED action should actually be COMPLETED
        if (action.completedAt) {
          // This is an inconsistency - has completedAt but status is PLANNED
          analysis.needsUpdate.push({
            ...action,
            reason: 'Has completedAt date but status is PLANNED',
            recommendedStatus: 'COMPLETED'
          });
          analysis.inconsistent++;
        } else {
          // This is correct - PLANNED with no completedAt
          analysis.alreadyCorrect.push(action);
          analysis.consistent++;
        }
      }
    }

    // Generate detailed report
    console.log('\n📈 DIAGNOSTIC REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n📊 OVERALL STATISTICS:`);
    console.log(`  Total actions: ${analysis.total}`);
    console.log(`  Consistent: ${analysis.consistent}`);
    console.log(`  Inconsistent: ${analysis.inconsistent}`);
    console.log(`  Needs update: ${analysis.needsUpdate.length}`);
    console.log(`  Already correct: ${analysis.alreadyCorrect.length}`);

    console.log(`\n📋 STATUS BREAKDOWN:`);
    Object.entries(analysis.stats.byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} actions`);
    });

    console.log(`\n🏢 WORKSPACE BREAKDOWN:`);
    Object.entries(analysis.stats.byWorkspace).forEach(([workspaceId, count]) => {
      console.log(`  ${workspaceId}: ${count} actions`);
    });

    console.log(`\n📝 ACTION TYPE BREAKDOWN:`);
    Object.entries(analysis.stats.byType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) // Top 10 types
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} actions`);
      });

    // Show sample of inconsistent actions
    if (analysis.needsUpdate.length > 0) {
      console.log(`\n⚠️  INCONSISTENT ACTIONS (${analysis.needsUpdate.length} found):`);
      console.log('   These actions have completedAt dates but status is still PLANNED');
      
      const sampleSize = Math.min(10, analysis.needsUpdate.length);
      for (let i = 0; i < sampleSize; i++) {
        const action = analysis.needsUpdate[i];
        console.log(`   ${i + 1}. "${action.subject}" (${action.type})`);
        console.log(`      ID: ${action.id}`);
        console.log(`      Status: ${action.status} → ${action.recommendedStatus}`);
        console.log(`      Completed: ${action.completedAt}`);
        console.log(`      Created: ${action.createdAt}`);
        console.log('');
      }
      
      if (analysis.needsUpdate.length > sampleSize) {
        console.log(`   ... and ${analysis.needsUpdate.length - sampleSize} more`);
      }
    } else {
      console.log('\n✅ No inconsistent actions found - all data is consistent!');
    }

    // Create backup files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Export inconsistent actions for backup
    if (analysis.needsUpdate.length > 0) {
      const backupFile = path.join(backupDir, `inconsistent-actions-${timestamp}.json`);
      await fs.writeFile(backupFile, JSON.stringify(analysis.needsUpdate, null, 2));
      console.log(`\n💾 Backup created: ${backupFile}`);
    }

    // Export full analysis report
    const reportFile = path.join(backupDir, `diagnostic-report-${timestamp}.json`);
    await fs.writeFile(reportFile, JSON.stringify(analysis, null, 2));
    console.log(`📄 Full report saved: ${reportFile}`);

    // Safety recommendations
    console.log('\n🛡️  SAFETY RECOMMENDATIONS:');
    if (analysis.needsUpdate.length > 0) {
      console.log(`   • ${analysis.needsUpdate.length} actions need status updates`);
      console.log('   • All changes are safe - only updating status from PLANNED to COMPLETED');
      console.log('   • No data will be deleted or lost');
      console.log('   • Backup files have been created for affected records');
      console.log('   • Review the sample actions above to confirm they should be COMPLETED');
    } else {
      console.log('   • No changes needed - all action statuses are consistent');
    }

    return analysis;

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
if (require.main === module) {
  diagnoseActionStatuses()
    .then((analysis) => {
      console.log('\n🎉 Diagnostic completed successfully');
      if (analysis.needsUpdate.length > 0) {
        console.log(`\n⚠️  Next step: Review the report and run the migration script if changes look correct`);
        console.log('   Command: node scripts/fix-action-statuses.js');
      } else {
        console.log('\n✅ No migration needed - all data is consistent');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Diagnostic failed:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseActionStatuses };
