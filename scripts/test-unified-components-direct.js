#!/usr/bin/env node

/**
 * 🧪 TEST UNIFIED COMPONENTS DIRECTLY
 * 
 * Direct testing of unified system components to validate functionality
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP configuration
const TOP_CONFIG = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  userId: 'dan@adrata.com'
};

class DirectComponentTests {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: []
    };
  }
  
  async runDirectTests() {
    console.log('🧪 TESTING UNIFIED SYSTEM COMPONENTS DIRECTLY');
    console.log('============================================');
    console.log(`📊 Direct component testing for validation`);
    console.log('');
    
    try {
      // Test 1: Import Unified System
      await this.testUnifiedSystemImport();
      
      // Test 2: Create System Instance
      await this.testSystemInstantiation();
      
      // Test 3: Test Database Connectivity
      await this.testDatabaseConnectivity();
      
      // Test 4: Test Buyer Group Generation Logic
      await this.testBuyerGroupLogic();
      
      // Test 5: Test Person Lookup Logic
      await this.testPersonLookupLogic();
      
      this.printTestSummary();
      
      return this.testResults;
      
    } catch (error) {
      console.error('💥 Direct component testing failed:', error);
      throw error;
    }
  }
  
  async testUnifiedSystemImport() {
    console.log('📦 TEST 1: Import Unified System');
    console.log('-'.repeat(32));
    
    try {
      console.log('  📁 Importing UnifiedEnrichmentFactory...');
      
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      
      console.log('  ✅ Import successful');
      console.log(`    - Factory available: ${typeof UnifiedEnrichmentFactory === 'function' ? '✅' : '❌'}`);
      console.log(`    - createForTOP method: ${typeof UnifiedEnrichmentFactory.createForTOP === 'function' ? '✅' : '❌'}`);
      console.log(`    - createForWorkspace method: ${typeof UnifiedEnrichmentFactory.createForWorkspace === 'function' ? '✅' : '❌'}`);
      
      this.recordTestPass('Import Unified System');
      
    } catch (error) {
      this.recordTestFail('Import Unified System', error.message);
    }
  }
  
  async testSystemInstantiation() {
    console.log('\n🏭 TEST 2: Create System Instance');
    console.log('-'.repeat(33));
    
    try {
      console.log('  🔧 Creating unified system instance...');
      
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      
      // Create instance for TOP
      const unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
      
      console.log('  ✅ Instance creation successful');
      console.log(`    - System object: ${typeof unifiedSystem === 'object' ? '✅' : '❌'}`);
      console.log(`    - Enrich method: ${typeof unifiedSystem.enrich === 'function' ? '✅' : '❌'}`);
      console.log(`    - GetSystemStats method: ${typeof unifiedSystem.getSystemStats === 'function' ? '✅' : '❌'}`);
      
      // Test system stats
      const stats = unifiedSystem.getSystemStats();
      console.log(`    - Stats accessible: ✅`);
      console.log(`      Total requests: ${stats.totalRequests}`);
      console.log(`      Success rate: ${stats.successRate}%`);
      
      this.recordTestPass('Create System Instance');
      
    } catch (error) {
      this.recordTestFail('Create System Instance', error.message);
    }
  }
  
  async testDatabaseConnectivity() {
    console.log('\n🗄️ TEST 3: Database Connectivity');
    console.log('-'.repeat(32));
    
    try {
      console.log('  🔌 Testing database connection...');
      
      await prisma.$connect();
      console.log('    ✅ Database connected');
      
      // Test basic queries
      console.log('  📊 Testing basic queries...');
      
      const companyCount = await prisma.companies.count({
        where: { workspaceId: TOP_CONFIG.workspaceId, deletedAt: null }
      });
      console.log(`    - TOP companies: ${companyCount}`);
      
      const peopleCount = await prisma.people.count({
        where: { workspaceId: TOP_CONFIG.workspaceId, deletedAt: null }
      });
      console.log(`    - TOP people: ${peopleCount}`);
      
      const buyerGroupCount = await prisma.buyer_groups.count({
        where: { workspaceId: TOP_CONFIG.workspaceId, deletedAt: null }
      });
      console.log(`    - TOP buyer groups: ${buyerGroupCount}`);
      
      if (companyCount > 0) {
        console.log('  ✅ TOP data available for testing');
        this.recordTestPass('Database Connectivity');
      } else {
        throw new Error('No TOP companies found - check workspace ID');
      }
      
    } catch (error) {
      this.recordTestFail('Database Connectivity', error.message);
    }
  }
  
  async testBuyerGroupLogic() {
    console.log('\n🎯 TEST 4: Buyer Group Generation Logic');
    console.log('-'.repeat(40));
    
    try {
      console.log('  🏢 Testing buyer group generation...');
      
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      const unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
      
      // Get a TOP company for testing
      const topCompany = await prisma.companies.findFirst({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null
        }
      });
      
      if (!topCompany) {
        throw new Error('No TOP company found for buyer group testing');
      }
      
      console.log(`    - Test company: ${topCompany.name}`);
      
      // Create buyer group request
      const request = {
        operation: 'buyer_group',
        target: {
          companyId: topCompany.id,
          companyName: topCompany.name
        },
        options: {
          depth: 'quick',
          includeBuyerGroup: true,
          includeIndustryIntel: false,
          urgencyLevel: 'batch'
        },
        sellerProfile: {
          productName: "TOP Engineering Plus",
          sellerCompanyName: "TOP Engineering Plus",
          solutionCategory: 'operations',
          targetMarket: 'enterprise',
          dealSize: 'large',
          buyingCenter: 'executive',
          decisionLevel: 'vp',
          rolePriorities: {
            decision: ['CEO', 'COO'],
            champion: ['Operations Manager'],
            stakeholder: ['Finance Manager'],
            blocker: ['Legal'],
            introducer: ['Advisor']
          },
          mustHaveTitles: ['CEO'],
          adjacentFunctions: ['finance'],
          disqualifiers: ['intern'],
          geo: ['US'],
          primaryPainPoints: ['Efficiency'],
          targetDepartments: ['operations']
        }
      };
      
      console.log('  🚀 Executing buyer group generation...');
      const startTime = Date.now();
      
      const result = await unifiedSystem.enrich(request);
      const duration = Date.now() - startTime;
      
      console.log(`    - Processing time: ${Math.round(duration/1000)}s`);
      console.log(`    - Success: ${result.success ? '✅' : '❌'}`);
      console.log(`    - Operation: ${result.operation || 'buyer_group'}`);
      
      if (result.success) {
        console.log(`    - Results received: ✅`);
        console.log(`    - Metadata present: ${result.metadata ? '✅' : '❌'}`);
        console.log(`    - Quality metrics: ${result.quality ? '✅' : '❌'}`);
        
        this.recordTestPass('Buyer Group Generation Logic');
      } else {
        throw new Error(result.errors?.[0] || 'Buyer group generation failed');
      }
      
    } catch (error) {
      this.recordTestFail('Buyer Group Generation Logic', error.message);
    }
  }
  
  async testPersonLookupLogic() {
    console.log('\n🔍 TEST 5: Person Lookup Logic');
    console.log('-'.repeat(29));
    
    try {
      console.log('  👤 Testing person lookup...');
      
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      const unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
      
      // Get a TOP person for testing
      const topPerson = await prisma.people.findFirst({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          fullName: { not: null }
        },
        include: { company: true }
      });
      
      if (!topPerson) {
        throw new Error('No TOP person found for lookup testing');
      }
      
      console.log(`    - Test person: ${topPerson.fullName}`);
      console.log(`    - Company: ${topPerson.company?.name || 'Unknown'}`);
      
      // Create person lookup request
      const request = {
        operation: 'person_lookup',
        target: {
          searchCriteria: {
            query: topPerson.fullName,
            company: topPerson.company?.name,
            industry: topPerson.company?.industry
          }
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: false,
          includeIndustryIntel: false,
          urgencyLevel: 'realtime'
        }
      };
      
      console.log('  🚀 Executing person lookup...');
      const startTime = Date.now();
      
      const result = await unifiedSystem.enrich(request);
      const duration = Date.now() - startTime;
      
      console.log(`    - Processing time: ${Math.round(duration/1000)}s`);
      console.log(`    - Success: ${result.success ? '✅' : '❌'}`);
      
      if (result.success) {
        console.log(`    - Query processed: ✅`);
        console.log(`    - Context applied: ${result.results?.context ? '✅' : '❌'}`);
        console.log(`    - Result type: ${result.results?.result?.type || 'unknown'}`);
        
        this.recordTestPass('Person Lookup Logic');
      } else {
        throw new Error(result.errors?.[0] || 'Person lookup failed');
      }
      
    } catch (error) {
      this.recordTestFail('Person Lookup Logic', error.message);
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
    console.log('\n📊 DIRECT COMPONENT TEST RESULTS');
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
  }
}

// Main execution
async function main() {
  try {
    const tester = new DirectComponentTests();
    const results = await tester.runDirectTests();
    
    process.exit(results.passedTests === results.totalTests ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Direct component testing failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { DirectComponentTests };
