const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditDanAccounts() {
  try {
    console.log('🔍 AUDITING DAN\'S ACCOUNTS & BUYER GROUP SYSTEM\n');

    // Find Dan Mirolli
    const danUser = await prisma.users.findFirst({
      where: { id: '01K1VBYZMWTCT09FWEKBDMCXZM' }
    });

    if (!danUser) {
      console.log('❌ Dan Mirolli not found in database');
      return;
    }

    console.log(`✅ Found Dan Mirolli: ${danUser.name} (${danUser.email})`);
    console.log('');

    // Count all accounts assigned to Dan
    const danAccounts = await prisma.accounts.findMany({
      where: { assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM' }
    });

    console.log(`📊 DAN'S TOTAL ACCOUNTS: ${danAccounts.length}`);
    console.log('');

    // Analyze account distribution by workspace
    const workspaceCounts = {};
    const industryCounts = {};
    const accountTypeCounts = {};

    danAccounts.forEach(account => {
      // Workspace counts
      if (account.workspaceId) {
        workspaceCounts[account.workspaceId] = (workspaceCounts[account.workspaceId] || 0) + 1;
      }

      // Industry counts
      if (account.industry) {
        industryCounts[account.industry] = (industryCounts[account.industry] || 0) + 1;
      }

      // Account type counts
      if (account.accountType) {
        accountTypeCounts[account.accountType] = (accountTypeCounts[account.accountType] || 0) + 1;
      }
    });

    console.log('🏢 ACCOUNT DISTRIBUTION BY WORKSPACE:');
    for (const [workspaceId, count] of Object.entries(workspaceCounts)) {
      console.log(`   ${workspaceId}: ${count} accounts`);
    }
    console.log('');

    console.log('🏭 ACCOUNT DISTRIBUTION BY INDUSTRY:');
    for (const [industry, count] of Object.entries(industryCounts)) {
      console.log(`   ${industry}: ${count} accounts`);
    }
    console.log('');

    console.log('📋 ACCOUNT DISTRIBUTION BY TYPE:');
    for (const [type, count] of Object.entries(accountTypeCounts)) {
      console.log(`   ${type}: ${count} accounts`);
    }
    console.log('');

    // Check if accounts have website/domain info needed for buyer group analysis
    const accountsWithWebsite = danAccounts.filter(acc => acc.website || acc.domain);
    const accountsWithoutWebsite = danAccounts.filter(acc => !acc.website && !acc.domain);

    console.log('🌐 WEBSITE/DOMAIN COVERAGE:');
    console.log(`   ✅ With website/domain: ${accountsWithWebsite.length} (${((accountsWithWebsite.length / danAccounts.length) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Without website/domain: ${accountsWithoutWebsite.length} (${((accountsWithoutWebsite.length / danAccounts.length) * 100).toFixed(1)}%)`);
    console.log('');

    // Sample accounts for buyer group analysis
    console.log('📝 SAMPLE ACCOUNTS FOR BUYER GROUP ANALYSIS:');
    const sampleAccounts = danAccounts.slice(0, 5);
    sampleAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name}`);
      console.log(`      Industry: ${account.industry || 'Unknown'}`);
      console.log(`      Website: ${account.website || account.domain || 'None'}`);
      console.log(`      Type: ${account.accountType || 'Unknown'}`);
      console.log(`      Workspace: ${account.workspaceId || 'None'}`);
      console.log('');
    });

    // Check buyer group system readiness
    console.log('🤖 BUYER GROUP SYSTEM READINESS AUDIT:');
    
    // Check if required API keys are available
    const requiredEnvVars = [
      'PERPLEXITY_API_KEY',
      'OPENAI_API_KEY',
      'CORESIGNAL_API_KEY'
    ];

    console.log('🔑 REQUIRED API KEYS:');
    for (const envVar of requiredEnvVars) {
      const hasKey = process.env[envVar] ? '✅' : '❌';
      console.log(`   ${hasKey} ${envVar}`);
    }
    console.log('');

    // Check if buyer group system files exist
    const fs = require('fs');
    const buyerGroupSystemPath = 'src/platform/pipelines/modules/powerhouse/BuyerGroupAI.js';
    const intelligenceApiPath = 'src/app/api/intelligence_archive/research/route.ts';
    
    console.log('📁 BUYER GROUP SYSTEM FILES:');
    console.log(`   ${fs.existsSync(buyerGroupSystemPath) ? '✅' : '❌'} ${buyerGroupSystemPath}`);
    console.log(`   ${fs.existsSync(intelligenceApiPath) ? '✅' : '❌'} ${intelligenceApiPath}`);
    console.log('');

    // Assess buyer group analysis readiness
    console.log('🎯 BUYER GROUP ANALYSIS READINESS:');
    
    if (danAccounts.length > 0) {
      console.log('   ✅ Dan has accounts to analyze');
    } else {
      console.log('   ❌ No accounts found for analysis');
    }

    if (accountsWithWebsite.length > 0) {
      console.log('   ✅ Sufficient website/domain data for analysis');
    } else {
      console.log('   ⚠️ Limited website data may affect analysis quality');
    }

    if (process.env.PERPLEXITY_API_KEY && process.env.OPENAI_API_KEY) {
      console.log('   ✅ AI APIs configured for buyer group analysis');
    } else {
      console.log('   ❌ Missing AI API keys for buyer group analysis');
    }

    console.log('');

    // Recommendations
    console.log('💡 RECOMMENDATIONS FOR OPTIMAL BUYER GROUP ANALYSIS:');
    
    if (accountsWithoutWebsite.length > 0) {
      console.log(`   🔍 Enrich ${accountsWithoutWebsite.length} accounts with website/domain data`);
    }
    
    if (!process.env.PERPLEXITY_API_KEY || !process.env.OPENAI_API_KEY) {
      console.log('   🔑 Configure PERPLEXITY_API_KEY and OPENAI_API_KEY in .env');
    }
    
    console.log('   📊 Process accounts in batches of 10-20 for optimal performance');
    console.log('   🎯 Focus on accounts with complete company information first');
    console.log('   🔄 Use industry-specific buyer group templates for better accuracy');

  } catch (error) {
    console.error('❌ Error auditing Dan\'s accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditDanAccounts();
}

module.exports = { auditDanAccounts };
