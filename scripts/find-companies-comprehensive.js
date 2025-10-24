#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE COMPANY SEARCH
 * 
 * Try multiple search strategies to find company IDs
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function searchCompanies(companyName, searchStrategies) {
  console.log(`\n🏢 Searching for: ${companyName}`);
  
  const url = 'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl';
  
  for (const strategy of searchStrategies) {
    console.log(`   Strategy: ${strategy.name}`);
    console.log(`   Query: ${JSON.stringify(strategy.query, null, 2)}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(strategy.query)
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
            size: company.company_size_range,
            strategy: strategy.name
          };
        }
      } else {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`   ❌ No company ID found for ${companyName}`);
  return null;
}

async function findCompaniesComprehensive() {
  console.log('🔍 COMPREHENSIVE COMPANY SEARCH');
  console.log('================================');
  
  const companies = [
    {
      name: 'Match Group',
      strategies: [
        {
          name: 'Industry + Description',
          query: {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      company_industry: 'Online Dating'
                    }
                  }
                ],
                should: [
                  {
                    match: {
                      company_name: 'Match'
                    }
                  },
                  {
                    match: {
                      company_description: 'dating'
                    }
                  }
                ]
              }
            }
          }
        },
        {
          name: 'Website Domain',
          query: {
            query: {
              bool: {
                should: [
                  {
                    match: {
                      company_website: 'mtch.com'
                    }
                  },
                  {
                    match: {
                      company_website: 'match.com'
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    },
    {
      name: 'Brex',
      strategies: [
        {
          name: 'Industry + FinTech',
          query: {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      company_industry: 'Financial Technology'
                    }
                  }
                ],
                should: [
                  {
                    match: {
                      company_name: 'Brex'
                    }
                  },
                  {
                    match: {
                      company_description: 'corporate card'
                    }
                  }
                ]
              }
            }
          }
        },
        {
          name: 'Website Domain',
          query: {
            query: {
              bool: {
                should: [
                  {
                    match: {
                      company_website: 'brex.com'
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    },
    {
      name: 'Zuora',
      strategies: [
        {
          name: 'Industry + Subscription',
          query: {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      company_industry: 'Software'
                    }
                  }
                ],
                should: [
                  {
                    match: {
                      company_name: 'Zuora'
                    }
                  },
                  {
                    match: {
                      company_description: 'subscription'
                    }
                  }
                ]
              }
            }
          }
        },
        {
          name: 'Website Domain',
          query: {
            query: {
              bool: {
                should: [
                  {
                    match: {
                      company_website: 'zuora.com'
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  ];
  
  const results = {
    'First Premier Bank': {
      id: 7578901,
      name: 'First Premier Bank',
      website: 'https://www.firstpremier.com',
      industry: 'Financial Services',
      size: '1000-5000 employees',
      status: 'confirmed_working'
    }
  };
  
  for (const company of companies) {
    const result = await searchCompanies(company.name, company.strategies);
    results[company.name] = result;
  }
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  
  const outputFile = path.join(__dirname, 'company-ids-comprehensive.json');
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
findCompaniesComprehensive().catch(console.error);
