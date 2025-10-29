/**
 * Comprehensive Buyer Group Discovery Test
 * 
 * Tests the enhanced pipeline with AI integration and database persistence
 * across 3 companies of different sizes to validate the complete system.
 */

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index');
const fs = require('fs');
const path = require('path');

// Test companies with different sizes and characteristics
const testCompanies = [
  {
    name: 'Openprise',
    website: 'https://www.openprisetech.com/',
    dealSize: 150000,
    expectedSize: 'Small (100 employees)',
    description: 'Revenue operations data automation - already tested, verify improvements'
  },
  {
    name: 'HubSpot',
    website: 'https://www.hubspot.com/',
    dealSize: 250000,
    expectedSize: 'Mid-size (5000+ employees)',
    description: 'Marketing and sales platform - test representative sampling'
  },
  {
    name: 'Salesforce',
    website: 'https://www.salesforce.com/',
    dealSize: 500000,
    expectedSize: 'Enterprise (50000+ employees)',
    description: 'CRM platform - test focused sampling and enterprise handling'
  }
];

class ComprehensiveTester {
  constructor() {
    this.prisma = new PrismaClient();
    this.results = [];
    this.startTime = Date.now();
  }

  async runTests() {
    console.log('🧪 Starting Comprehensive Buyer Group Discovery Tests');
    console.log(`📊 Testing ${testCompanies.length} companies with different characteristics\n`);

    for (let i = 0; i < testCompanies.length; i++) {
      const company = testCompanies[i];
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🧪 Test ${i + 1}/${testCompanies.length}: ${company.name}`);
      console.log(`📊 Expected: ${company.expectedSize} | Deal: $${company.dealSize.toLocaleString()}`);
      console.log(`📝 Description: ${company.description}`);
      console.log(`${'='.repeat(80)}\n`);

      try {
        const result = await this.testCompany(company, i + 1);
        this.results.push(result);
        
        console.log(`\n✅ Test ${i + 1} completed successfully`);
        console.log(`   👥 Buyer Group: ${result.buyerGroup.length} members`);
        console.log(`   🎯 Decision Makers: ${result.buyerGroup.filter(m => m.buyerGroupRole === 'decision').length}`);
        console.log(`   🏆 Champions: ${result.buyerGroup.filter(m => m.buyerGroupRole === 'champion').length}`);
        console.log(`   📊 Cohesion: ${result.cohesion?.score || 0}%`);
        console.log(`   🤖 AI Enabled: ${result.aiEnabled ? 'Yes' : 'No'}`);
        console.log(`   ⏱️ Processing Time: ${result.processingTime}ms`);
        console.log(`   💰 Total Cost: $${result.costs?.total?.toFixed(2) || '0.00'}`);

      } catch (error) {
        console.error(`\n❌ Test ${i + 1} failed:`, error.message);
        this.results.push({
          company: company.name,
          success: false,
          error: error.message,
          testNumber: i + 1
        });
      }

      // Wait between tests to avoid rate limiting
      if (i < testCompanies.length - 1) {
        console.log('\n⏳ Waiting 5 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    await this.generateReport();
  }

  async testCompany(company, testNumber) {
    const pipeline = new SmartBuyerGroupPipeline({
      prisma: this.prisma,
      workspaceId: 'adrata-workspace-id', // Replace with actual workspace ID
      targetCompany: company.website,
      dealSize: company.dealSize,
      productCategory: 'sales'
    });

    // Validate configuration
    const validation = pipeline.validateConfiguration();
    if (!validation.isValid) {
      throw new Error(`Configuration invalid: ${validation.issues.join(', ')}`);
    }

    console.log(`🚀 Starting pipeline for ${company.name}...`);
    const startTime = Date.now();

    const result = await pipeline.run();
    const processingTime = Date.now() - startTime;

    // Save individual result
    const resultData = {
      testNumber,
      company: company.name,
      website: company.website,
      dealSize: company.dealSize,
      expectedSize: company.expectedSize,
      success: true,
      processingTime,
      aiEnabled: !!process.env.ANTHROPIC_API_KEY,
      ...result
    };

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `buyer-group-${company.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`;
    const filepath = path.join(__dirname, 'buyer-group-results', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(resultData, null, 2));
    console.log(`💾 Results saved to: ${filename}`);

    return resultData;
  }

  async generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);

    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));

    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Successful: ${successfulTests.length}`);
    console.log(`   Failed: ${failedTests.length}`);
    console.log(`   Success Rate: ${Math.round((successfulTests.length / this.results.length) * 100)}%`);
    console.log(`   Total Time: ${Math.round(totalTime / 1000)}s`);

    if (successfulTests.length > 0) {
      console.log(`\n✅ Successful Tests:`);
      successfulTests.forEach(test => {
        console.log(`   ${test.testNumber}. ${test.company}`);
        console.log(`      👥 Members: ${test.buyerGroup?.length || 0}`);
        console.log(`      🎯 Decision Makers: ${test.buyerGroup?.filter(m => m.buyerGroupRole === 'decision').length || 0}`);
        console.log(`      🏆 Champions: ${test.buyerGroup?.filter(m => m.buyerGroupRole === 'champion').length || 0}`);
        console.log(`      📊 Cohesion: ${test.cohesion?.score || 0}%`);
        console.log(`      ⏱️ Time: ${test.processingTime}ms`);
        console.log(`      💰 Cost: $${test.costs?.total?.toFixed(2) || '0.00'}`);
      });
    }

    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`   ${test.testNumber}. ${test.company}: ${test.error}`);
      });
    }

    // Quality Analysis
    if (successfulTests.length > 0) {
      console.log(`\n🔍 Quality Analysis:`);
      
      const avgMembers = successfulTests.reduce((sum, test) => sum + (test.buyerGroup?.length || 0), 0) / successfulTests.length;
      const avgCohesion = successfulTests.reduce((sum, test) => sum + (test.cohesion?.score || 0), 0) / successfulTests.length;
      const avgProcessingTime = successfulTests.reduce((sum, test) => sum + test.processingTime, 0) / successfulTests.length;
      const totalCost = successfulTests.reduce((sum, test) => sum + (test.costs?.total || 0), 0);

      console.log(`   Average Buyer Group Size: ${Math.round(avgMembers)} members`);
      console.log(`   Average Cohesion Score: ${Math.round(avgCohesion)}%`);
      console.log(`   Average Processing Time: ${Math.round(avgProcessingTime)}ms`);
      console.log(`   Total Cost: $${totalCost.toFixed(2)}`);

      // Check for Customer Success exclusion
      const customerSuccessMembers = successfulTests.flatMap(test => 
        test.buyerGroup?.filter(member => 
          member.department?.toLowerCase().includes('customer success') && 
          !member.title?.toLowerCase().includes('sales')
        ) || []
      );

      if (customerSuccessMembers.length === 0) {
        console.log(`   ✅ Customer Success Exclusion: Working correctly`);
      } else {
        console.log(`   ⚠️ Customer Success Exclusion: Found ${customerSuccessMembers.length} non-sales Customer Success members`);
      }
    }

    // Manual Validation Instructions
    console.log(`\n📋 Manual Validation Required:`);
    console.log(`   1. Check LinkedIn profiles of decision makers for each company`);
    console.log(`   2. Verify they're in sales/revenue roles`);
    console.log(`   3. Confirm no Customer Success unless managing sales`);
    console.log(`   4. Validate company associations in database`);
    console.log(`   5. Check People records have correct buyer group flags`);

    // Database Verification
    console.log(`\n🗄️ Database Verification:`);
    try {
      const buyerGroups = await this.prisma.buyerGroups.findMany({
        where: { workspaceId: 'adrata-workspace-id' },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      console.log(`   Recent Buyer Groups: ${buyerGroups.length}`);
      buyerGroups.forEach(bg => {
        console.log(`   - ${bg.companyName}: ${bg.totalMembers} members, ${bg.cohesionScore}% cohesion`);
      });

      const peopleRecords = await this.prisma.people.findMany({
        where: { 
          workspaceId: 'adrata-workspace-id',
          isBuyerGroupMember: true
        },
        take: 10
      });

      console.log(`   People Records with Buyer Group Flags: ${peopleRecords.length}`);
      peopleRecords.forEach(person => {
        console.log(`   - ${person.fullName}: ${person.buyerGroupRole} at ${person.companyId ? 'Linked Company' : 'No Company'}`);
      });

    } catch (error) {
      console.log(`   ⚠️ Database verification failed: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Comprehensive testing completed!');
    console.log('='.repeat(80));

    // Save comprehensive report
    const reportData = {
      summary: {
        totalTests: this.results.length,
        successful: successfulTests.length,
        failed: failedTests.length,
        successRate: Math.round((successfulTests.length / this.results.length) * 100),
        totalTime: totalTime,
        timestamp: new Date().toISOString()
      },
      results: this.results,
      qualityAnalysis: successfulTests.length > 0 ? {
        avgMembers: Math.round(avgMembers),
        avgCohesion: Math.round(avgCohesion),
        avgProcessingTime: Math.round(avgProcessingTime),
        totalCost: totalCost
      } : null
    };

    const reportFilename = `comprehensive-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const reportFilepath = path.join(__dirname, 'buyer-group-results', reportFilename);
    fs.writeFileSync(reportFilepath, JSON.stringify(reportData, null, 2));
    console.log(`\n💾 Comprehensive report saved to: ${reportFilename}`);
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Run the tests
async function main() {
  const tester = new ComprehensiveTester();
  
  try {
    await tester.runTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { ComprehensiveTester };
