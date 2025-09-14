const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demoDanBuyerGroupContext() {
  try {
    console.log('🎯 DEMONSTRATING BUYER GROUP CONTEXT ADAPTATION FOR DAN\n');

    // Dan's selling context for buyer group intelligence/sales software
    const danSellingContext = {
      productCategory: 'Buyer Group Intelligence & Sales Software',
      targetMarket: 'Technology Companies (Enterprise & Mid-market)',
      averageDealSize: 75000, // Typical for B2B software
      salesCycle: '3-6 months',
      keyValueProps: [
        'Identify optimal buyer groups',
        'Map decision makers and influencers',
        'Accelerate sales cycles',
        'Improve win rates',
        'Reduce time to close'
      ],
      primaryTargetRoles: [
        'VP Sales',
        'Sales Director', 
        'VP Marketing',
        'Revenue Operations Manager',
        'Chief Revenue Officer (CRO)'
      ],
      championRoles: [
        'Sales Manager',
        'Marketing Manager',
        'Sales Operations',
        'Business Development Manager'
      ],
      blockerRoles: [
        'IT Security',
        'Legal/Compliance',
        'Procurement',
        'CFO (budget constraints)'
      ],
      sellerSkillLevel: 'expert'
    };

    console.log('👤 DAN\'S SELLING CONTEXT:');
    console.log(`   🏷️  Product: ${danSellingContext.productCategory}`);
    console.log(`   🎯 Target Market: ${danSellingContext.targetMarket}`);
    console.log(`   💰 Average Deal: $${danSellingContext.averageDealSize.toLocaleString()}`);
    console.log(`   ⏱️  Sales Cycle: ${danSellingContext.salesCycle}`);
    console.log('');

    console.log('🎯 PRIMARY TARGET ROLES:');
    danSellingContext.primaryTargetRoles.forEach(role => {
      console.log(`   ✅ ${role}`);
    });
    console.log('');

    console.log('🚀 CHAMPION ROLES:');
    danSellingContext.championRoles.forEach(role => {
      console.log(`   🎯 ${role}`);
    });
    console.log('');

    console.log('🚫 BLOCKER ROLES:');
    danSellingContext.blockerRoles.forEach(role => {
      console.log(`   ⚠️  ${role}`);
    });
    console.log('');

    // Show how this context adapts buyer group analysis for different company types
    console.log('🏭 HOW CONTEXT ADAPTS BUYER GROUP ANALYSIS:\n');

    // Example 1: Technology Company
    console.log('💻 EXAMPLE 1: TECHNOLOGY COMPANY (e.g., "Datadog")');
    console.log('   🎯 BUYER GROUP ADAPTATION:');
    console.log('      • Decision Maker: VP Sales or CRO (budget authority for sales tools)');
    console.log('      • Champion: Sales Operations Manager (daily user of sales intelligence)');
    console.log('      • Influencers: Marketing Manager (needs buyer group data for campaigns)');
    console.log('      • Budget Authority: VP Sales (controls sales tool budget)');
    console.log('      • Decision Factors: ROI on sales efficiency, integration with existing tools');
    console.log('');

    // Example 2: Enterprise Company
    console.log('🏢 EXAMPLE 2: ENTERPRISE COMPANY (e.g., "Adobe")');
    console.log('   🎯 BUYER GROUP ADAPTATION:');
    console.log('      • Decision Maker: Chief Revenue Officer (enterprise-wide sales strategy)');
    console.log('      • Champion: VP Sales Operations (implements sales processes)');
    console.log('      • Influencers: Sales Enablement, Marketing Operations');
    console.log('      • Budget Authority: CRO or VP Finance (enterprise budget)');
    console.log('      • Decision Factors: Enterprise security, scalability, ROI across regions');
    console.log('');

    // Example 3: Mid-market Company
    console.log('🏗️ EXAMPLE 3: MID-MARKET COMPANY (e.g., "ClickUp")');
    console.log('   🎯 BUYER GROUP ADAPTATION:');
    console.log('      • Decision Maker: VP Sales (direct budget control)');
    console.log('      • Champion: Sales Manager (team leader who sees the need)');
    console.log('      • Influencers: Marketing Manager, Sales Operations');
    console.log('      • Budget Authority: VP Sales (mid-market decision making)');
    console.log('      • Decision Factors: Quick ROI, ease of implementation, team adoption');
    console.log('');

    // Show the AI prompt adaptation
    console.log('🤖 AI PROMPT ADAPTATION FOR DAN\'S PRODUCT:');
    console.log('   The system automatically tailors the Perplexity AI prompt:');
    console.log('');
    console.log('   "Analyze the buyer group for selling Buyer Group Intelligence & Sales Software to [Company Name]');
    console.log('    - Focus on sales and revenue decision makers');
    console.log('    - Identify who controls sales tool budgets');
    console.log('    - Find champions who would use buyer group intelligence daily');
    console.log('    - Consider integration with existing sales/marketing tools');
    console.log('    - Evaluate ROI on sales efficiency improvements"');
    console.log('');

    // Show buyer group role mapping
    console.log('🎯 CONTEXT-AWARE BUYER GROUP ROLES:');
    console.log('   For Dan\'s product, the system automatically maps:');
    console.log('');
    console.log('   📊 DECISION MAKERS:');
    console.log('      • VP Sales (primary budget authority)');
    console.log('      • CRO (enterprise-wide decisions)');
    console.log('      • Sales Director (team-level decisions)');
    console.log('');
    console.log('   🚀 CHAMPIONS:');
    console.log('      • Sales Operations Manager (daily user)');
    console.log('      • Sales Manager (team adoption)');
    console.log('      • Marketing Manager (campaign intelligence)');
    console.log('');
    console.log('   🎭 INFLUENCERS:');
    console.log('      • Sales Enablement (training and adoption)');
    console.log('      • Business Development (prospecting intelligence)');
    console.log('      • Revenue Operations (process optimization)');
    console.log('');
    console.log('   🚫 BLOCKERS:');
    console.log('      • IT Security (data privacy concerns)');
    console.log('      • Legal (compliance requirements)');
    console.log('      • Procurement (vendor evaluation)');
    console.log('      • CFO (budget approval)');
    console.log('');

    console.log('💡 KEY INSIGHT:');
    console.log('   The system automatically adapts from generic "CFO/CTO" targeting');
    console.log('   to specific "VP Sales/CRO" targeting based on Dan\'s product context!');
    console.log('');
    console.log('   This means Dan gets buyer groups optimized for selling sales software,');
    console.log('   not generic enterprise software buyer groups.');

  } catch (error) {
    console.error('❌ Error demonstrating buyer group context:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo
if (require.main === module) {
  demoDanBuyerGroupContext();
}

module.exports = { demoDanBuyerGroupContext };
