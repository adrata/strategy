const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAccountsTo150() {
  try {
    console.log('🔧 Fixing accounts to exactly 150 total...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Get current accounts
    const currentAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        id: true,
        name: true,
        state: true
      }
    });
    
    const floridaAccounts = currentAccounts.filter(a => a.state === 'Florida');
    const arizonaAccounts = currentAccounts.filter(a => a.state === 'Arizona');
    
    console.log(`Current: ${currentAccounts.length} total (${floridaAccounts.length} Florida, ${arizonaAccounts.length} Arizona)`);
    
    // Target: 150 total (75 Florida + 75 Arizona)
    const targetTotal = 150;
    const targetPerState = 75;
    
    if (currentAccounts.length > targetTotal) {
      const excessCount = currentAccounts.length - targetTotal;
      console.log(`Need to unassign ${excessCount} accounts to reach 150 total`);
      
      // Unassign excess accounts to get to exactly 150
      const accountsToUnassign = currentAccounts.slice(targetTotal);
      
      await prisma.accounts.updateMany({
        where: {
          id: { in: accountsToUnassign.map(a => a.id) }
        },
        data: {
          assignedUserId: null
        }
      });
      
      console.log(`✅ Unassigned ${accountsToUnassign.length} excess accounts`);
      
      // Show which accounts were unassigned
      accountsToUnassign.slice(0, 5).forEach(account => {
        console.log(`   - ${account.name} (${account.state})`);
      });
    }
    
    // Final verification
    const finalAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        state: true
      }
    });
    
    const finalFloridaAccounts = finalAccounts.filter(a => a.state === 'Florida').length;
    const finalArizonaAccounts = finalAccounts.filter(a => a.state === 'Arizona').length;
    
    console.log(`\n🎯 FINAL RESULT:`);
    console.log(`   Accounts: ${finalAccounts.length} total (${finalFloridaAccounts} Florida, ${finalArizonaAccounts} Arizona)`);
    
    if (finalAccounts.length === 150) {
      console.log('✅ Perfect! Exactly 150 accounts achieved!');
    } else {
      console.log(`⚠️ Still have ${finalAccounts.length} accounts (target: 150)`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing accounts to 150:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccountsTo150();
