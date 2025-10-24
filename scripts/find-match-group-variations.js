#!/usr/bin/env node

/**
 * 🔍 FIND MATCH GROUP VARIATIONS
 * 
 * Search for Match Group using various company name variations and approaches
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function searchCompanyVariations(companyName, variations) {
  console.log(`\n🏢 Searching for: ${companyName}`);
  
  const url = 'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl';
  
  for (const variation of variations) {
    console.log(`   Trying: "${variation}"`);
    
    try {
      const query = {
        query: {
          bool: {
            should: [
              {
                match: {
                  company_name: variation
                }
              },
              {
                match: {
                  company_legal_name: variation
                }
              },
              {
                match: {
                  description: variation
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
          // Show first few results
          hits.slice(0, 3).forEach((company, index) => {
            console.log(`     📋 Result ${index + 1}: ${company.company_name} (ID: ${company.id})`);
            console.log(`         Website: ${company.company_website || 'N/A'}`);
            console.log(`         Industry: ${company.company_industry || 'N/A'}`);
            console.log(`         Country: ${company.company_hq_country || 'N/A'}`);
          });
          
          // Return the best match
          return {
            id: hits[0].id,
            name: hits[0].company_name,
            website: hits[0].company_website,
            industry: hits[0].company_industry,
            country: hits[0].company_hq_country
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

async function findMatchGroupVariations() {
  console.log('🔍 FINDING MATCH GROUP VARIATIONS');
  console.log('==================================');
  
  const matchGroupVariations = [
    'Match Group',
    'Match Group Inc',
    'Match Group, Inc.',
    'Match Group LLC',
    'Match Group Holdings',
    'MTCH',
    'MTCH Group',
    'Tinder',
    'Match.com',
    'Hinge',
    'OkCupid',
    'Plenty of Fish',
    'The League',
    'Dating App',
    'Online Dating',
    'Dating Platform'
  ];
  
  const brexVariations = [
    'Brex',
    'Brex Inc',
    'Brex, Inc.',
    'Brex Corporation',
    'Brex Financial',
    'Corporate Card',
    'Business Credit Card',
    'Fintech',
    'Financial Technology'
  ];
  
  const zuoraVariations = [
    'Zuora',
    'Zuora Inc',
    'Zuora, Inc.',
    'Zuora Corporation',
    'Subscription Management',
    'Revenue Recognition',
    'Billing Platform',
    'SaaS Billing'
  ];
  
  const results = {};
  
  // Search Match Group
  const matchResult = await searchCompanyVariations('Match Group', matchGroupVariations);
  results['Match Group'] = matchResult;
  
  // Search Brex
  const brexResult = await searchCompanyVariations('Brex', brexVariations);
  results['Brex'] = brexResult;
  
  // Search Zuora
  const zuoraResult = await searchCompanyVariations('Zuora', zuoraVariations);
  results['Zuora'] = zuoraResult;
  
  // First Premier Bank (already confirmed)
  results['First Premier Bank'] = {
    id: 7578901,
    name: 'First Premier Bank',
    website: 'https://www.firstpremier.com',
    industry: 'Financial Services',
    country: 'United States'
  };
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  
  const outputFile = path.join(__dirname, 'company-ids-variations.json');
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
findMatchGroupVariations().catch(console.error);
