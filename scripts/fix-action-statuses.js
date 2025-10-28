#!/usr/bin/env node

/**
 * Fix Action Statuses Migration Script
 * 
 * This script updates action statuses based on their actual completion state:
 * - If action has completedAt date → set status to COMPLETED
 * - If action has scheduledAt in the past and no completedAt → keep as PLANNED
 * - If action is in IN_PROGRESS → leave as-is
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixActionStatuses() {
  console.log('🔍 Starting action status migration...');
  
  try {
    // Get all actions
    const allActions = await prisma.actions.findMany({
      select: {
        id: true,
        status: true,
        completedAt: true,
        scheduledAt: true,
        subject: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${allActions.length} total actions`);

    // Categorize actions
    const actionsToUpdate = [];
    const actionsToKeep = [];
    const stats = {
      total: allActions.length,
      toUpdate: 0,
      alreadyCorrect: 0,
      inProgress: 0,
      cancelled: 0
    };

    for (const action of allActions) {
      // Skip if already COMPLETED or CANCELLED
      if (action.status === 'COMPLETED' || action.status === 'CANCELLED') {
        actionsToKeep.push(action);
        stats.alreadyCorrect++;
        continue;
      }

      // Keep IN_PROGRESS as-is
      if (action.status === 'IN_PROGRESS') {
        actionsToKeep.push(action);
        stats.inProgress++;
        continue;
      }

      // For PLANNED actions, check if they should be COMPLETED
      if (action.status === 'PLANNED') {
        if (action.completedAt) {
          // Has completion date but status is still PLANNED - needs update
          actionsToUpdate.push({
            id: action.id,
            newStatus: 'COMPLETED',
            reason: 'Has completedAt date'
          });
          stats.toUpdate++;
        } else {
          // No completion date - keep as PLANNED
          actionsToKeep.push(action);
          stats.alreadyCorrect++;
        }
      }
    }

    console.log('\n📈 Migration Statistics:');
    console.log(`  Total actions: ${stats.total}`);
    console.log(`  To update: ${stats.toUpdate}`);
    console.log(`  Already correct: ${stats.alreadyCorrect}`);
    console.log(`  In progress: ${stats.inProgress}`);
    console.log(`  Cancelled: ${stats.cancelled}`);

    if (actionsToUpdate.length === 0) {
      console.log('✅ No actions need updating - all statuses are correct!');
      return;
    }

    // Show sample of actions to be updated
    console.log('\n🔍 Sample actions to be updated:');
    const sampleActions = await prisma.actions.findMany({
      where: {
        id: { in: actionsToUpdate.slice(0, 5).map(a => a.id) }
      },
      select: {
        id: true,
        subject: true,
        status: true,
        completedAt: true,
        scheduledAt: true
      }
    });

    sampleActions.forEach(action => {
      console.log(`  - "${action.subject}" (${action.status} → COMPLETED) - completed: ${action.completedAt}`);
    });

    if (actionsToUpdate.length > 5) {
      console.log(`  ... and ${actionsToUpdate.length - 5} more`);
    }

    // Confirm before proceeding
    console.log(`\n⚠️  About to update ${actionsToUpdate.length} actions to COMPLETED status.`);
    console.log('This will change their status from PLANNED to COMPLETED based on their completedAt dates.');
    
    // In a real migration, you might want to add a confirmation prompt here
    // For now, we'll proceed automatically

    // Perform the updates
    console.log('\n🔄 Updating actions...');
    
    const updatePromises = actionsToUpdate.map(async (update) => {
      try {
        await prisma.actions.update({
          where: { id: update.id },
          data: { status: 'COMPLETED' }
        });
        return { success: true, id: update.id };
      } catch (error) {
        console.error(`❌ Failed to update action ${update.id}:`, error.message);
        return { success: false, id: update.id, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n✅ Migration completed!');
    console.log(`  Successfully updated: ${successful} actions`);
    if (failed > 0) {
      console.log(`  Failed to update: ${failed} actions`);
    }

    // Verify the results
    console.log('\n🔍 Verifying results...');
    const finalStats = await prisma.actions.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    console.log('Final status distribution:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat._count.status} actions`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  fixActionStatuses()
    .then(() => {
      console.log('🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixActionStatuses };
