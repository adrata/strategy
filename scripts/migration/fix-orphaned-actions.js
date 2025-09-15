const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrphanedActions() {
  console.log('🔧 FIXING ORPHANED ACTIONS');
  console.log('===========================');
  console.log('Fixing actions with no relationships...\n');

  let stats = {
    orphanedActionsFound: 0,
    actionsFixed: 0,
    actionsDeleted: 0,
    errors: 0
  };

  try {
    // STEP 1: Find orphaned actions
    console.log('🔄 STEP 1: Finding orphaned actions...');
    
    const orphanedActions = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.type,
        a.subject,
        a.description,
        a."createdAt",
        a."updatedAt"
      FROM actions a
      WHERE a."personId" IS NULL 
      AND a."companyId" IS NULL 
      AND a."leadId" IS NULL 
      AND a."opportunityId" IS NULL 
      AND a."prospectId" IS NULL
      ORDER BY a."createdAt" DESC
    `;
    
    stats.orphanedActionsFound = orphanedActions.length;
    console.log(`Found ${orphanedActions.length} orphaned actions`);
    
    if (orphanedActions.length === 0) {
      console.log('✅ No orphaned actions found!');
      return;
    }

    // STEP 2: Analyze orphaned actions
    console.log('\n🔄 STEP 2: Analyzing orphaned actions...');
    
    console.log('Orphaned actions:');
    orphanedActions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.type}: "${action.subject}" (${action.createdAt})`);
    });

    // STEP 3: Try to link actions based on content analysis
    console.log('\n🔄 STEP 3: Attempting to link actions...');
    
    for (const action of orphanedActions) {
      try {
        let linked = false;
        
        // Try to find company by name in subject/description
        if (action.subject || action.description) {
          const searchText = `${action.subject || ''} ${action.description || ''}`.toLowerCase();
          
          // Look for company names in the action text
          const companies = await prisma.companies.findMany({
            where: {
              name: {
                contains: searchText.split(' ')[0], // Try first word
                mode: 'insensitive'
              }
            },
            take: 1
          });
          
          if (companies.length > 0) {
            await prisma.actions.update({
              where: { id: action.id },
              data: { companyId: companies[0].id }
            });
            console.log(`  ✅ Linked action "${action.subject}" to company "${companies[0].name}"`);
            stats.actionsFixed++;
            linked = true;
          }
        }
        
        // If couldn't link, delete the orphaned action
        if (!linked) {
          await prisma.actions.delete({
            where: { id: action.id }
          });
          console.log(`  🗑️ Deleted orphaned action: "${action.subject}"`);
          stats.actionsDeleted++;
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to process action ${action.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 4: Summary
    console.log('\n📋 ORPHANED ACTIONS FIX SUMMARY');
    console.log('================================');
    console.log(`Orphaned actions found: ${stats.orphanedActionsFound}`);
    console.log(`Actions fixed (linked): ${stats.actionsFixed}`);
    console.log(`Actions deleted: ${stats.actionsDeleted}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Orphaned actions fix completed successfully!');
    } else {
      console.log('\n⚠️  Fix completed with some errors.');
    }

    // STEP 5: Verify fix
    console.log('\n🔍 VERIFICATION:');
    
    const remainingOrphaned = await prisma.actions.count({
      where: {
        AND: [
          { personId: null },
          { companyId: null },
          { leadId: null },
          { opportunityId: null },
          { prospectId: null }
        ]
      }
    });
    
    console.log(`Remaining orphaned actions: ${remainingOrphaned}`);
    
    if (remainingOrphaned === 0) {
      console.log('✅ All orphaned actions have been resolved!');
    } else {
      console.log(`⚠️  ${remainingOrphaned} orphaned actions still remain`);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanedActions()
  .then(() => {
    console.log('\n✅ Orphaned actions fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });

