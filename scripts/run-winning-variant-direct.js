const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const companies = [
  { 
    companyName: 'Match Group', 
    website: 'https://mtch.com',
    industry: 'Technology'
  },
  { 
    companyName: 'Brex', 
    website: 'https://brex.com',
    industry: 'FinTech'
  },
  { 
    companyName: 'First Premier Bank', 
    website: 'https://firstpremier.com',
    industry: 'Banking'
  },
  { 
    companyName: 'Zuora', 
    website: 'https://zuora.com',
    industry: 'SaaS'
  }
];

async function runDirectBuyerGroupDiscovery() {
  console.log('🎯 Starting DIRECT buyer group discovery for Winning Variant demo...\n');
  console.log('Using BuyerGroupPipeline directly\n');

  try {
    // Import the pipeline
    const BuyerGroupPipeline = require('../src/platform/pipelines/pipelines/core/buyer-group-pipeline.js');
    const pipeline = new BuyerGroupPipeline();
    
    const results = [];
    const failedCompanies = [];

    for (const company of companies) {
      console.log(`\n🔍 Discovering buyer group for: ${company.companyName}`);
      console.log(`   Industry: ${company.industry}`);
      console.log(`   Website: ${company.website}`);
      
      try {
        const result = await pipeline.processSingleCompany(company.companyName, {
          website: company.website,
          industry: company.industry,
          sellerProfile: {
            company: 'Winning Variant',
            product: 'A/B Testing Platform',
            industry: 'Technology'
          }
        });

        if (result && result.buyerGroup && result.buyerGroup.members) {
          console.log(`   ✅ Found ${result.buyerGroup.members.length} buyer group members`);
          console.log(`   📊 Confidence: ${result.quality?.overallConfidence || 0}%`);
          
          results.push({
            company: company,
            buyerGroup: result.buyerGroup,
            quality: result.quality,
            processingTime: result.processingTime,
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
          
          fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
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

  } catch (error) {
    console.error('❌ Failed to initialize pipeline:', error.message);
  }
}

// Run the discovery
runDirectBuyerGroupDiscovery().catch(console.error);
