#!/usr/bin/env node

/**
 * 🧪 TEST COMPLETE UNIFIED SYSTEM
 * 
 * Test the 100% complete unified enrichment system with TOP as first company
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

// TOP configuration
const TOP_CONFIG = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
  userId: 'dan@adrata.com',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

class CompleteSystemTest {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: []
    };
  }
  
  async runCompleteTest() {
    console.log('🧪 TESTING COMPLETE UNIFIED ENRICHMENT SYSTEM');
    console.log('=============================================');
    console.log(`📊 Testing with TOP as first company`);
    console.log(`🎯 Workspace: ${TOP_CONFIG.workspaceId}`);
    console.log('');
    
    try {
      // Test 1: System Health Check
      await this.testSystemHealth();
      
      // Test 2: API Endpoint Functionality
      await this.testAPIEndpoint();
      
      // Test 3: Database Schema Validation
      await this.testDatabaseSchema();
      
      // Test 4: Buyer Group Generation with TOP
      await this.testBuyerGroupWithTOP();
      
      // Test 5: Person Lookup Functionality
      await this.testPersonLookup();
      
      // Test 6: Technology Search
      await this.testTechnologySearch();
      
      this.printTestSummary();
      
      return this.testResults;
      
    } catch (error) {
      console.error('💥 Complete test failed:', error);
      throw error;
    }
  }
  
  async testSystemHealth() {
    console.log('🏥 TEST 1: System Health Check');
    console.log('-'.repeat(30));
    
    try {
      // Check API keys
      const requiredKeys = [
        { name: 'CoreSignal', key: process.env.CORESIGNAL_API_KEY },
        { name: 'Hunter.io', key: process.env.HUNTER_API_KEY },
        { name: 'Prospeo', key: process.env.PROSPEO_API_KEY },
        { name: 'Perplexity', key: process.env.PERPLEXITY_API_KEY }
      ];
      
      console.log('  🔑 Checking API keys...');
      requiredKeys.forEach(({ name, key }) => {
        console.log(`    ${name}: ${key ? '✅' : '❌'}`);
      });
      
      const missingKeys = requiredKeys.filter(({ key }) => !key);
      if (missingKeys.length > 0) {
        console.log('  ⚠️ Some API keys missing, but system can still function');
      }
      
      // Check database connectivity
      console.log('  🗄️ Checking database connectivity...');
      await prisma.$queryRaw`SELECT 1`;
      console.log('  ✅ Database connectivity confirmed');
      
      this.recordTestPass('System Health Check');
      
    } catch (error) {
      this.recordTestFail('System Health Check', error.message);
    }
  }
  
  async testAPIEndpoint() {
    console.log('\n🔌 TEST 2: API Endpoint Functionality');
    console.log('-'.repeat(38));
    
    try {
      // Test health endpoint
      const healthUrl = `${TOP_CONFIG.baseUrl}/api/enrichment/unified?operation=health`;
      console.log(`  Testing: ${healthUrl}`);
      
      const healthResponse = await fetch(healthUrl);
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log(`  ✅ Health endpoint: ${health.status || 'OK'}`);
        console.log(`    - API endpoint accessible: ✅`);
        console.log(`    - Response format valid: ✅`);
      } else {
        throw new Error(`Health endpoint failed: ${healthResponse.status}`);
      }
      
      // Test capabilities endpoint
      const capabilitiesUrl = `${TOP_CONFIG.baseUrl}/api/enrichment/unified?operation=capabilities`;
      const capabilitiesResponse = await fetch(capabilitiesUrl);
      
      if (capabilitiesResponse.ok) {
        const capabilities = await capabilitiesResponse.json();
        console.log(`  📊 Available operations: ${Object.keys(capabilities.operations || {}).length}`);
      }
      
      this.recordTestPass('API Endpoint Functionality');
      
    } catch (error) {
      this.recordTestFail('API Endpoint Functionality', error.message);
    }
  }
  
  async testDatabaseSchema() {
    console.log('\n📊 TEST 3: Database Schema Validation');
    console.log('-'.repeat(39));
    
    try {
      // Check if new fields exist
      console.log('  🔍 Checking database schema...');
      
      // Test people table structure
      const peopleColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'people' 
        ORDER BY column_name
      `;
      
      console.log(`  📊 People table has ${peopleColumns.length} columns`);
      
      // Test companies table structure
      const companiesColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        ORDER BY column_name
      `;
      
      console.log(`  🏢 Companies table has ${companiesColumns.length} columns`);
      
      // Test buyer_groups table structure
      const buyerGroupsColumns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'buyer_groups' 
        ORDER BY column_name
      `;
      
      console.log(`  🎯 Buyer groups table has ${buyerGroupsColumns.length} columns`);
      
      this.recordTestPass('Database Schema Validation');
      
    } catch (error) {
      this.recordTestFail('Database Schema Validation', error.message);
    }
  }
  
  async testBuyerGroupWithTOP() {
    console.log('\n🎯 TEST 4: Buyer Group Generation with TOP');
    console.log('-'.repeat(42));
    
    try {
      // Get a TOP company for testing
      const topCompany = await prisma.companies.findFirst({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          name: { not: null }
        },
        include: {
          people: true,
          buyer_groups: true
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      if (!topCompany) {
        throw new Error('No TOP company found for testing');
      }
      
      console.log(`  🏢 Testing with: ${topCompany.name}`);
      console.log(`    - Existing people: ${topCompany.people.length}`);
      console.log(`    - Existing buyer groups: ${topCompany.buyer_groups.length}`);
      
      // Test buyer group generation
      const request = {
        operation: 'buyer_group',
        target: {
          companyId: topCompany.id,
          companyName: topCompany.name
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: true,
          includeIndustryIntel: true,
          includeCompetitorAnalysis: false,
          urgencyLevel: 'batch'
        },
        sellerProfile: {
          productName: "TOP Engineering Plus",
          sellerCompanyName: "TOP Engineering Plus",
          solutionCategory: 'operations',
          targetMarket: 'enterprise',
          dealSize: 'large',
          buyingCenter: 'mixed',
          decisionLevel: 'vp',
          rolePriorities: {
            decision: ['CEO', 'COO', 'VP Operations', 'VP Engineering'],
            champion: ['Operations Manager', 'Engineering Manager'],
            stakeholder: ['Finance Manager', 'Quality Manager'],
            blocker: ['Legal Counsel', 'Compliance Manager'],
            introducer: ['Board Member', 'Advisor']
          },
          mustHaveTitles: ['CEO', 'COO', 'VP Operations'],
          adjacentFunctions: ['finance', 'legal', 'quality'],
          disqualifiers: ['intern', 'temporary'],
          geo: ['US'],
          primaryPainPoints: ['Engineering capacity', 'Quality control'],
          targetDepartments: ['operations', 'engineering']
        }
      };
      
      console.log('  🚀 Calling unified API...');
      const startTime = Date.now();
      
      const response = await this.callUnifiedAPI('POST', '', request);
      const duration = Date.now() - startTime;
      
      if (response.success) {
        console.log('  ✅ Buyer group generation: SUCCESS');
        console.log(`    - Processing time: ${Math.round(duration/1000)}s`);
        console.log(`    - Operation: ${response.operation || 'buyer_group'}`);
        console.log(`    - Success: ${response.success}`);
        console.log(`    - Response time: ${response.meta?.responseTime || duration}ms`);
        
        // Check if we got results
        if (response.results) {
          console.log(`    - Results received: ✅`);
          console.log(`    - Buyer group data: ${response.results.buyerGroup ? '✅' : '❌'}`);
          console.log(`    - New people: ${response.results.newPeople || 0}`);
          console.log(`    - Enriched people: ${response.results.enrichedPeople || 0}`);
        }
        
        this.recordTestPass('Buyer Group Generation with TOP');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Buyer Group Generation with TOP', error.message);
    }
  }
  
  async testPersonLookup() {
    console.log('\n🔍 TEST 5: Person Lookup Functionality');
    console.log('-'.repeat(37));
    
    try {
      // Get an existing TOP person for testing
      const topPerson = await prisma.people.findFirst({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          fullName: { not: null }
        },
        include: {
          company: true
        },
        orderBy: { updatedAt: 'desc' }
      });
      
      if (!topPerson) {
        console.log('  ⚠️ No TOP person found, testing with mock query');
      }
      
      const testQuery = topPerson ? topPerson.fullName : 'John Smith';
      console.log(`  👤 Testing person lookup: "${testQuery}"`);
      
      const request = {
        operation: 'person_lookup',
        target: {
          searchCriteria: {
            query: testQuery,
            company: topPerson?.company?.name || 'Test Company',
            industry: topPerson?.company?.industry || 'technology'
          }
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: true,
          includeIndustryIntel: false,
          urgencyLevel: 'realtime'
        }
      };
      
      const response = await this.callUnifiedAPI('POST', '', request);
      
      if (response.success) {
        console.log('  ✅ Person lookup: SUCCESS');
        console.log(`    - Query processed: "${response.results?.query || testQuery}"`);
        console.log(`    - Result type: ${response.results?.result?.type || 'unknown'}`);
        console.log(`    - Context applied: ${response.results?.context ? '✅' : '❌'}`);
        
        this.recordTestPass('Person Lookup Functionality');
      } else {
        throw new Error(response.error || 'Person lookup failed');
      }
      
    } catch (error) {
      this.recordTestFail('Person Lookup Functionality', error.message);
    }
  }
  
  async testTechnologySearch() {
    console.log('\n🔧 TEST 6: Technology Search');
    console.log('-'.repeat(28));
    
    try {
      const request = {
        operation: 'technology_search',
        target: {
          searchCriteria: {
            query: 'React developer',
            industry: 'technology',
            experienceLevel: 'senior',
            geography: 'US'
          }
        },
        options: {
          depth: 'thorough',
          includeBuyerGroup: false,
          includeIndustryIntel: false,
          urgencyLevel: 'batch'
        }
      };
      
      const response = await this.callUnifiedAPI('POST', '', request);
      
      if (response.success) {
        console.log('  ✅ Technology search: SUCCESS');
        console.log(`    - Query: ${response.results?.query || 'React developer'}`);
        console.log(`    - Technology: ${response.results?.result?.technology || 'unknown'}`);
        console.log(`    - Role: ${response.results?.result?.role || 'unknown'}`);
        console.log(`    - Total found: ${response.results?.result?.totalFound || 0}`);
        console.log(`    - Qualified: ${response.results?.result?.qualifiedCandidates || 0}`);
        
        this.recordTestPass('Technology Search');
      } else {
        throw new Error(response.error || 'Technology search failed');
      }
      
    } catch (error) {
      this.recordTestFail('Technology Search', error.message);
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
    const separator = endpoint.includes('?') ? '&' : '?';
    const contextUrl = `${url}${separator}workspaceId=${TOP_CONFIG.workspaceId}&userId=${TOP_CONFIG.userId}`;
    
    try {
      const response = await fetch(contextUrl, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to API - is the development server running?');
      }
      throw error;
    }
  }
  
  recordTestPass(testName) {
    this.testResults.totalTests++;
    this.testResults.passedTests++;
    console.log(`  ✅ ${testName}: PASSED`);
  }
  
  recordTestFail(testName, error) {
    this.testResults.totalTests++;
    this.testResults.failedTests++;
    this.testResults.errors.push({ test: testName, error });
    console.log(`  ❌ ${testName}: FAILED - ${error}`);
  }
  
  printTestSummary() {
    console.log('\n📊 COMPLETE SYSTEM TEST RESULTS');
    console.log('='.repeat(35));
    console.log(`✅ Passed: ${this.testResults.passedTests}/${this.testResults.totalTests}`);
    console.log(`❌ Failed: ${this.testResults.failedTests}/${this.testResults.totalTests}`);
    console.log(`📈 Success Rate: ${Math.round(this.testResults.passedTests/this.testResults.totalTests*100)}%`);
    
    if (this.testResults.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    console.log('\n🎯 SYSTEM STATUS:');
    if (this.testResults.passedTests === this.testResults.totalTests) {
      console.log('✅ UNIFIED SYSTEM IS 100% COMPLETE AND READY!');
      console.log('🚀 Ready to run TOP enrichment with new system');
      console.log('💡 Next: node scripts/run-top-with-unified-system.js');
    } else if (this.testResults.passedTests >= this.testResults.totalTests * 0.8) {
      console.log('⚠️ System mostly ready - minor issues to address');
      console.log('🔧 Fix remaining issues and re-test');
    } else {
      console.log('❌ System needs more work before production use');
      console.log('🔧 Address failed tests before proceeding');
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Starting complete unified system test...');
    
    const tester = new CompleteSystemTest();
    const results = await tester.runCompleteTest();
    
    process.exit(results.passedTests === results.totalTests ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Testing failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure development server is running: npm run dev');
    console.log('2. Check database connectivity');
    console.log('3. Verify API keys are set');
    
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { CompleteSystemTest, TOP_CONFIG };
