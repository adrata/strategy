#!/usr/bin/env node

/**
 * Test Individual Coresignal Filters
 * 
 * This script tests each filter individually to identify which one is causing issues.
 */

require('dotenv').config();

class CoresignalFilterTester {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
  }

  async run() {
    try {
      console.log('🔍 Testing Individual Coresignal Filters...\n');
      
      // Test 1: Match all (baseline)
      await this.testQuery('Match All', { query: { match_all: {} } });
      
      // Test 2: Country filter only (correct field name)
      await this.testQuery('Country: United States (hq_country)', {
        query: {
          term: {
            hq_country: 'United States'
          }
        }
      });
      
      // Test 3: Industry filter only (correct field name)
      await this.testQuery('Industry: Software', {
        query: {
          term: {
            industry: 'Software'
          }
        }
      });
      
      // Test 4: Revenue filter only
      await this.testQuery('Revenue: $15M-$100M', {
        query: {
          range: {
            'revenue_annual.source_1_annual_revenue.annual_revenue': {
              gte: 15000000,
              lte: 100000000
            }
          }
        }
      });
      
      // Test 5: Alternative revenue field
      await this.testQuery('Revenue: $15M-$100M (source_5)', {
        query: {
          range: {
            'revenue_annual.source_5_annual_revenue.annual_revenue': {
              gte: 15000000,
              lte: 100000000
            }
          }
        }
      });
      
      // Test 6: Country + Industry (correct field names)
      await this.testQuery('Country + Industry', {
        query: {
          bool: {
            must: [
              { term: { hq_country: 'United States' } },
              { term: { industry: 'Software' } }
            ]
          }
        }
      });
      
      // Test 7: Different country values (correct field name)
      await this.testQuery('Country: USA', {
        query: {
          term: {
            hq_country: 'USA'
          }
        }
      });
      
      await this.testQuery('Country: US', {
        query: {
          term: {
            hq_country: 'US'
          }
        }
      });
      
      // Test 8: Different industry values
      await this.testQuery('Industry: Software Development', {
        query: {
          term: {
            industry: 'Software Development'
          }
        }
      });
      
      await this.testQuery('Industry: Computer Software', {
        query: {
          term: {
            industry: 'Computer Software'
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  async testQuery(testName, query) {
    try {
      console.log(`📋 Testing: ${testName}`);
      
      const response = await fetch(
        'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5',
        {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(query)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
        console.log(`   📄 Response: ${errorText.substring(0, 200)}`);
        return;
      }

      const data = await response.json();
      const count = Array.isArray(data) ? data.length : 0;
      
      console.log(`   ${count > 0 ? '✅' : '❌'} Results: ${count} companies`);
      
      if (count > 0) {
        console.log(`   📋 Company IDs: ${data.slice(0, 3).join(', ')}${data.length > 3 ? '...' : ''}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run the tester
const tester = new CoresignalFilterTester();
tester.run().catch(console.error);
