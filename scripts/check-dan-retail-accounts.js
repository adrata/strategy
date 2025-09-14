const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDanRetailAccounts() {
  try {
    console.log('🏪 CHECKING DAN\'S RETAIL/CONVENIENCE STORE ACCOUNTS\n');

    // Find Dan's retail accounts
    const danRetailAccounts = await prisma.accounts.findMany({
      where: {
        assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM',
        industry: 'Retail/Convenience Store'
      }
    });

    console.log(`📊 Found ${danRetailAccounts.length} Retail/Convenience Store accounts for Dan\n`);

    if (danRetailAccounts.length === 0) {
      console.log('✅ No retail accounts found - this is good!');
      return;
    }

    console.log('🏪 RETAIL/CONVENIENCE STORE ACCOUNTS:');
    danRetailAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name}`);
      console.log(`      Type: ${account.accountType || 'Unknown'}`);
      console.log(`      Workspace: ${account.workspaceId || 'None'}`);
      console.log(`      Created: ${account.createdAt}`);
      console.log('');
    });

    // Check if any of these are in the wrong workspace
    const wrongWorkspaceAccounts = danRetailAccounts.filter(acc => 
      acc.workspaceId === '01K1VBYV8ETM2RCQA4GNN9EG72' // Retail Product Solutions
    );

    if (wrongWorkspaceAccounts.length > 0) {
      console.log('🚨 PROBLEM FOUND:');
      console.log(`   ${wrongWorkspaceAccounts.length} retail accounts are still in Retail Product Solutions workspace!`);
      wrongWorkspaceAccounts.forEach(account => {
        console.log(`   ❌ ${account.name} - in wrong workspace`);
      });
    } else {
      console.log('✅ All retail accounts are in the correct Adrata workspace');
    }

    // Check if these accounts match the CSV data
    console.log('\n📋 VERIFICATION AGAINST CSV DATA:');
    console.log('   The CSV shows these should be existing customers, not prospects');
    console.log('   Let\'s verify the account types:');
    
    const customerAccounts = danRetailAccounts.filter(acc => acc.accountType === 'Customer');
    const prospectAccounts = danRetailAccounts.filter(acc => acc.accountType === 'Prospect');
    
    console.log(`   ✅ Customer accounts: ${customerAccounts.length}`);
    console.log(`   ❌ Prospect accounts: ${prospectAccounts.length}`);
    
    if (prospectAccounts.length > 0) {
      console.log('\n⚠️  WARNING: Some retail accounts are marked as prospects:');
      prospectAccounts.forEach(account => {
        console.log(`   • ${account.name} - should be Customer, not Prospect`);
      });
    }

    console.log('\n💡 ANALYSIS:');
    console.log('   These 22 accounts should be Dan\'s existing retail customers');
    console.log('   They should be in the Adrata workspace (not Retail Product Solutions)');
    console.log('   They should be marked as Customer type (not Prospect)');

  } catch (error) {
    console.error('❌ Error checking Dan\'s retail accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkDanRetailAccounts();
}

module.exports = { checkDanRetailAccounts };
