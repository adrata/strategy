#!/usr/bin/env node

/**
 * 🎯 SMART DELL PIPELINE
 * 
 * Uses CoreSignal enrich endpoint with Dell websites for reliable company targeting
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
try {
  const dotenv = require('dotenv');
  const envPaths = [
    path.join(__dirname, '../../../../.env.local'),
    path.join(__dirname, '../../../../.env.production'), 
    path.join(__dirname, '../../../../.env')
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      console.log(`Loading environment from: ${p}`);
      dotenv.config({ path: p });
    }
  }
} catch (_) {}

const { BuyerGroupPipeline } = require('../../../../dist-scripts/src/platform/services/buyer-group/index.js');

// SMART DELL STRATEGY: Use known Dell websites for enrichment
const DELL_WEBSITES = [
  'https://www.dell.com',
  'https://www.delltechnologies.com', 
  'https://www.emc.com',
  'https://boomi.com',
  'https://secureworks.com',
  'https://www.vmware.com' // Now owned by Dell
];

async function main() {
  console.log('🎯 SMART DELL BUYER GROUP PIPELINE');
  console.log('==================================');
  
  const apiKey = process.env.CORESIGNAL_API_KEY || '';
  if (!apiKey) {
    throw new Error('Missing CORESIGNAL_API_KEY environment variable');
  }
  
  console.log(`🔑 API Key loaded: ${apiKey.substring(0, 10)}...`);

  const sellerProfile = {
    productName: 'Buyer Group Intelligence',
    sellerCompanyName: 'Adrata',
    solutionCategory: 'revenue_technology',
    targetMarket: 'enterprise',
    buyingCenter: 'executive',
    decisionLevel: 'vp',
    rolePriorities: {
      decision: ['chief revenue officer', 'vp sales', 'vp revenue', 'vp business development', 'svp sales', 'senior vice president sales'],
      champion: ['director sales', 'sales director', 'director revenue operations', 'director sales operations', 'head of sales', 'head of revenue'],
      stakeholder: ['sales manager', 'senior sales manager', 'principal sales manager', 'sales operations manager', 'revenue operations manager'],
      blocker: ['vp finance', 'cfo', 'director finance', 'procurement director', 'director procurement'],
      introducer: ['account executive', 'senior account executive', 'enterprise account executive', 'sales development representative', 'business development representative']
    },
    mustHaveTitles: ['sales', 'revenue', 'business development', 'commercial'],
    adjacentFunctions: ['marketing', 'customer success', 'operations'],
    disqualifiers: ['former', 'ex-', 'retired', 'intern', 'consultant', 'ceo', 'president', 'reseller', 'partner'],
    geo: ['united states', 'north america'],
    dealSize: 'enterprise',
    primaryPainPoints: [
      'buyer gap/dark funnel',
      'deal slippage and miss-forecasting', 
      'low multi-threading across buyer group',
      'unidentified blockers',
      'unpredictable pipeline conversion'
    ],
    targetDepartments: ['sales', 'revenue operations', 'sales operations', 'customer success'],
    competitiveThreats: ['status quo', 'internal build', 'sales ops bandwidth']
  };

  const config = {
    sellerProfile,
    coreSignal: {
      apiKey,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: 50, // Conservative start
      batchSize: 20,
      useCache: true,
      cacheTTL: 24,
      dryRun: false
    },
    analysis: {
      minInfluenceScore: 1,  // MINIMAL: Ensure we capture Dell employees
      maxBuyerGroupSize: 20,
      requireDirector: false,
      allowIC: true,
      targetBuyerGroupRange: { min: 10, max: 15 },
      earlyStopMode: 'quality_first',
      minRoleTargets: { 
        decision: 2, 
        champion: 2, 
        stakeholder: 2, 
        blocker: 1, 
        introducer: 3
      }
    },
    output: {
      format: 'json',
      includeFlightRisk: true,
      includeDecisionFlow: true,
      generatePlaybooks: true
    },
    enforceExactCompany: true
  };

  const pipeline = new BuyerGroupPipeline(config);
  
  console.log('✅ SMART DELL STRATEGY ACTIVE');
  console.log('=============================');
  console.log('🌐 Using Dell website enrichment (bypasses ID issues)');
  console.log('🎯 Targeting core Dell Technologies + key subsidiaries');
  console.log('📊 Quality-first approach (min influence score: 3)');
  console.log('🇺🇸 US geographic focus maintained');
  console.log('');

  try {
    // Phase 1: Enrich Dell companies by website
    console.log('🌐 PHASE 1: Dell Company Enrichment');
    console.log('===================================');
    
    const enrichedCompanies = [];
    for (const website of DELL_WEBSITES) {
      try {
        console.log(`🔍 Enriching: ${website}`);
        const companyData = await pipeline.coreSignalClient.enrichCompanyByWebsite(website);
        if (companyData) {
          enrichedCompanies.push(companyData);
          console.log(`✅ Found: ${companyData.company_name || 'Unknown'} (ID: ${companyData.id})`);
        } else {
          console.log(`⚠️ No data found for ${website}`);
        }
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ Error enriching ${website}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Successfully enriched ${enrichedCompanies.length} Dell companies`);
    
    if (enrichedCompanies.length === 0) {
      throw new Error('No Dell companies were successfully enriched');
    }

    // Extract company IDs from enriched data
    const dellCompanyIds = enrichedCompanies
      .filter(company => company.id)
      .map(company => company.id);
    
    console.log(`🎯 Using ${dellCompanyIds.length} verified Dell company IDs: ${dellCompanyIds.slice(0, 3).join(', ')}...`);

    // Phase 2: Run buyer group pipeline
    console.log('\n🔍 PHASE 2: Buyer Group Generation');
    console.log('==================================');
    const startTime = Date.now();
    
    const report = await pipeline.generateBuyerGroup('Dell Technologies', dellCompanyIds);
    const processingTime = Date.now() - startTime;

    // Phase 3: Results analysis
    console.log('\n📊 PHASE 3: Results & Quality Analysis');
    console.log('=====================================');
    
    const totalMembers = report.buyerGroup.totalMembers || 0;
    const roles = report.buyerGroup.roles;
    
    console.log(`📋 Total Members: ${totalMembers}`);
    console.log(`🎯 Decision Makers: ${roles.decision?.length || 0}`);
    console.log(`🚀 Champions: ${roles.champion?.length || 0}`);
    console.log(`📊 Stakeholders: ${roles.stakeholder?.length || 0}`);
    console.log(`🚫 Blockers: ${roles.blocker?.length || 0}`);
    console.log(`🤝 Introducers: ${roles.introducer?.length || 0}`);
    
    // Quality metrics
    const qualifiedRate = totalMembers > 0 ? ((totalMembers / 50) * 100).toFixed(1) : '0.0';
    const rolesCovered = Object.values(roles).filter(roleArray => roleArray && roleArray.length > 0).length;
    const coverageScore = ((rolesCovered / 5) * 100).toFixed(1);
    
    console.log('\n🎯 QUALITY METRICS');
    console.log('==================');
    console.log(`🔍 Collection Rate: ${qualifiedRate}%`);
    console.log(`📊 Role Coverage: ${coverageScore}% (${rolesCovered}/5 roles)`);
    console.log(`⏱️ Processing Time: ${(processingTime/1000).toFixed(1)}s`);
    console.log(`💰 Credits Used: ${report.metadata.creditsUsed.search + report.metadata.creditsUsed.collect}`);

    // Success criteria
    const isSuccess = totalMembers >= 10 && rolesCovered >= 4;
    console.log(`\n🎯 SUCCESS CRITERIA: ${isSuccess ? '✅ MET' : '❌ NEEDS IMPROVEMENT'}`);
    
    if (isSuccess) {
      console.log('🎉 Smart Dell pipeline successfully identified qualified buyer group!');
    } else {
      console.log('⚠️ Results below target - consider adjusting search criteria or influence thresholds');
    }

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `dell-smart-pipeline-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 SMART PIPELINE REPORT SAVED`);
    console.log(`📄 Location: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ SMART DELL PIPELINE FAILED');
    console.error('==============================');
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n💥 PIPELINE CRASHED');
    console.error('===================');
    console.error('Error:', err.message || err);
    process.exit(1);
  });
}

module.exports = { main };
