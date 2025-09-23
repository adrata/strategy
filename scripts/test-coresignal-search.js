#!/usr/bin/env node

const https = require('https');

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function makeCoreSignalRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method: method,
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`CoreSignal API Error ${res.statusCode}: ${parsedData.message || responseData}`));
          }
        } catch (error) {
          reject(new Error(`CoreSignal JSON Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSearches() {
  console.log('🔍 TESTING CORESIGNAL SEARCHES FOR LOCKARD & WHITE');
  console.log('==================================================\n');

  const searchTerms = [
    'Lockard & White',
    'Lockard White',
    'Lockard',
    'landw.com',
    'landw'
  ];

  for (const term of searchTerms) {
    console.log(`🔍 Searching for: "${term}"`);
    
    const searchQuery = {
      query: {
        query_string: {
          query: term,
          default_field: "company_name",
          default_operator: "and"
        }
      }
    };

    const url = `${CORESIGNAL_BASE_URL}/company_multi_source/search/es_dsl`;
    
    try {
      const response = await makeCoreSignalRequest(url, 'POST', searchQuery);
      
      if (Array.isArray(response) && response.length > 0) {
        console.log(`   ✅ Found ${response.length} results`);
        response.slice(0, 3).forEach((result, index) => {
          console.log(`      ${index + 1}. ${result}`);
        });
        if (response.length > 3) {
          console.log(`      ... and ${response.length - 3} more`);
        }
      } else {
        console.log('   ❌ No results found');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Try a broader search
  console.log('🔍 Trying broader search...');
  const broadSearchQuery = {
    query: {
      query_string: {
        query: 'Lockard OR White OR landw',
        default_field: "company_name",
        default_operator: "or"
      }
    }
  };

  try {
    const response = await makeCoreSignalRequest(`${CORESIGNAL_BASE_URL}/company_multi_source/search/es_dsl`, 'POST', broadSearchQuery);
    
    if (Array.isArray(response) && response.length > 0) {
      console.log(`✅ Found ${response.length} results with broader search`);
      response.slice(0, 5).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result}`);
      });
    } else {
      console.log('❌ No results found with broader search');
    }
  } catch (error) {
    console.log(`❌ Error with broader search: ${error.message}`);
  }
}

testSearches().catch(console.error);
