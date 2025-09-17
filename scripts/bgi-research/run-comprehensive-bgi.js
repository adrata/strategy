/**
 * 🎯 COMPREHENSIVE BUYER GROUP INTELLIGENCE ANALYSIS
 * 
 * This script runs the REAL buyer group pipeline using CoreSignal API
 * to get accurate, personalized buyer group data for:
 * - Flexera (SBI Growth target)
 * - athenahealth (Absorb target)
 */

const { BuyerGroupPipeline, runBuyerGroupPipeline } = require('./src/platform/services/buyer-group/index.ts');

async function runComprehensiveBGI() {
  console.log('🚀 Starting Comprehensive Buyer Group Intelligence Analysis...\n');

  // Check environment variables
  const apiKey = process.env.CORESIGNAL_API_KEY;
  if (!apiKey) {
    console.error('❌ CORESIGNAL_API_KEY not found in environment variables');
    console.log('Please ensure your .env.local file contains: CORESIGNAL_API_KEY=your_key_here');
    return;
  }

  console.log('✅ CoreSignal API Key found');
  console.log(`🔑 API Key length: ${apiKey.length} characters\n`);

  const companies = [
    {
      name: 'Flexera',
      seller: 'SBI Growth',
      product: 'Revenue Growth Services',
      targetRoles: ['CEO', 'CRO', 'CFO', 'VP Sales', 'VP Marketing', 'Head of Revenue Operations'],
      maxCollects: 50 // Conservative for cost control
    },
    {
      name: 'athenahealth',
      seller: 'Absorb',
      product: 'Learning Management System',
      targetRoles: ['CTO', 'VP Technology', 'Head of Learning', 'VP HR', 'Director of Training'],
      maxCollects: 40 // Conservative for cost control
    }
  ];

  const results = [];

  for (const company of companies) {
    console.log(`\n🎯 Analyzing ${company.name} for ${company.seller}...`);
    console.log(`📊 Product: ${company.product}`);
    console.log(`👥 Target Roles: ${company.targetRoles.join(', ')}`);
    console.log(`🔍 Max Profiles: ${company.maxCollects}\n`);

    try {
      // Use the real buyer group pipeline
      const report = await runBuyerGroupPipeline(
        company.name,
        'buyer-group-intelligence', // Use the comprehensive seller profile
        company.maxCollects
      );

      console.log(`✅ ${company.name} Analysis Complete:`);
      console.log(`   📈 Total Buyer Group Members: ${report.buyerGroup.totalMembers}`);
      console.log(`   💰 Credits Used: ${report.metadata.creditsUsed.collect + report.metadata.creditsUsed.search}`);
      console.log(`   ⏱️  Processing Time: ${report.metadata.processingTime}ms`);
      
      // Log role distribution
      const roles = report.buyerGroup.roles;
      console.log(`   🎯 Role Distribution:`);
      console.log(`      Decision Makers: ${roles.decision.length}`);
      console.log(`      Champions: ${roles.champion.length}`);
      console.log(`      Stakeholders: ${roles.stakeholder.length}`);
      console.log(`      Blockers: ${roles.blocker.length}`);
      console.log(`      Introducers: ${roles.introducer.length}`);

      // Log key people
      console.log(`   👑 Key Decision Makers:`);
      roles.decision.forEach(person => {
        console.log(`      • ${person.name} - ${person.title}`);
      });

      console.log(`   🏆 Key Champions:`);
      roles.champion.forEach(person => {
        console.log(`      • ${person.name} - ${person.title}`);
      });

      results.push({
        company: company.name,
        seller: company.seller,
        report: report,
        success: true
      });

    } catch (error) {
      console.error(`❌ Error analyzing ${company.name}:`, error.message);
      results.push({
        company: company.name,
        seller: company.seller,
        error: error.message,
        success: false
      });
    }

    // Rate limiting between companies
    console.log('\n⏳ Waiting 5 seconds before next analysis...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Summary
  console.log('\n📊 COMPREHENSIVE BGI ANALYSIS SUMMARY');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful Analyses: ${successful.length}`);
  console.log(`❌ Failed Analyses: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 SUCCESSFUL BUYER GROUPS:');
    successful.forEach(result => {
      const report = result.report;
      console.log(`\n${result.company} (${result.seller}):`);
      console.log(`  Total Members: ${report.buyerGroup.totalMembers}`);
      console.log(`  Decision Makers: ${report.buyerGroup.roles.decision.length}`);
      console.log(`  Champions: ${report.buyerGroup.roles.champion.length}`);
      console.log(`  Stakeholders: ${report.buyerGroup.roles.stakeholder.length}`);
      console.log(`  Blockers: ${report.buyerGroup.roles.blocker.length}`);
      console.log(`  Introducers: ${report.buyerGroup.roles.introducer.length}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ FAILED ANALYSES:');
    failed.forEach(result => {
      console.log(`${result.company}: ${result.error}`);
    });
  }

  // Save results to file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `bgi-comprehensive-results-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);

  return results;
}

// Run the analysis
if (require.main === module) {
  runComprehensiveBGI()
    .then(results => {
      console.log('\n🎉 Comprehensive BGI Analysis Complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal Error:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveBGI };
