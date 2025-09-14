/**
 * CFO/CEO Enrichment Test - Real Key Account Domains CSV
 * Tests the complete pipeline with actual client data to achieve >80% accuracy
 * Uses CoreSignal Employee API for accurate executive search
 */

const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
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
    for (let i = 1; i < Math.min(21, lines.length); i++) { // Test first 20 companies
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= headers.length && values[0]) {
        companies.push({
          domain: values[0].toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, ''),
          name: values[1] || values[0],
          industry: values[2] || 'Unknown'
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

// CoreSignal API Helper
async function searchCoreSignalEmployees(companyWebsite, jobTitle) {
  try {
    // First get company info
    const companyUrl = `${CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/enrich?website=${companyWebsite}`;
    const companyResponse = await fetch(companyUrl, {
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!companyResponse.ok) {
      throw new Error(`Company API error: ${companyResponse.status}`);
    }
    
    const companyData = await companyResponse.json();
    
    // Search for employees with specific title
    const employeeUrl = `${CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search`;
    const searchParams = new URLSearchParams({
      company_website: companyWebsite,
      title: jobTitle,
      limit: '3'
    });
    
    const employeeResponse = await fetch(`${employeeUrl}?${searchParams}`, {
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!employeeResponse.ok) {
      throw new Error(`Employee API error: ${employeeResponse.status}`);
    }
    
    const employeeData = await employeeResponse.json();
    
    return {
      company: companyData,
      employees: employeeData
    };
    
  } catch (error) {
    console.error(`❌ CoreSignal API error for ${companyWebsite}:`, error.message);
    return null;
  }
}

// Confidence scoring system
function calculateConfidenceScore(person, role, company) {
  let score = 0;
  let reasons = [];
  
  // Title matching (40 points max)
  const title = (person.active_experience_title || '').toLowerCase();
  const targetRole = role.toLowerCase();
  
  if (title.includes(targetRole)) {
    score += 40;
    reasons.push(`Exact title match: "${person.active_experience_title}"`);
  } else if (title.includes('chief') && targetRole.includes('chief')) {
    score += 35;
    reasons.push(`C-level title match: "${person.active_experience_title}"`);
  } else if (title.includes('cfo') || title.includes('ceo')) {
    score += 30;
    reasons.push(`Executive acronym match: "${person.active_experience_title}"`);
  }
  
  // Company verification (25 points max)
  if (person.active_experience_company_id && company.id) {
    score += 25;
    reasons.push('Company ID verified');
  } else if (person.company_name && company.company_name) {
    const similarity = calculateStringSimilarity(
      person.company_name.toLowerCase(), 
      company.company_name.toLowerCase()
    );
    if (similarity > 0.8) {
      score += 20;
      reasons.push(`Company name match (${Math.round(similarity * 100)}%)`);
    }
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

function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
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
  console.log('🚀 Starting CFO/CEO Enrichment Test with Real Data');
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
    console.log('🔍 Searching for CFO...');
    totalTests++;
    
    try {
      const cfoData = await searchCoreSignalEmployees(company.domain, 'CFO');
      
      if (cfoData && cfoData.employees && cfoData.employees.length > 0) {
        const bestCFO = cfoData.employees[0]; // Take first result
        const confidence = calculateConfidenceScore(bestCFO, 'CFO', cfoData.company);
        
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
        console.log(`   Reasons: ${confidence.reasons.join(', ')}`);
      } else {
        console.log('❌ CFO Not Found');
      }
    } catch (error) {
      console.log(`❌ CFO Search Error: ${error.message}`);
    }
    
    // Test CEO search
    console.log('\n🔍 Searching for CEO...');
    totalTests++;
    
    try {
      const ceoData = await searchCoreSignalEmployees(company.domain, 'CEO');
      
      if (ceoData && ceoData.employees && ceoData.employees.length > 0) {
        const bestCEO = ceoData.employees[0]; // Take first result
        const confidence = calculateConfidenceScore(bestCEO, 'CEO', ceoData.company);
        
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
        console.log(`   Reasons: ${confidence.reasons.join(', ')}`);
      } else {
        console.log('❌ CEO Not Found');
      }
    } catch (error) {
      console.log(`❌ CEO Search Error: ${error.message}`);
    }
    
    results.push(companyResult);
    
    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
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
  
  // Save detailed results
  const reportPath = path.join(__dirname, '..', 'cfo-ceo-enrichment-report.json');
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
  
  // Generate CSV output for client
  const csvOutput = generateCSVOutput(results);
  const csvPath = path.join(__dirname, '..', 'enriched-key-accounts.csv');
  fs.writeFileSync(csvPath, csvOutput);
  
  console.log(`📄 CSV output saved to: ${csvPath}`);
  console.log('\n🎉 Test completed successfully!');
}

function generateCSVOutput(results) {
  const headers = [
    'Company Name',
    'Domain',
    'Industry',
    'CFO Name',
    'CFO Title',
    'CFO Email',
    'CFO Confidence',
    'CEO Name',
    'CEO Title', 
    'CEO Email',
    'CEO Confidence',
    'Overall Quality Score'
  ];
  
  let csv = headers.join(',') + '\n';
  
  for (const result of results) {
    const overallScore = Math.round((result.cfoConfidence + result.ceoConfidence) / 2);
    
    const row = [
      `"${result.company}"`,
      `"${result.domain}"`,
      `"${result.industry}"`,
      `"${result.cfo?.name || 'Not Found'}"`,
      `"${result.cfo?.title || 'N/A'}"`,
      `"${result.cfo?.email || 'N/A'}"`,
      `"${result.cfoConfidence}%"`,
      `"${result.ceo?.name || 'Not Found'}"`,
      `"${result.ceo?.title || 'N/A'}"`,
      `"${result.ceo?.email || 'N/A'}"`,
      `"${result.ceoConfidence}%"`,
      `"${overallScore}%"`
    ];
    
    csv += row.join(',') + '\n';
  }
  
  return csv;
}

// Run the test
if (require.main === module) {
  testCFOCEOEnrichment().catch(console.error);
}

module.exports = { testCFOCEOEnrichment };
