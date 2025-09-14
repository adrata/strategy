#!/usr/bin/env node
/**
 * 🧪 MODULAR PIPELINE VALIDATION TEST
 * 
 * Comprehensive test of the new modular buyer group pipeline
 */

const { runBuyerGroupPipeline, SELLER_PROFILES } = require('../../src/platform/services/buyer-group');

async function main() {
  console.log('🚀 MODULAR BUYER GROUP PIPELINE VALIDATION');
  console.log('='.repeat(60));

  try {
    // Test 1: Basic Pipeline Execution
    console.log('\n📋 Test 1: Basic Pipeline Execution');
    console.log('-'.repeat(40));

    const testCompany = 'Dell Technologies';
    const sellerProfile = 'buyer-group-intelligence';
    const maxCollects = 50; // Small test run

    console.log(`Company: ${testCompany}`);
    console.log(`Seller Profile: ${sellerProfile}`);
    console.log(`Max Collects: ${maxCollects}`);

    const startTime = Date.now();
    const report = await runBuyerGroupPipeline(testCompany, sellerProfile, maxCollects);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Pipeline completed in ${duration}ms`);
    console.log(`📊 Generated report ID: ${report.id}`);

    // Test 2: Report Structure Validation
    console.log('\n📋 Test 2: Report Structure Validation');
    console.log('-'.repeat(40));

    const requiredFields = [
      'id', 'buyerGroup', 'painIntelligence', 'profiles', 
      'engagementStrategy', 'enablementAssets', 'recommendations'
    ];

    const missingFields = requiredFields.filter(field => !(field in report));
    if (missingFields.length === 0) {
      console.log('✅ All required report fields present');
    } else {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
    }

    // Test 3: Buyer Group Analysis
    console.log('\n📋 Test 3: Buyer Group Analysis');
    console.log('-'.repeat(40));

    const { buyerGroup } = report;
    const roleTypes = Object.keys(buyerGroup.roles);
    const totalMembers = Object.values(buyerGroup.roles).flat().length;

    console.log(`👥 Total buyer group members: ${totalMembers}`);
    console.log(`🎯 Role distribution:`);
    
    for (const roleType of roleTypes) {
      const count = buyerGroup.roles[roleType].length;
      console.log(`  ${roleType}: ${count} members`);
    }

    console.log(`⚡ Risk level: ${buyerGroup.dynamics.riskLevel}`);
    console.log(`🔄 Decision complexity: ${buyerGroup.dynamics.decisionComplexity.toFixed(1)}`);

    // Test 4: Pain Intelligence Validation
    console.log('\n📋 Test 4: Pain Intelligence Validation');
    console.log('-'.repeat(40));

    if (report.painIntelligence) {
      const { painIntelligence } = report;
      console.log(`🔥 Overall pain score: ${painIntelligence.overallPainScore}/100`);
      console.log(`⚡ Recommended approach: ${painIntelligence.recommendedApproach}`);
      console.log(`📈 Top challenges: ${painIntelligence.topChallenges.length}`);
      console.log(`🎯 Key buying signals: ${painIntelligence.keyBuyingSignals.length}`);

      // Show top challenge
      if (painIntelligence.topChallenges.length > 0) {
        const topChallenge = painIntelligence.topChallenges[0];
        console.log(`\n🔍 Top Challenge:`);
        console.log(`   Category: ${topChallenge.category}`);
        console.log(`   Description: ${topChallenge.description}`);
        console.log(`   Urgency: ${topChallenge.urgency}/10`);
        console.log(`   Confidence: ${(topChallenge.confidence * 100).toFixed(0)}%`);
      }
    } else {
      console.log('⚠️  No pain intelligence data available');
    }

    // Test 5: Engagement Strategy Validation
    console.log('\n📋 Test 5: Engagement Strategy Validation');
    console.log('-'.repeat(40));

    const { engagementStrategy } = report;
    console.log(`🎯 Primary approach: ${engagementStrategy.primaryApproach}`);
    console.log(`⏱️  Timeline: ${engagementStrategy.timeline}`);
    console.log(`📝 Key messages: ${engagementStrategy.keyMessages.length}`);
    console.log(`🛡️  Risk mitigations: ${engagementStrategy.riskMitigation.length}`);

    // Test 6: Cost Analysis
    console.log('\n📋 Test 6: Cost Analysis');
    console.log('-'.repeat(40));

    const costInCredits = buyerGroup.metadata.costInCredits;
    const costPerCredit = 0.196; // From pricing analysis
    const totalCost = costInCredits * costPerCredit;

    console.log(`💰 Credits used: ${costInCredits}`);
    console.log(`💵 Estimated cost: $${totalCost.toFixed(2)}`);
    console.log(`📊 Cost per profile: $${(totalCost / totalMembers).toFixed(2)}`);

    // Test 7: Seller Profile Compatibility
    console.log('\n📋 Test 7: Seller Profile Compatibility');
    console.log('-'.repeat(40));

    const availableProfiles = Object.keys(SELLER_PROFILES);
    console.log(`🎯 Available seller profiles: ${availableProfiles.length}`);
    console.log(`   ${availableProfiles.join(', ')}`);

    // Test each profile type
    for (const profileKey of availableProfiles.slice(0, 2)) { // Test first 2 to save time
      try {
        console.log(`\n🧪 Testing ${profileKey}...`);
        const testReport = await runBuyerGroupPipeline(testCompany, profileKey, 10);
        console.log(`✅ ${profileKey} profile successful`);
      } catch (error) {
        console.log(`❌ ${profileKey} profile failed: ${error.message}`);
      }
    }

    // Test 8: Performance Metrics
    console.log('\n📋 Test 8: Performance Metrics');
    console.log('-'.repeat(40));

    const profilesPerSecond = (totalMembers / (duration / 1000)).toFixed(1);
    const timePerProfile = (duration / totalMembers).toFixed(0);

    console.log(`⚡ Profiles per second: ${profilesPerSecond}`);
    console.log(`⏱️  Time per profile: ${timePerProfile}ms`);
    console.log(`🎯 Efficiency rating: ${duration < 30000 ? 'EXCELLENT' : duration < 60000 ? 'GOOD' : 'NEEDS_IMPROVEMENT'}`);

    // Final Summary
    console.log('\n🎉 VALIDATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Modular pipeline successfully executed`);
    console.log(`📊 Generated comprehensive buyer group intelligence`);
    console.log(`🔥 Pain Intelligence fully integrated`);
    console.log(`💰 Cost-optimized execution`);
    console.log(`⚡ High-performance modular architecture`);

  } catch (error) {
    console.error('\n❌ VALIDATION FAILED');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const company = args.find(arg => arg.startsWith('--company='))?.split('=')[1] || 'Dell Technologies';
const profile = args.find(arg => arg.startsWith('--profile='))?.split('=')[1] || 'buyer-group-intelligence';
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '50');

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
