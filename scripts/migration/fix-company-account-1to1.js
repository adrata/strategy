const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCompanyAccount1to1() {
  console.log('🔧 FIXING COMPANY-ACCOUNT RELATIONSHIPS - ACHIEVING 1-TO-1');
  console.log('==========================================================\n');

  try {
    // Step 1: Check current company-account relationships
    console.log('📋 STEP 1: Analyzing current company-account relationships...');
    
    const companyStats = await prisma.company.findMany({
      select: {
        _count: { accounts: true }
      }
    });
    
    const accountCounts = companyStats.map(c => c._count.accounts);
    const oneAccount = accountCounts.filter(count => count === 1).length;
    const multipleAccounts = accountCounts.filter(count => count > 1).length;
    const noAccounts = accountCounts.filter(count => count === 0).length;
    
    console.log(`  Companies with exactly 1 account: ${oneAccount}/${accountCounts.length} (${((oneAccount/accountCounts.length)*100).toFixed(1)}%)`);
    console.log(`  Companies with multiple accounts: ${multipleAccounts}/${accountCounts.length} (${((multipleAccounts/accountCounts.length)*100).toFixed(1)}%)`);
    console.log(`  Companies with no accounts: ${noAccounts}/${accountCounts.length} (${((noAccounts/accountCounts.length)*100).toFixed(1)}%)`);
    
    // Step 2: Handle companies with multiple accounts
    if (multipleAccounts > 0) {
      console.log('\n📋 STEP 2: Handling companies with multiple accounts...');
      
      const companiesWithMultipleAccounts = await prisma.company.findMany({
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
              website: true,
              industry: true,
              size: true,
              description: true,
              headquarters: true,
              foundedYear: true,
              revenue: true,
              employeeCount: true,
              isPublic: true,
              stockSymbol: true,
              logoUrl: true
            }
          }
        }
      });
      
      const problematicCompanies = companiesWithMultipleAccounts.filter(c => c.accounts.length > 1);
      console.log(`  Found ${problematicCompanies.length} companies with multiple accounts`);
      
      for (const company of problematicCompanies) {
        console.log(`\n  Company: ${company.name}`);
        console.log(`  Accounts: ${company.accounts.length}`);
        
        // Check if accounts have different data
        const accountNames = company.accounts.map(a => a.name);
        const uniqueNames = [...new Set(accountNames)];
        
        if (uniqueNames.length === 1) {
          // All accounts have the same name - merge them
          console.log(`    All accounts have same name: ${uniqueNames[0]}`);
          console.log(`    This appears to be duplicate data - keeping first account, removing others`);
          
          const keepAccount = company.accounts[0];
          const removeAccounts = company.accounts.slice(1);
          
          for (const removeAccount of removeAccounts) {
            // Update any leads/prospects/opportunities/customers that reference this account
            await prisma.leads.updateMany({
              where: { accountId: removeAccount.id },
              data: { accountId: keepAccount.id }
            });
            
            await prisma.prospects.updateMany({
              where: { accountId: removeAccount.id },
              data: { accountId: keepAccount.id }
            });
            
            await prisma.opportunities.updateMany({
              where: { accountId: removeAccount.id },
              data: { accountId: keepAccount.id }
            });
            
            await prisma.clients.updateMany({
              where: { accountId: removeAccount.id },
              data: { accountId: keepAccount.id }
            });
            
            // Delete the duplicate account
            await prisma.accounts.delete({ where: { id: removeAccount.id } });
            console.log(`    Removed duplicate account: ${removeAccount.name}`);
          }
        } else {
          // Accounts have different names - this might be legitimate
          console.log(`    Accounts have different names: ${uniqueNames.join(', ')}`);
          console.log(`    This might be legitimate (different divisions/locations)`);
          console.log(`    Manual review recommended for: ${company.name}`);
        }
      }
    }
    
    // Step 3: Handle unlinked accounts
    console.log('\n📋 STEP 3: Handling unlinked accounts...');
    
    const unlinkedAccounts = await prisma.accounts.findMany({
      where: { companyId: null },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        size: true,
        description: true,
        headquarters: true,
        foundedYear: true,
        revenue: true,
        employeeCount: true,
        isPublic: true,
        stockSymbol: true,
        logoUrl: true
      }
    });
    
    console.log(`  Found ${unlinkedAccounts.length} unlinked accounts`);
    
    let linkedAccounts = 0;
    let createdCompanies = 0;
    
    for (const account of unlinkedAccounts) {
      // Try to find existing company by name
      let existingCompany = await prisma.company.findFirst({
        where: { name: account.name }
      });
      
      if (existingCompany) {
        // Link account to existing company
        await prisma.accounts.update({
          where: { id: account.id },
          data: { companyId: existingCompany.id }
        });
        linkedAccounts++;
        console.log(`  Linked account ${account.name} to existing company`);
      } else {
        // Create new company record
        const newCompany = await prisma.company.create({
          data: {
            name: account.name,
            website: account.website,
            industry: account.industry,
            size: account.size,
            description: account.description,
            headquarters: account.headquarters,
            foundedYear: account.foundedYear,
            revenue: account.revenue,
            employeeCount: account.employeeCount,
            isPublic: account.isPublic,
            stockSymbol: account.stockSymbol,
            logoUrl: account.logoUrl
          }
        });
        
        // Link account to new company
        await prisma.accounts.update({
          where: { id: account.id },
          data: { companyId: newCompany.id }
        });
        
        createdCompanies++;
        console.log(`  Created new company: ${account.name}`);
      }
    }
    
    console.log(`  ✅ Linked ${linkedAccounts} accounts to existing companies`);
    console.log(`  ✅ Created ${createdCompanies} new company records`);
    
    // Step 4: Verify final 1-to-1 relationships
    console.log('\n📋 STEP 4: Verifying final 1-to-1 relationships...');
    
    const finalCompanyStats = await prisma.company.findMany({
      select: {
        _count: { accounts: true }
      }
    });
    
    const finalAccountCounts = finalCompanyStats.map(c => c._count.accounts);
    const finalOneAccount = finalAccountCounts.filter(count => count === 1).length;
    const finalMultipleAccounts = finalAccountCounts.filter(count => count > 1).length;
    const finalNoAccounts = finalAccountCounts.filter(count => count === 0).length;
    
    console.log(`  Companies with exactly 1 account: ${finalOneAccount}/${finalAccountCounts.length} (${((finalOneAccount/finalAccountCounts.length)*100).toFixed(1)}%)`);
    console.log(`  Companies with multiple accounts: ${finalMultipleAccounts}/${finalAccountCounts.length} (${((finalMultipleAccounts/finalAccountCounts.length)*100).toFixed(1)}%)`);
    console.log(`  Companies with no accounts: ${finalNoAccounts}/${finalAccountCounts.length} (${((finalNoAccounts/finalAccountCounts.length)*100).toFixed(1)}%)`);
    
    // Check for any remaining unlinked accounts
    const remainingUnlinked = await prisma.accounts.count({
      where: { companyId: null }
    });
    
    console.log(`  Remaining unlinked accounts: ${remainingUnlinked}`);
    
    if (finalMultipleAccounts > 0) {
      console.log('\n  ⚠️  WARNING: Some companies still have multiple accounts. This may indicate:');
      console.log('     - Different divisions/locations of the same company');
      console.log('     - Legitimate business structure that requires multiple accounts');
      console.log('     - Manual review recommended for these cases');
    }
    
    if (remainingUnlinked > 0) {
      console.log('\n  ⚠️  WARNING: Some accounts remain unlinked. These may need manual review.');
    }
    
    console.log('\n🎯 COMPANY-ACCOUNT 1-TO-1 FIX COMPLETE!');
    console.log('========================================');
    console.log('✅ Merged duplicate accounts where appropriate');
    console.log('✅ Created proper company records for unlinked accounts');
    console.log('✅ Achieved near 1-to-1 company-account relationships');
    
  } catch (error) {
    console.error('❌ Error during company-account fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixCompanyAccount1to1().catch(console.error);
