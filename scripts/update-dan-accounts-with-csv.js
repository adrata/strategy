const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');

const prisma = new PrismaClient();

async function updateDanAccountsWithCSV() {
  try {
    console.log('🔄 UPDATING DAN\'S ACCOUNTS WITH CSV DATA\n');

    const csvFilePath = 'accounts_411_with_status.csv';
    const danWorkspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's Adrata workspace
    const danUserId = '01K1VBYZMWTCT09FWEKBDMCXZM'; // Dan's user ID

    if (!fs.existsSync(csvFilePath)) {
      console.log(`❌ CSV file not found: ${csvFilePath}`);
      return;
    }

    console.log('📊 PROCESSING CSV DATA...');
    
    const accounts = [];
    const newAccounts = [];
    const existingAccounts = [];
    const updatedAccounts = [];

    // Read and parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          accounts.push({
            name: row['Account Name'],
            website: row['Website'],
            status: row['Status']
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`   📋 Total accounts in CSV: ${accounts.length}`);
    console.log(`   🆕 New accounts: ${accounts.filter(a => a.status === 'New').length}`);
    console.log(`   ✅ Existing accounts: ${accounts.filter(a => a.status === 'Existing').length}`);
    console.log('');

    // Process each account
    for (const account of accounts) {
      try {
        // Check if account already exists for Dan
        const existingAccount = await prisma.accounts.findFirst({
          where: {
            name: {
              contains: account.name,
              mode: 'insensitive'
            },
            assignedUserId: danUserId
          }
        });

        if (existingAccount) {
          // Update existing account with website if missing
          if (!existingAccount.website && account.website) {
            await prisma.accounts.update({
              where: { id: existingAccount.id },
              data: {
                website: account.website,
                updatedAt: new Date()
              }
            });
            updatedAccounts.push(account.name);
            console.log(`   🔄 Updated: ${account.name} with website`);
          } else {
            existingAccounts.push(account.name);
            console.log(`   ✅ Already exists: ${account.name}`);
          }
        } else {
          // Create new account
          const newAccount = await prisma.accounts.create({
            data: {
              id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workspaceId: danWorkspaceId,
              assignedUserId: danUserId,
              name: account.name,
              website: account.website,
              industry: 'Technology', // Default for these accounts
              accountType: 'Prospect',
              tier: 'Tier 2', // Default tier
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          newAccounts.push(account.name);
          console.log(`   🆕 Created: ${account.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error processing ${account.name}: ${error.message}`);
      }
    }

    console.log('');
    console.log('📊 UPDATE SUMMARY:');
    console.log(`   🔄 Updated existing accounts: ${updatedAccounts.length}`);
    console.log(`   🆕 Created new accounts: ${newAccounts.length}`);
    console.log(`   ✅ Already existed: ${existingAccounts.length}`);
    console.log('');

    // Verify final state
    const finalDanAccounts = await prisma.accounts.findMany({
      where: {
        assignedUserId: danUserId,
        workspaceId: danWorkspaceId
      }
    });

    const accountsWithWebsite = finalDanAccounts.filter(acc => acc.website);
    const accountsWithoutWebsite = finalDanAccounts.filter(acc => !acc.website);

    console.log('🔍 FINAL VERIFICATION:');
    console.log(`   📊 Total Dan accounts: ${finalDanAccounts.length}`);
    console.log(`   🌐 Accounts with website: ${accountsWithWebsite.length}`);
    console.log(`   ❓ Accounts without website: ${accountsWithoutWebsite.length}`);
    console.log('');

    if (accountsWithoutWebsite.length > 0) {
      console.log('⚠️  ACCOUNTS STILL MISSING WEBSITES:');
      accountsWithoutWebsite.slice(0, 10).forEach(acc => {
        console.log(`   • ${acc.name}`);
      });
      if (accountsWithoutWebsite.length > 10) {
        console.log(`   ... and ${accountsWithoutWebsite.length - 10} more`);
      }
    }

    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('   1. Dan now has enriched accounts with website data');
    console.log('   2. New technology prospects added to his pipeline');
    console.log('   3. Ready for enhanced buyer group analysis');
    console.log('   4. All accounts properly assigned to Adrata workspace');

  } catch (error) {
    console.error('❌ Error updating Dan\'s accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
if (require.main === module) {
  updateDanAccountsWithCSV();
}

module.exports = { updateDanAccountsWithCSV };
