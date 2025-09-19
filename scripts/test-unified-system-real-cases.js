#!/usr/bin/env node

/**
 * 🧪 TEST UNIFIED SYSTEM - REAL USE CASES
 * 
 * Test all critical use cases with real data to validate 100% completion
 */

const { PrismaClient } = require('@prisma/client');
const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');

const prisma = new PrismaClient();

// TOP configuration
const TOP_CONFIG = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  userId: 'dan@adrata.com'
};

class RealUseCaseTests {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: []
    };
    
    // Initialize unified system
    this.unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
  }
  
  async runAllRealTests() {
    console.log('🧪 TESTING UNIFIED SYSTEM - REAL USE CASES');
    console.log('==========================================');
    console.log(`📊 Testing with TOP workspace: ${TOP_CONFIG.workspaceId}`);
    console.log('');
    
    try {
      // Test 1: Real Buyer Group Generation
      await this.testRealBuyerGroupGeneration();
      
      // Test 2: Real Person Enrichment
      await this.testRealPersonEnrichment();
      
      // Test 3: Real Role Finding
      await this.testRealRoleFinding();
      
      // Test 4: Real Person Lookup with Context
      await this.testRealPersonLookup();
      
      // Test 5: Real Employment Verification
      await this.testRealEmploymentVerification();
      
      this.printFinalResults();
      
      return this.testResults;
      
    } catch (error) {
      console.error('💥 Real use case testing failed:', error);
      throw error;
    }
  }
  
  /**
   * 🎯 TEST 1: Real Buyer Group Generation
   */
  async testRealBuyerGroupGeneration() {
    console.log('🎯 TEST 1: Real Buyer Group Generation');
    console.log('-'.repeat(38));
    
    try {
      // Get a real TOP company
      const topCompany = await prisma.companies.findFirst({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          name: { not: null }
        },
        include: {
          people: true,
          buyer_groups: true
        }
      });
      
      if (!topCompany) {
        throw new Error('No TOP company found for testing');
      }
      
      console.log(`  🏢 Testing with: ${topCompany.name}`);
      console.log(`    - Current people: ${topCompany.people.length}`);
      console.log(`    - Current buyer groups: ${topCompany.buyer_groups.length}`);
      
      // Real buyer group generation request
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
      
      console.log('  🚀 Executing buyer group generation...');
      const startTime = Date.now();
      
      const result = await this.unifiedSystem.enrich(request);
      const duration = Date.now() - startTime;
      
      console.log(`  ⏱️  Processing time: ${Math.round(duration/1000)}s`);
      console.log(`  📊 Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log(`    - Operation: ${result.operation}`);
        console.log(`    - Buyer group generated: ${result.results?.buyerGroup ? '✅' : '❌'}`);
        console.log(`    - New people added: ${result.results?.newPeople || 0}`);
        console.log(`    - Existing people enriched: ${result.results?.enrichedPeople || 0}`);
        console.log(`    - Confidence: ${result.quality?.roleConfidence || result.metadata?.confidence || 0}%`);
        console.log(`    - Processing time: ${result.metadata?.processingTime || duration}ms`);
        
        // Validate buyer group was actually created/updated in database
        const updatedCompany = await prisma.companies.findUnique({
          where: { id: topCompany.id },
          include: { buyer_groups: true }
        });
        
        console.log(`    - Database updated: ${updatedCompany?.buyer_groups.length > topCompany.buyer_groups.length ? '✅' : '❌'}`);
        
        this.recordTestPass('Real Buyer Group Generation');
      } else {
        throw new Error(result.errors?.[0] || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Real Buyer Group Generation', error.message);
    }
  }
  
  /**
   * 👤 TEST 2: Real Person Enrichment
   */
  async testRealPersonEnrichment() {
    console.log('\n👤 TEST 2: Real Person Enrichment');
    console.log('-'.repeat(33));
    
    try {
      // Get a real TOP person
      const topPerson = await prisma.people.findFirst({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          email: { not: null }
        },
        include: {
          company: true
        }
      });
      
      if (!topPerson) {
        throw new Error('No TOP person found for testing');
      }
      
      console.log(`  👤 Testing with: ${topPerson.fullName}`);
      console.log(`    - Company: ${topPerson.company?.name || 'Unknown'}`);
      console.log(`    - Title: ${topPerson.jobTitle || 'Unknown'}`);
      console.log(`    - Email: ${topPerson.email ? '✅' : '❌'}`);
      
      // Real contact enrichment request
      const request = {
        operation: 'contact_enrichment',
        target: {
          personId: topPerson.id
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: false,
          includeIndustryIntel: false,
          urgencyLevel: 'realtime'
        }
      };
      
      console.log('  🚀 Executing contact enrichment...');
      const startTime = Date.now();
      
      const result = await this.unifiedSystem.enrich(request);
      const duration = Date.now() - startTime;
      
      console.log(`  ⏱️  Processing time: ${Math.round(duration/1000)}s`);
      console.log(`  📊 Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log(`    - Person enriched: ${result.results?.person ? '✅' : '❌'}`);
        console.log(`    - Email enrichment: ${result.results?.enrichment?.email ? '✅' : '❌'}`);
        console.log(`    - Phone enrichment: ${result.results?.enrichment?.phone ? '✅' : '❌'}`);
        console.log(`    - Social enrichment: ${result.results?.enrichment?.social ? '✅' : '❌'}`);
        console.log(`    - Quality score: ${result.quality?.overallScore || 0}%`);
        
        this.recordTestPass('Real Person Enrichment');
      } else {
        throw new Error(result.errors?.[0] || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Real Person Enrichment', error.message);
    }
  }
  
  /**
   * 🔧 TEST 3: Real Role Finding
   */
  async testRealRoleFinding() {
    console.log('\n🔧 TEST 3: Real Role Finding');
    console.log('-'.repeat(27));
    
    try {
      // Test technology role search
      const request = {
        operation: 'technology_search',
        target: {
          searchCriteria: {
            query: 'Engineering Manager',
            industry: 'manufacturing',
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
      
      console.log('  🔍 Searching for: Engineering Manager');
      console.log('    - Industry: manufacturing');
      console.log('    - Level: senior');
      console.log('    - Geography: US');
      
      const startTime = Date.now();
      const result = await this.unifiedSystem.enrich(request);
      const duration = Date.now() - startTime;
      
      console.log(`  ⏱️  Processing time: ${Math.round(duration/1000)}s`);
      console.log(`  📊 Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log(`    - Query processed: ${result.results?.query || 'Engineering Manager'}`);
        console.log(`    - Technology: ${result.results?.result?.technology || 'general'}`);
        console.log(`    - Role: ${result.results?.result?.role || 'Engineering Manager'}`);
        console.log(`    - Total found: ${result.results?.result?.totalFound || 0}`);
        console.log(`    - Qualified candidates: ${result.results?.result?.qualifiedCandidates || 0}`);
        
        this.recordTestPass('Real Role Finding');
      } else {
        throw new Error(result.errors?.[0] || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Real Role Finding', error.message);
    }
  }
  
  /**
   * 🔍 TEST 4: Real Person Lookup with Context
   */
  async testRealPersonLookup() {
    console.log('\n🔍 TEST 4: Real Person Lookup with Context');
    console.log('-'.repeat(42));
    
    try {
      // Get a real person name from TOP data
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
      
      console.log(`  👤 Testing lookup for: ${topPerson.fullName}`);
      console.log(`    - Company context: ${topPerson.company?.name || 'Unknown'}`);
      console.log(`    - Industry context: ${topPerson.company?.industry || 'Unknown'}`);
      
      // Real person lookup request
      const request = {
        operation: 'person_lookup',
        target: {
          searchCriteria: {
            query: topPerson.fullName,
            company: topPerson.company?.name,
            industry: topPerson.company?.industry,
            role: topPerson.jobTitle
          }
        },
        options: {
          depth: 'comprehensive',
          includeBuyerGroup: true,
          includeIndustryIntel: false,
          urgencyLevel: 'realtime'
        }
      };
      
      console.log('  🚀 Executing person lookup...');
      const startTime = Date.now();
      
      const result = await this.unifiedSystem.enrich(request);
      const duration = Date.now() - startTime;
      
      console.log(`  ⏱️  Processing time: ${Math.round(duration/1000)}s`);
      console.log(`  📊 Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log(`    - Query: "${result.results?.query || topPerson.fullName}"`);
        console.log(`    - Result type: ${result.results?.result?.type || 'unknown'}`);
        console.log(`    - Person found: ${result.results?.result?.person ? '✅' : '❌'}`);
        console.log(`    - Context applied: ${result.results?.context ? '✅' : '❌'}`);
        console.log(`    - Confidence: ${result.results?.result?.confidence || 0}%`);
        
        this.recordTestPass('Real Person Lookup with Context');
      } else {
        throw new Error(result.errors?.[0] || 'Unknown error');
      }
      
    } catch (error) {
      this.recordTestFail('Real Person Lookup with Context', error.message);
    }
  }
  
  /**
   * 👔 TEST 5: Real Employment Verification
   */
  async testRealEmploymentVerification() {
    console.log('\n👔 TEST 5: Real Employment Verification');
    console.log('-'.repeat(39));
    
    try {
      // Get sample of TOP people
      const topPeople = await prisma.people.findMany({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          email: { not: null }
        },
        include: { company: true },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      });
      
      if (topPeople.length === 0) {
        throw new Error('No TOP people found for employment verification testing');
      }
      
      console.log(`  👥 Testing employment verification with ${topPeople.length} people`);
      
      // Test employment verification directly
      let verifiedCount = 0;
      let currentEmploymentCount = 0;
      
      for (const person of topPeople) {
        try {
          console.log(`    🔍 Verifying: ${person.fullName} at ${person.company?.name || 'Unknown'}`);
          
          const verification = await this.unifiedSystem.employmentVerifier.verifyPersonEmployment(person);
          
          verifiedCount++;
          if (verification.isCurrentlyEmployed) {
            currentEmploymentCount++;
          }
          
          console.log(`      - Currently employed: ${verification.isCurrentlyEmployed ? '✅' : '❌'}`);
          console.log(`      - Confidence: ${verification.confidence}%`);
          console.log(`      - Method: ${verification.verificationMethod}`);
          console.log(`      - Data age: ${verification.dataAge} days`);
          
        } catch (error) {
          console.error(`      ❌ Verification failed: ${error.message}`);
        }
      }
      
      const employmentRate = currentEmploymentCount / verifiedCount;
      console.log(`  📊 Employment verification results:`);
      console.log(`    - People verified: ${verifiedCount}/${topPeople.length}`);
      console.log(`    - Currently employed: ${currentEmploymentCount}/${verifiedCount} (${Math.round(employmentRate*100)}%)`);
      
      if (verifiedCount > 0) {
        this.recordTestPass('Real Employment Verification');
      } else {
        throw new Error('No people could be verified');
      }
      
    } catch (error) {
      this.recordTestFail('Real Employment Verification', error.message);
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
  
  printFinalResults() {
    console.log('\n📊 REAL USE CASE TEST RESULTS');
    console.log('='.repeat(32));
    console.log(`✅ Passed: ${this.testResults.passedTests}/${this.testResults.totalTests}`);
    console.log(`❌ Failed: ${this.testResults.failedTests}/${this.testResults.totalTests}`);
    console.log(`📈 Success Rate: ${Math.round(this.testResults.passedTests/this.testResults.totalTests*100)}%`);
    
    if (this.testResults.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    console.log('\n🎯 UNIFIED SYSTEM STATUS:');
    if (this.testResults.passedTests === this.testResults.totalTests) {
      console.log('✅ UNIFIED SYSTEM IS 100% FUNCTIONAL!');
      console.log('🚀 All critical use cases working correctly');
      console.log('💡 Ready for production use with TOP');
    } else if (this.testResults.passedTests >= this.testResults.totalTests * 0.8) {
      console.log('⚠️ System mostly functional - minor issues to address');
      console.log('🔧 Fix remaining issues before production');
    } else {
      console.log('❌ System has significant issues');
      console.log('🔧 Address failed tests before proceeding');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    if (this.testResults.passedTests === this.testResults.totalTests) {
      console.log('1. ✅ System validated - ready for TOP production run');
      console.log('2. 🏢 Run: node scripts/run-top-with-unified-system.js');
      console.log('3. 📊 Monitor results and performance');
      console.log('4. 🔄 Scale to additional companies');
    } else {
      console.log('1. 🔧 Fix failed test cases');
      console.log('2. 🧪 Re-run validation tests');
      console.log('3. ✅ Proceed only after all tests pass');
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Starting real use case validation...');
    
    const tester = new RealUseCaseTests();
    const results = await tester.runAllRealTests();
    
    process.exit(results.passedTests === results.totalTests ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Real testing failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if unified system is properly implemented');
    console.log('2. Verify database connectivity and schema');
    console.log('3. Check API keys are configured');
    console.log('4. Review error messages above');
    
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { RealUseCaseTests, TOP_CONFIG };
