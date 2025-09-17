const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function standardizeActionTerminology() {
  console.log('🎯 STANDARDIZING ACTION TERMINOLOGY');
  console.log('===================================');
  console.log('Consolidating all action-related data into unified system...\n');

  let stats = {
    speedrunActionLogsMigrated: 0,
    leadInteractionsMigrated: 0,
    strategicActionsMigrated: 0,
    pipelineFieldsStandardized: 0,
    errors: 0
  };

  try {
    // STEP 1: Migrate speedrun_action_logs to activities
    console.log('🔄 STEP 1: Migrating speedrun_action_logs to activities...');
    
    const speedrunActionLogs = await prisma.speedrun_action_logs.findMany();
    console.log(`Found ${speedrunActionLogs.length} speedrun action logs to migrate`);
    
    for (const log of speedrunActionLogs) {
      try {
        await prisma.activities.create({
          data: {
            id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: log.workspaceId,
            userId: log.userId,
            personId: log.personId,
            type: log.type.toLowerCase(),
            subject: log.actionLog,
            description: log.notes,
            outcome: log.nextAction,
            scheduledAt: log.nextActionDate,
            completedAt: log.timestamp,
            status: 'completed',
            priority: 'normal',
            assignedUserId: log.actionPerformedBy,
            createdAt: log.timestamp,
            updatedAt: log.timestamp
          }
        });
        stats.speedrunActionLogsMigrated++;
        console.log(`  ✅ Migrated speedrun action log: ${log.actionLog}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate speedrun action log ${log.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 2: Migrate speedrun_lead_interactions to activities (if any exist)
    console.log('\n🔄 STEP 2: Migrating speedrun_lead_interactions to activities...');
    
    const leadInteractions = await prisma.speedrun_lead_interactions.findMany();
    console.log(`Found ${leadInteractions.length} lead interactions to migrate`);
    
    for (const interaction of leadInteractions) {
      try {
        await prisma.activities.create({
          data: {
            id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: interaction.workspaceId,
            userId: interaction.userId,
            leadId: interaction.leadId,
            type: interaction.interactionType.toLowerCase(),
            subject: interaction.actionTaken || interaction.interactionType,
            outcome: interaction.outcome,
            completedAt: interaction.timestamp,
            status: 'completed',
            priority: 'normal',
            createdAt: interaction.timestamp,
            updatedAt: interaction.timestamp
          }
        });
        stats.leadInteractionsMigrated++;
        console.log(`  ✅ Migrated lead interaction: ${interaction.interactionType}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate lead interaction ${interaction.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 3: Migrate strategic_action_outcomes to activities (if any exist)
    console.log('\n🔄 STEP 3: Migrating strategic_action_outcomes to activities...');
    
    const strategicActions = await prisma.strategic_action_outcomes.findMany();
    console.log(`Found ${strategicActions.length} strategic actions to migrate`);
    
    for (const action of strategicActions) {
      try {
        await prisma.activities.create({
          data: {
            id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: action.workspaceId,
            leadId: action.leadId,
            companyId: action.companyId,
            type: action.actionType.toLowerCase(),
            subject: `Strategic Action: ${action.actionType}`,
            description: JSON.stringify(action.actionData),
            outcome: action.outcome,
            status: 'completed',
            priority: 'high',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        stats.strategicActionsMigrated++;
        console.log(`  ✅ Migrated strategic action: ${action.actionType}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate strategic action ${action.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 4: Standardize pipeline record action fields
    console.log('\n🔄 STEP 4: Standardizing pipeline record action fields...');
    
    // Update opportunities to use nextAction instead of nextActions
    const opportunitiesWithNextActions = await prisma.opportunities.findMany({
      where: { nextActions: { not: null } }
    });
    
    for (const opp of opportunitiesWithNextActions) {
      try {
        await prisma.opportunities.update({
          where: { id: opp.id },
          data: {
            nextAction: JSON.stringify(opp.nextActions),
            nextActions: null // Remove the old field
          }
        });
        stats.pipelineFieldsStandardized++;
        console.log(`  ✅ Standardized opportunity ${opp.id}: nextActions → nextAction`);
      } catch (error) {
        console.error(`  ❌ Failed to standardize opportunity ${opp.id}:`, error.message);
        stats.errors++;
      }
    }

    // Update clients to use nextAction instead of nextBestAction
    const clientsWithNextBestAction = await prisma.clients.findMany({
      where: { nextBestAction: { not: null } }
    });
    
    for (const customer of clientsWithNextBestAction) {
      try {
        await prisma.clients.update({
          where: { id: customer.id },
          data: {
            nextAction: customer.nextBestAction,
            nextBestAction: null // Remove the old field
          }
        });
        stats.pipelineFieldsStandardized++;
        console.log(`  ✅ Standardized customer ${customer.id}: nextBestAction → nextAction`);
      } catch (error) {
        console.error(`  ❌ Failed to standardize customer ${customer.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 5: Summary
    console.log('\n📋 STANDARDIZATION SUMMARY');
    console.log('===========================');
    console.log(`Speedrun action logs migrated: ${stats.speedrunActionLogsMigrated}`);
    console.log(`Lead interactions migrated: ${stats.leadInteractionsMigrated}`);
    console.log(`Strategic actions migrated: ${stats.strategicActionsMigrated}`);
    console.log(`Pipeline fields standardized: ${stats.pipelineFieldsStandardized}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Action terminology standardization completed successfully!');
      console.log('All action-related data is now consolidated in the activities table.');
      console.log('All pipeline records now use consistent "nextAction" field naming.');
    } else {
      console.log('\n⚠️  Standardization completed with some errors.');
      console.log('Please review the errors above before proceeding with cleanup.');
    }

    // STEP 6: Next steps
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Update Prisma schema to remove deprecated tables');
    console.log('2. Update codebase to use unified "activities" table');
    console.log('3. Standardize all action-related field names');
    console.log('4. Remove deprecated action tables from database');

  } catch (error) {
    console.error('❌ Standardization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

standardizeActionTerminology()
  .then(() => {
    console.log('\n✅ Action terminology standardization completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Standardization failed:', error);
    process.exit(1);
  });
