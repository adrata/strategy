const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicateAccounts() {
  console.log('🔧 FIXING DUPLICATE ACCOUNT RECORDS');
  console.log('===================================\n');
  
  // Step 1: Find companies with multiple accounts
  console.log('📋 STEP 1: Finding companies with multiple accounts...');
  
  const companiesWithMultiple = await prisma.company.findMany({
    where: {
      accounts: {
        some: {}
      }
    },
    include: {
      accounts: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          website: true,
          industry: true,
          size: true,
          city: true,
          state: true,
          country: true,
          workspaceId: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });
  
  const companiesWithMultipleAccounts = companiesWithMultiple.filter(c => c.accounts.length > 1);
  console.log(`Found ${companiesWithMultipleAccounts.length} companies with multiple accounts`);
  
  let duplicatesRemovedCount = 0;
  let companiesProcessed = 0;
  
  // Process each company with multiple accounts
  for (const company of companiesWithMultipleAccounts) {
    companiesProcessed++;
    console.log(`\n🏢 Processing ${company.name} (${company.accounts.length} accounts)`);
    
    // Check if all accounts are identical (duplicate records)
    const firstAccount = company.accounts[0];
    const allIdentical = company.accounts.every(account => 
      account.name === firstAccount.name &&
      account.email === firstAccount.email &&
      account.phone === firstAccount.phone &&
      account.website === firstAccount.website &&
      account.industry === firstAccount.industry &&
      account.size === firstAccount.size &&
      account.city === firstAccount.city &&
      account.state === firstAccount.state &&
      account.country === firstAccount.country &&
      account.workspaceId === firstAccount.workspaceId
    );
    
    if (allIdentical) {
      console.log(`   🚨 ALL ACCOUNTS ARE IDENTICAL - MERGING DUPLICATES`);
      // Keep the first account, delete the rest
      const accountsToDelete = company.accounts.slice(1);
      for (const account of accountsToDelete) {
        await prisma.accounts.delete({ where: { id: account.id } });
        console.log(`   Deleting duplicate: ${account.id}`);
        duplicatesRemovedCount++;
      }
      console.log(`   ✅ Merged ${accountsToDelete.length} duplicate accounts`);
    } else {
      // Accounts have differences - use scoring system to keep the best one
      console.log(`   ⚠️  ACCOUNTS HAVE DIFFERENCES - USING SCORING SYSTEM`);
      
      let bestAccount = null;
      let highestScore = -1;
      
      for (const account of company.accounts) {
        let score = 0;
        if (account.email) score++;
        if (account.phone) score++;
        if (account.website) score++;
        if (account.industry) score++;
        if (account.size) score++;
        if (account.city) score++;
        if (account.state) score++;
        if (account.country) score++;
        
        if (score > highestScore) {
          highestScore = score;
          bestAccount = account;
        }
      }
      
      if (bestAccount) {
        console.log(`   Keeping account: ${bestAccount.id} (score: ${highestScore})`);
        console.log(`   Email: ${bestAccount.email || 'None'}`);
        console.log(`   Phone: ${bestAccount.phone || 'None'}`);
        console.log(`   Website: ${bestAccount.website || 'None'}`);
        
        for (const accountToDelete of company.accounts) {
          if (accountToDelete.id !== bestAccount.id) {
            await prisma.accounts.delete({ where: { id: accountToDelete.id } });
            console.log(`   Deleting: ${accountToDelete.id} (${accountToDelete.email || 'No email'})`);
            duplicatesRemovedCount++;
          }
        }
        console.log(`   ✅ Fixed ${company.accounts.length - 1} duplicates`);
      }
    }
  }
  
  console.log(`\n✅ DUPLICATE ACCOUNT FIX COMPLETE!`);
  console.log(`===================================`);
  console.log(`  Companies processed: ${companiesProcessed}`);
  console.log(`  Duplicate accounts removed: ${duplicatesRemovedCount}`);
  
  // Step 2: Verify the results
  console.log('\n📋 STEP 2: Verifying results...');
  
  const finalCompanyStats = await prisma.company.findMany({
    include: {
      accounts: {
        select: { id: true }
      }
    }
  });
  
  const accountCounts = finalCompanyStats.map(c => c.accounts.length);
  const oneAccount = accountCounts.filter(count => count === 1).length;
  const multipleAccounts = accountCounts.filter(count => count > 1).length;
  const noAccounts = accountCounts.filter(count => count === 0).length;
  
  console.log('\n🏢 FINAL COMPANY-ACCOUNT RELATIONSHIPS:');
  console.log(`  Total companies: ${finalCompanyStats.length}`);
  console.log(`  Companies with exactly 1 account: ${oneAccount} (${((oneAccount/finalCompanyStats.length)*100).toFixed(1)}%)`);
  console.log(`  Companies with multiple accounts: ${multipleAccounts} (${((multipleAccounts/finalCompanyStats.length)*100).toFixed(1)}%)`);
  console.log(`  Companies with no accounts: ${noAccounts} (${((noAccounts/finalCompanyStats.length)*100).toFixed(1)}%)`);
  
  if (multipleAccounts > 0) {
    console.log('\n⚠️  REMAINING COMPANIES WITH MULTIPLE ACCOUNTS:');
    const remainingMultiple = finalCompanyStats.filter(c => c.accounts.length > 1).slice(0, 5);
    remainingMultiple.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name}: ${company.accounts.length} accounts`);
    });
  }
  
  await prisma.$disconnect();
}

fixDuplicateAccounts().catch(console.error);
