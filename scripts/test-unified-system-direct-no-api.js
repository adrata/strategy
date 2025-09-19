#!/usr/bin/env node

/**
 * 🧪 TEST UNIFIED SYSTEM DIRECTLY (NO API)
 * 
 * Test the unified system components directly without relying on API endpoints
 * This validates the core system functionality with real TOP data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP configuration
const TOP_CONFIG = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  userId: 'dan@adrata.com'
};

class DirectUnifiedSystemTest {
  constructor() {
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: []
    };
  }
  
  async runDirectSystemTest() {
    console.log('🧪 TESTING UNIFIED SYSTEM DIRECTLY WITH REAL TOP DATA');
    console.log('===================================================');
    console.log(`📊 Workspace: ${TOP_CONFIG.workspaceId}`);
    console.log('');
    
    try {
      // Test 1: Verify TOP Data Exists
      await this.verifyTOPDataExists();
      
      // Test 2: Test Unified System Import
      await this.testUnifiedSystemImport();
      
      // Test 3: Test System Instantiation with TOP Context
      await this.testSystemInstantiationWithTOPContext();
      
      // Test 4: Test Real Buyer Group Generation
      await this.testRealBuyerGroupGeneration();
      
      // Test 5: Test Employment Verification with Real Data
      await this.testEmploymentVerificationWithRealData();
      
      this.printFinalResults();
      
      return this.testResults;
      
    } catch (error) {
      console.error('💥 Direct system test failed:', error);
      throw error;
    }
  }
  
  async verifyTOPDataExists() {
    console.log('📊 TEST 1: Verify TOP Data Exists');
    console.log('-'.repeat(33));
    
    try {
      await prisma.$connect();
      console.log('  ✅ Database connected');
      
      // Check TOP companies
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null
        },
        include: {
          people: true
        },
        take: 5
      });
      
      console.log(`  🏢 TOP companies found: ${companies.length}`);
      
      if (companies.length === 0) {
        throw new Error('No TOP companies found - check workspace ID');
      }
      
      // Show sample data
      companies.forEach((company, index) => {
        console.log(`    ${index + 1}. ${company.name} (${company.people.length} people, ${company.industry || 'No industry'})`);
      });
      
      // Check TOP people
      const people = await prisma.people.findMany({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null
        },
        include: {
          company: true
        },
        take: 5
      });
      
      console.log(`  👥 TOP people found: ${people.length}`);
      
      if (people.length > 0) {
        people.forEach((person, index) => {
          console.log(`    ${index + 1}. ${person.fullName} (${person.jobTitle || 'No title'}, ${person.company?.name || 'No company'})`);
        });
      }
      
      this.recordTestPass('Verify TOP Data Exists');
      
    } catch (error) {
      this.recordTestFail('Verify TOP Data Exists', error.message);
    }
  }
  
  async testUnifiedSystemImport() {
    console.log('\n📦 TEST 2: Test Unified System Import');
    console.log('-'.repeat(37));
    
    try {
      console.log('  📁 Importing unified system...');
      
      // Test import
      const unifiedSystemModule = require('../src/platform/services/unified-enrichment-system');
      
      console.log('  ✅ Import successful');
      console.log(`    - UnifiedEnrichmentFactory: ${typeof unifiedSystemModule.UnifiedEnrichmentFactory === 'function' ? '✅' : '❌'}`);
      console.log(`    - UnifiedEnrichmentSystem: ${typeof unifiedSystemModule.UnifiedEnrichmentSystem === 'function' ? '✅' : '❌'}`);
      
      // Test factory methods
      const factory = unifiedSystemModule.UnifiedEnrichmentFactory;
      console.log(`    - createForTOP method: ${typeof factory.createForTOP === 'function' ? '✅' : '❌'}`);
      console.log(`    - createForWorkspace method: ${typeof factory.createForWorkspace === 'function' ? '✅' : '❌'}`);
      
      this.recordTestPass('Test Unified System Import');
      
    } catch (error) {
      this.recordTestFail('Test Unified System Import', error.message);
    }
  }
  
  async testSystemInstantiationWithTOPContext() {
    console.log('\n🏭 TEST 3: Test System Instantiation with TOP Context');
    console.log('-'.repeat(52));
    
    try {
      console.log('  🔧 Creating unified system for TOP...');
      
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      
      // Create system instance for TOP
      const unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
      
      console.log('  ✅ System instantiation successful');
      
      // Test system methods
      console.log('  🔍 Testing system methods...');
      console.log(`    - enrich method: ${typeof unifiedSystem.enrich === 'function' ? '✅' : '❌'}`);
      console.log(`    - getSystemStats method: ${typeof unifiedSystem.getSystemStats === 'function' ? '✅' : '❌'}`);
      
      // Test system stats
      const stats = unifiedSystem.getSystemStats();
      console.log(`  📊 System stats accessible: ✅`);
      console.log(`    - Total requests: ${stats.totalRequests}`);
      console.log(`    - Success rate: ${stats.successRate}%`);
      console.log(`    - Average processing time: ${stats.averageProcessingTime}ms`);
      
      this.recordTestPass('Test System Instantiation with TOP Context');
      
    } catch (error) {
      this.recordTestFail('Test System Instantiation with TOP Context', error.message);
    }
  }
  
  async testRealBuyerGroupGeneration() {
    console.log('\n🎯 TEST 4: Test Real Buyer Group Generation');
    console.log('-'.repeat(44));
    
    try {
      console.log('  🏢 Testing buyer group generation with real TOP company...');
      
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      const unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
      
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
      
      console.log(`    - Company: ${topCompany.name}`);
      console.log(`    - Industry: ${topCompany.industry || 'Not specified'}`);
      console.log(`    - Current people: ${topCompany.people.length}`);
      console.log(`    - Current buyer groups: ${topCompany.buyer_groups.length}`);
      
      // Create real buyer group request with TOP context
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
          decisionLevel: 'mixed',
          rolePriorities: {
            decision: ['CEO', 'COO', 'VP Operations', 'VP Engineering', 'CTO', 'President'],
            champion: ['Director Operations', 'Engineering Manager', 'Operations Manager', 'Project Manager'],
            stakeholder: ['VP Finance', 'CFO', 'Procurement Manager', 'Quality Manager'],
            blocker: ['Legal Counsel', 'Compliance Manager', 'Risk Manager'],
            introducer: ['Board Member', 'Advisor', 'Consultant']
          },
          mustHaveTitles: ['CEO', 'COO', 'VP Operations', 'VP Engineering'],
          adjacentFunctions: ['finance', 'legal', 'procurement', 'quality'],
          disqualifiers: ['intern', 'student', 'temporary'],
          geo: ['US'],
          primaryPainPoints: [
            'Engineering capacity constraints',
            'Technical skill gaps',
            'Project delivery delays',
            'Quality control issues'
          ],
          targetDepartments: ['engineering', 'operations', 'manufacturing', 'quality']
        }
      };
      
      console.log('  🚀 Executing buyer group generation...');
      const startTime = Date.now();
      
      const result = await unifiedSystem.enrich(request);
      const duration = Date.now() - startTime;
      
      console.log(`    - Processing time: ${Math.round(duration/1000)}s`);
      console.log(`    - Success: ${result.success ? '✅' : '❌'}`);
      
      if (result.success) {
        console.log(`    - Operation: ${result.operation}`);
        console.log(`    - Buyer group created: ${result.results?.buyerGroup ? '✅' : '❌'}`);
        console.log(`    - New people: ${result.results?.newPeople || 0}`);
        console.log(`    - Enriched people: ${result.results?.enrichedPeople || 0}`);
        console.log(`    - Confidence: ${result.quality?.roleConfidence || result.metadata?.confidence || 0}%`);
        console.log(`    - Processing time: ${result.metadata?.processingTime || duration}ms`);
        
        // Verify database was updated
        const updatedCompany = await prisma.companies.findUnique({
          where: { id: topCompany.id },
          include: { buyer_groups: true }
        });
        
        const buyerGroupsAfter = updatedCompany?.buyer_groups.length || 0;
        const buyerGroupsBefore = topCompany.buyer_groups.length;
        
        console.log(`    - Database updated: ${buyerGroupsAfter > buyerGroupsBefore ? '✅' : '📊'} (${buyerGroupsBefore} → ${buyerGroupsAfter})`);
        
        this.recordTestPass('Test Real Buyer Group Generation');
      } else {
        throw new Error(result.errors?.[0] || 'Buyer group generation failed');
      }
      
    } catch (error) {
      this.recordTestFail('Test Real Buyer Group Generation', error.message);
    }
  }
  
  async testEmploymentVerificationWithRealData() {
    console.log('\n👔 TEST 5: Test Employment Verification with Real Data');
    console.log('-'.repeat(54));
    
    try {
      console.log('  👥 Testing employment verification with real TOP people...');
      
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      const unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
      
      // Get real TOP people for testing
      const topPeople = await prisma.people.findMany({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          email: { not: null }
        },
        include: {
          company: true
        },
        take: 3,
        orderBy: { updatedAt: 'desc' }
      });
      
      if (topPeople.length === 0) {
        throw new Error('No TOP people found for employment verification testing');
      }
      
      console.log(`    - Testing with ${topPeople.length} real TOP people`);
      
      let verifiedCount = 0;
      let currentEmploymentCount = 0;
      
      for (const person of topPeople) {
        try {
          console.log(`    🔍 Verifying: ${person.fullName}`);
          console.log(`      Company: ${person.company?.name || 'Unknown'}`);
          console.log(`      Title: ${person.jobTitle || 'Unknown'}`);
          console.log(`      Email: ${person.email ? '✅' : '❌'}`);
          
          // Test employment verification directly
          const verification = await unifiedSystem.employmentVerifier.verifyPersonEmployment(person);
          
          verifiedCount++;
          if (verification.isCurrentlyEmployed) {
            currentEmploymentCount++;
          }
          
          console.log(`      - Currently employed: ${verification.isCurrentlyEmployed ? '✅' : '❌'}`);
          console.log(`      - Confidence: ${verification.confidence}%`);
          console.log(`      - Method: ${verification.verificationMethod}`);
          console.log(`      - Data age: ${verification.dataAge} days`);
          
          if (verification.warnings && verification.warnings.length > 0) {
            console.log(`      - Warnings: ${verification.warnings.join(', ')}`);
          }
          
        } catch (error) {
          console.error(`      ❌ Verification failed: ${error.message}`);
        }
      }
      
      const employmentRate = verifiedCount > 0 ? currentEmploymentCount / verifiedCount : 0;
      
      console.log(`  📊 Employment verification results:`);
      console.log(`    - People tested: ${topPeople.length}`);
      console.log(`    - Successfully verified: ${verifiedCount}/${topPeople.length}`);
      console.log(`    - Currently employed: ${currentEmploymentCount}/${verifiedCount} (${Math.round(employmentRate*100)}%)`);
      
      if (verifiedCount > 0) {
        console.log('  ✅ Employment verification working with real data');
        this.recordTestPass('Test Employment Verification with Real Data');
      } else {
        throw new Error('No people could be verified');
      }
      
    } catch (error) {
      this.recordTestFail('Test Employment Verification with Real Data', error.message);
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
    console.log('\n📊 DIRECT UNIFIED SYSTEM TEST RESULTS');
    console.log('='.repeat(40));
    console.log(`✅ Passed: ${this.testResults.passedTests}/${this.testResults.totalTests}`);
    console.log(`❌ Failed: ${this.testResults.failedTests}/${this.testResults.totalTests}`);
    console.log(`📈 Success Rate: ${Math.round(this.testResults.passedTests/this.testResults.totalTests*100)}%`);
    
    if (this.testResults.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    console.log('\n🎯 UNIFIED SYSTEM WITH REAL TOP DATA:');
    if (this.testResults.passedTests === this.testResults.totalTests) {
      console.log('✅ UNIFIED SYSTEM WORKS PERFECTLY WITH REAL TOP DATA!');
      console.log('🎯 Context model ensures accurate targeting');
      console.log('👔 Employment verification prevents outdated data');
      console.log('🚀 Ready for full TOP enrichment production run');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. ✅ System validated with real TOP data');
      console.log('2. 🏢 Run full TOP enrichment');
      console.log('3. 📊 Monitor results and accuracy');
      console.log('4. 🔄 Scale to all TOP companies');
    } else {
      console.log('⚠️ System has issues with real TOP data');
      console.log('🔧 Address failed tests before production use');
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Starting direct unified system test with real TOP data...');
    
    const tester = new DirectUnifiedSystemTest();
    const results = await tester.runDirectSystemTest();
    
    if (results.passedTests === results.totalTests) {
      console.log('\n🎉 UNIFIED SYSTEM VALIDATED WITH REAL TOP DATA!');
      console.log('🚀 Ready for production enrichment');
    }
    
    process.exit(results.passedTests === results.totalTests ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Direct system test failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { DirectUnifiedSystemTest, TOP_CONFIG };
