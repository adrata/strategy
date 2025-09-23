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

async function testDomainSearch() {
  console.log('🧪 TESTING DOMAIN SEARCH STRATEGIES');
  console.log('===================================\n');

  if (!CORESIGNAL_API_KEY) {
    console.error('❌ CORESIGNAL_API_KEY not configured');
    return;
  }

  // Test domains from our companies
  const testDomains = [
    'landw.com', // We know this works
    '5bars.net',
    'aes.com',
    'aflglobal.com',
    'microsoft.com', // Known to work
    'google.com'
  ];

  for (const domain of testDomains) {
    console.log(`🌐 Testing domain: "${domain}"`);
    
    // Test different search fields and strategies
    const searchStrategies = [
      { field: "website", query: domain, description: "Exact domain in website field" },
      { field: "website", query: `*${domain}*`, description: "Wildcard domain in website field" },
      { field: "company_name", query: domain, description: "Domain in company_name field" },
      { field: "company_name", query: domain.split('.')[0], description: "Domain name part in company_name field" },
      { field: "company_domain", query: domain, description: "Domain in company_domain field" },
      { field: "domain", query: domain, description: "Domain in domain field" },
    ];

    for (const strategy of searchStrategies) {
      try {
        const searchQuery = {
          query: {
            query_string: {
              query: strategy.query,
              default_field: strategy.field,
              default_operator: "and"
            }
          }
        };

        const response = await makeCoreSignalRequest(`${CORESIGNAL_BASE_URL}/company_multi_source/search/es_dsl`, 'POST', searchQuery);
        
        if (Array.isArray(response) && response.length > 0) {
          console.log(`   ✅ Found with "${strategy.description}": ${response.length} results`);
          if (response.length > 0) {
            console.log(`      First result ID: ${response[0].company_id || response[0]}`);
          }
          break; // Found a match, move to next domain
        } else {
          console.log(`   ❌ No results with "${strategy.description}"`);
        }
      } catch (error) {
        console.log(`   ❌ Error with "${strategy.description}": ${error.message}`);
      }
    }
    
    console.log('');
  }

  // Test with a broader search to see what fields are available
  console.log('🔍 Testing broader search to understand available fields...');
  try {
    const broadSearchQuery = {
      query: {
        query_string: {
          query: 'microsoft',
          default_field: "*",
          default_operator: "or"
        }
      }
    };

    const response = await makeCoreSignalRequest(`${CORESIGNAL_BASE_URL}/company_multi_source/search/es_dsl`, 'POST', broadSearchQuery);
    
    if (Array.isArray(response) && response.length > 0) {
      console.log(`✅ Found ${response.length} results with broad search`);
      console.log('📋 First result structure:');
      console.log(JSON.stringify(response[0], null, 2));
    }
  } catch (error) {
    console.log(`❌ Broad search failed: ${error.message}`);
  }
}

testDomainSearch().catch(console.error);
