const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDanWorkspaceAssignments() {
  try {
    console.log('🔧 FIXING DAN\'S WORKSPACE ASSIGNMENTS\n');

    // Dan should only have access to the Adrata workspace
    const danCorrectWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Adrata workspace
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Retail Product Solutions (Dano's)
    const danUserId = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan Mirolli

    console.log('📋 CURRENT SITUATION:');
    console.log(`   ✅ Dan's correct workspace: ${danCorrectWorkspaceId} (Adrata)`);
    console.log(`   ❌ Dan incorrectly assigned to: ${danoWorkspaceId} (Retail Product Solutions - Dano's)`);
    console.log('');

    // Check current account distribution
    const danAccounts = await prisma.accounts.findMany({
      where: { assignedUserId: danUserId }
    });

    console.log(`📊 Dan currently has ${danAccounts.length} accounts assigned`);
    
    const accountsInCorrectWorkspace = danAccounts.filter(acc => acc.workspaceId === danCorrectWorkspaceId);
    const accountsInWrongWorkspace = danAccounts.filter(acc => acc.workspaceId === danoWorkspaceId);
    
    console.log(`   ✅ Correct workspace (Adrata): ${accountsInCorrectWorkspace.length} accounts`);
    console.log(`   ❌ Wrong workspace (Dano's): ${accountsInWrongWorkspace.length} accounts`);
    console.log('');

    if (accountsInWrongWorkspace.length === 0) {
      console.log('✅ No accounts to fix - Dan is already correctly assigned!');
      return;
    }

    console.log('🔍 ACCOUNTS THAT NEED TO BE FIXED:');
    accountsInWrongWorkspace.slice(0, 10).forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name} (currently in Dano's workspace)`);
    });
    
    if (accountsInWrongWorkspace.length > 10) {
      console.log(`   ... and ${accountsInWrongWorkspace.length - 10} more accounts`);
    }
    console.log('');

    // Ask for confirmation
    console.log('⚠️  WARNING: This will reassign accounts from Dano\'s workspace to Dan\'s Adrata workspace');
    console.log('   This means Dan will lose access to these accounts in the Retail Product Solutions workspace');
    console.log('   and they will only be accessible in the Adrata workspace');
    console.log('');

    // For safety, let's just show what would happen without making changes
    console.log('🛡️  SAFETY MODE: Showing what would happen (no changes made)');
    console.log('');
    
    console.log('📋 RECOMMENDED ACTIONS:');
    console.log('   1. Remove Dan\'s access to Retail Product Solutions workspace');
    console.log('   2. Ensure Dan only has access to Adrata workspace');
    console.log('   3. Verify Dano maintains access to Retail Product Solutions workspace');
    console.log('   4. Update any workspace_user relationships if needed');
    console.log('');

    console.log('💡 ALTERNATIVE APPROACHES:');
    console.log('   Option A: Move accounts to Dan\'s workspace (Dan loses access in Dano\'s workspace)');
    console.log('   Option B: Keep accounts in Dano\'s workspace but remove Dan\'s user assignment');
    console.log('   Option C: Create duplicate accounts (one in each workspace)');
    console.log('');

    console.log('🎯 RECOMMENDATION:');
    console.log('   Use Option B - Keep accounts in Dano\'s workspace but remove Dan\'s user assignment');
    console.log('   This preserves Dano\'s access while fixing Dan\'s incorrect assignment');
    console.log('');

    // Show what the final state should look like
    console.log('📊 FINAL STATE SHOULD BE:');
    console.log(`   Dan Mirolli: ${accountsInCorrectWorkspace.length} accounts in Adrata workspace only`);
    console.log(`   Just Dano: All accounts in Retail Product Solutions workspace`);
    console.log(`   No cross-workspace access issues`);

  } catch (error) {
    console.error('❌ Error fixing Dan\'s workspace assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixDanWorkspaceAssignments();
}

module.exports = { fixDanWorkspaceAssignments };
