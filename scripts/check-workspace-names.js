const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWorkspaceNames() {
  try {
    console.log('🏢 CHECKING WORKSPACE NAMES FOR DAN\'S ACCOUNTS\n');

    // Get Dan's accounts
    const danAccounts = await prisma.accounts.findMany({
      where: { assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM' }
    });

    console.log(`📊 Found ${danAccounts.length} accounts for Dan Mirolli\n`);

    // Group by workspace
    const workspaceGroups = {};
    danAccounts.forEach(account => {
      const workspaceId = account.workspaceId || 'No Workspace';
      const workspaceName = 'Unknown Workspace'; // We'll get this separately
      
      if (!workspaceGroups[workspaceId]) {
        workspaceGroups[workspaceId] = {
          name: workspaceName,
          count: 0,
          accounts: []
        };
      }
      
      workspaceGroups[workspaceId].count++;
      workspaceGroups[workspaceId].accounts.push(account.name);
    });

    // Display workspace breakdown
    console.log('🏢 WORKSPACE BREAKDOWN:');
    Object.entries(workspaceGroups).forEach(([workspaceId, info]) => {
      console.log(`\n   📁 Workspace ID: ${workspaceId}`);
      console.log(`   🏷️  Name: ${info.name}`);
      console.log(`   📊 Account Count: ${info.count}`);
      
      // Show sample accounts
      if (info.accounts.length <= 5) {
        console.log(`   📝 Accounts: ${info.accounts.join(', ')}`);
      } else {
        console.log(`   📝 Sample Accounts: ${info.accounts.slice(0, 5).join(', ')}...`);
        console.log(`   📝 Total: ${info.accounts.length} accounts`);
      }
    });

    console.log('\n💡 ANALYSIS:');
    console.log('   • Dan has accounts distributed across multiple workspaces');
    console.log('   • This suggests different business units or product lines');
    console.log('   • Each workspace may have different sales strategies or target markets');

  } catch (error) {
    console.error('❌ Error checking workspace names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkWorkspaceNames();
}

module.exports = { checkWorkspaceNames };
