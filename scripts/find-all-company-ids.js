#!/usr/bin/env node

/**
 * 🔍 FIND ALL COMPANY IDs
 * 
 * Search CoreSignal company API for Match Group, Brex, and Zuora company IDs
 * First Premier Bank already confirmed working with ID 7578901
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function findCompanyId(companyName, searchVariations) {
  console.log(`\n🏢 Searching for: ${companyName}`);
  
  const url = 'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl';
  
  for (const variation of searchVariations) {
    console.log(`   Trying: "${variation}"`);
    
    try {
      const query = {
        query: {
          bool: {
            must: [
              {
                match: {
                  company_name: variation
                }
              }
            ]
          }
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(query)
      });
      
      if (response.ok) {
        const data = await response.json();
        const hits = data.hits?.hits || [];
        
        console.log(`     ✅ Found ${hits.length} companies`);
        
        if (hits.length > 0) {
          const company = hits[0];
          console.log(`     📋 Best match: ${company.company_name} (ID: ${company.id})`);
          console.log(`     🌐 Website: ${company.company_website || 'N/A'}`);
          console.log(`     🏭 Industry: ${company.company_industry || 'N/A'}`);
          console.log(`     📊 Size: ${company.company_size_range || 'N/A'}`);
          
          return {
            id: company.id,
            name: company.company_name,
            website: company.company_website,
            industry: company.company_industry,
            size: company.company_size_range
          };
        }
      } else {
        console.log(`     ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`   ❌ No company ID found for ${companyName}`);
  return null;
}

async function findAllCompanyIds() {
  console.log('🔍 FINDING ALL COMPANY IDs');
  console.log('==========================');
  
  const companies = [
    {
      name: 'Match Group',
      variations: [
        'Match Group',
        'Match Group, Inc.',
        'Match Group LLC',
        'MTCH',
        'Match Group Inc',
        'Match.com'
      ]
    },
    {
      name: 'Brex',
      variations: [
        'Brex',
        'Brex Inc.',
        'Brex, Inc.',
        'Brex Inc',
        'Brex Corporation'
      ]
    },
    {
      name: 'First Premier Bank',
      variations: ['First Premier Bank'] // Already confirmed working
    },
    {
      name: 'Zuora',
      variations: [
        'Zuora',
        'Zuora, Inc.',
        'Zuora Inc',
        'Zuora Inc.',
        'Zuora Corporation'
      ]
    }
  ];
  
  const results = {};
  
  for (const company of companies) {
    if (company.name === 'First Premier Bank') {
      // We already know this works
      results[company.name] = {
        id: 7578901,
        name: 'First Premier Bank',
        website: 'https://www.firstpremier.com',
        industry: 'Financial Services',
        size: '1000-5000 employees',
        status: 'confirmed_working'
      };
      console.log(`\n🏢 ${company.name}: ID 7578901 (confirmed working)`);
    } else {
      const result = await findCompanyId(company.name, company.variations);
      results[company.name] = result;
    }
  }
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  
  const outputFile = path.join(__dirname, 'company-ids-found.json');
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  
  console.log(`\n💾 Results saved to: ${outputFile}`);
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  Object.entries(results).forEach(([companyName, result]) => {
    if (result && result.id) {
      console.log(`✅ ${companyName}: ID ${result.id} (${result.industry})`);
    } else {
      console.log(`❌ ${companyName}: No ID found`);
    }
  });
  
  return results;
}

// Run the search
findAllCompanyIds().catch(console.error);
