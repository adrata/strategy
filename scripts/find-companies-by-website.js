#!/usr/bin/env node

/**
 * 🔍 FIND COMPANIES BY WEBSITE
 * 
 * Search CoreSignal using official company websites for better matching
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function findCompanyByWebsite(companyName, website) {
  console.log(`\n🏢 Searching for: ${companyName}`);
  console.log(`   Website: ${website}`);
  
  const url = 'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl';
  
  try {
    // Search by website domain
    const query = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_website: website
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(query, null, 2)}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      const hits = data.hits?.hits || [];
      
      console.log(`   ✅ Found ${hits.length} companies`);
      
      if (hits.length > 0) {
        const company = hits[0];
        console.log(`   📋 Best match: ${company.company_name} (ID: ${company.id})`);
        console.log(`   🌐 Website: ${company.company_website || 'N/A'}`);
        console.log(`   🏭 Industry: ${company.company_industry || 'N/A'}`);
        console.log(`   📊 Size: ${company.company_size_range || 'N/A'}`);
        
        return {
          id: company.id,
          name: company.company_name,
          website: company.company_website,
          industry: company.company_industry,
          size: company.company_size_range
        };
      } else {
        console.log(`   ❌ No companies found with website: ${website}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Search failed: ${response.status} ${response.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  return null;
}

async function findCompaniesByWebsite() {
  console.log('🔍 FINDING COMPANIES BY WEBSITE');
  console.log('===============================');
  
  const companies = [
    {
      name: 'Match Group',
      website: 'https://www.mtch.com'
    },
    {
      name: 'Brex',
      website: 'https://www.brex.com'
    },
    {
      name: 'First Premier Bank',
      website: 'https://www.firstpremier.com'
    },
    {
      name: 'Zuora',
      website: 'https://www.zuora.com'
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
      const result = await findCompanyByWebsite(company.name, company.website);
      results[company.name] = result;
    }
  }
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  
  const outputFile = path.join(__dirname, 'company-ids-by-website.json');
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
findCompaniesByWebsite().catch(console.error);
