#!/usr/bin/env node

/**
 * CFO/CRO FUNCTION-BASED PIPELINE (JavaScript Version)
 * 
 * Modern function-based orchestration pipeline for CFO/CRO discovery
 * Following 2025 best practices with idempotency, retry logic, and cost tracking
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

// Import existing modules
const { CoreSignalMultiSource } = require('../../modules/core/CoreSignalMultiSource');
const { MultiSourceVerifier } = require('../../modules/core/MultiSourceVerifier');

// Import missing modules from old pipeline
const { ExecutiveContactIntelligence } = require('../../modules/core/ExecutiveContactIntelligence');
const { ContactValidator } = require('../../modules/core/ContactValidator');
const { ExecutiveResearch } = require('../../modules/core/ExecutiveResearch');

// Import new modules for enhanced discovery
const { CompanySizeDetector } = require('../../modules/core/CompanySizeDetector');
const { LinkedInResearch } = require('../../modules/core/LinkedInResearch'); // AI Research module

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load companies from CSV file
 */
async function loadCompaniesFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const companies = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Support multiple column names for company URLs
        const companyUrl = row['Company URL'] || row['company_url'] || row['url'] || row['company'] || row['Company'];
        if (companyUrl) {
          companies.push(companyUrl);
        }
      })
      .on('end', () => {
        console.log(`📋 Loaded ${companies.length} companies from ${filePath}`);
        resolve(companies);
      })
      .on('error', reject);
  });
}

/**
 * Load companies from command line arguments
 */
function loadCompaniesFromArgs(args) {
  const companies = [];
  
  for (const arg of args) {
    if (arg.startsWith('http')) {
      companies.push(arg);
    } else if (arg.includes('.')) {
      // Assume it's a domain, add https://
      companies.push(`https://${arg}`);
    }
  }
  
  return companies;
}

/**
 * Create output directory
 */
function ensureOutputDirectory() {
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }
}

// ============================================================================
// PURE FUNCTIONS (JavaScript Implementation)
// ============================================================================

/**
 * Company Resolution Function
 */
async function resolveCompany(companyUrl, config) {
  console.log(`🏢 Resolving company: ${companyUrl}`);
  
  const coresignal = new CoreSignalMultiSource(config);
  const sizeDetector = new CompanySizeDetector(config);
  
  // Extract domain from URL
  let domain;
  let companyName;
  try {
    const urlObj = new URL(companyUrl);
    domain = urlObj.hostname.replace('www.', '');
    companyName = domain.split('.')[0]; // Extract company name from domain
  } catch {
    domain = companyUrl.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0];
    companyName = domain.split('.')[0]; // Extract company name from domain
  }
  
  console.log(`   📍 Extracted domain: ${domain}`);
  console.log(`   🏢 Extracted company name: ${companyName}`);
  
  // Search for company ID
  const companyId = await coresignal.searchCompanyId(companyName, domain);
  
  if (!companyId) {
    throw new Error(`Company not found: ${companyUrl}`);
  }
  
  // Detect company size for strategy selection
  console.log(`   📊 Detecting company size...`);
  const sizeInfo = await sizeDetector.detectCompanySize(companyName, domain, companyId);
  
  const result = {
    companyName: companyName,
    domain,
    companyId,
    sizeInfo,
    creditsUsed: 1
  };
  
  console.log(`   ✅ Company resolved: ${result.companyName} (ID: ${result.companyId}, Size: ${sizeInfo.category})`);
  return result;
}

/**
 * Executive Discovery Function
 */
async function discoverExecutives(company, config) {
  console.log(`👥 Discovering executives for: ${company.companyName}`);
  console.log(`   🏢 Company ID: ${company.companyId}`);
  console.log(`   📊 Company Size: ${company.sizeInfo?.category || 'unknown'}`);
  
  const coresignal = new CoreSignalMultiSource(config);
  const executiveResearch = new ExecutiveResearch(config);
  const aiResearch = new LinkedInResearch(config); // AI Research module (no LinkedIn scraping)
  let totalCreditsUsed = 0;
  
  // Size-based strategy selection
  const strategy = company.sizeInfo?.strategy || 'coresignal_comprehensive';
  console.log(`   🎯 Using strategy: ${strategy}`);
  
  // Multi-strategy executive discovery
  console.log(`   🔍 Multi-strategy executive discovery...`);
  
  // Strategy 1: CoreSignal Multi-Source Discovery (unless startup)
  let cfoResult = { executive: null, method: 'not_found', creditsUsed: 0 };
  let croResult = { executive: null, method: 'not_found', creditsUsed: 0 };
  
  if (strategy !== 'leadership_scraping_first') {
    console.log(`   📋 Strategy 1: CoreSignal Multi-Source Discovery`);
    
    // Discover CFO (Finance Executive)
    console.log(`   💰 Discovering CFO...`);
    cfoResult = await coresignal.discoverExecutiveMultiStrategy(
      company.companyName,
      'cfo'
    );
    totalCreditsUsed += cfoResult.creditsUsed || 0;
    
    // Discover CRO (Revenue/Sales Executive)
    console.log(`   📈 Discovering CRO...`);
    croResult = await coresignal.discoverExecutiveMultiStrategy(
      company.companyName,
      'cro'
    );
    totalCreditsUsed += croResult.creditsUsed || 0;
  }
  
  // Strategy 2: Executive Research (Leadership Page Scraping) - Fallback or Primary for startups
  if ((!cfoResult.executive && !croResult.executive) || 
      (cfoResult.executive && !croResult.executive) || 
      (!cfoResult.executive && croResult.executive) ||
      strategy === 'leadership_scraping_first') {
    console.log(`   📋 Strategy 2: Executive Research (Leadership Page Scraping)`);
    
    try {
      const researchResult = await executiveResearch.researchExecutives({
        companyName: company.companyName,
        website: company.domain
      });
      
      // Use research results as fallback for missing executives
      if (!cfoResult.executive && researchResult.cfo) {
        console.log(`   ✅ CFO found via Executive Research: ${researchResult.cfo.name}`);
        cfoResult.executive = researchResult.cfo;
        cfoResult.method = 'executive-research';
      }
      
      if (!croResult.executive && researchResult.cro) {
        console.log(`   ✅ CRO found via Executive Research: ${researchResult.cro.name}`);
        croResult.executive = researchResult.cro;
        croResult.method = 'executive-research';
      }
    } catch (error) {
      console.log(`   ⚠️ Executive Research failed: ${error.message}`);
    }
  }
  
  // Strategy 3: AI Research - Final fallback
  if ((!cfoResult.executive && !croResult.executive) || 
      (cfoResult.executive && !croResult.executive) || 
      (!cfoResult.executive && croResult.executive)) {
    console.log(`   📋 Strategy 3: AI Research (Final Fallback)`);
    
    try {
      const aiResult = await aiResearch.researchExecutivesViaLinkedIn(
        company.companyName,
        company.domain,
        'both'
      );
      
      // Use AI research results as final fallback
      if (!cfoResult.executive && aiResult.cfo) {
        console.log(`   ✅ CFO found via AI Research: ${aiResult.cfo.name}`);
        cfoResult.executive = aiResult.cfo;
        cfoResult.method = 'ai-research';
      }
      
      if (!croResult.executive && aiResult.cro) {
        console.log(`   ✅ CRO found via AI Research: ${aiResult.cro.name}`);
        croResult.executive = aiResult.cro;
        croResult.method = 'ai-research';
      }
    } catch (error) {
      console.log(`   ⚠️ AI Research failed: ${error.message}`);
    }
  }
  
  // Process CFO result
  let cfo = null;
  if (cfoResult.executive) {
    console.log(`   ✅ CFO found: ${cfoResult.executive.name} (${cfoResult.executive.title})`);
    cfo = {
      name: cfoResult.executive.name,
      title: cfoResult.executive.title,
      email: cfoResult.executive.email,
      phone: cfoResult.executive.phone,
      linkedinUrl: cfoResult.executive.linkedinUrl,
      confidence: cfoResult.executive.confidence || 80,
      source: cfoResult.method || 'coresignal_multisource',
      tier: cfoResult.executive.tier || 1,
      employmentStatus: cfoResult.executive.employmentStatus || {
        isCurrent: true,
        confidence: 80
      }
    };
  } else {
    console.log(`   ❌ No CFO found`);
  }
  
  // Process CRO result
  let cro = null;
  if (croResult.executive) {
    console.log(`   ✅ CRO found: ${croResult.executive.name} (${croResult.executive.title})`);
    cro = {
      name: croResult.executive.name,
      title: croResult.executive.title,
      email: croResult.executive.email,
      phone: croResult.executive.phone,
      linkedinUrl: croResult.executive.linkedinUrl,
      confidence: croResult.executive.confidence || 80,
      source: croResult.method || 'coresignal_multisource',
      tier: croResult.executive.tier || 1,
      employmentStatus: croResult.executive.employmentStatus || {
        isCurrent: true,
        confidence: 80
      }
    };
  } else {
    console.log(`   ❌ No CRO found`);
  }
  
  const result = {
    cfo,
    cro,
    creditsUsed: totalCreditsUsed,
    discoveryMethod: {
      cfo: cfo ? cfo.source : 'not_found',
      cro: cro ? cro.source : 'not_found'
    }
  };
  
  console.log(`   📊 Discovery complete: CFO ${cfo ? '✅' : '❌'}, CRO ${cro ? '✅' : '❌'}`);
  console.log(`   💳 Credits used: ${totalCreditsUsed}`);
  
  return result;
}

/**
 * Verification Function with Enhanced Contact Discovery
 */
async function verifyExecutive(executive, company, config) {
  if (!executive) return null;
  
  console.log(`🔍 Verifying executive: ${executive.name} (${executive.title})`);
  
  const verifier = new MultiSourceVerifier(config);
  const contactIntelligence = new ExecutiveContactIntelligence(config);
  const contactValidator = new ContactValidator(config);
  
  try {
    // Step 1: Enhanced Contact Intelligence (Email/Phone Discovery)
    console.log(`   📧 Enhanced contact intelligence...`);
    const contactIntelligenceResult = await contactIntelligence.enhanceExecutiveIntelligence({
      companyName: company.companyName,
      website: company.domain
    });
    
    // Step 2: Contact Validation and Enrichment
    console.log(`   ✅ Contact validation and enrichment...`);
    const contactValidation = await contactValidator.enrichContacts(
      { executives: { cfo: executive } },
      { companyName: company.companyName, website: company.domain }
    );
    
    // Step 2.5: Extract contact information from enrichment results
    let enrichedEmail = executive.email;
    let enrichedPhone = executive.phone;
    
    if (contactValidation && contactValidation.enrichedExecutives) {
      const enrichedCFO = contactValidation.enrichedExecutives.cfo;
      if (enrichedCFO) {
        enrichedEmail = enrichedCFO.email || enrichedEmail;
        enrichedPhone = enrichedCFO.phone || enrichedPhone;
        console.log(`   📧 Email enriched: ${enrichedEmail ? 'Found' : 'Not found'}`);
        console.log(`   📞 Phone enriched: ${enrichedPhone ? 'Found' : 'Not found'}`);
      }
    }
    
    // Step 3: PARALLEL VERIFICATION - All 3 verification types run simultaneously
    console.log(`   🔄 Parallel verification (person, email, phone)...`);
    
    const verificationPromises = [
      // Person Identity Verification (2-3x sources) - includes employment status check
      verifier.verifyPersonIdentity(
        executive.name,
        company.companyName,
        company.domain,
        executive.linkedinUrl
      ).catch(error => {
        console.log(`   ⚠️ Person verification failed: ${error.message}`);
        return { confidence: 0, verificationDetails: [{ source: 'error', status: 'failed', reason: error.message }] };
      }),
      
      // Email Multi-Layer Verification (2-3x layers)
      verifier.verifyEmailMultiLayer(
        enrichedEmail || '',
        executive.name,
        company.companyName
      ).catch(error => {
        console.log(`   ⚠️ Email verification failed: ${error.message}`);
        return { confidence: 0, validationDetails: [{ source: 'error', status: 'failed', reason: error.message }] };
      }),
      
      // Phone Verification (4x sources)
      verifier.verifyPhone(
        enrichedPhone || '',
        executive.name,
        company.companyName,
        executive.linkedinUrl
      ).catch(error => {
        console.log(`   ⚠️ Phone verification failed: ${error.message}`);
        return { confidence: 0, verificationDetails: [{ source: 'error', status: 'failed', reason: error.message }] };
      })
    ];
    
    // Wait for all verifications to complete in parallel
    const verificationResults = await Promise.all(verificationPromises);
    const personVerification = verificationResults[0];
    const emailVerification = verificationResults[1];
    const phoneVerification = verificationResults[2];
    
    // Step 4: Employment Status Validation - Reject former employees
    const employmentStatus = validateEmploymentStatus(personVerification, executive.title);
    if (!employmentStatus.isCurrent) {
      console.log(`   ❌ EXECUTIVE REJECTED: ${executive.name} is not currently employed (${employmentStatus.reason})`);
      return null; // Reject former employees
    } else {
      console.log(`   ✅ EMPLOYMENT VERIFIED: ${executive.name} is currently employed`);
    }
    
    const result = {
      ...executive,
      email: enrichedEmail || executive.email,
      phone: enrichedPhone || executive.phone,
      verification: {
        person: personVerification,
        email: emailVerification,
        phone: phoneVerification,
        employment: employmentStatus
      },
      contactIntelligence: contactIntelligenceResult,
      contactValidation: contactValidation
    };
    
    console.log(`   ✅ Verification complete: Person=${personVerification.confidence}%, Email=${emailVerification?.confidence || 0}%, Phone=${phoneVerification?.confidence || 0}%`);
    
    return result;
  } catch (error) {
    console.log(`   ❌ Verification failed: ${error.message}`);
    return {
      ...executive,
      verification: {
        person: { verified: false, confidence: 0 },
        email: null,
        phone: null,
        employment: { isCurrent: false, confidence: 0 }
      }
    };
  }
}

/**
 * Employment Status Validation
 */
function validateEmploymentStatus(personVerification, title) {
  // Check if person verification indicates current employment
  if (personVerification.verificationDetails) {
    for (const detail of personVerification.verificationDetails) {
      if (detail.source === 'perplexity' && detail.employmentStatus) {
        return {
          isCurrent: detail.employmentStatus === 'current',
          confidence: detail.confidence || 0,
          reason: detail.employmentStatus === 'current' ? 'Currently employed' : 'Former employee'
        };
      }
    }
  }
  
  // Default to current if no employment data found
  return {
    isCurrent: true,
    confidence: 50,
    reason: 'No employment data found, assuming current'
  };
}

/**
 * Save Results Function
 */
async function saveResults(company, executives, outputDir) {
  console.log(`💾 Saving results for: ${company.companyName}`);
  
  const timestamp = new Date().toISOString();
  const results = {
    company: {
      name: company.companyName,
      domain: company.domain,
      companyId: company.companyId,
      sizeInfo: company.sizeInfo
    },
    executives: {
      cfo: executives.cfo,
      cro: executives.cro
    },
    metadata: {
      timestamp,
      pipelineVersion: '2.0.0-function-based-enhanced',
      creditsUsed: executives.creditsUsed,
      discoveryMethods: {
        cfo: executives.cfo?.source || 'not_found',
        cro: executives.cro?.source || 'not_found'
      },
      companySize: company.sizeInfo?.category || 'unknown',
      strategy: company.sizeInfo?.strategy || 'default'
    }
  };
  
  // Save JSON
  const jsonPath = path.join(outputDir, 'executives.json');
  let existingData = [];
  
  if (fs.existsSync(jsonPath)) {
    try {
      const fileContent = fs.readFileSync(jsonPath, 'utf8');
      existingData = JSON.parse(fileContent);
      if (!Array.isArray(existingData)) {
        existingData = [existingData];
      }
    } catch (error) {
      console.log(`   ⚠️ Could not parse existing JSON, creating new file`);
      existingData = [];
    }
  }
  
  existingData.push(results);
  fs.writeFileSync(jsonPath, JSON.stringify(existingData, null, 2), 'utf8');
  
  // Save CSV
  const csvPath = path.join(outputDir, 'executives.csv');
  const csvHeaders = [
    'Company Name', 'Role', 'Executive Name', 'Title', 'Email', 'Phone', 'LinkedIn URL',
    'Person Verified', 'Email Valid', 'Phone Valid', 'Currently Employed',
    'Person Confidence', 'Email Confidence', 'Phone Confidence', 'Employment Confidence',
    'Timestamp'
  ];
  
  const csvRows = [];
  
  if (executives.cfo) {
    csvRows.push([
      company.companyName,
      'CFO',
      executives.cfo.name,
      executives.cfo.title,
      executives.cfo.email || '',
      executives.cfo.phone || '',
      executives.cfo.linkedinUrl || '',
      executives.cfo.verification?.person?.verified || false,
      executives.cfo.verification?.email?.valid || false,
      executives.cfo.verification?.phone?.valid || false,
      executives.cfo.verification?.employment?.isCurrent || false,
      executives.cfo.verification?.person?.confidence || 0,
      executives.cfo.verification?.email?.confidence || 0,
      executives.cfo.verification?.phone?.confidence || 0,
      executives.cfo.verification?.employment?.confidence || 0,
      timestamp
    ]);
  }
  
  if (executives.cro) {
    csvRows.push([
      company.companyName,
      'CRO',
      executives.cro.name,
      executives.cro.title,
      executives.cro.email || '',
      executives.cro.phone || '',
      executives.cro.linkedinUrl || '',
      executives.cro.verification?.person?.verified || false,
      executives.cro.verification?.email?.valid || false,
      executives.cro.verification?.phone?.valid || false,
      executives.cro.verification?.employment?.isCurrent || false,
      executives.cro.verification?.person?.confidence || 0,
      executives.cro.verification?.email?.confidence || 0,
      executives.cro.verification?.phone?.confidence || 0,
      executives.cro.verification?.employment?.confidence || 0,
      timestamp
    ]);
  }
  
  if (csvRows.length > 0) {
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    if (fs.existsSync(csvPath)) {
      fs.appendFileSync(csvPath, '\n' + csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n'));
    } else {
      fs.writeFileSync(csvPath, csvContent, 'utf8');
    }
  }
  
  console.log(`   ✅ Results saved: JSON (${existingData.length} records), CSV (${csvRows.length} new rows)`);
  
  return {
    jsonPath,
    csvPath,
    recordsWritten: csvRows.length
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  try {
    console.log('🚀 CFO/CRO Function-Based Pipeline v2.0.0 (JavaScript) - Enhanced');
    console.log('=' .repeat(60));
    
    // Create configuration
    const config = {
      CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
      LUSHA_API_KEY: process.env.LUSHA_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY
    };

    // Validate required API keys
    const requiredKeys = [
      'CORESIGNAL_API_KEY',
      'LUSHA_API_KEY',
      'PERPLEXITY_API_KEY'
    ];
    
    const missingKeys = requiredKeys.filter(key => !config[key]);
    if (missingKeys.length > 0) {
      console.error(`❌ Missing required API keys: ${missingKeys.join(', ')}`);
      process.exit(1);
    }

    // Load companies
    let companies = [];
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Default to test companies file
      const defaultFile = './test-companies.csv';
      if (fs.existsSync(defaultFile)) {
        companies = await loadCompaniesFromCSV(defaultFile);
      } else {
        console.log('📋 No input provided, using default test companies');
        companies = [
          'https://salesforce.com',
          'https://hubspot.com',
          'https://microsoft.com'
        ];
      }
    } else if (args[0].endsWith('.csv')) {
      // Load from CSV file
      companies = await loadCompaniesFromCSV(args[0]);
    } else {
      // Load from command line arguments
      companies = loadCompaniesFromArgs(args);
    }

    if (companies.length === 0) {
      console.error('❌ No companies to process');
      process.exit(1);
    }

    console.log(`📊 Companies to process: ${companies.length}`);
    console.log(`🏢 Companies: ${companies.slice(0, 3).join(', ')}${companies.length > 3 ? '...' : ''}`);
    
    // Ensure output directory exists
    ensureOutputDirectory();
    
    // Process companies with efficacy tracking
    const startTime = Date.now();
    const results = [];
    
    for (const companyUrl of companies) {
      console.log(`\n🎯 Processing: ${companyUrl}`);
      const companyStartTime = Date.now();
      
      try {
        // Step 1: Resolve company
        const company = await resolveCompany(companyUrl, config);
        
        // Step 2: Discover executives
        const executives = await discoverExecutives(company, config);
        
        // Step 3: Verify executives (in parallel)
        const [verifiedCFO, verifiedCRO] = await Promise.all([
          verifyExecutive(executives.cfo, company, config),
          verifyExecutive(executives.cro, company, config)
        ]);
        
        // Step 4: Save results
        const saveResult = await saveResults(company, {
          cfo: verifiedCFO,
          cro: verifiedCRO,
          creditsUsed: executives.creditsUsed
        }, './output');
        
        const companyResult = {
          companyName: company.companyName,
          cfo: { 
            found: !!verifiedCFO, 
            name: verifiedCFO?.name,
            source: executives.cfo?.source || 'not_found',
            tier: executives.cfo?.tier || 0,
            email: {
              found: !!verifiedCFO?.email,
              source: verifiedCFO?.email ? 'discovered' : 'not_found',
              confidence: verifiedCFO?.verification?.email?.confidence || 0
            },
            phone: {
              found: !!verifiedCFO?.phone,
              source: verifiedCFO?.phone ? 'discovered' : 'not_found',
              confidence: verifiedCFO?.verification?.phone?.confidence || 0
            },
            employmentStatus: {
              isCurrent: verifiedCFO?.verification?.employment?.isCurrent || false,
              confidence: verifiedCFO?.verification?.employment?.confidence || 0
            }
          },
          cro: { 
            found: !!verifiedCRO, 
            name: verifiedCRO?.name,
            source: executives.cro?.source || 'not_found',
            tier: executives.cro?.tier || 0,
            email: {
              found: !!verifiedCRO?.email,
              source: verifiedCRO?.email ? 'discovered' : 'not_found',
              confidence: verifiedCRO?.verification?.email?.confidence || 0
            },
            phone: {
              found: !!verifiedCRO?.phone,
              source: verifiedCRO?.phone ? 'discovered' : 'not_found',
              confidence: verifiedCRO?.verification?.phone?.confidence || 0
            },
            employmentStatus: {
              isCurrent: verifiedCRO?.verification?.employment?.isCurrent || false,
              confidence: verifiedCRO?.verification?.employment?.confidence || 0
            }
          },
          executionTime: Date.now() - companyStartTime,
          recordsWritten: saveResult.recordsWritten,
          creditsUsed: executives.creditsUsed
        };
        
        results.push(companyResult);
        
        console.log(`   ✅ Company complete: ${companyResult.cfo.found ? 'CFO ✅' : 'CFO ❌'}, ${companyResult.cro.found ? 'CRO ✅' : 'CRO ❌'}`);
        
      } catch (error) {
        console.log(`   ❌ Company failed: ${error.message}`);
        results.push({
          companyName: companyUrl,
          cfo: { found: false, source: 'error', tier: 0, email: { found: false, source: 'error', confidence: 0 }, phone: { found: false, source: 'error', confidence: 0 }, employmentStatus: { isCurrent: false, confidence: 0 } },
          cro: { found: false, source: 'error', tier: 0, email: { found: false, source: 'error', confidence: 0 }, phone: { found: false, source: 'error', confidence: 0 }, employmentStatus: { isCurrent: false, confidence: 0 } },
          executionTime: Date.now() - companyStartTime,
          recordsWritten: 0,
          creditsUsed: 0
        });
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Pipeline Complete!');
    console.log(`⏱️ Total Time: ${totalExecutionTime}ms (${(totalExecutionTime / 1000).toFixed(1)}s)`);
    
    const cfoFound = results.filter(r => r.cfo.found).length;
    const croFound = results.filter(r => r.cro.found).length;
    
    console.log(`\n📈 Results Summary:`);
    console.log(`   🏢 Companies processed: ${results.length}`);
    console.log(`   💰 CFOs found: ${cfoFound} (${((cfoFound / results.length) * 100).toFixed(1)}%)`);
    console.log(`   📈 CROs found: ${croFound} (${((croFound / results.length) * 100).toFixed(1)}%)`);
    
    console.log(`\n📁 Output files:`);
    console.log(`   📄 JSON: ./output/executives.json`);
    console.log(`   📊 CSV: ./output/executives.csv`);
    
    // Generate Efficacy Report
    console.log(`\n📊 Generating Efficacy Report...`);
    generateEfficacyReport(results, totalExecutionTime);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Generate Efficacy Report
 */
function generateEfficacyReport(results, totalExecutionTime) {
  const totalCompanies = results.length;
  const totalCFOs = results.filter(r => r.cfo.found).length;
  const totalCROs = results.filter(r => r.cro.found).length;
  const totalEmails = results.filter(r => r.cfo.email.found || r.cro.email.found).length;
  const totalPhones = results.filter(r => r.cfo.phone.found || r.cro.phone.found).length;
  const totalCreditsUsed = results.reduce((sum, r) => sum + r.creditsUsed, 0);
  
  console.log(`\n📊 EFFICACY REPORT - ${totalCompanies} Companies Processed`);
  console.log('='.repeat(60));
  
  // Summary
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Companies: ${totalCompanies}`);
  console.log(`   CFOs Found: ${totalCFOs} (${Math.round((totalCFOs / totalCompanies) * 100)}%)`);
  console.log(`   CROs Found: ${totalCROs} (${Math.round((totalCROs / totalCompanies) * 100)}%)`);
  console.log(`   Emails Found: ${totalEmails} (${Math.round((totalEmails / totalCompanies) * 100)}%)`);
  console.log(`   Phones Found: ${totalPhones} (${Math.round((totalPhones / totalCompanies) * 100)}%)`);
  console.log(`   Credits Used: ${totalCreditsUsed}`);
  console.log(`   Processing Time: ${(totalExecutionTime / 1000).toFixed(1)}s`);
  
  // Discovery Sources Analysis
  console.log(`\n🔍 DISCOVERY SOURCES:`);
  const cfoSources = {};
  const croSources = {};
  const emailSources = {};
  const phoneSources = {};
  
  results.forEach(result => {
    if (result.cfo.found) {
      cfoSources[result.cfo.source] = (cfoSources[result.cfo.source] || 0) + 1;
    }
    if (result.cro.found) {
      croSources[result.cro.source] = (croSources[result.cro.source] || 0) + 1;
    }
    if (result.cfo.email.found) {
      emailSources[result.cfo.email.source] = (emailSources[result.cfo.email.source] || 0) + 1;
    }
    if (result.cro.email.found) {
      emailSources[result.cro.email.source] = (emailSources[result.cro.email.source] || 0) + 1;
    }
    if (result.cfo.phone.found) {
      phoneSources[result.cfo.phone.source] = (phoneSources[result.cfo.phone.source] || 0) + 1;
    }
    if (result.cro.phone.found) {
      phoneSources[result.cro.phone.source] = (phoneSources[result.cro.phone.source] || 0) + 1;
    }
  });
  
  console.log(`   CFO Sources:`);
  Object.entries(cfoSources).forEach(([source, count]) => {
    console.log(`     - ${source}: ${count} (${Math.round((count / totalCFOs) * 100)}%)`);
  });
  
  console.log(`   CRO Sources:`);
  Object.entries(croSources).forEach(([source, count]) => {
    console.log(`     - ${source}: ${count} (${Math.round((count / totalCROs) * 100)}%)`);
  });
  
  console.log(`   Email Sources:`);
  Object.entries(emailSources).forEach(([source, count]) => {
    console.log(`     - ${source}: ${count}`);
  });
  
  console.log(`   Phone Sources:`);
  Object.entries(phoneSources).forEach(([source, count]) => {
    console.log(`     - ${source}: ${count}`);
  });
  
  // Per-Company Breakdown
  console.log(`\n📋 PER-COMPANY BREAKDOWN:`);
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.companyName}`);
    if (result.cfo.found) {
      console.log(`   - CFO: ${result.cfo.name} (${result.cfo.source}, Tier ${result.cfo.tier})`);
      console.log(`   - Email: ${result.cfo.email.found ? result.cfo.email.source : 'Not found'}`);
      console.log(`   - Phone: ${result.cfo.phone.found ? result.cfo.phone.source : 'Not found'}`);
    } else {
      console.log(`   - CFO: Not found`);
    }
    if (result.cro.found) {
      console.log(`   - CRO: ${result.cro.name} (${result.cro.source}, Tier ${result.cro.tier})`);
      console.log(`   - Email: ${result.cro.email.found ? result.cro.email.source : 'Not found'}`);
      console.log(`   - Phone: ${result.cro.phone.found ? result.cro.phone.source : 'Not found'}`);
    } else {
      console.log(`   - CRO: Not found`);
    }
    console.log('');
  });
  
  // Save detailed efficacy report
  const efficacyReport = {
    summary: {
      totalCompanies,
      totalCFOs,
      totalCROs,
      totalEmails,
      totalPhones,
      processingTime: totalExecutionTime,
      creditsUsed: totalCreditsUsed
    },
    discoverySources: {
      cfoSources,
      croSources,
      emailSources,
      phoneSources
    },
    companyBreakdown: results
  };
  
  const fs = require('fs');
  fs.writeFileSync('./output/efficacy-report.json', JSON.stringify(efficacyReport, null, 2), 'utf8');
  console.log(`\n📄 Detailed efficacy report saved: ./output/efficacy-report.json`);
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
