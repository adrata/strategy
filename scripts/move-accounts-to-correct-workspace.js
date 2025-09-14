const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function moveAccountsToCorrectWorkspace() {
  try {
    console.log('🔧 MOVING ACCOUNTS TO CORRECT WORKSPACE\n');

    // Define the correct workspace assignments
    const danCorrectWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Adrata workspace
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Retail Product Solutions (Dano's)
    const danUserId = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan Mirolli

    console.log('📋 WORKSPACE MAPPING:');
    console.log(`   ✅ Dan's correct workspace: ${danCorrectWorkspaceId} (Adrata)`);
    console.log(`   ❌ Accounts currently in: ${danoWorkspaceId} (Retail Product Solutions - Dano's)`);
    console.log('');

    // Find all accounts that Dan has assigned in the wrong workspace
    const accountsToMove = await prisma.accounts.findMany({
      where: {
        assignedUserId: danUserId,
        workspaceId: danoWorkspaceId
      }
    });

    console.log(`📊 Found ${accountsToMove.length} accounts that need to be moved`);
    console.log('');

    if (accountsToMove.length === 0) {
      console.log('✅ No accounts to move - everything is already correct!');
      return;
    }

    // Show sample accounts being moved
    console.log('🔍 SAMPLE ACCOUNTS BEING MOVED:');
    accountsToMove.slice(0, 10).forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name}`);
    });
    
    if (accountsToMove.length > 10) {
      console.log(`   ... and ${accountsToMove.length - 10} more accounts`);
    }
    console.log('');

    // Confirm the move
    console.log('⚠️  ABOUT TO MOVE ACCOUNTS:');
    console.log(`   FROM: Retail Product Solutions workspace (Dano's)`);
    console.log(`   TO: Adrata workspace (Dan's)`);
    console.log(`   COUNT: ${accountsToMove.length} accounts`);
    console.log('');

    // Move accounts in batches
    const batchSize = 50;
    let movedCount = 0;
    let errorCount = 0;

    console.log('🚚 MOVING ACCOUNTS IN BATCHES...\n');

    for (let i = 0; i < accountsToMove.length; i += batchSize) {
      const batch = accountsToMove.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(accountsToMove.length / batchSize)} (${batch.length} accounts)`);
      
      for (const account of batch) {
        try {
          // Update the workspace ID for this account
          await prisma.accounts.update({
            where: { id: account.id },
            data: {
              workspaceId: danCorrectWorkspaceId
            }
          });
          
          movedCount++;
          if (movedCount % 10 === 0) {
            console.log(`   ✅ Moved ${movedCount} accounts so far...`);
          }
          
        } catch (error) {
          errorCount++;
          console.log(`   ❌ Error moving "${account.name}": ${error.message}`);
        }
      }
      
      // Small delay between batches
      if (i + batchSize < accountsToMove.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n🎉 ACCOUNT MOVEMENT COMPLETE!');
    console.log(`   ✅ Successfully moved: ${movedCount} accounts`);
    console.log(`   ❌ Errors: ${errorCount} accounts`);
    console.log(`   📊 Total processed: ${accountsToMove.length} accounts`);
    console.log('');

    // Verify the final state
    console.log('🔍 VERIFYING FINAL STATE...\n');
    
    const danAccountsInAdrata = await prisma.accounts.findMany({
      where: {
        assignedUserId: danUserId,
        workspaceId: danCorrectWorkspaceId
      }
    });

    const danAccountsInDanoWorkspace = await prisma.accounts.findMany({
      where: {
        assignedUserId: danUserId,
        workspaceId: danoWorkspaceId
      }
    });

    console.log('📊 FINAL ACCOUNT DISTRIBUTION:');
    console.log(`   ✅ Dan's Adrata workspace: ${danAccountsInAdrata.length} accounts`);
    console.log(`   ❌ Dan in Dano's workspace: ${danAccountsInDanoWorkspace.length} accounts`);
    console.log('');

    if (danAccountsInDanoWorkspace.length === 0) {
      console.log('🎯 SUCCESS: All accounts moved to correct workspace!');
      console.log('   • Dan now has all accounts in his Adrata workspace');
      console.log('   • Dano maintains access to his Retail Product Solutions workspace');
      console.log('   • No more cross-workspace access issues');
    } else {
      console.log('⚠️  WARNING: Some accounts still need attention');
      console.log(`   • ${danAccountsInDanoWorkspace.length} accounts still in wrong workspace`);
    }

  } catch (error) {
    console.error('❌ Error moving accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  moveAccountsToCorrectWorkspace();
}

module.exports = { moveAccountsToCorrectWorkspace };
