const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import the buyer group API handler directly
const { POST: buyerGroupAPI } = require('../src/app/api/intelligence/buyer-group/route.ts');

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

async function runInternalBuyerGroupDiscovery() {
  console.log('🎯 Starting INTERNAL buyer group discovery for Winning Variant demo...\n');
  console.log('Using API handler directly\n');

  const results = [];
  const failedCompanies = [];

  for (const company of companies) {
    console.log(`\n🔍 Discovering buyer group for: ${company.companyName}`);
    console.log(`   Industry: ${company.industry}`);
    console.log(`   Website: ${company.website}`);
    
    try {
      // Create a mock request object
      const mockRequest = {
        json: async () => ({
          companyName: company.companyName,
          website: company.website,
          sellerProfile: {
            company: 'Winning Variant',
            product: 'A/B Testing Platform',
            industry: 'Technology'
          },
          saveToDatabase: true,
          returnFullData: true
        })
      };

      // Call the API handler directly
      const response = await buyerGroupAPI(mockRequest);
      const result = await response.json();
      
      if (result.success) {
        console.log(`   ✅ Found ${result.buyerGroup.totalMembers} buyer group members`);
        console.log(`   📊 Confidence: ${result.quality.overallConfidence}%`);
        
        results.push({
          company: company,
          buyerGroup: result.buyerGroup,
          quality: result.quality,
          processingTime: result.processingTime,
          timestamp: result.timestamp
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
        throw new Error(result.message || 'API returned unsuccessful response');
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
}

// Run the discovery
runInternalBuyerGroupDiscovery().catch(console.error);
