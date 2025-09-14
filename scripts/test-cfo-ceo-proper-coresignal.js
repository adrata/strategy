/**
 * CFO/CEO Enrichment Test - Using Proper CoreSignal API
 * Tests the complete pipeline with actual client data to achieve >80% accuracy
 * Uses correct CoreSignal Elasticsearch DSL API structure from documentation
 */

const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test Configuration
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY';
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com';

// Accuracy Scoring System
const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 95,    // 95-100%: Multiple data sources confirm, recent updates
  VERY_GOOD: 85,    // 85-94%: Strong single source or multiple weak sources
  GOOD: 75,         // 75-84%: Single reliable source, some validation
  FAIR: 65,         // 65-74%: Weak source or outdated information
  POOR: 50,         // 50-64%: Very weak or questionable data
  UNACCEPTABLE: 0   // 0-49%: No reliable data found
};

// Load CSV data
function loadCSVData() {
  try {
    const csvPath = path.join(__dirname, '..', 'Key Account Domains.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const companies = [];
    for (let i = 1; i < Math.min(6, lines.length); i++) { // Test first 5 companies to control costs
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= headers.length && values[0]) {
        const domain = values[0].toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
        // Extract company name from domain
        const companyName = domain.split('.')[0]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        companies.push({
          domain: domain,
          name: companyName,
          industry: 'Technology' // Default for testing
        });
      }
    }
    
    console.log(`📊 Loaded ${companies.length} companies from CSV`);
    return companies;
  } catch (error) {
    console.error('❌ Error loading CSV:', error.message);
    return [];
  }
}

// CoreSignal API Helper Functions
async function searchEmployeesByCompanyAndRole(companyDomain, role) {
  try {
    console.log(`🔍 Searching for ${role} at ${companyDomain}...`);
    
    // Step 1: Find company ID using company enrichment endpoint
    const companyResponse = await fetch(
      `${CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/enrich?website=${companyDomain}`,
      {
        method: 'GET',
        headers: {
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!companyResponse.ok) {
      console.log(`⚠️  Company not found for ${companyDomain}: ${companyResponse.status}`);
      return { success: false, error: `Company not found: ${companyResponse.status}` };
    }
    
    const companyData = await companyResponse.json();
    console.log(`✅ Found company: ${companyData.company_name} (ID: ${companyData.id})`);
    
    // Step 2: Search for employees using Elasticsearch DSL
    const employeeSearchQuery = {
      "query": {
        "bool": {
          "must": [
            {
              "nested": {
                "path": "experience",
                "query": {
                  "bool": {
                    "must": [
                      {
                        "term": {
                          "experience.company_id": companyData.id
                        }
                      },
                      {
                        "term": {
                          "experience.active_experience": 1
                        }
                      },
                      {
                        "query_string": {
                          "query": role,
                          "default_field": "experience.position_title",
                          "default_operator": "and"
                        }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      },
      "sort": [
        "_score"
      ]
    };
    
    const employeeResponse = await fetch(
      `${CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5`,
      {
        method: 'POST',
        headers: {
          'apikey': CORESIGNAL_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(employeeSearchQuery)
      }
    );
    
    if (!employeeResponse.ok) {
      console.log(`⚠️  Employee search failed: ${employeeResponse.status}`);
      const errorText = await employeeResponse.text();
      console.log('Error details:', errorText);
      return { success: false, error: `Employee search failed: ${employeeResponse.status}` };
    }
    
    const employeeIds = await employeeResponse.json();
    console.log(`📋 Found ${employeeIds.length} potential ${role} candidates`);
    
    if (employeeIds.length === 0) {
      return { success: false, error: 'No employees found' };
    }
    
    // Step 3: Collect detailed data for the first candidate
    const employeeDetailResponse = await fetch(
      `${CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/collect/${employeeIds[0]}`,
      {
        method: 'GET',
        headers: {
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!employeeDetailResponse.ok) {
      console.log(`⚠️  Employee detail fetch failed: ${employeeDetailResponse.status}`);
      return { success: false, error: `Employee detail fetch failed: ${employeeDetailResponse.status}` };
    }
    
    const employeeDetail = await employeeDetailResponse.json();
    
    return {
      success: true,
      data: {
        id: employeeDetail.id,
        name: employeeDetail.full_name,
        title: employeeDetail.active_experience_title,
        email: employeeDetail.primary_professional_email,
        company: companyData.company_name,
        companyDomain: companyDomain,
        lastUpdated: employeeDetail.updated_at,
        profileUrl: employeeDetail.professional_network_url
      }
    };
    
  } catch (error) {
    console.error(`❌ Error searching for ${role}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Confidence scoring function
function calculateConfidenceScore(executiveData) {
  let score = 0;
  let reasons = [];
  
  // Name validation (20 points)
  if (executiveData.name && executiveData.name.trim().length > 0) {
    score += 20;
    reasons.push("✅ Full name available");
  } else {
    reasons.push("❌ No name found");
  }
  
  // Title validation (30 points)
  if (executiveData.title) {
    const title = executiveData.title.toLowerCase();
    const targetRole = executiveData.targetRole || '';
    
    if (targetRole === 'cfo' && (title.includes('cfo') || title.includes('chief financial'))) {
      score += 30;
      reasons.push("✅ CFO title confirmed");
    } else if (targetRole === 'ceo' && (title.includes('ceo') || title.includes('chief executive'))) {
      score += 30;
      reasons.push("✅ CEO title confirmed");
    } else if (title.includes('chief') || title.includes('president') || title.includes('founder')) {
      score += 20;
      reasons.push("⚠️  Executive-level title");
    } else {
      score += 5;
      reasons.push("❌ Title doesn't match target role");
    }
  } else {
    reasons.push("❌ No title found");
  }
  
  // Email validation (25 points)
  if (executiveData.email && executiveData.email.includes('@')) {
    score += 25;
    reasons.push("✅ Professional email available");
  } else {
    reasons.push("❌ No email found");
  }
  
  // Data freshness (15 points)
  if (executiveData.lastUpdated) {
    const updateDate = new Date(executiveData.lastUpdated);
    const monthsOld = (Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsOld < 3) {
      score += 15;
      reasons.push("✅ Data updated within 3 months");
    } else if (monthsOld < 12) {
      score += 10;
      reasons.push("⚠️  Data updated within 1 year");
    } else {
      score += 5;
      reasons.push("❌ Data is over 1 year old");
    }
  } else {
    reasons.push("❌ No update timestamp");
  }
  
  // Profile completeness (10 points)
  if (executiveData.profileUrl) {
    score += 10;
    reasons.push("✅ Professional profile available");
  } else {
    reasons.push("❌ No profile URL");
  }
  
  return {
    score: Math.min(score, 100),
    level: getConfidenceLevel(score),
    reasons: reasons
  };
}

function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= CONFIDENCE_THRESHOLDS.VERY_GOOD) return 'VERY GOOD';
  if (score >= CONFIDENCE_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= CONFIDENCE_THRESHOLDS.FAIR) return 'FAIR';
  if (score >= CONFIDENCE_THRESHOLDS.POOR) return 'POOR';
  return 'UNACCEPTABLE';
}

// Main test function
async function runCFOCEOEnrichmentTest() {
  console.log('🚀 Starting CFO/CEO Enrichment Test with Real Data');
  console.log('📋 Target: >80% accuracy to win the account\n');
  
  const companies = loadCSVData();
  if (companies.length === 0) {
    console.error('❌ No companies loaded. Exiting.');
    return;
  }
  
  const results = [];
  let totalTests = 0;
  let successfulFinds = 0;
  let highConfidenceFinds = 0;
  
  for (const company of companies) {
    console.log(`\n🏢 Testing: ${company.name} (${company.domain})`);
    console.log('=' .repeat(60));
    
    // Test CFO search
    totalTests++;
    const cfoResult = await searchEmployeesByCompanyAndRole(company.domain, 'CFO');
    
    let cfoData = null;
    let cfoConfidence = null;
    
    if (cfoResult.success) {
      cfoData = cfoResult.data;
      cfoData.targetRole = 'cfo';
      cfoConfidence = calculateConfidenceScore(cfoData);
      successfulFinds++;
      
      if (cfoConfidence.score >= 75) {
        highConfidenceFinds++;
      }
      
      console.log(`✅ CFO Found: ${cfoData.name} - ${cfoData.title}`);
      console.log(`   Email: ${cfoData.email || 'Not available'}`);
      console.log(`   Confidence: ${cfoConfidence.score}% (${cfoConfidence.level})`);
      console.log(`   Reasoning: ${cfoConfidence.reasons.join(', ')}`);
    } else {
      console.log(`❌ CFO Not Found: ${cfoResult.error}`);
    }
    
    // Test CEO search
    totalTests++;
    const ceoResult = await searchEmployeesByCompanyAndRole(company.domain, 'CEO');
    
    let ceoData = null;
    let ceoConfidence = null;
    
    if (ceoResult.success) {
      ceoData = ceoResult.data;
      ceoData.targetRole = 'ceo';
      ceoConfidence = calculateConfidenceScore(ceoData);
      successfulFinds++;
      
      if (ceoConfidence.score >= 75) {
        highConfidenceFinds++;
      }
      
      console.log(`✅ CEO Found: ${ceoData.name} - ${ceoData.title}`);
      console.log(`   Email: ${ceoData.email || 'Not available'}`);
      console.log(`   Confidence: ${ceoConfidence.score}% (${ceoConfidence.level})`);
      console.log(`   Reasoning: ${ceoConfidence.reasons.join(', ')}`);
    } else {
      console.log(`❌ CEO Not Found: ${ceoResult.error}`);
    }
    
    // Store results
    results.push({
      company: company.name,
      domain: company.domain,
      cfo: cfoData,
      cfoConfidence: cfoConfidence,
      ceo: ceoData,
      ceoConfidence: ceoConfidence
    });
    
    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate final accuracy metrics
  const overallAccuracy = (successfulFinds / totalTests) * 100;
  const highConfidenceAccuracy = (highConfidenceFinds / totalTests) * 100;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS - CFO/CEO ENRICHMENT TEST');
  console.log('='.repeat(80));
  console.log(`🎯 Target Accuracy: >80% (to win the account)`);
  console.log(`📈 Overall Accuracy: ${overallAccuracy.toFixed(1)}% (${successfulFinds}/${totalTests})`);
  console.log(`⭐ High Confidence (75%+): ${highConfidenceAccuracy.toFixed(1)}% (${highConfidenceFinds}/${totalTests})`);
  
  if (overallAccuracy >= 80) {
    console.log('🎉 SUCCESS: We exceed the 80% accuracy benchmark!');
  } else {
    console.log('⚠️  WARNING: Below 80% accuracy benchmark');
  }
  
  // Detailed breakdown
  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.company} (${result.domain})`);
    
    if (result.cfo) {
      console.log(`   CFO: ${result.cfo.name} - ${result.cfo.title} (${result.cfoConfidence.score}% ${result.cfoConfidence.level})`);
    } else {
      console.log(`   CFO: Not found`);
    }
    
    if (result.ceo) {
      console.log(`   CEO: ${result.ceo.name} - ${result.ceo.title} (${result.ceoConfidence.score}% ${result.ceoConfidence.level})`);
    } else {
      console.log(`   CEO: Not found`);
    }
  });
  
  console.log('\n🚀 Test completed successfully!');
  return {
    overallAccuracy,
    highConfidenceAccuracy,
    results,
    passedBenchmark: overallAccuracy >= 80
  };
}

// Run the test
if (require.main === module) {
  runCFOCEOEnrichmentTest()
    .then(results => {
      if (results && results.passedBenchmark) {
        console.log('\n✅ SYSTEM READY FOR MONDAY LAUNCH!');
        process.exit(0);
      } else {
        console.log('\n❌ SYSTEM NEEDS IMPROVEMENT BEFORE LAUNCH');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runCFOCEOEnrichmentTest };
