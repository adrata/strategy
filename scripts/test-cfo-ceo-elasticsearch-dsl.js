/**
 * CFO/CEO Enrichment Test - Using Correct CoreSignal Elasticsearch DSL API
 * Tests the complete pipeline with actual client data to achieve >80% accuracy
 */

const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test Configuration
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY';
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com';

// Load CSV data
function loadCSVData() {
  try {
    const csvPath = path.join(__dirname, '..', 'Key Account Domains.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const companies = [];
    for (let i = 1; i < Math.min(11, lines.length); i++) { // Test first 10 companies to control costs
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= headers.length && values[0]) {
        const domain = values[0].toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
        // Extract company name from domain (remove .com, .net, etc.)
        const companyName = domain.split('.')[0]
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        companies.push({
          domain: domain,
          name: companyName,
          industry: 'Technology', // Default since we don't have industry data
          accountOwner: values[2] || 'Unknown'
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

// Build Elasticsearch DSL query for CFO/CEO search
function buildExecutiveSearchQuery(companyName, role) {
  const roleVariations = {
    'CFO': ['CFO', 'Chief Financial Officer', 'Finance Director', 'VP Finance', 'VP of Finance'],
    'CEO': ['CEO', 'Chief Executive Officer', 'President', 'Managing Director', 'Chief Executive']
  };
  
  const variations = roleVariations[role] || [role];
  
  return {
    query: {
      bool: {
        must: [
          // Company name matching
          {
            bool: {
              should: [
                { match_phrase: { 'active_experience_company_name': companyName } },
                { match_phrase: { 'company_name': companyName } },
                { 
                  nested: {
                    path: 'experience',
                    query: {
                      bool: {
                        must: [
                          { match_phrase: { 'experience.company_name': companyName } },
                          { term: { 'experience.active_experience': 1 } }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          },
          // Role matching
          {
            bool: {
              should: variations.map(variation => ({
                bool: {
                  should: [
                    { match: { 'active_experience_title': variation } },
                    { match: { 'headline': variation } },
                    {
                      nested: {
                        path: 'experience',
                        query: {
                          match: { 'experience.position_title': variation }
                        }
                      }
                    }
                  ]
                }
              }))
            }
          },
          // Must be currently working
          { term: { 'is_working': 1 } }
        ],
        must_not: [
          // Exclude former employees
          { match: { 'headline': 'former' } },
          { match: { 'headline': 'ex-' } },
          { match: { 'headline': 'retired' } },
          { match: { 'active_experience_title': 'former' } },
          { match: { 'active_experience_title': 'ex-' } }
        ]
      }
    },
    size: 5,
    sort: [
      { 'updated_at': { 'order': 'desc' } },
      { '_score': { 'order': 'desc' } }
    ]
  };
}

// Search CoreSignal using Elasticsearch DSL
async function searchCoreSignalExecutives(companyName, role) {
  try {
    const query = buildExecutiveSearchQuery(companyName, role);
    const url = `${CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5`;
    
    console.log(`🔍 Searching for ${role} at ${companyName}...`);
    console.log(`📋 Query:`, JSON.stringify(query, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📊 Search response:`, JSON.stringify(data, null, 2));
    
    // Extract candidate IDs from search response
    const candidateIds = [];
    if (data.hits && data.hits.hits) {
      for (const hit of data.hits.hits) {
        if (hit._source && hit._source.id) {
          candidateIds.push(hit._source.id.toString());
        }
      }
    }
    
    console.log(`🎯 Found ${candidateIds.length} candidate IDs:`, candidateIds);
    
    // Now collect detailed profiles
    if (candidateIds.length > 0) {
      const profiles = await collectProfiles(candidateIds);
      return profiles;
    }
    
    return [];
    
  } catch (error) {
    console.error(`❌ CoreSignal search error for ${companyName} ${role}:`, error.message);
    return [];
  }
}

// Collect detailed profiles
async function collectProfiles(candidateIds) {
  const profiles = [];
  
  for (const id of candidateIds.slice(0, 3)) { // Limit to 3 profiles to control costs
    try {
      const url = `${CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/collect/${id}`;
      
      console.log(`📥 Collecting profile for ID: ${id}`);
      
      const response = await fetch(url, {
        headers: {
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log(`⚠️  Profile collection failed for ID ${id}: ${response.status}`);
        continue;
      }
      
      const profile = await response.json();
      profiles.push(profile);
      
      console.log(`✅ Collected profile: ${profile.full_name} - ${profile.active_experience_title}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error collecting profile ${id}:`, error.message);
    }
  }
  
  return profiles;
}

// Calculate confidence score
function calculateConfidenceScore(person, targetRole, companyName) {
  let score = 0;
  let reasons = [];
  
  // Title matching (40 points max)
  const title = (person.active_experience_title || '').toLowerCase();
  const role = targetRole.toLowerCase();
  
  if (title.includes(role)) {
    score += 40;
    reasons.push(`Exact role match: "${person.active_experience_title}"`);
  } else if (title.includes('chief') && role.includes('chief')) {
    score += 35;
    reasons.push(`C-level match: "${person.active_experience_title}"`);
  } else if ((role === 'cfo' && title.includes('finance')) || (role === 'ceo' && title.includes('executive'))) {
    score += 30;
    reasons.push(`Department match: "${person.active_experience_title}"`);
  }
  
  // Company verification (25 points max)
  const personCompany = (person.active_experience_company_name || person.company_name || '').toLowerCase();
  const targetCompany = companyName.toLowerCase();
  
  if (personCompany.includes(targetCompany) || targetCompany.includes(personCompany)) {
    score += 25;
    reasons.push(`Company match: "${person.active_experience_company_name || person.company_name}"`);
  }
  
  // Contact information (15 points max)
  if (person.primary_professional_email) {
    score += 10;
    reasons.push('Professional email available');
    
    if (person.primary_professional_email_status === 'verified') {
      score += 5;
      reasons.push('Email verified');
    }
  }
  
  // Profile completeness (10 points max)
  if (person.full_name && person.headline) {
    score += 5;
    reasons.push('Complete profile');
  }
  
  if (person.connections_count > 100) {
    score += 5;
    reasons.push(`Active profile (${person.connections_count} connections)`);
  }
  
  // Data freshness (10 points max)
  if (person.updated_at) {
    const updatedDate = new Date(person.updated_at);
    const monthsOld = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsOld < 3) {
      score += 10;
      reasons.push('Recently updated profile');
    } else if (monthsOld < 6) {
      score += 5;
      reasons.push('Moderately recent profile');
    }
  }
  
  return {
    score: Math.min(100, score),
    reasons,
    level: getConfidenceLevel(score)
  };
}

function getConfidenceLevel(score) {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 80) return 'VERY_GOOD';
  if (score >= 70) return 'GOOD';
  if (score >= 60) return 'FAIR';
  return 'POOR';
}

// Main test function
async function testCFOCEOEnrichment() {
  console.log('🚀 Starting CFO/CEO Enrichment Test with Elasticsearch DSL');
  console.log('=' .repeat(60));
  
  const companies = loadCSVData();
  if (companies.length === 0) {
    console.log('❌ No companies loaded. Exiting.');
    return;
  }
  
  const results = [];
  let totalTests = 0;
  let successfulFinds = 0;
  let highConfidenceFinds = 0;
  
  for (const company of companies) {
    console.log(`\n🏢 Testing: ${company.name} (${company.domain})`);
    console.log('-'.repeat(50));
    
    const companyResult = {
      company: company.name,
      domain: company.domain,
      industry: company.industry,
      cfo: null,
      ceo: null,
      cfoConfidence: 0,
      ceoConfidence: 0,
      timestamp: new Date().toISOString()
    };
    
    // Test CFO search
    totalTests++;
    const cfoProfiles = await searchCoreSignalExecutives(company.name, 'CFO');
    
    if (cfoProfiles.length > 0) {
      const bestCFO = cfoProfiles[0];
      const confidence = calculateConfidenceScore(bestCFO, 'CFO', company.name);
      
      companyResult.cfo = {
        name: bestCFO.full_name,
        title: bestCFO.active_experience_title,
        email: bestCFO.primary_professional_email,
        emailStatus: bestCFO.primary_professional_email_status,
        confidence: confidence.score,
        reasons: confidence.reasons
      };
      companyResult.cfoConfidence = confidence.score;
      
      successfulFinds++;
      if (confidence.score >= 80) highConfidenceFinds++;
      
      console.log(`✅ CFO Found: ${bestCFO.full_name} - ${bestCFO.active_experience_title}`);
      console.log(`   Email: ${bestCFO.primary_professional_email || 'Not available'}`);
      console.log(`   Confidence: ${confidence.score}% (${confidence.level})`);
    } else {
      console.log('❌ CFO Not Found');
    }
    
    // Test CEO search
    totalTests++;
    const ceoProfiles = await searchCoreSignalExecutives(company.name, 'CEO');
    
    if (ceoProfiles.length > 0) {
      const bestCEO = ceoProfiles[0];
      const confidence = calculateConfidenceScore(bestCEO, 'CEO', company.name);
      
      companyResult.ceo = {
        name: bestCEO.full_name,
        title: bestCEO.active_experience_title,
        email: bestCEO.primary_professional_email,
        emailStatus: bestCEO.primary_professional_email_status,
        confidence: confidence.score,
        reasons: confidence.reasons
      };
      companyResult.ceoConfidence = confidence.score;
      
      successfulFinds++;
      if (confidence.score >= 80) highConfidenceFinds++;
      
      console.log(`✅ CEO Found: ${bestCEO.full_name} - ${bestCEO.active_experience_title}`);
      console.log(`   Email: ${bestCEO.primary_professional_email || 'Not available'}`);
      console.log(`   Confidence: ${confidence.score}% (${confidence.level})`);
    } else {
      console.log('❌ CEO Not Found');
    }
    
    results.push(companyResult);
    
    // Rate limiting between companies
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate comprehensive report
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL ACCURACY REPORT');
  console.log('='.repeat(60));
  
  const overallAccuracy = (successfulFinds / totalTests) * 100;
  const highConfidenceAccuracy = (highConfidenceFinds / totalTests) * 100;
  
  console.log(`\n📈 ACCURACY METRICS:`);
  console.log(`   Total Searches: ${totalTests}`);
  console.log(`   Successful Finds: ${successfulFinds}`);
  console.log(`   High Confidence (80%+): ${highConfidenceFinds}`);
  console.log(`   Overall Accuracy: ${overallAccuracy.toFixed(1)}%`);
  console.log(`   High Confidence Rate: ${highConfidenceAccuracy.toFixed(1)}%`);
  
  // Benchmark comparison
  console.log(`\n🎯 BENCHMARK COMPARISON:`);
  if (overallAccuracy > 80) {
    console.log(`   ✅ EXCEEDS 80% benchmark by ${(overallAccuracy - 80).toFixed(1)}%`);
    console.log(`   🏆 READY TO WIN THE ACCOUNT!`);
  } else {
    console.log(`   ⚠️  Below 80% benchmark by ${(80 - overallAccuracy).toFixed(1)}%`);
    console.log(`   🔧 Needs improvement for account win`);
  }
  
  // Save results
  const reportPath = path.join(__dirname, '..', 'cfo-ceo-elasticsearch-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalTests,
      successfulFinds,
      highConfidenceFinds,
      overallAccuracy,
      highConfidenceAccuracy,
      benchmarkMet: overallAccuracy >= 80,
      timestamp: new Date().toISOString()
    },
    results
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved to: ${reportPath}`);
  console.log('\n🎉 Test completed successfully!');
}

// Run the test
if (require.main === module) {
  testCFOCEOEnrichment().catch(console.error);
}

module.exports = { testCFOCEOEnrichment };
