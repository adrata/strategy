#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE PRODUCTION PIPELINE TEST
 * 
 * Enhanced testing script that runs all 10 companies through the production pipeline
 * and provides detailed executive discovery breakdown as requested:
 * 
 * GOALS:
 * ✅ 100% Executive Discovery (CFO/CRO or department/similar department)
 * ✅ 95% Contact Validation Rate  
 * ✅ <10 seconds processing per company
 * ✅ Complete audit trail
 * ✅ >80% Production readiness score
 * 
 * DETAILED TRACKING:
 * 1. Exact CFO/CRO matches
 * 2. Department matches (Finance, Revenue, Sales, etc.)
 * 3. Similar department matches (VP Finance, Chief Revenue, etc.)
 * 4. Total should equal 100% with complete breakdown
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Test companies for comprehensive validation
const TEST_COMPANIES = [
  {
    website: 'vts.com',
    name: 'VTS',
    industry: 'Real Estate Technology',
    expectedChallenges: ['Private company', 'Niche industry', 'Limited public data']
  },
  {
    website: 'rapid7.com', 
    name: 'Rapid7',
    industry: 'Cybersecurity',
    expectedChallenges: ['Public company', 'Technical executives', 'Security-focused']
  },
  {
    website: 'cm.com',
    name: 'CM.com',
    industry: 'Communications Platform', 
    expectedChallenges: ['European company', 'Short domain', 'International structure']
  },
  {
    website: 'discoveryeducation.com',
    name: 'Discovery Education',
    industry: 'Educational Technology',
    expectedChallenges: ['Parent company (Discovery)', 'Education sector', 'Acquisition complexity']
  },
  {
    website: 'postman.com',
    name: 'Postman', 
    industry: 'API Development',
    expectedChallenges: ['Developer-focused', 'Technical leadership', 'API-first culture']
  },
  {
    website: 'snowflake.com',
    name: 'Snowflake',
    industry: 'Cloud Data Platform',
    expectedChallenges: ['Public company', 'High-growth', 'Data-focused executives']
  },
  {
    website: 'databricks.com',
    name: 'Databricks', 
    industry: 'Data Analytics',
    expectedChallenges: ['Private company', 'Technical executives', 'AI/ML focus']
  },
  {
    website: 'stripe.com',
    name: 'Stripe',
    industry: 'Payment Processing',
    expectedChallenges: ['Private company', 'Financial services', 'Global operations']
  },
  {
    website: 'atlassian.com',
    name: 'Atlassian',
    industry: 'Software Development Tools', 
    expectedChallenges: ['Public company', 'Australian headquarters', 'Developer tools']
  },
  {
    website: 'zendesk.com',
    name: 'Zendesk',
    industry: 'Customer Service Platform',
    expectedChallenges: ['Public company', 'Customer-focused executives', 'SaaS model']
  }
];

// Production pipeline URL (using public testing endpoint) - Updated to latest deployment
const PIPELINE_URL = 'https://adrata-production-nd0an4f46-adrata.vercel.app/api/public-test/pipeline';

class ExecutiveDiscoveryTracker {
  constructor() {
    this.results = [];
    this.overallStats = {
      totalCompanies: 0,
      exactCfoMatches: 0,
      exactCroMatches: 0,
      departmentMatches: 0,
      similarDepartmentMatches: 0,
      totalExecutivesFound: 0,
      contactValidationRate: 0,
      averageProcessingTime: 0,
      productionReadinessScore: 0
    };
  }

  analyzeExecutiveDiscovery(result, companyName) {
    const analysis = {
      companyName,
      exactCfo: null,
      exactCro: null,
      departmentExecutives: [],
      similarDepartmentExecutives: [],
      totalFound: 0,
      contactsValidated: 0,
      totalContacts: 0,
      processingTime: 0,
      breakdown: {
        exactCfoFound: false,
        exactCroFound: false,
        departmentCount: 0,
        similarDepartmentCount: 0,
        totalExecutiveCount: 0
      }
    };

    if (!result || !Array.isArray(result)) {
      console.log(`  ❌ ${companyName}: No valid result data`);
      return analysis;
    }

    // Analyze each record (including parent companies)
    result.forEach((record, index) => {
      const recordType = index === 0 ? 'Primary' : 'Parent Company';
      console.log(`    📊 Analyzing ${recordType} Record:`);

      // Exact CFO matches
      if (record.cfo?.name) {
        analysis.exactCfo = record.cfo;
        analysis.breakdown.exactCfoFound = true;
        console.log(`      ✅ CFO Found: ${record.cfo.name} (${record.cfo.title || 'CFO'})`);
        
        if (record.cfo.email) {
          analysis.totalContacts++;
          if (record.cfo.emailValidation?.isValid) {
            analysis.contactsValidated++;
          }
        }
      }

      // Exact CRO matches  
      if (record.cro?.name) {
        analysis.exactCro = record.cro;
        analysis.breakdown.exactCroFound = true;
        console.log(`      ✅ CRO Found: ${record.cro.name} (${record.cro.title || 'CRO'})`);
        
        if (record.cro.email) {
          analysis.totalContacts++;
          if (record.cro.emailValidation?.isValid) {
            analysis.contactsValidated++;
          }
        }
      }

      // Department executives (Finance, Revenue, Sales departments)
      if (record.departmentExecutives?.length > 0) {
        record.departmentExecutives.forEach(exec => {
          analysis.departmentExecutives.push({
            name: exec.name,
            title: exec.title,
            department: exec.department,
            recordType
          });
          console.log(`      📋 Department Executive: ${exec.name} (${exec.title}) - ${exec.department}`);
          
          if (exec.email) {
            analysis.totalContacts++;
            if (exec.emailValidation?.isValid) {
              analysis.contactsValidated++;
            }
          }
        });
      }

      // Similar department executives (VP Finance, Chief Revenue, etc.)
      if (record.similarExecutives?.length > 0) {
        record.similarExecutives.forEach(exec => {
          analysis.similarDepartmentExecutives.push({
            name: exec.name,
            title: exec.title,
            similarity: exec.similarity,
            recordType
          });
          console.log(`      🔄 Similar Executive: ${exec.name} (${exec.title}) - Similarity: ${exec.similarity}%`);
          
          if (exec.email) {
            analysis.totalContacts++;
            if (exec.emailValidation?.isValid) {
              analysis.contactsValidated++;
            }
          }
        });
      }
    });

    // Calculate totals
    analysis.breakdown.departmentCount = analysis.departmentExecutives.length;
    analysis.breakdown.similarDepartmentCount = analysis.similarDepartmentExecutives.length;
    analysis.breakdown.totalExecutiveCount = 
      (analysis.breakdown.exactCfoFound ? 1 : 0) +
      (analysis.breakdown.exactCroFound ? 1 : 0) +
      analysis.breakdown.departmentCount +
      analysis.breakdown.similarDepartmentCount;

    analysis.totalFound = analysis.breakdown.totalExecutiveCount;

    return analysis;
  }

  async testSingleCompany(company, index) {
    const startTime = Date.now();
    
    console.log(`\n🏢 Testing Company ${index + 1}/10: ${company.name} (${company.website})`);
    console.log(`   Industry: ${company.industry}`);
    console.log(`   Expected Challenges: ${company.expectedChallenges.join(', ')}`);

    try {
      console.log(`   🚀 Calling production pipeline...`);
      
      const response = await fetch(PIPELINE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: {
            Website: company.website,
            'Top 1000': '0',
            'Account Owner': 'Comprehensive Test'
          }
        })
      });

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      console.log(`   ⏱️  Processing Time: ${(processingTime / 1000).toFixed(1)}s`);

      if (result.success) {
        console.log(`   ✅ Pipeline Success`);
        
        // Analyze executive discovery
        const analysis = this.analyzeExecutiveDiscovery(result.result, company.name);
        analysis.processingTime = processingTime;
        
        // Calculate contact validation rate for this company
        const validationRate = analysis.totalContacts > 0 
          ? (analysis.contactsValidated / analysis.totalContacts) * 100 
          : 0;
        
        console.log(`   📊 Executive Discovery Summary:`);
        console.log(`      • Exact CFO: ${analysis.breakdown.exactCfoFound ? '✅' : '❌'}`);
        console.log(`      • Exact CRO: ${analysis.breakdown.exactCroFound ? '✅' : '❌'}`);
        console.log(`      • Department Executives: ${analysis.breakdown.departmentCount}`);
        console.log(`      • Similar Department Executives: ${analysis.breakdown.similarDepartmentCount}`);
        console.log(`      • Total Executives Found: ${analysis.breakdown.totalExecutiveCount}`);
        console.log(`      • Contact Validation Rate: ${validationRate.toFixed(1)}%`);
        
        this.results.push(analysis);
        
        // Update overall stats
        this.overallStats.totalCompanies++;
        if (analysis.breakdown.exactCfoFound) this.overallStats.exactCfoMatches++;
        if (analysis.breakdown.exactCroFound) this.overallStats.exactCroMatches++;
        this.overallStats.departmentMatches += analysis.breakdown.departmentCount;
        this.overallStats.similarDepartmentMatches += analysis.breakdown.similarDepartmentCount;
        this.overallStats.totalExecutivesFound += analysis.breakdown.totalExecutiveCount;
        
        return { success: true, analysis, processingTime };
        
      } else {
        console.log(`   ❌ Pipeline Failed: ${result.error || 'Unknown error'}`);
        
        const analysis = this.analyzeExecutiveDiscovery(null, company.name);
        analysis.processingTime = processingTime;
        this.results.push(analysis);
        this.overallStats.totalCompanies++;
        
        return { success: false, error: result.error, processingTime };
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.log(`   💥 Error: ${error.message}`);
      
      const analysis = this.analyzeExecutiveDiscovery(null, company.name);
      analysis.processingTime = processingTime;
      this.results.push(analysis);
      this.overallStats.totalCompanies++;
      
      return { success: false, error: error.message, processingTime };
    }
  }

  calculateFinalMetrics() {
    const totalProcessingTime = this.results.reduce((sum, r) => sum + r.processingTime, 0);
    const totalContacts = this.results.reduce((sum, r) => sum + r.totalContacts, 0);
    const totalValidatedContacts = this.results.reduce((sum, r) => sum + r.contactsValidated, 0);
    
    this.overallStats.averageProcessingTime = totalProcessingTime / this.overallStats.totalCompanies;
    this.overallStats.contactValidationRate = totalContacts > 0 ? (totalValidatedContacts / totalContacts) * 100 : 0;
    
    // Calculate executive discovery rates
    const exactExecutiveRate = ((this.overallStats.exactCfoMatches + this.overallStats.exactCroMatches) / (this.overallStats.totalCompanies * 2)) * 100;
    const departmentExecutiveRate = (this.overallStats.departmentMatches / this.overallStats.totalCompanies) * 100;
    const similarExecutiveRate = (this.overallStats.similarDepartmentMatches / this.overallStats.totalCompanies) * 100;
    const totalExecutiveDiscoveryRate = (this.overallStats.totalExecutivesFound / this.overallStats.totalCompanies) * 100;
    
    // Calculate production readiness score
    const speedScore = this.overallStats.averageProcessingTime <= 10000 ? 100 : Math.max(0, 100 - ((this.overallStats.averageProcessingTime - 10000) / 1000) * 10);
    const discoveryScore = Math.min(100, totalExecutiveDiscoveryRate);
    const validationScore = Math.min(100, this.overallStats.contactValidationRate);
    
    this.overallStats.productionReadinessScore = (speedScore * 0.3 + discoveryScore * 0.4 + validationScore * 0.3);
    
    return {
      exactExecutiveRate,
      departmentExecutiveRate, 
      similarExecutiveRate,
      totalExecutiveDiscoveryRate,
      speedScore,
      discoveryScore,
      validationScore
    };
  }

  generateDetailedReport() {
    const metrics = this.calculateFinalMetrics();
    
    console.log('\n' + '='.repeat(80));
    console.log('🚀 COMPREHENSIVE PRODUCTION PIPELINE TEST RESULTS');
    console.log('='.repeat(80));
    
    console.log('\n📊 EXECUTIVE DISCOVERY BREAKDOWN (Your Goal: 100% Total)');
    console.log('─'.repeat(60));
    console.log(`✅ Exact CFO Matches:           ${this.overallStats.exactCfoMatches}/${this.overallStats.totalCompanies} (${((this.overallStats.exactCfoMatches / this.overallStats.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`✅ Exact CRO Matches:           ${this.overallStats.exactCroMatches}/${this.overallStats.totalCompanies} (${((this.overallStats.exactCroMatches / this.overallStats.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`📋 Department Executives:        ${this.overallStats.departmentMatches} total (${metrics.departmentExecutiveRate.toFixed(1)} avg per company)`);
    console.log(`🔄 Similar Department Execs:     ${this.overallStats.similarDepartmentMatches} total (${metrics.similarExecutiveRate.toFixed(1)} avg per company)`);
    console.log(`🎯 TOTAL EXECUTIVE DISCOVERY:    ${this.overallStats.totalExecutivesFound} executives (${metrics.totalExecutiveDiscoveryRate.toFixed(1)}% rate)`);
    
    console.log('\n⚡ PERFORMANCE METRICS');
    console.log('─'.repeat(40));
    console.log(`🚀 Average Processing Time:      ${(this.overallStats.averageProcessingTime / 1000).toFixed(1)}s (Goal: <10s)`);
    console.log(`📧 Contact Validation Rate:      ${this.overallStats.contactValidationRate.toFixed(1)}% (Goal: 95%)`);
    console.log(`🎯 Production Readiness Score:   ${this.overallStats.productionReadinessScore.toFixed(1)}% (Goal: >80%)`);
    
    console.log('\n🎯 GOAL ACHIEVEMENT STATUS');
    console.log('─'.repeat(50));
    console.log(`✅ 100% Executive Discovery:     ${metrics.totalExecutiveDiscoveryRate >= 100 ? '✅ ACHIEVED' : `❌ ${metrics.totalExecutiveDiscoveryRate.toFixed(1)}% (Need ${(100 - metrics.totalExecutiveDiscoveryRate).toFixed(1)}% more)`}`);
    console.log(`✅ 95% Contact Validation:       ${this.overallStats.contactValidationRate >= 95 ? '✅ ACHIEVED' : `❌ ${this.overallStats.contactValidationRate.toFixed(1)}% (Need ${(95 - this.overallStats.contactValidationRate).toFixed(1)}% more)`}`);
    console.log(`✅ <10s Processing Speed:        ${this.overallStats.averageProcessingTime <= 10000 ? '✅ ACHIEVED' : `❌ ${(this.overallStats.averageProcessingTime / 1000).toFixed(1)}s (${((this.overallStats.averageProcessingTime - 10000) / 1000).toFixed(1)}s over target)`}`);
    console.log(`✅ >80% Production Readiness:    ${this.overallStats.productionReadinessScore >= 80 ? '✅ ACHIEVED' : `❌ ${this.overallStats.productionReadinessScore.toFixed(1)}% (Need ${(80 - this.overallStats.productionReadinessScore).toFixed(1)}% more)`}`);
    
    console.log('\n📋 DETAILED COMPANY BREAKDOWN');
    console.log('─'.repeat(80));
    
    this.results.forEach((result, index) => {
      const company = TEST_COMPANIES[index];
      const discoveryRate = result.totalFound > 0 ? 100 : 0;
      const validationRate = result.totalContacts > 0 ? (result.contactsValidated / result.totalContacts) * 100 : 0;
      
      console.log(`\n${index + 1}. ${result.companyName} (${company.website})`);
      console.log(`   ⏱️  Processing: ${(result.processingTime / 1000).toFixed(1)}s`);
      console.log(`   👥 Executives: ${result.totalFound} found`);
      console.log(`   📧 Validation: ${validationRate.toFixed(1)}% (${result.contactsValidated}/${result.totalContacts})`);
      console.log(`   📊 Breakdown:`);
      console.log(`      • CFO: ${result.breakdown.exactCfoFound ? '✅' : '❌'} ${result.exactCfo?.name || 'Not found'}`);
      console.log(`      • CRO: ${result.breakdown.exactCroFound ? '✅' : '❌'} ${result.exactCro?.name || 'Not found'}`);
      console.log(`      • Department: ${result.breakdown.departmentCount} executives`);
      console.log(`      • Similar Dept: ${result.breakdown.similarDepartmentCount} executives`);
    });
    
    console.log('\n🚀 PRODUCTION READINESS ASSESSMENT');
    console.log('─'.repeat(50));
    
    if (this.overallStats.productionReadinessScore >= 80) {
      console.log('🎉 PIPELINE IS READY FOR PRODUCTION!');
      console.log('   All key metrics meet or exceed targets.');
    } else if (this.overallStats.productionReadinessScore >= 60) {
      console.log('⚠️  PIPELINE NEEDS OPTIMIZATION');
      console.log('   Close to production ready but requires improvements.');
    } else {
      console.log('❌ PIPELINE NOT READY FOR PRODUCTION');
      console.log('   Significant improvements needed before deployment.');
    }
    
    console.log('\n📈 RECOMMENDATIONS FOR 100% EXECUTIVE DISCOVERY:');
    console.log('─'.repeat(60));
    
    if (metrics.totalExecutiveDiscoveryRate < 100) {
      console.log('• Enhance executive research waterfall with additional tiers');
      console.log('• Expand department search to include VP, Director, Manager levels');
      console.log('• Add industry-specific executive title patterns');
      console.log('• Implement LinkedIn profile enrichment for missing executives');
      console.log('• Add company org chart analysis for executive hierarchy');
    }
    
    if (this.overallStats.contactValidationRate < 95) {
      console.log('• Implement additional email validation services');
      console.log('• Add email pattern generation for missing contacts');
      console.log('• Enhance domain-specific email format detection');
      console.log('• Add phone number validation as backup contact method');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      overallStats: this.overallStats,
      metrics,
      results: this.results
    };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Production Pipeline Test');
  console.log(`📅 Test Started: ${new Date().toISOString()}`);
  console.log(`🎯 Testing ${TEST_COMPANIES.length} companies with enhanced executive tracking`);
  console.log(`🌐 Pipeline URL: ${PIPELINE_URL}`);
  
  const tracker = new ExecutiveDiscoveryTracker();
  const testResults = [];
  
  // Test all companies
  for (let i = 0; i < TEST_COMPANIES.length; i++) {
    const company = TEST_COMPANIES[i];
    const result = await tracker.testSingleCompany(company, i);
    testResults.push(result);
    
    // Small delay between companies to prevent rate limiting
    if (i < TEST_COMPANIES.length - 1) {
      console.log('   ⏳ Waiting 2 seconds before next company...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate comprehensive report
  const finalReport = tracker.generateDetailedReport();
  
  console.log(`\n📅 Test Completed: ${new Date().toISOString()}`);
  console.log(`⏱️  Total Test Duration: ${((Date.now() - Date.parse(new Date().toISOString())) / 1000).toFixed(1)}s`);
  
  return finalReport;
}

// Run the test
if (require.main === module) {
  runComprehensiveTest()
    .then(report => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTest, ExecutiveDiscoveryTracker };
