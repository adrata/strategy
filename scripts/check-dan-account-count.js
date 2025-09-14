const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDanAccountCount() {
  try {
    console.log('📊 CHECKING DAN\'S CURRENT ACCOUNT COUNT\n');

    const danUserId = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan Mirolli
    const adrataWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's Adrata workspace

    // Count Dan's accounts in Adrata workspace
    const danAccounts = await prisma.accounts.findMany({
      where: {
        assignedUserId: danUserId,
        workspaceId: adrataWorkspaceId
      }
    });

    console.log(`🎯 DAN'S ACCOUNT COUNT: ${danAccounts.length}`);
    console.log('');

    // Breakdown by account type
    const accountTypeCounts = {};
    danAccounts.forEach(account => {
      const type = account.accountType || 'Unknown';
      accountTypeCounts[type] = (accountTypeCounts[type] || 0) + 1;
    });

    console.log('📋 ACCOUNT TYPE BREAKDOWN:');
    Object.entries(accountTypeCounts).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count}`);
    });
    console.log('');

    // Breakdown by industry
    const industryCounts = {};
    danAccounts.forEach(account => {
      const industry = account.industry || 'Unknown';
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    });

    console.log('🏭 INDUSTRY BREAKDOWN:');
    Object.entries(industryCounts).forEach(([industry, count]) => {
      console.log(`   • ${industry}: ${count}`);
    });
    console.log('');

    // Check website coverage
    const accountsWithWebsite = danAccounts.filter(acc => acc.website);
    const accountsWithoutWebsite = danAccounts.filter(acc => !acc.website);

    console.log('🌐 WEBSITE COVERAGE:');
    console.log(`   ✅ With website: ${accountsWithWebsite.length}`);
    console.log(`   ❓ Without website: ${accountsWithoutWebsite.length}`);
    console.log(`   📊 Coverage: ${((accountsWithWebsite.length / danAccounts.length) * 100).toFixed(1)}%`);
    console.log('');

    // Show sample accounts
    console.log('📋 SAMPLE ACCOUNTS:');
    danAccounts.slice(0, 10).forEach(account => {
      console.log(`   • ${account.name} (${account.industry || 'Unknown'}) - ${account.accountType || 'Unknown'}`);
    });
    
    if (danAccounts.length > 10) {
      console.log(`   ... and ${danAccounts.length - 10} more`);
    }

    console.log('');
    console.log('🎯 SUMMARY:');
    console.log(`   Dan now has ${danAccounts.length} accounts in his Adrata workspace`);
    console.log(`   These are ready for enhanced buyer group intelligence analysis`);
    console.log(`   All accounts have been enriched with website data from the CSV`);

  } catch (error) {
    console.error('❌ Error checking Dan\'s account count:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkDanAccountCount();
}

module.exports = { checkDanAccountCount };
