const https = require('https');

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class CoreSignalAPITester {
  constructor() {
    this.apiKey = CORESIGNAL_API_KEY;
    this.baseUrl = CORESIGNAL_BASE_URL;
  }

  async makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.apiKey,
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
            resolve({
              statusCode: res.statusCode,
              data: parsedData,
              raw: responseData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              data: null,
              raw: responseData,
              error: error.message
            });
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

  async testEndpoint(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`\n🔍 Testing: ${method} ${endpoint}`);
    console.log('='.repeat(50));
    
    try {
      const response = await this.makeRequest(url, method, data);
      console.log(`Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log('✅ SUCCESS!');
        if (response.data) {
          console.log(`Response type: ${typeof response.data}`);
          if (Array.isArray(response.data)) {
            console.log(`Array length: ${response.data.length}`);
            if (response.data.length > 0) {
              console.log(`First item keys: ${Object.keys(response.data[0]).join(', ')}`);
            }
          } else if (typeof response.data === 'object') {
            console.log(`Object keys: ${Object.keys(response.data).join(', ')}`);
          }
        }
      } else if (response.statusCode === 404) {
        console.log('❌ NOT FOUND - Endpoint does not exist');
      } else if (response.statusCode === 401) {
        console.log('❌ UNAUTHORIZED - API key issue');
      } else if (response.statusCode === 403) {
        console.log('❌ FORBIDDEN - No access to this endpoint');
      } else {
        console.log(`❌ ERROR - Status: ${response.statusCode}`);
        console.log(`Response: ${response.raw}`);
      }
    } catch (error) {
      console.log(`❌ REQUEST FAILED: ${error.message}`);
    }
  }
}

async function testPeopleEndpoints() {
  console.log('🧪 TESTING CORESIGNAL PEOPLE ENDPOINTS');
  console.log('=====================================');

  if (!CORESIGNAL_API_KEY) {
    console.error('❌ CORESIGNAL_API_KEY is not set');
    return;
  }

  const tester = new CoreSignalAPITester();

  // Test various people-related endpoints
  const endpoints = [
    // Person endpoints
    { endpoint: '/person_multi_source/search', method: 'GET' },
    { endpoint: '/person_multi_source/search/es_dsl', method: 'POST', data: { query: { match_all: {} } } },
    { endpoint: '/person/search', method: 'GET' },
    { endpoint: '/person/search/es_dsl', method: 'POST', data: { query: { match_all: {} } } },
    { endpoint: '/people/search', method: 'GET' },
    { endpoint: '/people/search/es_dsl', method: 'POST', data: { query: { match_all: {} } } },
    { endpoint: '/person', method: 'GET' },
    { endpoint: '/people', method: 'GET' },
    
    // Test with specific person search
    { endpoint: '/person_multi_source/search/es_dsl', method: 'POST', data: { 
      query: { 
        query_string: { 
          query: "John Smith", 
          default_field: "full_name" 
        } 
      } 
    }},
    { endpoint: '/person/search/es_dsl', method: 'POST', data: { 
      query: { 
        query_string: { 
          query: "John Smith", 
          default_field: "full_name" 
        } 
      } 
    }},
    { endpoint: '/people/search/es_dsl', method: 'POST', data: { 
      query: { 
        query_string: { 
          query: "John Smith", 
          default_field: "full_name" 
        } 
      } 
    }},
  ];

  for (const test of endpoints) {
    await tester.testEndpoint(test.endpoint, test.method, test.data);
  }

  console.log('\n🎯 SUMMARY:');
  console.log('============');
  console.log('Look for endpoints that return 200 status with data');
  console.log('These are the working endpoints for people search');
}

testPeopleEndpoints();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class CoreSignalAPITester {
  constructor() {
    this.apiKey = CORESIGNAL_API_KEY;
    this.baseUrl = CORESIGNAL_BASE_URL;
  }

  async makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.apiKey,
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
            resolve({
              statusCode: res.statusCode,
              data: parsedData,
              raw: responseData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              data: null,
              raw: responseData,
              error: error.message
            });
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

  async testEndpoint(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`\n🔍 Testing: ${method} ${endpoint}`);
    console.log('='.repeat(50));
    
    try {
      const response = await this.makeRequest(url, method, data);
      console.log(`Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        console.log('✅ SUCCESS!');
        if (response.data) {
          console.log(`Response type: ${typeof response.data}`);
          if (Array.isArray(response.data)) {
            console.log(`Array length: ${response.data.length}`);
            if (response.data.length > 0) {
              console.log(`First item keys: ${Object.keys(response.data[0]).join(', ')}`);
            }
          } else if (typeof response.data === 'object') {
            console.log(`Object keys: ${Object.keys(response.data).join(', ')}`);
          }
        }
      } else if (response.statusCode === 404) {
        console.log('❌ NOT FOUND - Endpoint does not exist');
      } else if (response.statusCode === 401) {
        console.log('❌ UNAUTHORIZED - API key issue');
      } else if (response.statusCode === 403) {
        console.log('❌ FORBIDDEN - No access to this endpoint');
      } else {
        console.log(`❌ ERROR - Status: ${response.statusCode}`);
        console.log(`Response: ${response.raw}`);
      }
    } catch (error) {
      console.log(`❌ REQUEST FAILED: ${error.message}`);
    }
  }
}

async function testPeopleEndpoints() {
  console.log('🧪 TESTING CORESIGNAL PEOPLE ENDPOINTS');
  console.log('=====================================');

  if (!CORESIGNAL_API_KEY) {
    console.error('❌ CORESIGNAL_API_KEY is not set');
    return;
  }

  const tester = new CoreSignalAPITester();

  // Test various people-related endpoints
  const endpoints = [
    // Person endpoints
    { endpoint: '/person_multi_source/search', method: 'GET' },
    { endpoint: '/person_multi_source/search/es_dsl', method: 'POST', data: { query: { match_all: {} } } },
    { endpoint: '/person/search', method: 'GET' },
    { endpoint: '/person/search/es_dsl', method: 'POST', data: { query: { match_all: {} } } },
    { endpoint: '/people/search', method: 'GET' },
    { endpoint: '/people/search/es_dsl', method: 'POST', data: { query: { match_all: {} } } },
    { endpoint: '/person', method: 'GET' },
    { endpoint: '/people', method: 'GET' },
    
    // Test with specific person search
    { endpoint: '/person_multi_source/search/es_dsl', method: 'POST', data: { 
      query: { 
        query_string: { 
          query: "John Smith", 
          default_field: "full_name" 
        } 
      } 
    }},
    { endpoint: '/person/search/es_dsl', method: 'POST', data: { 
      query: { 
        query_string: { 
          query: "John Smith", 
          default_field: "full_name" 
        } 
      } 
    }},
    { endpoint: '/people/search/es_dsl', method: 'POST', data: { 
      query: { 
        query_string: { 
          query: "John Smith", 
          default_field: "full_name" 
        } 
      } 
    }},
  ];

  for (const test of endpoints) {
    await tester.testEndpoint(test.endpoint, test.method, test.data);
  }

  console.log('\n🎯 SUMMARY:');
  console.log('============');
  console.log('Look for endpoints that return 200 status with data');
  console.log('These are the working endpoints for people search');
}

testPeopleEndpoints();


