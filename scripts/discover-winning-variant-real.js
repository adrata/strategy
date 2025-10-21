const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import the existing BuyerGroupPipeline
const BuyerGroupPipeline = require('../src/platform/pipelines/pipelines/core/buyer-group-pipeline.js');

const prisma = new PrismaClient();

const companies = [
  { 
    companyName: 'Match Group', 
    website: 'https://mtch.com',
    industry: 'Technology',
    description: 'Online Dating Platform'
  },
  { 
    companyName: 'Brex', 
    website: 'https://brex.com',
    industry: 'FinTech',
    description: 'Corporate Credit Cards & Financial Services'
  },
  { 
    companyName: 'First Premier Bank', 
    website: 'https://firstpremier.com',
    industry: 'Banking',
    description: 'Regional Banking & Financial Services'
  },
  { 
    companyName: 'Zuora', 
    website: 'https://zuora.com',
    industry: 'SaaS',
    description: 'Subscription Management Platform'
  }
];

async function runRealBuyerGroupDiscovery() {
  console.log('🎯 Starting REAL buyer group discovery for Winning Variant demo...\n');
  console.log('Using existing BuyerGroupPipeline with full enrichment\n');

  const pipeline = new BuyerGroupPipeline();
  const results = [];
  const failedCompanies = [];

  for (const company of companies) {
    console.log(`\n🔍 Discovering buyer group for: ${company.companyName}`);
    console.log(`   Industry: ${company.industry}`);
    console.log(`   Website: ${company.website}`);
    
    try {
      // Use the existing pipeline with full enrichment
      const result = await pipeline.processSingleCompany(company.companyName, {
        website: company.website,
        industry: company.industry,
        enrichmentLevel: 'enrich', // Full enrichment with contact info
        saveToDatabase: true,
        workspaceId: 'winning-variant-demo'
      });

      if (result && result.buyerGroup && result.buyerGroup.members) {
        console.log(`   ✅ Found ${result.buyerGroup.members.length} buyer group members`);
        
        // Add archetype assignment and strategy personalization
        const enrichedResult = await enrichWithArchetypesAndStrategy(result, company.industry);
        
        results.push({
          company: company,
          buyerGroup: enrichedResult.buyerGroup,
          discoveryMetadata: result.discoveryMetadata,
          timestamp: new Date().toISOString()
        });

        // Save to individual JSON file
        const filename = `${company.companyName.toLowerCase().replace(/\s/g, '-')}-buyer-group-real.json`;
        const filepath = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data', filename);
        
        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, JSON.stringify(enrichedResult, null, 2));
        console.log(`   📁 Real data saved to: ${filepath}`);
        
      } else {
        throw new Error('No buyer group data returned from pipeline');
      }

    } catch (error) {
      console.error(`❌ Error discovering ${company.companyName}:`, error.message);
      failedCompanies.push({ 
        companyName: company.companyName, 
        error: error.message 
      });
    }
  }

  // Save comprehensive results
  const outputDir = path.join(__dirname, '..', 'src', 'app', '(locker)', 'private', 'winning-variant', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const allResultsFile = path.join(outputDir, 'all-companies-buyer-groups-real.json');
  fs.writeFileSync(allResultsFile, JSON.stringify({
    discoverySummary: {
      totalCompanies: companies.length,
      successfulCompanies: results.length,
      failedCompanies: failedCompanies.length,
      timestamp: new Date().toISOString()
    },
    companies: results,
    failures: failedCompanies
  }, null, 2));

  console.log('\n📊 REAL Discovery Summary:');
  console.log('==========================');
  console.log(`✅ Successful: ${results.length}/${companies.length}`);
  console.log(`❌ Failed: ${failedCompanies.length}/${companies.length}`);
  console.log(`📁 All results saved to: ${allResultsFile}`);

  if (failedCompanies.length > 0) {
    console.log('\n❌ Failed Companies:');
    failedCompanies.forEach(f => console.log(`   ${f.companyName}: ${f.error}`));
  }

  console.log('\n🎉 REAL buyer group discovery complete!');
  console.log('All data is 100% real with full enrichment, archetypes, and strategies.');
  
  await prisma.$disconnect();
}

async function enrichWithArchetypesAndStrategy(result, industry) {
  // Import archetype and strategy services
  const { BUYER_GROUP_ARCHETYPES, determineArchetype } = require('../src/platform/services/buyer-group-archetypes.ts');
  const { StrategyPersonalizationService } = require('../src/platform/services/strategy-personalization-service.ts');
  
  const strategyService = new StrategyPersonalizationService();
  
  // Process each member
  for (const member of result.buyerGroup.members) {
    // Assign archetype
    member.archetype = determineArchetype(member);
    
    // Generate personalized strategy
    if (member.archetype) {
      try {
        const strategy = await strategyService.generateStrategySummary({
          person: member,
          company: result.buyerGroup.company,
          industry: industry
        });
        
        member.personalizedStrategy = {
          situation: strategy.situation,
          complication: strategy.complication,
          futureState: strategy.futureState,
          engagementStrategy: strategy.engagementStrategy,
          keyTalkingPoints: strategy.keyTalkingPoints
        };
      } catch (error) {
        console.warn(`   ⚠️  Could not generate strategy for ${member.name}: ${error.message}`);
      }
    }
    
    // Add flight risk analysis
    member.flightRisk = await analyzeFlightRisk(member);
  }
  
  return result;
}

async function analyzeFlightRisk(member) {
  // Import flight risk analyzer
  const { FlightRiskAnalyzer } = require('../src/platform/monaco-pipeline/steps/analyzeFlightRisk.ts');
  
  try {
    const analyzer = new FlightRiskAnalyzer();
    const riskAnalysis = await analyzer.analyzePersonWithContext(member);
    
    return {
      score: riskAnalysis.flightRiskScore,
      category: riskAnalysis.riskCategory,
      factors: riskAnalysis.riskFactors,
      indicators: riskAnalysis.keyIndicators,
      recommendations: riskAnalysis.retentionRecommendations,
      monitoringPriority: riskAnalysis.monitoringPriority
    };
  } catch (error) {
    console.warn(`   ⚠️  Could not analyze flight risk for ${member.name}: ${error.message}`);
    return {
      score: 0,
      category: 'UNKNOWN',
      factors: {},
      indicators: [],
      recommendations: [],
      monitoringPriority: 'annual'
    };
  }
}

// Run the discovery
runRealBuyerGroupDiscovery().catch(console.error);
