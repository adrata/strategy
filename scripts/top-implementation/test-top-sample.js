#!/usr/bin/env node

/**
 * 🧪 TOP SAMPLE TEST
 * 
 * Test buyer group enrichment with a small sample of TOP companies
 * to validate the approach before full processing
 */

const { TOP24HourEnrichment, TOP_CONFIG } = require('./top-24h-enrichment');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTOPSample() {
  console.log('🧪 TESTING TOP ENRICHMENT WITH SAMPLE DATA');
  console.log('='.repeat(50));
  
  try {
    // Get 3-5 TOP companies for testing
    const testCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_CONFIG.workspaceId,
        deletedAt: null,
        // Prefer companies without existing buyer groups for testing
        buyer_groups: {
          none: {}
        }
      },
      take: 5,
      include: {
        people: true,
        buyer_groups: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    if (testCompanies.length === 0) {
      console.log('❌ No suitable test companies found');
      console.log('💡 Try removing the buyer_groups filter or check workspace ID');
      return;
    }
    
    console.log(`📊 Testing with ${testCompanies.length} companies:`);
    testCompanies.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.name} (${c.people.length} existing people, ${c.buyer_groups.length} buyer groups)`);
    });
    
    const enrichment = new TOP24HourEnrichment();
    const testResults = [];
    
    // Test each company individually
    for (const [index, company] of testCompanies.entries()) {
      console.log(`\n🎯 Testing ${index + 1}/${testCompanies.length}: ${company.name}`);
      console.log('-'.repeat(40));
      
      const startTime = Date.now();
      
      try {
        // Test the core processing function
        const result = await enrichment.processSingleCompanyFast(company);
        
        // Validate the results
        const validation = await validateTestResult(company, result);
        
        testResults.push({
          company: company.name,
          result,
          validation,
          success: true
        });
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ Test Results for ${company.name}:`);
        console.log(`  ⏱️  Processing time: ${Math.round(duration/1000)}s`);
        console.log(`  👥 Buyer group members: ${result.buyerGroup?.totalMembers || 0}`);
        console.log(`  ➕ New people added: ${result.newPeople}`);
        console.log(`  🔄 Existing people enriched: ${result.enrichedPeople}`);
        console.log(`  🎯 Confidence: ${result.confidence}%`);
        console.log(`  💰 Cost: $${result.cost?.toFixed(2) || '0.00'}`);
        console.log(`  ✅ Validation: ${validation.status}`);
        
        if (validation.issues.length > 0) {
          console.log(`  ⚠️ Issues found:`);
          validation.issues.forEach(issue => console.log(`    - ${issue}`));
        }
        
        if (validation.recommendations.length > 0) {
          console.log(`  💡 Recommendations:`);
          validation.recommendations.forEach(rec => console.log(`    - ${rec}`));
        }
        
      } catch (error) {
        console.error(`❌ Test failed for ${company.name}:`, error.message);
        testResults.push({
          company: company.name,
          error: error.message,
          success: false
        });
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Print test summary
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(30));
    
    const successful = testResults.filter(r => r.success);
    const failed = testResults.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${testResults.length}`);
    console.log(`❌ Failed: ${failed.length}/${testResults.length}`);
    
    if (successful.length > 0) {
      const avgConfidence = successful.reduce((sum, r) => sum + (r.result.confidence || 0), 0) / successful.length;
      const totalNewPeople = successful.reduce((sum, r) => sum + (r.result.newPeople || 0), 0);
      const totalEnrichedPeople = successful.reduce((sum, r) => sum + (r.result.enrichedPeople || 0), 0);
      const totalCost = successful.reduce((sum, r) => sum + (r.result.cost || 0), 0);
      
      console.log(`📈 Average confidence: ${Math.round(avgConfidence)}%`);
      console.log(`➕ Total new people: ${totalNewPeople}`);
      console.log(`🔄 Total enriched people: ${totalEnrichedPeople}`);
      console.log(`💰 Total cost: $${totalCost.toFixed(2)}`);
    }
    
    if (failed.length > 0) {
      console.log(`\n❌ Failed companies:`);
      failed.forEach(f => console.log(`  - ${f.company}: ${f.error}`));
    }
    
    // Recommendations for full run
    console.log('\n🚀 RECOMMENDATIONS FOR FULL RUN:');
    if (successful.length >= testResults.length * 0.8) {
      console.log('✅ Tests successful - proceed with full enrichment');
      console.log('💡 Run: node scripts/top-implementation/top-24h-enrichment.js');
    } else {
      console.log('⚠️ Test success rate below 80% - investigate issues first');
      console.log('🔧 Check API keys, rate limits, and error messages above');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('💥 Sample test failed:', error);
    throw error;
  }
}

async function validateTestResult(company, result) {
  const validation = {
    status: 'success',
    issues: [],
    recommendations: []
  };
  
  // Check buyer group size
  if (!result.buyerGroup || (result.buyerGroup.totalMembers || 0) < 5) {
    validation.issues.push('Buyer group too small (< 5 members)');
    validation.status = 'partial';
    validation.recommendations.push('Consider lowering influence score threshold');
  }
  
  // Check confidence
  if ((result.confidence || 0) < 70) {
    validation.issues.push(`Low confidence: ${result.confidence}%`);
    validation.status = 'partial';
    validation.recommendations.push('Review company name and website accuracy');
  }
  
  // Check processing time
  if ((result.duration || 0) > 180000) { // 3 minutes
    validation.issues.push(`Slow processing: ${Math.round(result.duration/1000)}s`);
    validation.recommendations.push('Consider reducing maxCollects or batch size');
  }
  
  // Check cost
  if ((result.cost || 0) > 2.00) {
    validation.issues.push(`High cost: $${result.cost?.toFixed(2)}`);
    validation.recommendations.push('Review API usage and optimize provider selection');
  }
  
  return validation;
}

// Execute test if run directly
if (require.main === module) {
  testTOPSample()
    .then(() => {
      console.log('\n✅ Sample test complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Sample test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTOPSample, validateTestResult };
