#!/usr/bin/env node

/**
 * 🧪 TEST UNIFIED ENRICHMENT SYSTEM WITH TOP
 * 
 * Comprehensive testing of the new unified system using TOP as the test case
 * This validates the entire system before broader rollout
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

// TOP workspace configuration
const TOP_CONFIG = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
  userId: 'dan@adrata.com',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

class UnifiedSystemTester {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: []
    };
  }
  
  async runComprehensiveTest() {
    console.log('🧪 TESTING UNIFIED ENRICHMENT SYSTEM WITH TOP');
    console.log('=============================================');
    console.log(`📊 Workspace: ${TOP_CONFIG.workspaceId}`);
    console.log(`👤 User: ${TOP_CONFIG.userId}`);
    console.log('');
    
    try {
      // Test 1: System Health Check
      await this.testSystemHealth();
      
      // Test 2: Buyer Group Generation
      await this.testBuyerGroupGeneration();
      
      // Test 3: People Search and Enrichment
      await this.testPeopleSearchEnrichment();
      
      // Test 4: Company Research
      await this.testCompanyResearch();
      
      // Test 5: Contact Enrichment
      await this.testContactEnrichment();
      
      // Test 6: Full Company Enrichment
      await this.testFullCompanyEnrichment();
      
      // Test 7: Performance and Parallel Processing
      await this.testPerformanceAndParallelism();
      
      // Print final test results
      this.printTestSummary();
      
      return this.testResults;
      
    } catch (error) {
      console.error('💥 Comprehensive test failed:', error);
      throw error;
    }
  }
  
  async testSystemHealth() {
    console.log('🏥 TEST 1: System Health Check');
    console.log('-'.repeat(30));
    
    try {
      const response = await this.callUnifiedAPI('GET', '?operation=health');
      
      if (response.status === 'healthy') {
        console.log('✅ System health: HEALTHY');
        console.log(`  - Database: ${response.checks.database ? '✅' : '❌'}`);
        console.log(`  - CoreSignal: ${response.checks.coreSignal ? '✅' : '❌'}`);
        console.log(`  - Hunter.io: ${response.checks.hunter ? '✅' : '❌'}`);
        console.log(`  - Prospeo: ${response.checks.prospeo ? '✅' : '❌'}`);
        console.log(`  - Perplexity: ${response.checks.perplexity ? '✅' : '❌'}`);
        this.recordTestPass('System Health');
      } else {
        throw new Error(`System unhealthy: ${JSON.stringify(response.checks)}`);
      }
      
    } catch (error) {
      this.recordTestFail('System Health', error.message);
    }
  }
  
  async testBuyerGroupGeneration() {
    console.log('\n🎯 TEST 2: Buyer Group Generation');
    console.log('-'.repeat(35));
    
    try {
      // Get a TOP company for testing
      const testCompany = await this.getTOPTestCompany();
      
      if (!testCompany) {
        throw new Error('No suitable TOP company found for testing');
      }
      
      console.log(`  Testing with: ${testCompany.name}`);
      
      const request = {
        operation: 'buyer_group',
        target: {
          companyId: testCompany.id,
          companyName: testCompany.name
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: true,
          includeIndustryIntel: true,
          includeCompetitorAnalysis: false,
          urgencyLevel: 'batch'
        }
      };
      
      const startTime = Date.now();
      const response = await this.callUnifiedAPI('POST', '', request);
      const duration = Date.now() - startTime;
      
      if (response.success) {
        console.log('✅ Buyer group generation: SUCCESS');
        console.log(`  - Processing time: ${Math.round(duration/1000)}s`);
        console.log(`  - Buyer group members: ${response.results.buyerGroup?.totalMembers || 0}`);
        console.log(`  - New people added: ${response.results.newPeople || 0}`);
        console.log(`  - Existing people enriched: ${response.results.enrichedPeople || 0}`);
        console.log(`  - Confidence: ${response.quality.roleConfidence}%`);
        console.log(`  - Cost: $${response.metadata.totalCost?.toFixed(2) || '0.00'}`);
        
        // Validate results
        if (response.quality.roleConfidence >= 70) {
          this.recordTestPass('Buyer Group Generation');
        } else {
          throw new Error(`Low confidence: ${response.quality.roleConfidence}%`);
        }
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Buyer Group Generation', error.message);
    }
  }
  
  async testPeopleSearchEnrichment() {
    console.log('\n🔍 TEST 3: People Search and Enrichment');
    console.log('-'.repeat(40));
    
    try {
      const request = {
        operation: 'people_search',
        target: {
          searchCriteria: {
            titles: ['CEO', 'CTO', 'VP Engineering'],
            companies: ['TOP Engineering Plus'],
            locations: ['US']
          }
        },
        options: {
          depth: 'thorough',
          includeBuyerGroup: false,
          includeIndustryIntel: false,
          urgencyLevel: 'batch'
        }
      };
      
      const startTime = Date.now();
      const response = await this.callUnifiedAPI('POST', '', request);
      const duration = Date.now() - startTime;
      
      if (response.success) {
        console.log('✅ People search: SUCCESS');
        console.log(`  - Processing time: ${Math.round(duration/1000)}s`);
        console.log(`  - People found: ${response.results.totalFound || 0}`);
        console.log(`  - Successfully enriched: ${response.results.successfullyEnriched || 0}`);
        console.log(`  - Email accuracy: ${response.quality.emailAccuracy}%`);
        console.log(`  - Phone accuracy: ${response.quality.phoneAccuracy}%`);
        
        this.recordTestPass('People Search');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('People Search', error.message);
    }
  }
  
  async testCompanyResearch() {
    console.log('\n🏢 TEST 4: Company Research');
    console.log('-'.repeat(30));
    
    try {
      const testCompany = await this.getTOPTestCompany();
      
      const request = {
        operation: 'company_research',
        target: {
          companyId: testCompany.id,
          companyName: testCompany.name
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: false,
          includeIndustryIntel: true,
          includeCompetitorAnalysis: true,
          urgencyLevel: 'batch'
        }
      };
      
      const startTime = Date.now();
      const response = await this.callUnifiedAPI('POST', '', request);
      const duration = Date.now() - startTime;
      
      if (response.success) {
        console.log('✅ Company research: SUCCESS');
        console.log(`  - Processing time: ${Math.round(duration/1000)}s`);
        console.log(`  - Intelligence gathered: ${response.results.intelligence ? '✅' : '❌'}`);
        console.log(`  - Competitors analyzed: ${response.results.competitors?.length || 0}`);
        console.log(`  - Industry intel: ${response.results.industry ? '✅' : '❌'}`);
        console.log(`  - Recent news: ${response.results.recentNews || 0} items`);
        
        this.recordTestPass('Company Research');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Company Research', error.message);
    }
  }
  
  async testContactEnrichment() {
    console.log('\n📞 TEST 5: Contact Enrichment');
    console.log('-'.repeat(32));
    
    try {
      // Get a TOP person for testing
      const testPerson = await this.getTOPTestPerson();
      
      if (!testPerson) {
        throw new Error('No suitable TOP person found for testing');
      }
      
      console.log(`  Testing with: ${testPerson.fullName}`);
      
      const request = {
        operation: 'contact_enrichment',
        target: {
          personId: testPerson.id
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: false,
          includeIndustryIntel: false,
          urgencyLevel: 'realtime'
        }
      };
      
      const startTime = Date.now();
      const response = await this.callUnifiedAPI('POST', '', request);
      const duration = Date.now() - startTime;
      
      if (response.success) {
        console.log('✅ Contact enrichment: SUCCESS');
        console.log(`  - Processing time: ${Math.round(duration/1000)}s`);
        console.log(`  - Email enriched: ${response.results.enrichment?.email ? '✅' : '❌'}`);
        console.log(`  - Phone enriched: ${response.results.enrichment?.phone ? '✅' : '❌'}`);
        console.log(`  - Social profiles: ${response.results.enrichment?.social ? '✅' : '❌'}`);
        console.log(`  - Perplexity validated: ${response.results.validation ? '✅' : '❌'}`);
        console.log(`  - Quality score: ${response.quality.overallScore}%`);
        
        this.recordTestPass('Contact Enrichment');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Contact Enrichment', error.message);
    }
  }
  
  async testFullCompanyEnrichment() {
    console.log('\n🚀 TEST 6: Full Company Enrichment');
    console.log('-'.repeat(37));
    
    try {
      const testCompany = await this.getTOPTestCompany();
      
      const request = {
        operation: 'full_enrichment',
        target: {
          companyId: testCompany.id,
          companyName: testCompany.name
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: true,
          includeIndustryIntel: true,
          includeCompetitorAnalysis: true,
          urgencyLevel: 'batch'
        }
      };
      
      const startTime = Date.now();
      const response = await this.callUnifiedAPI('POST', '', request);
      const duration = Date.now() - startTime;
      
      if (response.success) {
        console.log('✅ Full enrichment: SUCCESS');
        console.log(`  - Processing time: ${Math.round(duration/1000)}s`);
        console.log(`  - Buyer groups: ${response.results.buyerGroups ? '✅' : '❌'}`);
        console.log(`  - Company research: ${response.results.companyResearch ? '✅' : '❌'}`);
        console.log(`  - People enrichment: ${response.results.peopleEnrichment ? '✅' : '❌'}`);
        console.log(`  - Completeness: ${response.results.completeness}%`);
        console.log(`  - Overall quality: ${response.quality.overallScore}%`);
        
        this.recordTestPass('Full Company Enrichment');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Full Company Enrichment', error.message);
    }
  }
  
  async testPerformanceAndParallelism() {
    console.log('\n⚡ TEST 7: Performance and Parallelism');
    console.log('-'.repeat(40));
    
    try {
      // Get multiple TOP companies for parallel testing
      const testCompanies = await prisma.companies.findMany({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      });
      
      if (testCompanies.length < 3) {
        throw new Error('Need at least 3 companies for parallel testing');
      }
      
      console.log(`  Testing parallel processing with ${testCompanies.length} companies`);
      
      // Test parallel buyer group generation
      const startTime = Date.now();
      
      const parallelRequests = testCompanies.map(company => ({
        operation: 'buyer_group',
        target: {
          companyId: company.id,
          companyName: company.name
        },
        options: {
          depth: 'quick',
          includeBuyerGroup: true,
          includeIndustryIntel: false,
          urgencyLevel: 'batch'
        }
      }));
      
      // Execute all requests in parallel
      const parallelPromises = parallelRequests.map(request => 
        this.callUnifiedAPI('POST', '', request)
      );
      
      const parallelResults = await Promise.allSettled(parallelPromises);
      const duration = Date.now() - startTime;
      
      // Analyze results
      const successful = parallelResults.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = parallelResults.filter(r => r.status === 'rejected' || !r.value?.success);
      
      console.log('✅ Parallel processing: SUCCESS');
      console.log(`  - Total processing time: ${Math.round(duration/1000)}s`);
      console.log(`  - Average per company: ${Math.round(duration/testCompanies.length/1000)}s`);
      console.log(`  - Success rate: ${successful.length}/${testCompanies.length} (${Math.round(successful.length/testCompanies.length*100)}%)`);
      console.log(`  - Parallel efficiency: ${successful.length > 0 ? 'EXCELLENT' : 'NEEDS WORK'}`);
      
      if (successful.length >= testCompanies.length * 0.8) {
        this.recordTestPass('Performance and Parallelism');
      } else {
        throw new Error(`Low success rate: ${successful.length}/${testCompanies.length}`);
      }
      
    } catch (error) {
      this.recordTestFail('Performance and Parallelism', error.message);
    }
  }
  
  async callUnifiedAPI(method, endpoint = '', body = null) {
    const url = `${TOP_CONFIG.baseUrl}/api/enrichment/unified${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    // Add workspace context for development
    if (endpoint && !endpoint.includes('workspaceId')) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint += `${separator}workspaceId=${TOP_CONFIG.workspaceId}&userId=${TOP_CONFIG.userId}`;
      options.url = `${TOP_CONFIG.baseUrl}/api/enrichment/unified${endpoint}`;
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async getTOPTestCompany() {
    return await prisma.companies.findFirst({
      where: {
        workspaceId: TOP_CONFIG.workspaceId,
        deletedAt: null,
        name: { not: null },
        website: { not: null }
      },
      include: {
        people: true,
        buyer_groups: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  async getTOPTestPerson() {
    return await prisma.people.findFirst({
      where: {
        workspaceId: TOP_CONFIG.workspaceId,
        deletedAt: null,
        email: { not: null },
        fullName: { not: null }
      },
      include: {
        company: true,
        buyerGroups: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  recordTestPass(testName) {
    this.testResults.totalTests++;
    this.testResults.passedTests++;
    console.log(`✅ ${testName}: PASSED`);
  }
  
  recordTestFail(testName, error) {
    this.testResults.totalTests++;
    this.testResults.failedTests++;
    this.testResults.errors.push({ test: testName, error });
    console.log(`❌ ${testName}: FAILED - ${error}`);
  }
  
  printTestSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(20));
    console.log(`✅ Passed: ${this.testResults.passedTests}/${this.testResults.totalTests}`);
    console.log(`❌ Failed: ${this.testResults.failedTests}/${this.testResults.totalTests}`);
    console.log(`📈 Success Rate: ${Math.round(this.testResults.passedTests/this.testResults.totalTests*100)}%`);
    
    if (this.testResults.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.testResults.passedTests === this.testResults.totalTests) {
      console.log('✅ All tests passed - Unified system ready for production!');
      console.log('💡 Proceed with archiving old systems and full rollout');
    } else if (this.testResults.passedTests >= this.testResults.totalTests * 0.8) {
      console.log('⚠️ Most tests passed - Address failed tests before production');
      console.log('🔧 Review errors above and fix issues');
    } else {
      console.log('❌ Multiple test failures - System needs debugging');
      console.log('🔧 Address critical issues before proceeding');
    }
  }
}

// Main execution
async function main() {
  try {
    const tester = new UnifiedSystemTester();
    const results = await tester.runComprehensiveTest();
    
    console.log('\n🎯 Next Steps:');
    if (results.passedTests === results.totalTests) {
      console.log('1. Archive old systems: node scripts/archive-old-enrichment-systems.js');
      console.log('2. Deploy unified system to production');
      console.log('3. Update all client integrations to use unified API');
      console.log('4. Monitor performance and optimize as needed');
    } else {
      console.log('1. Fix failed tests and re-run validation');
      console.log('2. Debug issues with API keys, database, or configuration');
      console.log('3. Re-test before proceeding to archival');
    }
    
    process.exit(results.passedTests === results.totalTests ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Testing failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { UnifiedSystemTester, TOP_CONFIG };
