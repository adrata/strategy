/**
 * Test Buyer Group Discovery System
 * 
 * Tests the buyer group discovery pipeline with a real company
 * Saves results to file instead of database
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import the buyer group discovery modules
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index');

class BuyerGroupDiscoveryTester {
  constructor() {
    this.resultsDir = path.join(__dirname, 'buyer-group-results');
    this.ensureResultsDir();
  }

  ensureResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async testWithCompany(companyName, website, dealSize = 150000) {
    console.log('🚀 Testing Buyer Group Discovery System');
    console.log(`📊 Company: ${companyName}`);
    console.log(`🌐 Website: ${website}`);
    console.log(`💰 Deal Size: $${dealSize.toLocaleString()}`);
    console.log('─'.repeat(60));

    try {
      // Initialize the pipeline
      const pipeline = new SmartBuyerGroupPipeline({
        targetCompany: website, // Use website as identifier
        dealSize: dealSize,
        productCategory: 'sales', // Buyer group intelligence is sales software
        workspaceId: '01K7464TNANHQXPCZT1FYX205V' // Adrata workspace ID
      });

      // Validate configuration
      const validation = pipeline.validateConfiguration();
      if (!validation.isValid) {
        console.error('❌ Configuration validation failed:');
        validation.issues.forEach(issue => console.error(`   - ${issue}`));
        return null;
      }

      console.log('✅ Configuration valid, starting pipeline...\n');

      // Run the pipeline
      const result = await pipeline.run();

      if (!result) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      // Save results to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `buyer-group-${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.json`;
      const filepath = path.join(this.resultsDir, filename);

      const output = {
        metadata: {
          companyName,
          website,
          dealSize,
          timestamp: new Date().toISOString(),
          pipelineVersion: '2.0.0'
        },
        result
      };

      fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
      console.log(`\n💾 Results saved to: ${filepath}`);

      // Display summary
      this.displaySummary(result, companyName);

      return result;

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  displaySummary(result, companyName) {
    console.log('\n📊 Buyer Group Discovery Results:');
    console.log('─'.repeat(50));
    
    if (result.companyIntelligence) {
      console.log(`🏢 Company: ${result.companyIntelligence.companyName || companyName}`);
      console.log(`👥 Employees: ${result.companyIntelligence.employeeCount || 'Unknown'}`);
      console.log(`💰 Revenue: $${(result.companyIntelligence.revenue || 0).toLocaleString()}`);
      console.log(`🏷️  Tier: ${result.companyIntelligence.tier || 'Unknown'}`);
    }
    
    console.log(`📋 Total Employees Found: ${result.previewEmployees?.length || 0}`);
    console.log(`🎯 Buyer Group Size: ${result.buyerGroup?.length || 0}`);
    console.log(`💵 Total Cost: $${(result.costs?.total || 0).toFixed(2)}`);
    console.log(`⏱️  Processing Time: ${result.processingTime || 0}ms`);
    
    if (result.buyerGroup && result.buyerGroup.length > 0) {
      console.log('\n🎯 Buyer Group Members:');
      console.log('─'.repeat(50));
      
      const roleEmojis = {
        decision: '🏛️',
        champion: '🚀', 
        stakeholder: '📊',
        blocker: '🚫',
        introducer: '🤝'
      };
      
      result.buyerGroup.forEach((member, index) => {
        const roleEmoji = roleEmojis[member.buyerGroupRole] || '👤';
        const confidence = member.roleConfidence || 0;
        console.log(`${index + 1}. ${roleEmoji} ${member.name} - ${member.title}`);
        console.log(`   ${member.department} | ${member.buyerGroupRole.replace('_', ' ')} (${confidence}%)`);
        if (member.roleReasoning) {
          console.log(`   💭 ${member.roleReasoning}`);
        }
        console.log('');
      });
    }
    
    if (result.cohesion) {
      console.log(`📊 Cohesion Score: ${result.cohesion.score}%`);
    }
    
    if (result.coverage) {
      console.log(`📈 Coverage Analysis: ${JSON.stringify(result.coverage, null, 2)}`);
    }
  }
}

// Test function
async function runTest() {
  const tester = new BuyerGroupDiscoveryTester();
  
  // Test with Openprise (revenue operations company - perfect for buyer group intelligence)
  const testCompany = {
    name: 'Openprise',
    website: 'https://www.openprisetech.com/',
    dealSize: 150000 // $150K deal for buyer group intelligence software
  };

  try {
    await tester.testWithCompany(
      testCompany.name,
      testCompany.website,
      testCompany.dealSize
    );
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTest();
}

module.exports = { BuyerGroupDiscoveryTester };
