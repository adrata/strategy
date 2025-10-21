#!/usr/bin/env node

/**
 * 🔍 FIND EXACT COMPANY NAMES FOR CORESIGNAL API
 * 
 * Tests different company name variations to find the exact names
 * that CoreSignal API can successfully locate
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();

const companyVariations = [
  // Match Group variations
  { name: 'Match Group', website: 'mtch.com' },
  { name: 'Match Group, Inc.', website: 'mtch.com' },
  { name: 'Match Group Inc.', website: 'mtch.com' },
  { name: 'Match Group Inc', website: 'mtch.com' },
  { name: 'Match.com', website: 'mtch.com' },
  { name: 'Match', website: 'mtch.com' },
  
  // Brex variations
  { name: 'Brex', website: 'brex.com' },
  { name: 'Brex, Inc.', website: 'brex.com' },
  { name: 'Brex Inc.', website: 'brex.com' },
  { name: 'Brex Inc', website: 'brex.com' },
  { name: 'Brex Inc.', website: 'brex.com' },
  
  // First Premier Bank variations
  { name: 'First Premier Bank', website: 'firstpremier.com' },
  { name: 'First PREMIER Bank', website: 'firstpremier.com' },
  { name: 'First Premier', website: 'firstpremier.com' },
  { name: 'First Premier Bank, Inc.', website: 'firstpremier.com' },
  { name: 'First Premier Bank Inc.', website: 'firstpremier.com' },
  
  // Zuora variations
  { name: 'Zuora', website: 'zuora.com' },
  { name: 'Zuora, Inc.', website: 'zuora.com' },
  { name: 'Zuora Inc.', website: 'zuora.com' },
  { name: 'Zuora Inc', website: 'zuora.com' },
  { name: 'Zuora Inc.', website: 'zuora.com' }
];

/**
 * Search for company using CoreSignal API
 */
async function searchCompany(companyName, website) {
  try {
    const query = {
      query: {
        bool: {
          should: [
            { match: { company_name: companyName } },
            { match: { website: website } }
          ]
        }
      }
    };

    const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      return { found: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    
    if (data.hits?.hits?.length > 0) {
      const companyId = data.hits.hits[0]._id;
      const companySource = data.hits.hits[0]._source;
      return {
        found: true,
        companyId,
        companyName: companySource.company_name,
        website: companySource.website,
        industry: companySource.industry
      };
    }
    
    return { found: false, error: 'No results found' };
    
  } catch (error) {
    return { found: false, error: error.message };
  }
}

/**
 * Test all company variations
 */
async function testAllVariations() {
  console.log('🔍 TESTING COMPANY NAME VARIATIONS FOR CORESIGNAL API');
  console.log('=' .repeat(60));
  console.log('Finding exact company names that CoreSignal can locate');
  console.log('');
  
  const results = {};
  
  for (const variation of companyVariations) {
    const baseName = variation.name.split(',')[0].split(' ')[0]; // Get first word for grouping
    if (!results[baseName]) {
      results[baseName] = [];
    }
    
    console.log(`🔍 Testing: "${variation.name}" (${variation.website})`);
    
    const result = await searchCompany(variation.name, variation.website);
    
    if (result.found) {
      console.log(`   ✅ FOUND: ${result.companyName} (ID: ${result.companyId})`);
      console.log(`   📊 Industry: ${result.industry || 'Not specified'}`);
      console.log(`   🌐 Website: ${result.website || 'Not specified'}`);
      
      results[baseName].push({
        searchName: variation.name,
        searchWebsite: variation.website,
        foundName: result.companyName,
        companyId: result.companyId,
        industry: result.industry,
        website: result.website
      });
    } else {
      console.log(`   ❌ Not found: ${result.error}`);
    }
    
    console.log('');
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('🎯 SUMMARY OF WORKING COMPANY NAMES');
  console.log('=' .repeat(60));
  
  for (const [baseName, variations] of Object.entries(results)) {
    if (variations.length > 0) {
      console.log(`\n📊 ${baseName}:`);
      variations.forEach(v => {
        console.log(`   ✅ "${v.searchName}" → "${v.foundName}" (ID: ${v.companyId})`);
      });
    }
  }
  
  console.log('\n🎉 COMPANY NAME DISCOVERY COMPLETE');
  console.log('=' .repeat(60));
  
  return results;
}

// Run the script
if (require.main === module) {
  testAllVariations().catch(console.error);
}

module.exports = { testAllVariations };
