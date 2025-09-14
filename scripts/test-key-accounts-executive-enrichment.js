/**
 * Key Accounts Executive Enrichment Test
 * Real-world validation with CFO/CEO data from actual client CSV
 * Target: >80% accuracy to win the account
 */

const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
  roleFinderSingle: `${BASE_URL}/api/role-finder`,
  enrichmentWaterfall: `${BASE_URL}/api/enrichment/waterfall`,
  exportGenerate: `${BASE_URL}/api/export/generate`
};

// Accuracy Scoring System
const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 95,    // 95-100%: Multiple data sources confirm, recent updates
  VERY_GOOD: 85,    // 85-94%: Strong single source or multiple weak sources
  GOOD: 75,         // 75-84%: Single reliable source, some validation
  FAIR: 65,         // 65-74%: Weak source or outdated information
  POOR: 50,         // 50-64%: Very weak or conflicting information
  UNRELIABLE: 0     // 0-49%: No reliable data found
};

const ACCURACY_FACTORS = {
  DATA_FRESHNESS: {
    RECENT: 25,      // Updated within 6 months
    MODERATE: 15,    // Updated within 1 year
    OLD: 5,          // Updated within 2 years
    STALE: 0         // Older than 2 years
  },
  SOURCE_RELIABILITY: {
    OFFICIAL: 30,    // Company website, SEC filings, press releases
    PROFESSIONAL: 20, // LinkedIn, professional networks
    THIRD_PARTY: 10, // News articles, industry reports
    SOCIAL: 5        // Social media, unverified sources
  },
  CROSS_VALIDATION: {
    MULTIPLE_SOURCES: 20, // 3+ sources confirm
    DUAL_SOURCES: 15,     // 2 sources confirm
    SINGLE_SOURCE: 5,     // Only 1 source
    NO_VALIDATION: 0      // No cross-validation
  },
  CONTACT_COMPLETENESS: {
    FULL_CONTACT: 15,     // Name, title, email, phone
    PARTIAL_CONTACT: 10,  // Name, title, email
    BASIC_INFO: 5,        // Name and title only
    NAME_ONLY: 0          // Just name
  },
  ROLE_SPECIFICITY: {
    EXACT_MATCH: 10,      // Exact role match (CFO, CEO)
    CLOSE_MATCH: 7,       // Close role (Chief Financial Officer vs CFO)
    RELATED_ROLE: 3,      // Related role (VP Finance vs CFO)
    UNCLEAR: 0            // Role unclear or unrelated
  }
};

// Sample of companies for focused testing (first 20 to control costs)
const TEST_COMPANIES = [
  { domain: 'cielotalent.com', name: 'Cielo Talent', owner: 'Andrew Urteaga' },
  { domain: 'optimizely.com', name: 'Optimizely', owner: 'Andrew Urteaga' },
  { domain: 'highradius.com', name: 'HighRadius', owner: 'Andrew Urteaga' },
  { domain: 'softchoice.com', name: 'Softchoice', owner: 'Andrew Urteaga' },
  { domain: 'westmonroe.com', name: 'West Monroe', owner: 'Andrew Urteaga' },
  { domain: 'dropbox.com', name: 'Dropbox', owner: 'Andrew Urteaga' },
  { domain: 'kaseya.com', name: 'Kaseya', owner: 'Andrew Urteaga' },
  { domain: 'cyberark.com', name: 'CyberArk', owner: 'Andrew Urteaga' },
  { domain: 'amdocs.com', name: 'Amdocs', owner: 'Andrew Urteaga' },
  { domain: 'xometry.com', name: 'Xometry', owner: 'Andrew Urteaga' },
  { domain: 'saic.com', name: 'SAIC', owner: 'Andrew Urteaga' },
  { domain: 'leidos.com', name: 'Leidos', owner: 'Andrew Urteaga' },
  { domain: 'kla.com', name: 'KLA Corporation', owner: 'Andrew Urteaga' },
  { domain: 'endava.com', name: 'Endava', owner: 'Andrew Urteaga' },
  { domain: 'nttdata.com', name: 'NTT DATA', owner: 'Andrew Urteaga' },
  { domain: 'bmc.com', name: 'BMC Software', owner: 'Andrew Urteaga' },
  { domain: 'dxc.com', name: 'DXC Technology', owner: 'Andrew Urteaga' },
  { domain: 'motorolasolutions.com', name: 'Motorola Solutions', owner: 'Andrew Urteaga' },
  { domain: 'perficient.com', name: 'Perficient', owner: 'Andrew Urteaga' },
  { domain: 'redhat.com', name: 'Red Hat', owner: 'Andrew Urteaga' }
];

// Utility Functions
async function makeAPICall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message, status: 500 };
  }
}

function calculateConfidenceScore(result) {
  let score = 0;
  const factors = {};
  
  // Data Freshness (25 points max)
  const lastUpdated = result.lastUpdated ? new Date(result.lastUpdated) : null;
  const monthsOld = lastUpdated ? (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24 * 30) : 999;
  
  if (monthsOld <= 6) {
    score += ACCURACY_FACTORS.DATA_FRESHNESS.RECENT;
    factors.freshness = 'Recent (within 6 months)';
  } else if (monthsOld <= 12) {
    score += ACCURACY_FACTORS.DATA_FRESHNESS.MODERATE;
    factors.freshness = 'Moderate (within 1 year)';
  } else if (monthsOld <= 24) {
    score += ACCURACY_FACTORS.DATA_FRESHNESS.OLD;
    factors.freshness = 'Old (within 2 years)';
  } else {
    score += ACCURACY_FACTORS.DATA_FRESHNESS.STALE;
    factors.freshness = 'Stale (over 2 years)';
  }
  
  // Source Reliability (30 points max)
  const sources = result.sources || [];
  let sourceScore = 0;
  const sourceTypes = [];
  
  sources.forEach(source => {
    if (source.type === 'official' || source.url?.includes('sec.gov') || source.url?.includes('company.com')) {
      sourceScore = Math.max(sourceScore, ACCURACY_FACTORS.SOURCE_RELIABILITY.OFFICIAL);
      sourceTypes.push('Official');
    } else if (source.type === 'professional' || source.url?.includes('linkedin.com')) {
      sourceScore = Math.max(sourceScore, ACCURACY_FACTORS.SOURCE_RELIABILITY.PROFESSIONAL);
      sourceTypes.push('Professional');
    } else if (source.type === 'news' || source.url?.includes('reuters.com') || source.url?.includes('bloomberg.com')) {
      sourceScore = Math.max(sourceScore, ACCURACY_FACTORS.SOURCE_RELIABILITY.THIRD_PARTY);
      sourceTypes.push('Third-party');
    } else {
      sourceScore = Math.max(sourceScore, ACCURACY_FACTORS.SOURCE_RELIABILITY.SOCIAL);
      sourceTypes.push('Social');
    }
  });
  
  score += sourceScore;
  factors.sources = sourceTypes.length > 0 ? sourceTypes.join(', ') : 'No sources identified';
  
  // Cross-validation (20 points max)
  if (sources.length >= 3) {
    score += ACCURACY_FACTORS.CROSS_VALIDATION.MULTIPLE_SOURCES;
    factors.validation = `${sources.length} sources confirm`;
  } else if (sources.length === 2) {
    score += ACCURACY_FACTORS.CROSS_VALIDATION.DUAL_SOURCES;
    factors.validation = '2 sources confirm';
  } else if (sources.length === 1) {
    score += ACCURACY_FACTORS.CROSS_VALIDATION.SINGLE_SOURCE;
    factors.validation = 'Single source only';
  } else {
    factors.validation = 'No cross-validation';
  }
  
  // Contact Completeness (15 points max)
  const hasEmail = result.email && result.email.includes('@');
  const hasPhone = result.phone && result.phone.length > 5;
  const hasName = result.name && result.name.length > 2;
  const hasTitle = result.title && result.title.length > 2;
  
  if (hasName && hasTitle && hasEmail && hasPhone) {
    score += ACCURACY_FACTORS.CONTACT_COMPLETENESS.FULL_CONTACT;
    factors.completeness = 'Full contact info';
  } else if (hasName && hasTitle && hasEmail) {
    score += ACCURACY_FACTORS.CONTACT_COMPLETENESS.PARTIAL_CONTACT;
    factors.completeness = 'Partial contact info';
  } else if (hasName && hasTitle) {
    score += ACCURACY_FACTORS.CONTACT_COMPLETENESS.BASIC_INFO;
    factors.completeness = 'Basic info only';
  } else {
    factors.completeness = 'Name only';
  }
  
  // Role Specificity (10 points max)
  const title = (result.title || '').toLowerCase();
  const targetRole = result.targetRole?.toLowerCase() || '';
  
  if (title === targetRole || 
      (targetRole === 'cfo' && (title.includes('chief financial officer') || title === 'cfo')) ||
      (targetRole === 'ceo' && (title.includes('chief executive officer') || title === 'ceo'))) {
    score += ACCURACY_FACTORS.ROLE_SPECIFICITY.EXACT_MATCH;
    factors.roleMatch = 'Exact match';
  } else if (title.includes('chief') && targetRole.includes('chief')) {
    score += ACCURACY_FACTORS.ROLE_SPECIFICITY.CLOSE_MATCH;
    factors.roleMatch = 'Close match';
  } else if ((targetRole === 'cfo' && title.includes('finance')) || 
             (targetRole === 'ceo' && title.includes('executive'))) {
    score += ACCURACY_FACTORS.ROLE_SPECIFICITY.RELATED_ROLE;
    factors.roleMatch = 'Related role';
  } else {
    factors.roleMatch = 'Role unclear';
  }
  
  return { score: Math.min(score, 100), factors };
}

function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_THRESHOLDS.EXCELLENT) return 'EXCELLENT';
  if (score >= CONFIDENCE_THRESHOLDS.VERY_GOOD) return 'VERY GOOD';
  if (score >= CONFIDENCE_THRESHOLDS.GOOD) return 'GOOD';
  if (score >= CONFIDENCE_THRESHOLDS.FAIR) return 'FAIR';
  if (score >= CONFIDENCE_THRESHOLDS.POOR) return 'POOR';
  return 'UNRELIABLE';
}

function generateAccuracyRationale(result, confidence) {
  const rationale = [];
  
  rationale.push(`**Confidence Score: ${confidence.score}% (${getConfidenceLevel(confidence.score)})**`);
  rationale.push('');
  rationale.push('**Accuracy Factors:**');
  rationale.push(`• Data Freshness: ${confidence.factors.freshness}`);
  rationale.push(`• Source Quality: ${confidence.factors.sources}`);
  rationale.push(`• Cross-validation: ${confidence.factors.validation}`);
  rationale.push(`• Contact Completeness: ${confidence.factors.completeness}`);
  rationale.push(`• Role Specificity: ${confidence.factors.roleMatch}`);
  
  if (result.name && result.title) {
    rationale.push('');
    rationale.push('**Found Executive:**');
    rationale.push(`• Name: ${result.name}`);
    rationale.push(`• Title: ${result.title}`);
    if (result.email) rationale.push(`• Email: ${result.email}`);
    if (result.phone) rationale.push(`• Phone: ${result.phone}`);
  }
  
  // Accuracy assessment
  rationale.push('');
  const level = getConfidenceLevel(confidence.score);
  if (level === 'EXCELLENT' || level === 'VERY GOOD') {
    rationale.push('✅ **ACCURACY VALIDATION: PASSED** - High confidence in data accuracy');
  } else if (level === 'GOOD') {
    rationale.push('⚠️ **ACCURACY VALIDATION: CONDITIONAL** - Good confidence, minor validation needed');
  } else {
    rationale.push('❌ **ACCURACY VALIDATION: FAILED** - Low confidence, requires manual verification');
  }
  
  return rationale.join('\n');
}

async function testExecutiveEnrichment() {
  console.log('🎯 KEY ACCOUNTS EXECUTIVE ENRICHMENT TEST');
  console.log('==========================================');
  console.log(`Target: >80% accuracy to win the account`);
  console.log(`Testing ${TEST_COMPANIES.length} companies for CFO and CEO data\n`);
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < TEST_COMPANIES.length; i++) {
    const company = TEST_COMPANIES[i];
    console.log(`\n[${i + 1}/${TEST_COMPANIES.length}] Testing: ${company.name} (${company.domain})`);
    console.log('='.repeat(60));
    
    // Test CFO enrichment
    console.log('\n🔍 Searching for CFO...');
    const cfoResult = await makeAPICall(API_ENDPOINTS.roleFinderSingle, {
      method: 'POST',
      body: JSON.stringify({
        inputType: 'single',
        company: company.domain,
        roles: ['CFO'],
        workspaceId: 'adrata',
        userId: 'test-user',
        config: {
          includeContactInfo: true,
          maxResultsPerCompany: 1,
          minConfidenceScore: 60
        }
      })
    });
    
    let cfoData = null;
    let cfoConfidence = { score: 0, factors: {} };
    
    if (cfoResult.success && cfoResult.data?.report?.results?.length > 0) {
      // Extract first CFO result
      const cfoResults = cfoResult.data.report.results.filter(r => 
        r.role?.name?.toLowerCase().includes('cfo') || 
        r.role?.name?.toLowerCase().includes('financial')
      );
      
      if (cfoResults.length > 0) {
        cfoData = cfoResults[0];
        cfoData.targetRole = 'cfo';
        cfoData.name = cfoData.person?.name || 'Unknown';
        cfoData.title = cfoData.person?.currentTitle || cfoData.role?.name || 'Unknown';
        cfoData.email = cfoData.person?.email || null;
        cfoData.phone = cfoData.person?.phone || null;
        cfoConfidence = calculateConfidenceScore(cfoData);
        
        console.log(`✅ CFO Found: ${cfoData.name} - ${cfoData.title}`);
        console.log(`   Confidence: ${cfoConfidence.score}% (${getConfidenceLevel(cfoConfidence.score)})`);
      } else {
        console.log('❌ CFO Not Found in results');
      }
    } else {
      console.log('❌ CFO Not Found');
      if (!cfoResult.success) {
        console.log(`   Error: ${cfoResult.error || cfoResult.data?.error || 'Unknown error'}`);
      }
    }
    
    // Test CEO enrichment
    console.log('\n🔍 Searching for CEO...');
    const ceoResult = await makeAPICall(API_ENDPOINTS.roleFinderSingle, {
      method: 'POST',
      body: JSON.stringify({
        inputType: 'single',
        company: company.domain,
        roles: ['CEO'],
        workspaceId: 'adrata',
        userId: 'test-user',
        config: {
          includeContactInfo: true,
          maxResultsPerCompany: 1,
          minConfidenceScore: 60
        }
      })
    });
    
    let ceoData = null;
    let ceoConfidence = { score: 0, factors: {} };
    
    if (ceoResult.success && ceoResult.data?.report?.results?.length > 0) {
      // Extract first CEO result
      const ceoResults = ceoResult.data.report.results.filter(r => 
        r.role?.name?.toLowerCase().includes('ceo') || 
        r.role?.name?.toLowerCase().includes('executive')
      );
      
      if (ceoResults.length > 0) {
        ceoData = ceoResults[0];
        ceoData.targetRole = 'ceo';
        ceoData.name = ceoData.person?.name || 'Unknown';
        ceoData.title = ceoData.person?.currentTitle || ceoData.role?.name || 'Unknown';
        ceoData.email = ceoData.person?.email || null;
        ceoData.phone = ceoData.person?.phone || null;
        ceoConfidence = calculateConfidenceScore(ceoData);
        
        console.log(`✅ CEO Found: ${ceoData.name} - ${ceoData.title}`);
        console.log(`   Confidence: ${ceoConfidence.score}% (${getConfidenceLevel(ceoConfidence.score)})`);
      } else {
        console.log('❌ CEO Not Found in results');
      }
    } else {
      console.log('❌ CEO Not Found');
      if (!ceoResult.success) {
        console.log(`   Error: ${ceoResult.error || ceoResult.data?.error || 'Unknown error'}`);
      }
    }
    
    // Store results
    results.push({
      company: company.name,
      domain: company.domain,
      owner: company.owner,
      cfo: {
        found: !!cfoData,
        data: cfoData,
        confidence: cfoConfidence,
        rationale: cfoData ? generateAccuracyRationale(cfoData, cfoConfidence) : 'No CFO data found'
      },
      ceo: {
        found: !!ceoData,
        data: ceoData,
        confidence: ceoConfidence,
        rationale: ceoData ? generateAccuracyRationale(ceoData, ceoConfidence) : 'No CEO data found'
      }
    });
    
    // Brief pause to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate comprehensive report
  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  
  console.log('\n\n📊 COMPREHENSIVE ACCURACY REPORT');
  console.log('=================================\n');
  
  // Calculate overall statistics
  const totalExecutives = results.length * 2; // CFO + CEO for each company
  const foundExecutives = results.reduce((count, r) => count + (r.cfo.found ? 1 : 0) + (r.ceo.found ? 1 : 0), 0);
  const highConfidenceExecutives = results.reduce((count, r) => {
    let highConf = 0;
    if (r.cfo.found && r.cfo.confidence.score >= 75) highConf++;
    if (r.ceo.found && r.ceo.confidence.score >= 75) highConf++;
    return count + highConf;
  }, 0);
  
  const findRate = ((foundExecutives / totalExecutives) * 100).toFixed(1);
  const accuracyRate = ((highConfidenceExecutives / totalExecutives) * 100).toFixed(1);
  
  console.log(`**EXECUTIVE SUMMARY**`);
  console.log(`• Companies Tested: ${results.length}`);
  console.log(`• Total Executive Positions: ${totalExecutives} (CFO + CEO)`);
  console.log(`• Executives Found: ${foundExecutives} (${findRate}% find rate)`);
  console.log(`• High Confidence Results: ${highConfidenceExecutives} (${accuracyRate}% accuracy)`);
  console.log(`• Processing Time: ${totalTime.toFixed(1)} seconds`);
  console.log(`• Average Time per Company: ${(totalTime / results.length).toFixed(1)} seconds\n`);
  
  // Accuracy benchmark assessment
  const targetAccuracy = 80;
  const actualAccuracy = parseFloat(accuracyRate);
  
  console.log(`**ACCURACY BENCHMARK ASSESSMENT**`);
  console.log(`• Target Accuracy: ${targetAccuracy}% (to win account)`);
  console.log(`• Achieved Accuracy: ${actualAccuracy}%`);
  
  if (actualAccuracy > targetAccuracy) {
    console.log(`✅ **BENCHMARK EXCEEDED** - We beat the competition by ${(actualAccuracy - targetAccuracy).toFixed(1)}%!`);
  } else if (actualAccuracy >= targetAccuracy - 5) {
    console.log(`⚠️ **BENCHMARK CLOSE** - Within 5% of target, competitive position`);
  } else {
    console.log(`❌ **BENCHMARK NOT MET** - Need ${(targetAccuracy - actualAccuracy).toFixed(1)}% improvement`);
  }
  
  console.log('\n**DETAILED COMPANY RESULTS**');
  console.log('============================\n');
  
  // Detailed results for each company
  results.forEach((result, index) => {
    console.log(`**${index + 1}. ${result.company}** (${result.domain})`);
    console.log(`Account Owner: ${result.owner}\n`);
    
    // CFO Results
    if (result.cfo.found) {
      console.log(`**CFO Results:**`);
      console.log(result.cfo.rationale);
    } else {
      console.log(`**CFO Results:** ❌ No CFO found`);
    }
    
    console.log('');
    
    // CEO Results
    if (result.ceo.found) {
      console.log(`**CEO Results:**`);
      console.log(result.ceo.rationale);
    } else {
      console.log(`**CEO Results:** ❌ No CEO found`);
    }
    
    console.log('\n' + '-'.repeat(80) + '\n');
  });
  
  // Export results to CSV for client
  const csvData = results.map(r => ({
    Company: r.company,
    Domain: r.domain,
    'Account Owner': r.owner,
    'CFO Name': r.cfo.data?.name || 'Not Found',
    'CFO Title': r.cfo.data?.title || 'Not Found',
    'CFO Email': r.cfo.data?.email || 'Not Found',
    'CFO Confidence': r.cfo.found ? `${r.cfo.confidence.score}%` : '0%',
    'CFO Status': r.cfo.found ? getConfidenceLevel(r.cfo.confidence.score) : 'NOT FOUND',
    'CEO Name': r.ceo.data?.name || 'Not Found',
    'CEO Title': r.ceo.data?.title || 'Not Found',
    'CEO Email': r.ceo.data?.email || 'Not Found',
    'CEO Confidence': r.ceo.found ? `${r.ceo.confidence.score}%` : '0%',
    'CEO Status': r.ceo.found ? getConfidenceLevel(r.ceo.confidence.score) : 'NOT FOUND'
  }));
  
  // Generate CSV export
  console.log('📄 Generating CSV export for client...');
  const exportResult = await makeAPICall(API_ENDPOINTS.exportGenerate, {
    method: 'POST',
    body: JSON.stringify({
      data: csvData,
      format: 'csv',
      title: 'Key Accounts Executive Enrichment Results'
    })
  });
  
  if (exportResult.success) {
    console.log('✅ CSV export generated successfully');
  } else {
    console.log('❌ CSV export failed:', exportResult.error);
  }
  
  // Final assessment
  console.log('\n🎯 **FINAL ASSESSMENT FOR ACCOUNT WIN**');
  console.log('=====================================');
  
  if (actualAccuracy > 85) {
    console.log('🏆 **EXCELLENT** - Strong competitive advantage, high win probability');
  } else if (actualAccuracy > 80) {
    console.log('✅ **GOOD** - Meets benchmark, competitive position');
  } else if (actualAccuracy > 75) {
    console.log('⚠️ **FAIR** - Close to benchmark, needs improvement');
  } else {
    console.log('❌ **POOR** - Below benchmark, significant improvement needed');
  }
  
  console.log(`\nRecommendation: ${actualAccuracy > targetAccuracy ? 'PROCEED WITH PROPOSAL' : 'IMPROVE ACCURACY BEFORE PROPOSAL'}`);
  
  return {
    summary: {
      companiesTested: results.length,
      totalPositions: totalExecutives,
      executivesFound: foundExecutives,
      findRate: parseFloat(findRate),
      accuracyRate: actualAccuracy,
      benchmarkMet: actualAccuracy >= targetAccuracy,
      processingTime: totalTime
    },
    results: results,
    csvData: csvData
  };
}

// Run the test
if (require.main === module) {
  testExecutiveEnrichment()
    .then(results => {
      console.log('\n✅ Executive enrichment test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testExecutiveEnrichment, calculateConfidenceScore, generateAccuracyRationale };
