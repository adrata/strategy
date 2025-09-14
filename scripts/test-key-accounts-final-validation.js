/**
 * FINAL KEY ACCOUNTS VALIDATION TEST
 * Tests the complete pipeline with actual Key Account Domains CSV
 * Real-world scenario: Find CFO and CEO for client's key accounts
 */

const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY';

// Load and parse CSV data
function loadKeyAccountsCSV() {
  try {
    const csvPath = path.join(__dirname, '..', 'Key Account Domains.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    console.log(`📊 Loaded ${lines.length - 1} companies from Key Account Domains CSV`);
    
    const companies = [];
    // Test first 10 companies to control costs but validate accuracy
    for (let i = 1; i < Math.min(11, lines.length); i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length >= 1 && values[0]) {
        const domain = values[0].toLowerCase().replace(/^https?:\\/\\//, '').replace(/^www\\./, '');
        const companyName = domain.split('.')[0]
          .replace(/-/g, ' ')
          .replace(/\\b\\w/g, l => l.toUpperCase());
        
        companies.push({
          domain: domain,
          name: companyName,
          originalLine: lines[i]
        });
      }
    }
    
    return companies;
  } catch (error) {
    console.error('❌ Error loading CSV:', error.message);
    return [];
  }
}

// Test Results Tracking
let results = {
  totalCompanies: 0,
  successfulCFO: 0,
  successfulCEO: 0,
  totalExecutives: 0,
  foundExecutives: 0,
  executiveDetails: [],
  errors: []
};

/**
 * Find executives for a single company
 */
async function findExecutivesForCompany(company) {
  console.log(`\\n🏢 Processing: ${company.name} (${company.domain})`);
  console.log('-'.repeat(60));
  
  const companyResult = {
    company: company.name,
    domain: company.domain,
    cfo: null,
    ceo: null,
    success: false
  };
  
  try {
    // Find CFO
    console.log('🔍 Searching for CFO...');
    const cfoResponse = await fetch(`${BASE_URL}/api/role-finder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    
    results.totalExecutives++;
    
    if (cfoResponse.ok) {
      const cfoData = await cfoResponse.json();
      if (cfoData.success && cfoData.data?.report?.results?.length > 0) {
        const cfo = cfoData.data.report.results[0];
        companyResult.cfo = {
          name: cfo.person?.fullName || 'Unknown',
          title: cfo.role?.name || 'Unknown',
          email: cfo.person?.email || cfo.contactInfo?.email || null,
          confidence: cfo.confidence || 0
        };
        results.successfulCFO++;
        results.foundExecutives++;
        console.log(`✅ CFO Found: ${companyResult.cfo.name} - ${companyResult.cfo.title}`);
        if (companyResult.cfo.email) {
          console.log(`   Email: ${companyResult.cfo.email}`);
        }
      } else {
        console.log('❌ CFO not found');
      }
    } else {
      console.log(`❌ CFO search failed: ${cfoResponse.status}`);
      results.errors.push(`${company.name} CFO: HTTP ${cfoResponse.status}`);
    }
    
    // Find CEO
    console.log('🔍 Searching for CEO...');
    const ceoResponse = await fetch(`${BASE_URL}/api/role-finder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    
    results.totalExecutives++;
    
    if (ceoResponse.ok) {
      const ceoData = await ceoResponse.json();
      if (ceoData.success && ceoData.data?.report?.results?.length > 0) {
        const ceo = ceoData.data.report.results[0];
        companyResult.ceo = {
          name: ceo.person?.fullName || 'Unknown',
          title: ceo.role?.name || 'Unknown',
          email: ceo.person?.email || ceo.contactInfo?.email || null,
          confidence: ceo.confidence || 0
        };
        results.successfulCEO++;
        results.foundExecutives++;
        console.log(`✅ CEO Found: ${companyResult.ceo.name} - ${companyResult.ceo.title}`);
        if (companyResult.ceo.email) {
          console.log(`   Email: ${companyResult.ceo.email}`);
        }
      } else {
        console.log('❌ CEO not found');
      }
    } else {
      console.log(`❌ CEO search failed: ${ceoResponse.status}`);
      results.errors.push(`${company.name} CEO: HTTP ${ceoResponse.status}`);
    }
    
    // Mark as successful if we found at least one executive
    companyResult.success = !!(companyResult.cfo || companyResult.ceo);
    
  } catch (error) {
    console.error(`❌ Error processing ${company.name}:`, error.message);
    results.errors.push(`${company.name}: ${error.message}`);
  }
  
  results.executiveDetails.push(companyResult);
  return companyResult;
}

/**
 * Generate CSV output with results
 */
function generateCSVOutput() {
  const csvHeaders = [
    'Company Name',
    'Domain',
    'CFO Name',
    'CFO Title', 
    'CFO Email',
    'CFO Confidence',
    'CEO Name',
    'CEO Title',
    'CEO Email', 
    'CEO Confidence',
    'Success'
  ];
  
  const csvRows = [csvHeaders.join(',')];
  
  results.executiveDetails.forEach(company => {
    const row = [
      `"${company.company}"`,
      `"${company.domain}"`,
      `"${company.cfo?.name || 'Not Found'}"`,
      `"${company.cfo?.title || 'Not Found'}"`,
      `"${company.cfo?.email || 'Not Found'}"`,
      company.cfo?.confidence || 0,
      `"${company.ceo?.name || 'Not Found'}"`,
      `"${company.ceo?.title || 'Not Found'}"`,
      `"${company.ceo?.email || 'Not Found'}"`,
      company.ceo?.confidence || 0,
      company.success ? 'Yes' : 'No'
    ];
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\\n');
  
  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'test-outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'key-accounts-executives-results.csv');
  fs.writeFileSync(outputPath, csvContent);
  
  console.log(`\\n📄 Results exported to: ${outputPath}`);
  return outputPath;
}

/**
 * Generate final report
 */
function generateFinalReport() {
  console.log('\\n' + '='.repeat(80));
  console.log('📊 KEY ACCOUNTS EXECUTIVE SEARCH RESULTS');
  console.log('='.repeat(80));
  
  const overallAccuracy = results.totalExecutives > 0 ? 
    (results.foundExecutives / results.totalExecutives * 100).toFixed(1) : 0;
  
  const cfoAccuracy = results.totalCompanies > 0 ? 
    (results.successfulCFO / results.totalCompanies * 100).toFixed(1) : 0;
  
  const ceoAccuracy = results.totalCompanies > 0 ? 
    (results.successfulCEO / results.totalCompanies * 100).toFixed(1) : 0;
  
  const companySuccessRate = results.totalCompanies > 0 ? 
    (results.executiveDetails.filter(c => c.success).length / results.totalCompanies * 100).toFixed(1) : 0;
  
  console.log(`🎯 Overall Executive Search Accuracy: ${overallAccuracy}% (${results.foundExecutives}/${results.totalExecutives})`);
  console.log(`👔 CFO Success Rate: ${cfoAccuracy}% (${results.successfulCFO}/${results.totalCompanies})`);
  console.log(`🏆 CEO Success Rate: ${ceoAccuracy}% (${results.successfulCEO}/${results.totalCompanies})`);
  console.log(`🏢 Company Success Rate: ${companySuccessRate}% (found at least 1 executive)`);
  
  console.log('\\n📋 Detailed Results:');
  results.executiveDetails.forEach((company, index) => {
    console.log(`\\n${index + 1}. ${company.company} (${company.domain})`);
    if (company.cfo) {
      console.log(`   CFO: ${company.cfo.name} - ${company.cfo.title} ${company.cfo.email ? `(${company.cfo.email})` : ''}`);
    } else {
      console.log(`   CFO: Not found`);
    }
    if (company.ceo) {
      console.log(`   CEO: ${company.ceo.name} - ${company.ceo.title} ${company.ceo.email ? `(${company.ceo.email})` : ''}`);
    } else {
      console.log(`   CEO: Not found`);
    }
  });
  
  if (results.errors.length > 0) {
    console.log('\\n❌ Errors Encountered:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log('\\n🚀 CLIENT DELIVERABLE ASSESSMENT:');
  if (parseFloat(overallAccuracy) >= 80) {
    console.log('✅ EXCEEDS CLIENT EXPECTATIONS (>80% accuracy)');
    console.log('   Ready to deliver high-quality executive data');
  } else if (parseFloat(overallAccuracy) >= 60) {
    console.log('⚠️  MEETS BASIC EXPECTATIONS (60-80% accuracy)');
    console.log('   Good results but room for improvement');
  } else {
    console.log('❌ BELOW CLIENT EXPECTATIONS (<60% accuracy)');
    console.log('   Needs significant improvement before delivery');
  }
  
  // Generate CSV output
  const csvPath = generateCSVOutput();
  
  return {
    overallAccuracy: parseFloat(overallAccuracy),
    cfoAccuracy: parseFloat(cfoAccuracy),
    ceoAccuracy: parseFloat(ceoAccuracy),
    companySuccessRate: parseFloat(companySuccessRate),
    csvPath,
    clientReady: parseFloat(overallAccuracy) >= 80
  };
}

/**
 * Main test runner
 */
async function runKeyAccountsValidation() {
  console.log('🚀 KEY ACCOUNTS EXECUTIVE SEARCH VALIDATION');
  console.log('🎯 Real-world test with client CSV data');
  console.log('📋 Finding CFO and CEO for each company\\n');
  
  const startTime = Date.now();
  
  // Load companies from CSV
  const companies = loadKeyAccountsCSV();
  if (companies.length === 0) {
    console.error('❌ No companies loaded from CSV. Exiting.');
    return;
  }
  
  results.totalCompanies = companies.length;
  console.log(`\\n🏢 Processing ${companies.length} companies...`);
  
  // Process each company
  for (const company of companies) {
    await findExecutivesForCompany(company);
    
    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\\n⏱️  Total processing time: ${duration} seconds`);
  
  // Generate final report
  const report = generateFinalReport();
  
  if (report.clientReady) {
    console.log('\\n🎉 SUCCESS: Ready to deliver to client!');
    process.exit(0);
  } else {
    console.log('\\n⚠️  WARNING: Results may need improvement for client delivery');
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  runKeyAccountsValidation().catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = { runKeyAccountsValidation };
