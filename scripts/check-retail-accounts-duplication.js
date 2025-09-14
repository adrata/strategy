const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRetailAccountsDuplication() {
  try {
    console.log('🔍 CHECKING RETAIL ACCOUNTS FOR DUPLICATION\n');

    const adrataWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Adrata
    const retailProductWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Retail Product Solutions

    // Check retail accounts in Adrata workspace
    console.log('🏪 RETAIL ACCOUNTS IN ADRATA WORKSPACE:');
    const adrataRetailAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: adrataWorkspaceId,
        industry: 'Retail/Convenience Store'
      }
    });

    console.log(`   Found ${adrataRetailAccounts.length} retail accounts in Adrata workspace`);
    adrataRetailAccounts.forEach(account => {
      console.log(`   • ${account.name} (${account.accountType})`);
    });
    console.log('');

    // Check retail accounts in Retail Product Solutions workspace
    console.log('🏪 RETAIL ACCOUNTS IN RETAIL PRODUCT SOLUTIONS WORKSPACE:');
    const retailProductRetailAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: retailProductWorkspaceId,
        industry: 'Retail/Convenience Store'
      }
    });

    console.log(`   Found ${retailProductRetailAccounts.length} retail accounts in Retail Product Solutions workspace`);
    retailProductRetailAccounts.forEach(account => {
      console.log(`   • ${account.name} (${account.accountType})`);
    });
    console.log('');

    // Check for duplicates by name
    const adrataNames = adrataRetailAccounts.map(acc => acc.name.toLowerCase());
    const retailProductNames = retailProductRetailAccounts.map(acc => acc.name.toLowerCase());
    
    const duplicates = adrataNames.filter(name => retailProductNames.includes(name));
    
    if (duplicates.length > 0) {
      console.log('🚨 DUPLICATE ACCOUNTS FOUND:');
      duplicates.forEach(name => {
        console.log(`   ❌ "${name}" exists in BOTH workspaces`);
      });
    } else {
      console.log('✅ No duplicate retail accounts found between workspaces');
    }

    // Check who owns what
    console.log('\n👥 OWNERSHIP ANALYSIS:');
    
    // Check if Dan has accounts in Retail Product Solutions
    const danInRetailProduct = await prisma.accounts.findMany({
      where: {
        assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM', // Dan
        workspaceId: retailProductWorkspaceId
      }
    });

    // Check if Dano has accounts in Retail Product Solutions
    const danoInRetailProduct = await prisma.accounts.findMany({
      where: {
        assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB', // Just Dano
        workspaceId: retailProductWorkspaceId
      }
    });

    console.log(`   Dan has ${danInRetailProduct.length} accounts in Retail Product Solutions workspace`);
    console.log(`   Dano has ${danoInRetailProduct.length} accounts in Retail Product Solutions workspace`);
    console.log('');

    // Determine where retail accounts should belong
    console.log('💡 ANALYSIS - WHERE SHOULD RETAIL ACCOUNTS BELONG?');
    console.log('   • Adrata workspace: Dan\'s main company workspace');
    console.log('   • Retail Product Solutions workspace: Dano\'s specialized retail workspace');
    console.log('');
    console.log('   🎯 RECOMMENDATION:');
    console.log('   Retail accounts should probably be in Retail Product Solutions workspace');
    console.log('   since that\'s Dano\'s specialized retail business unit');
    console.log('   Dan should focus on his technology prospects in Adrata workspace');

  } catch (error) {
    console.error('❌ Error checking retail accounts duplication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkRetailAccountsDuplication();
}

module.exports = { checkRetailAccountsDuplication };
