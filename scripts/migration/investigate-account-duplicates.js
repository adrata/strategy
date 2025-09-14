const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateAccountDuplicates() {
  console.log('🔍 INVESTIGATING ACCOUNT SYSTEM DATA QUALITY');
  console.log('============================================\n');
  
  // Get companies with multiple accounts
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
  console.log('Analyzing first 10 for patterns...\n');
  
  let duplicateRecords = 0;
  let legitimateMultiple = 0;
  
  companiesWithMultipleAccounts.slice(0, 10).forEach((company, index) => {
    console.log(`${index + 1}. ${company.name}`);
    console.log(`   Has ${company.accounts.length} accounts:`);
    
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
      console.log(`   🚨 ALL ACCOUNTS ARE IDENTICAL - BAD DATA MANAGEMENT`);
      duplicateRecords++;
    } else {
      console.log(`   ⚠️  ACCOUNTS HAVE DIFFERENCES - NEEDS MANUAL REVIEW`);
      legitimateMultiple++;
    }
    
    // Show account details
    company.accounts.forEach((account, accountIndex) => {
      console.log(`     ${accountIndex + 1}. ${account.name} (${account.email || 'No email'})`);
      console.log(`        Industry: ${account.industry || 'None'}`);
      console.log(`        Size: ${account.size || 'None'}`);
      console.log(`        Location: ${account.city || 'None'}, ${account.state || 'None'}, ${account.country || 'None'}`);
      console.log(`        Workspace: ${account.workspaceId}`);
    });
    
    console.log('');
  });
  
  console.log(`\n📊 ANALYSIS RESULTS (first 10):`);
  console.log(`  Duplicate records (identical accounts): ${duplicateRecords}`);
  console.log(`  Legitimate multiple accounts: ${legitimateMultiple}`);
  console.log(`  Total analyzed: ${duplicateRecords + legitimateMultiple}`);
  
  await prisma.$disconnect();
}

investigateAccountDuplicates().catch(console.error);
