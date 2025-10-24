#!/usr/bin/env node

/**
 * 🔍 TEST PREVIEW API WITH DIFFERENT COMPANIES
 * 
 * Test CoreSignal Search Preview API with different companies to find one that works
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function testPreviewCompanies() {
  console.log('🔍 TESTING PREVIEW API WITH DIFFERENT COMPANIES');
  console.log('=============================================');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
  
  // Test different companies
  const companies = [
    'Microsoft',
    'Google', 
    'Apple',
    'Amazon',
    'Meta',
    'Tesla',
    'Netflix',
    'Uber',
    'Airbnb',
    'Salesforce'
  ];
  
  for (const company of companies) {
    console.log(`\n🏢 Testing: ${company}`);
    try {
      const query = {
        query: {
          bool: {
            must: [
              {
                match: {
                  company_name: company
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
        console.log(`   ✅ ${company}: ${data.length} employees`);
        if (data.length > 0) {
          console.log(`   📋 First employee: ${data[0].full_name} - ${data[0].active_experience_title} at ${data[0].company_name}`);
        }
      } else {
        console.log(`   ❌ ${company}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ ${company}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 COMPANY TEST COMPLETE');
}

// Run the test
testPreviewCompanies().catch(console.error);
