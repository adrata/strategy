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

async function testCoreSignalAPI() {
  console.log('🧪 TESTING CORESIGNAL API');
  console.log('=========================\n');

  if (!CORESIGNAL_API_KEY) {
    console.error('❌ CORESIGNAL_API_KEY not configured');
    return;
  }

  console.log('🔑 API Key configured');
  console.log(`🌐 Base URL: ${CORESIGNAL_BASE_URL}\n`);

  // Test 1: Search for Lockard & White (we know this worked before)
  console.log('🔍 Test 1: Searching for "Lockard & White"');
  const searchQuery = {
    query: {
      query_string: {
        query: 'Lockard & White',
        default_field: "company_name",
        default_operator: "and"
      }
    }
  };

  try {
    const response = await makeCoreSignalRequest(`${CORESIGNAL_BASE_URL}/company_multi_source/search/es_dsl`, 'POST', searchQuery);
    console.log('✅ Search successful');
    console.log(`📊 Response type: ${typeof response}`);
    console.log(`📊 Response length: ${Array.isArray(response) ? response.length : 'Not an array'}`);
    
    if (Array.isArray(response) && response.length > 0) {
      console.log('📋 First result:');
      console.log(JSON.stringify(response[0], null, 2));
    } else {
      console.log('❌ No results found');
    }
  } catch (error) {
    console.log(`❌ Search failed: ${error.message}`);
  }

  console.log('\n');

  // Test 2: Try a broader search
  console.log('🔍 Test 2: Broader search for "Lockard"');
  const broadSearchQuery = {
    query: {
      query_string: {
        query: 'Lockard',
        default_field: "company_name",
        default_operator: "or"
      }
    }
  };

  try {
    const response = await makeCoreSignalRequest(`${CORESIGNAL_BASE_URL}/company_multi_source/search/es_dsl`, 'POST', broadSearchQuery);
    console.log('✅ Broader search successful');
    console.log(`📊 Found ${Array.isArray(response) ? response.length : 0} results`);
    
    if (Array.isArray(response) && response.length > 0) {
      console.log('📋 First few results:');
      response.slice(0, 3).forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.company_name || 'No name'} (ID: ${result.company_id || 'No ID'})`);
      });
    }
  } catch (error) {
    console.log(`❌ Broader search failed: ${error.message}`);
  }

  console.log('\n');

  // Test 3: Try to get specific company data (using the ID we found before)
  console.log('🔍 Test 3: Getting company data for ID 8453124 (Lockard & White)');
  try {
    const response = await makeCoreSignalRequest(`${CORESIGNAL_BASE_URL}/company_multi_source/collect/8453124`);
    console.log('✅ Company data retrieval successful');
    console.log(`📊 Company name: ${response.company_name || 'No name'}`);
    console.log(`📊 Website: ${response.website || 'No website'}`);
    console.log(`📊 Industry: ${response.industry || 'No industry'}`);
    console.log(`📊 Employee count: ${response.employees_count || 'No count'}`);
    console.log(`📊 LinkedIn URL: ${response.linkedin_url || 'No LinkedIn'}`);
    console.log(`📊 Founded year: ${response.founded_year || 'No founded year'}`);
  } catch (error) {
    console.log(`❌ Company data retrieval failed: ${error.message}`);
  }
}

testCoreSignalAPI().catch(console.error);
