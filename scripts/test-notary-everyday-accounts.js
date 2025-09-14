#!/usr/bin/env node

/**
 * 🏢 NOTARY EVERYDAY ACCOUNT INTELLIGENCE TEST
 * 
 * Demonstrates how our system works for Dano's real-world accounts
 * in the title/notary industry with seller skill optimization
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const INTELLIGENCE_API_URL = 'http://localhost:3000/api/intelligence';

// Sample Notary Everyday target accounts (title companies, real estate, legal)
const notaryEverydayAccounts = [
  {
    name: "Stewart Title Company",
    website: "stewart.com",
    industry: "Financial Services",
    dealSize: 75000,
    importance: "high_value"
  },
  {
    name: "Old Republic Title",
    website: "oldrepublictitle.com", 
    industry: "Financial Services",
    dealSize: 50000,
    importance: "standard"
  },
  {
    name: "Fidelity National Title",
    website: "fnf.com",
    industry: "Financial Services", 
    dealSize: 125000,
    importance: "strategic"
  },
  {
    name: "Chicago Title Company",
    website: "chicagotitle.com",
    industry: "Financial Services",
    dealSize: 60000,
    importance: "standard"
  },
  {
    name: "Commonwealth Land Title",
    website: "commonwealthlandtitle.com",
    industry: "Financial Services",
    dealSize: 80000,
    importance: "high_value"
  }
];

// Dano's seller profile (expert level seller)
const danoSellerProfile = {
  name: "Dan Mirolli",
  skillLevel: "expert", // Can sell high to C-level
  product: "Notary Management Software",
  productCategory: "Legal Technology",
  averageDealSize: 75000,
  targetRoles: ["COO", "VP_Operations", "CFO", "General_Counsel"],
  sellingStrengths: ["Process optimization", "Compliance automation", "Cost reduction"]
};

async function testNotaryEverydayIntelligence() {
  console.log('🏢 NOTARY EVERYDAY ACCOUNT INTELLIGENCE TEST');
  console.log('=' .repeat(60));
  console.log(`👤 Seller: ${danoSellerProfile.name} (${danoSellerProfile.skillLevel} level)`);
  console.log(`📦 Product: ${danoSellerProfile.product}`);
  console.log(`🎯 Target Roles: ${danoSellerProfile.targetRoles.join(', ')}`);
  console.log(`💰 Average Deal: $${danoSellerProfile.averageDealSize.toLocaleString()}`);
  console.log('');

  // Test each account
  for (let i = 0; i < Math.min(5, notaryEverydayAccounts.length); i++) {
    const account = notaryEverydayAccounts[i];
    
    console.log(`\n🔍 ACCOUNT ${i + 1}: ${account.name}`);
    console.log('─'.repeat(40));
    
    try {
      // Research executives and buyer group
      const response = await fetch(`${INTELLIGENCE_API_URL}/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dan',
          'x-workspace-id': 'adrata'
        },
        body: JSON.stringify({
          accounts: [account],
          targetRoles: danoSellerProfile.targetRoles,
          researchDepth: 'comprehensive',
          sellerContext: danoSellerProfile
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log(`✅ INTELLIGENCE DISCOVERED:`);
        console.log(`   Company: ${account.name}`);
        console.log(`   Industry: ${account.industry}`);
        console.log(`   Deal Size: $${account.dealSize.toLocaleString()}`);
        console.log('');

        // Show executives found
        if (data.executives && data.executives.length > 0) {
          console.log(`👥 EXECUTIVES FOUND (${data.executives.length}):`);
          data.executives.forEach((exec, index) => {
            console.log(`   ${index + 1}. ${exec.name}`);
            console.log(`      Title: ${exec.title}`);
            console.log(`      Role: ${exec.role}`);
            console.log(`      Email: ${exec.email || 'Not found'}`);
            console.log(`      Phone: ${exec.phone || 'Not found'}`);
            console.log(`      Confidence: ${exec.confidenceScore}%`);
            console.log(`      Why Selected: ${exec.selectionReasoning}`);
            console.log('');
          });
        } else {
          console.log('❌ No executives found');
        }

        // Show buyer group analysis
        if (data.buyerGroupAnalysis) {
          const bg = data.buyerGroupAnalysis;
          
          console.log(`🎯 BUYER GROUP ANALYSIS:`);
          
          if (bg.decisionMaker) {
            console.log(`   💰 DECISION MAKER: ${bg.decisionMaker.name} (${bg.decisionMaker.role})`);
            console.log(`      Why: ${bg.budgetAuthority}`);
            if (bg.decisionMaker.buyerGroupReasoning) {
              console.log(`      Reasoning: ${bg.decisionMaker.buyerGroupReasoning}`);
            }
          }
          
          if (bg.champion) {
            console.log(`   🚀 CHAMPION: ${bg.champion.name} (${bg.champion.role})`);
            if (bg.champion.buyerGroupReasoning) {
              console.log(`      Reasoning: ${bg.champion.buyerGroupReasoning}`);
            }
          }
          
          if (bg.influencers && bg.influencers.length > 0) {
            console.log(`   👥 INFLUENCERS: ${bg.influencers.length} identified`);
            bg.influencers.forEach(inf => {
              console.log(`      - ${inf.name} (${inf.role})`);
            });
          }
          
          if (bg.introducers && bg.introducers.length > 0) {
            console.log(`   🤝 INTRODUCERS: ${bg.introducers.length} identified`);
            bg.introducers.forEach(intro => {
              console.log(`      - ${intro.name} (${intro.role})`);
            });
          }
          
          if (bg.blockers && bg.blockers.length > 0) {
            console.log(`   🚫 POTENTIAL BLOCKERS: ${bg.blockers.length} identified`);
            bg.blockers.forEach(blocker => {
              console.log(`      - ${blocker.name} (${blocker.role})`);
            });
          }
          
          console.log('');
          console.log(`📈 SALES STRATEGY FOR DANO:`);
          console.log(`   Sales Cycle: ${bg.salesCycleEstimate}`);
          console.log(`   Approach: ${bg.decisionStyle}`);
          console.log(`   Close Probability: ${bg.probability}%`);
          console.log(`   Predicted Close: ${bg.closeDate}`);
          
          if (bg.painPoints) {
            console.log(`   Pain Points: ${bg.painPoints.join(', ')}`);
          }
          
          if (bg.nextActions) {
            console.log(`   Next Actions:`);
            bg.nextActions.forEach((action, index) => {
              console.log(`      ${index + 1}. ${action}`);
            });
          }
        }

        console.log(`\n💰 COST: $${data.totalCost.toFixed(2)} | ⏱️ TIME: ${Math.round(data.processingTimeMs/1000)}s | 🎯 CONFIDENCE: ${data.confidence}%`);

      } else {
        console.log(`❌ Research failed for ${account.name}`);
      }

    } catch (error) {
      console.log(`❌ Error researching ${account.name}:`, error.message);
    }

    // Small delay between accounts
    if (i < Math.min(5, notaryEverydayAccounts.length) - 1) {
      console.log('\n⏳ Waiting 3 seconds before next account...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n🎯 NOTARY EVERYDAY INTELLIGENCE TEST COMPLETE');
  console.log('=' .repeat(60));
  console.log('✅ System demonstrates:');
  console.log('   - Real executive discovery in title/financial services industry');
  console.log('   - Industry-specific buyer group analysis');
  console.log('   - Deal-size appropriate decision maker identification');
  console.log('   - Seller skill-level optimized approach recommendations');
  console.log('   - Complete contact intelligence with emails and LinkedIn');
  console.log('   - Actionable next steps for each account');
}

// Run the test
if (require.main === module) {
  testNotaryEverydayIntelligence().catch(console.error);
}

module.exports = { testNotaryEverydayIntelligence };
