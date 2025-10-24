#!/usr/bin/env node

/**
 * 🔍 FIND COMPANY IDs
 * 
 * Search for company IDs for Match Group, Brex, and Zuora
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => import('node-fetch').then(({default: fetch}) => fetch(...args)));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function findCompanyIds() {
  console.log('🔍 FINDING COMPANY IDs');
  console.log('======================');
  
  const companies = [
    'Match Group',
    'Brex', 
    'Zuora'
  ];
  
  for (const companyName of companies) {
    console.log(`\n🏢 Searching for: ${companyName}`);
    
    try {
      const url = 'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl';
      
      const query = {
        query: {
          bool: {
            must: [
              {
                match: {
                  company_name: companyName
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
        console.log(`   ✅ Found ${data.hits?.hits?.length || 0} companies`);
        
        if (data.hits?.hits?.length > 0) {
          const company = data.hits.hits[0];
          console.log(`   📋 Best match: ${company.company_name} (ID: ${company.id})`);
          console.log(`   🌐 Website: ${company.company_website || 'N/A'}`);
          console.log(`   🏭 Industry: ${company.company_industry || 'N/A'}`);
        }
      } else {
        console.log(`   ❌ Search failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🎯 COMPANY ID SEARCH COMPLETE');
}

// Run the search
findCompanyIds().catch(console.error);
