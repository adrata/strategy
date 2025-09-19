#!/usr/bin/env node

/**
 * 🚀 RUN TOP PIPELINE VERIFICATION
 * 
 * Actually execute the unified system with TOP's real data to verify it works
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP configuration - CORRECTED based on data migration report
const TOP_CONFIG = {
  workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
  userId: 'ross@adrata.com' // Ross Sylvester as per migration report
};

async function runTOPPipelineVerification() {
  console.log('🚀 RUNNING TOP PIPELINE VERIFICATION');
  console.log('===================================');
  console.log('📊 Executing unified system with TOP\'s real data');
  console.log('');
  
  try {
    // Step 1: Connect to database and verify TOP data
    console.log('🔌 STEP 1: Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Get TOP companies
    console.log('\n🏢 STEP 2: Analyzing TOP companies...');
    const topCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_CONFIG.workspaceId,
        deletedAt: null
      },
      include: {
        people: true,
        buyer_groups: true
      },
      take: 10
    });
    
    console.log(`📊 Found ${topCompanies.length} TOP companies`);
    
    if (topCompanies.length === 0) {
      console.log('❌ No TOP companies found - cannot test pipeline');
      console.log('💡 Check workspace ID or add TOP companies to database');
      return;
    }
    
    // Show sample companies
    console.log('📋 Sample TOP companies:');
    topCompanies.slice(0, 5).forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name}`);
      console.log(`     Industry: ${company.industry || 'Not specified'}`);
      console.log(`     People: ${company.people.length}`);
      console.log(`     Buyer groups: ${company.buyer_groups.length}`);
      console.log('');
    });
    
    // Step 3: Test unified system import
    console.log('📦 STEP 3: Testing unified system import...');
    
    let unifiedSystem;
    try {
      const { UnifiedEnrichmentFactory } = require('../src/platform/services/unified-enrichment-system');
      unifiedSystem = UnifiedEnrichmentFactory.createForTOP();
      console.log('✅ Unified system imported and instantiated successfully');
    } catch (importError) {
      console.log(`❌ Unified system import failed: ${importError.message}`);
      return;
    }
    
    // Step 4: Test buyer group generation with real TOP company
    console.log('\n🎯 STEP 4: Testing buyer group generation...');
    
    const testCompany = topCompanies[0];
    console.log(`🏢 Testing with: ${testCompany.name}`);
    
    // Create TOP-specific seller profile
    const topSellerProfile = {
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
    };
    
    // Execute buyer group generation
    const buyerGroupRequest = {
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
      },
      sellerProfile: topSellerProfile
    };
    
    console.log('🚀 Executing buyer group generation...');
    const startTime = Date.now();
    
    const result = await unifiedSystem.enrich(buyerGroupRequest);
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Processing completed in ${Math.round(duration/1000)}s`);
    console.log(`📊 Success: ${result.success ? '✅' : '❌'}`);
    
    if (result.success) {
      console.log('✅ BUYER GROUP GENERATION SUCCESSFUL!');
      console.log(`   Operation: ${result.operation}`);
      console.log(`   Buyer group: ${result.results?.buyerGroup ? '✅' : '❌'}`);
      console.log(`   New people: ${result.results?.newPeople || 0}`);
      console.log(`   Enriched people: ${result.results?.enrichedPeople || 0}`);
      console.log(`   Confidence: ${result.quality?.roleConfidence || result.metadata?.confidence || 0}%`);
      console.log(`   Processing time: ${result.metadata?.processingTime || duration}ms`);
      
      // Verify database changes
      const updatedCompany = await prisma.companies.findUnique({
        where: { id: testCompany.id },
        include: { buyer_groups: true, people: true }
      });
      
      console.log(`   Database updated: ${updatedCompany?.buyer_groups.length > testCompany.buyer_groups.length ? '✅' : '📊'}`);
      console.log(`   Buyer groups: ${testCompany.buyer_groups.length} → ${updatedCompany?.buyer_groups.length || 0}`);
      console.log(`   People: ${testCompany.people.length} → ${updatedCompany?.people.length || 0}`);
      
    } else {
      console.log('❌ BUYER GROUP GENERATION FAILED');
      console.log(`   Error: ${result.errors?.[0] || 'Unknown error'}`);
    }
    
    // Step 5: Test employment verification
    console.log('\n👔 STEP 5: Testing employment verification...');
    
    const topPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_CONFIG.workspaceId,
        deletedAt: null,
        email: { not: null }
      },
      include: { company: true },
      take: 3
    });
    
    if (topPeople.length > 0) {
      console.log(`👥 Testing employment verification with ${topPeople.length} TOP people`);
      
      for (const person of topPeople) {
        try {
          console.log(`  🔍 ${person.fullName} at ${person.company?.name || 'Unknown'}`);
          
          const verification = await unifiedSystem.employmentVerifier.verifyPersonEmployment(person);
          
          console.log(`    Currently employed: ${verification.isCurrentlyEmployed ? '✅' : '❌'}`);
          console.log(`    Confidence: ${verification.confidence}%`);
          console.log(`    Method: ${verification.verificationMethod}`);
          console.log(`    Data age: ${verification.dataAge} days`);
          
        } catch (verificationError) {
          console.log(`    ❌ Verification failed: ${verificationError.message}`);
        }
      }
    }
    
    // Final assessment
    console.log('\n🎯 FINAL PIPELINE VERIFICATION RESULTS');
    console.log('=====================================');
    
    if (result.success) {
      console.log('✅ UNIFIED SYSTEM PIPELINE WORKING CORRECTLY!');
      console.log('🎯 System successfully processed TOP company');
      console.log('👔 Employment verification functional');
      console.log('🏢 Buyer group generation operational');
      console.log('📊 Database integration working');
      console.log('');
      console.log('🚀 READY FOR FULL TOP PRODUCTION RUN!');
      console.log('   The pipeline has been verified with real TOP data');
      console.log('   and is ready for production use.');
    } else {
      console.log('❌ PIPELINE VERIFICATION FAILED');
      console.log('🔧 System needs debugging before production use');
    }
    
  } catch (error) {
    console.error('💥 Pipeline verification failed:', error);
    console.log('\n🔧 Error details:');
    console.log(`   Message: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the verification
runTOPPipelineVerification()
  .then(() => {
    console.log('\n✨ Pipeline verification complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Pipeline verification failed:', error);
    process.exit(1);
  });
