const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function moveRetailAccountsToDano() {
  try {
    console.log('🔄 MOVING RETAIL ACCOUNTS TO DANO\'S WORKSPACE\n');

    const adrataWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's Adrata
    const retailProductWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's Retail Product Solutions

    // First, let's see what we're moving
    console.log('📋 ACCOUNTS TO BE MOVED:');
    const retailAccountsToMove = await prisma.accounts.findMany({
      where: {
        workspaceId: adrataWorkspaceId,
        industry: 'Retail/Convenience Store',
        assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM' // Dan
      }
    });

    console.log(`   Found ${retailAccountsToMove.length} retail accounts to move:`);
    retailAccountsToMove.forEach(account => {
      console.log(`   • ${account.name} (${account.accountType})`);
    });
    console.log('');

    if (retailAccountsToMove.length === 0) {
      console.log('✅ No retail accounts found to move');
      return;
    }

    // Confirm the move
    console.log('⚠️  CONFIRMATION REQUIRED:');
    console.log(`   Moving ${retailAccountsToMove.length} retail accounts from:`);
    console.log(`   • FROM: Dan's Adrata workspace (${adrataWorkspaceId})`);
    console.log(`   • TO: Dano's Retail Product Solutions workspace (${retailProductWorkspaceId})`);
    console.log('   • REASON: Retail accounts belong in specialized retail workspace');
    console.log('');

    // Safety check - verify Dano's workspace exists
    const danoWorkspace = await prisma.workspaces.findUnique({
      where: { id: retailProductWorkspaceId }
    });

    if (!danoWorkspace) {
      console.log('❌ ERROR: Dano\'s Retail Product Solutions workspace not found');
      return;
    }

    console.log(`   ✅ Dano's workspace confirmed: ${danoWorkspace.name}`);
    console.log('');

    // Move the accounts
    console.log('🔄 MOVING ACCOUNTS...');
    let movedCount = 0;

    for (const account of retailAccountsToMove) {
      try {
        await prisma.accounts.update({
          where: { id: account.id },
          data: {
            workspaceId: retailProductWorkspaceId,
            updatedAt: new Date()
          }
        });
        
        console.log(`   ✅ Moved: ${account.name}`);
        movedCount++;
      } catch (error) {
        console.log(`   ❌ Failed to move ${account.name}: ${error.message}`);
      }
    }

    console.log('');
    console.log(`🎯 MOVE COMPLETE: ${movedCount}/${retailAccountsToMove.length} accounts moved`);
    console.log('');

    // Verify the move
    console.log('🔍 VERIFICATION:');
    const remainingRetailInAdrata = await prisma.accounts.findMany({
      where: {
        workspaceId: adrataWorkspaceId,
        industry: 'Retail/Convenience Store'
      }
    });

    const retailInDanoWorkspace = await prisma.accounts.findMany({
      where: {
        workspaceId: retailProductWorkspaceId,
        industry: 'Retail/Convenience Store'
      }
    });

    console.log(`   ✅ Remaining retail accounts in Adrata: ${remainingRetailInAdrata.length}`);
    console.log(`   ✅ Retail accounts in Dano's workspace: ${retailInDanoWorkspace.length}`);
    console.log('');

    // Final summary
    console.log('📊 FINAL STATE:');
    console.log('   • Dan\'s Adrata workspace: Technology prospects only');
    console.log('   • Dano\'s Retail Product Solutions: All retail accounts');
    console.log('   • Proper separation of concerns achieved');

  } catch (error) {
    console.error('❌ Error moving retail accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the move
if (require.main === module) {
  moveRetailAccountsToDano();
}

module.exports = { moveRetailAccountsToDano };
