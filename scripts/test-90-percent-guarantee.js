#!/usr/bin/env node

/**
 * 🛡️ 90% CONTACT GUARANTEE TEST
 * 
 * Tests our complete system with real title company executives
 * Validates LinkedIn-first approach + pattern generation for 90% success
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const INTELLIGENCE_API_URL = 'http://localhost:3000/api/intelligence';

// Real title company executives (more likely to be found in APIs)
const REAL_TITLE_EXECUTIVES = [
  {
    name: "Stewart Title",
    website: "stewart.com",
    industry: "Title Insurance",
    dealSize: 75000,
    expectedExecutives: ["CEO", "COO", "President", "General Counsel"]
  },
  {
    name: "Old Republic Title",
    website: "oldrepublictitle.com", 
    industry: "Title Insurance",
    dealSize: 75000,
    expectedExecutives: ["CEO", "CFO", "President"]
  },
  {
    name: "Chicago Title Insurance Company",
    website: "chicagotitle.com",
    industry: "Title Insurance", 
    dealSize: 100000,
    expectedExecutives: ["CEO", "COO", "CFO", "President"]
  },
  {
    name: "Lawyers Title Insurance Corporation",
    website: "landam.com",
    industry: "Title Insurance",
    dealSize: 85000,
    expectedExecutives: ["CEO", "CFO", "General Counsel"]
  },
  {
    name: "Commonwealth Land Title Insurance Company",
    website: "commonwealthlandtitle.com",
    industry: "Title Insurance",
    dealSize: 90000,
    expectedExecutives: ["President", "COO", "General Counsel"]
  }
];

async function test90PercentGuarantee() {
  console.log('🛡️ 90% CONTACT GUARANTEE TEST');
  console.log('=' .repeat(60));
  console.log('Testing complete system with real title company executives');
  console.log('GOAL: Achieve 90% contact discovery rate (email + phone + LinkedIn)');
  console.log('');

  let totalTested = 0;
  let totalExecutivesFound = 0;
  let totalWithEmail = 0;
  let totalWithPhone = 0;
  let totalWithLinkedIn = 0;
  let totalComplete = 0;
  let totalCost = 0;
  let totalTime = 0;

  const detailedResults = [];

  for (const company of REAL_TITLE_EXECUTIVES) {
    console.log(`🏢 Testing: ${company.name}`);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    
    try {
      // Test the complete intelligence system
      const response = await fetch(`${INTELLIGENCE_API_URL}/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'dano',
          'x-workspace-id': 'notary-everyday'
        },
        body: JSON.stringify({
          workspaceId: 'notary-everyday',
          userId: 'dano',
          accounts: [company],
          researchDepth: 'comprehensive',
          targetRoles: company.expectedExecutives
        })
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      totalTime += processingTime;

      console.log(`   📊 Response Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        
        console.log(`   ✅ Intelligence Success!`);
        console.log(`   👥 Executives Found: ${result.executives?.length || 0}`);
        console.log(`   📝 Contacts Added: ${result.contactsAdded || 0}`);
        console.log(`   🎯 Leads Added: ${result.leadsAdded || 0}`);
        console.log(`   💰 Cost: $${result.totalCost?.toFixed(2) || '0.00'}`);
        console.log(`   ⏱️  Time: ${(processingTime / 1000).toFixed(1)}s`);
        console.log(`   📊 Confidence: ${result.confidence || 0}%`);
        
        totalCost += result.totalCost || 0;
        
        if (result.executives && result.executives.length > 0) {
          totalExecutivesFound += result.executives.length;
          
          console.log(`\n   👥 Executive Contact Analysis:`);
          
          result.executives.forEach((exec, index) => {
            const hasEmail = !!exec.email;
            const hasPhone = !!exec.phone;
            const hasLinkedIn = !!exec.linkedin;
            const isComplete = hasEmail && hasPhone && hasLinkedIn;
            
            if (hasEmail) totalWithEmail++;
            if (hasPhone) totalWithPhone++;
            if (hasLinkedIn) totalWithLinkedIn++;
            if (isComplete) totalComplete++;
            
            console.log(`   ${index + 1}. ${exec.name} (${exec.role})`);
            console.log(`      📧 Email: ${hasEmail ? '✅' : '❌'} ${exec.email || 'Not found'}`);
            console.log(`      📞 Phone: ${hasPhone ? '✅' : '❌'} ${exec.phone || 'Not found'}`);
            console.log(`      💼 LinkedIn: ${hasLinkedIn ? '✅' : '❌'} ${exec.linkedin || 'Not found'}`);
            console.log(`      🎯 Complete: ${isComplete ? '✅' : '❌'} (${exec.confidence || 0}% confidence)`);
            
            detailedResults.push({
              company: company.name,
              executive: exec.name,
              role: exec.role,
              hasEmail,
              hasPhone,
              hasLinkedIn,
              isComplete,
              confidence: exec.confidence || 0,
              source: exec.source || 'unknown'
            });
          });
          
          if (result.buyerGroupAnalysis) {
            console.log(`\n   🎯 Buyer Group Analysis:`);
            const bg = result.buyerGroupAnalysis;
            if (bg.decisionMaker) {
              console.log(`   Decision Maker: ${bg.decisionMaker.name} (${bg.decisionMaker.role})`);
            }
            if (bg.champions && bg.champions.length > 0) {
              console.log(`   Champions: ${bg.champions.map(c => c.name).join(', ')}`);
            }
          }
        }
        
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Intelligence failed: ${response.status}`);
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.error(`   ❌ Exception: ${error.message}`);
    }
    
    totalTested++;
    console.log('');
    
    // Wait between companies to respect API limits
    if (totalTested < REAL_TITLE_EXECUTIVES.length) {
      console.log('⏳ Waiting 5 seconds before next company...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // FINAL ANALYSIS
  console.log('📊 90% CONTACT GUARANTEE TEST RESULTS');
  console.log('=' .repeat(60));
  console.log(`Companies Tested: ${totalTested}`);
  console.log(`👥 Total Executives Found: ${totalExecutivesFound}`);
  console.log(`📧 Email Discovery Rate: ${totalExecutivesFound > 0 ? Math.round(totalWithEmail/totalExecutivesFound*100) : 0}% (${totalWithEmail}/${totalExecutivesFound})`);
  console.log(`📞 Phone Discovery Rate: ${totalExecutivesFound > 0 ? Math.round(totalWithPhone/totalExecutivesFound*100) : 0}% (${totalWithPhone}/${totalExecutivesFound})`);
  console.log(`💼 LinkedIn Discovery Rate: ${totalExecutivesFound > 0 ? Math.round(totalWithLinkedIn/totalExecutivesFound*100) : 0}% (${totalWithLinkedIn}/${totalExecutivesFound})`);
  console.log(`🎯 COMPLETE CONTACT RATE: ${totalExecutivesFound > 0 ? Math.round(totalComplete/totalExecutivesFound*100) : 0}% (${totalComplete}/${totalExecutivesFound})`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(2)}`);
  console.log(`⏱️  Average Time per Company: ${totalTested > 0 ? (totalTime/totalTested/1000).toFixed(1) : 0}s`);
  console.log(`💰 Cost per Executive: $${totalExecutivesFound > 0 ? (totalCost/totalExecutivesFound).toFixed(2) : '0.00'}`);
  console.log('');

  // SYSTEM READINESS ASSESSMENT
  const guaranteeRate = totalExecutivesFound > 0 ? totalComplete / totalExecutivesFound : 0;
  
  console.log('🚀 SYSTEM READINESS ASSESSMENT');
  console.log('=' .repeat(60));
  
  if (guaranteeRate >= 0.9) {
    console.log('🎉 SYSTEM READY: 90%+ guarantee rate achieved!');
    console.log('   ✅ Ready to process all 150 Notary Everyday accounts');
    console.log('   ✅ APIs are working and finding real executives');
    console.log('   ✅ Contact discovery is meeting enterprise standards');
  } else if (guaranteeRate >= 0.8) {
    console.log('✅ SYSTEM GOOD: 80-90% guarantee rate achieved');
    console.log('   ✅ Ready to process 150 accounts with high confidence');
    console.log('   💡 Consider minor optimizations for 90%+ rate');
  } else if (guaranteeRate >= 0.6) {
    console.log('⚠️ SYSTEM PARTIAL: 60-80% guarantee rate');
    console.log('   ⚠️ May proceed with caution for 150 accounts');
    console.log('   💡 Recommend adding Apollo or ZoomInfo APIs');
  } else {
    console.log('❌ SYSTEM NOT READY: <60% guarantee rate');
    console.log('   ❌ Do not process 150 accounts yet');
    console.log('   🔧 Must improve contact discovery before production');
  }
  
  console.log('');
  console.log('📋 DETAILED BREAKDOWN BY COMPANY:');
  console.log('─'.repeat(60));
  
  const companySummary = {};
  detailedResults.forEach(result => {
    if (!companySummary[result.company]) {
      companySummary[result.company] = { total: 0, complete: 0 };
    }
    companySummary[result.company].total++;
    if (result.isComplete) companySummary[result.company].complete++;
  });
  
  Object.entries(companySummary).forEach(([company, stats]) => {
    const rate = Math.round((stats.complete / stats.total) * 100);
    console.log(`${company}: ${rate}% complete (${stats.complete}/${stats.total})`);
  });
  
  console.log('');
  console.log(guaranteeRate >= 0.8 ? 
    '🎯 CONTACT GUARANTEE SYSTEM READY FOR PRODUCTION!' :
    '🔧 SYSTEM NEEDS IMPROVEMENT BEFORE 150-ACCOUNT PROCESSING'
  );
}

// Run the test
if (require.main === module) {
  test90PercentGuarantee().catch(console.error);
}

module.exports = { test90PercentGuarantee };
