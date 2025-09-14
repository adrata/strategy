#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE DATA FLOW TEST
 * Tests that the left panel and middle panel are getting correct data
 * from the right workspace (not default workspace)
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_PAGES = [
  '/rps/pipeline/opportunities',
  '/rps/pipeline/speedrun', 
  '/rps/pipeline/prospects',
  '/rps/pipeline/leads'
];

// Expected data counts for "Retail Product Solutions" workspace
const EXPECTED_DATA = {
  leads: 869,
  prospects: 277, 
  opportunities: 56,
  accounts: 253,
  contacts: 1130,
  clients: 8,
  partners: 1,
  speedrun: 50
};

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'DataFlowTest/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function extractDataFromHTML(html) {
  const results = {
    workspace: null,
    leftPanelData: {},
    middlePanelData: {},
    errors: [],
    warnings: []
  };

  try {
    // Extract workspace name
    const workspaceMatch = html.match(/Retail Product Solutions/);
    results.workspace = workspaceMatch ? 'Retail Product Solutions' : 'Unknown';

    // Extract left panel numbers
    const leftPanelPatterns = [
      { key: 'leads', pattern: /Leads.*?(\d+)/ },
      { key: 'prospects', pattern: /Prospects.*?(\d+)/ },
      { key: 'opportunities', pattern: /Opportunities.*?(\d+)/ },
      { key: 'accounts', pattern: /Accounts.*?(\d+)/ },
      { key: 'contacts', pattern: /Contacts.*?(\d+)/ },
      { key: 'clients', pattern: /Clients.*?(\d+)/ },
      { key: 'partners', pattern: /Partners.*?(\d+)/ },
      { key: 'speedrun', pattern: /Speedrun.*?(\d+)/ }
    ];

    leftPanelPatterns.forEach(({ key, pattern }) => {
      const match = html.match(pattern);
      if (match) {
        results.leftPanelData[key] = parseInt(match[1]);
      } else {
        results.leftPanelData[key] = 'Not found';
      }
    });

    // Extract middle panel data
    const middlePanelPatterns = [
      { key: 'totalCount', pattern: /(\d+)\s+Total/ },
      { key: 'tableData', pattern: /No [a-zA-Z]+ yet|No data available/ },
      { key: 'loadingState', pattern: /Loading workspace|Initializing authentication/ }
    ];

    middlePanelPatterns.forEach(({ key, pattern }) => {
      const match = html.match(pattern);
      if (match) {
        results.middlePanelData[key] = match[0];
      } else {
        results.middlePanelData[key] = 'Not found';
      }
    });

    // Check for default workspace pollution
    if (html.includes('unified-default-default') || html.includes('workspaceId=default')) {
      results.errors.push('DEFAULT WORKSPACE POLLUTION DETECTED - API calls still using default workspace');
    }

    // Check for wrong numbers (should match expected data)
    Object.keys(EXPECTED_DATA).forEach(key => {
      if (results.leftPanelData[key] !== 'Not found' && results.leftPanelData[key] !== EXPECTED_DATA[key]) {
        results.warnings.push(`${key}: Expected ${EXPECTED_DATA[key]}, got ${results.leftPanelData[key]}`);
      }
    });

  } catch (error) {
    results.errors.push(`Error parsing HTML: ${error.message}`);
  }

  return results;
}

function printResults(page, results) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 TESTING: ${page}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`🏢 Workspace: ${results.workspace}`);
  
  console.log(`\n📊 LEFT PANEL DATA:`);
  Object.entries(results.leftPanelData).forEach(([key, value]) => {
    const expected = EXPECTED_DATA[key];
    const status = value === expected ? '✅' : value === 'Not found' ? '❌' : '⚠️';
    console.log(`  ${status} ${key}: ${value} (expected: ${expected})`);
  });

  console.log(`\n📋 MIDDLE PANEL DATA:`);
  Object.entries(results.middlePanelData).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  if (results.errors.length > 0) {
    console.log(`\n🚨 ERRORS:`);
    results.errors.forEach(error => console.log(`  ❌ ${error}`));
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS:`);
    results.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
  }

  // Overall status
  const hasErrors = results.errors.length > 0;
  const hasWarnings = results.warnings.length > 0;
  const isCorrectWorkspace = results.workspace === 'Retail Product Solutions';
  
  if (hasErrors) {
    console.log(`\n🔴 OVERALL STATUS: FAILED - Critical errors detected`);
  } else if (hasWarnings) {
    console.log(`\n🟡 OVERALL STATUS: PARTIAL SUCCESS - Some issues detected`);
  } else if (isCorrectWorkspace) {
    console.log(`\n🟢 OVERALL STATUS: SUCCESS - All data loading correctly`);
  } else {
    console.log(`\n🔴 OVERALL STATUS: FAILED - Wrong workspace detected`);
  }
}

async function runTests() {
  console.log('🧪 COMPREHENSIVE DATA FLOW TEST');
  console.log('Testing that left panel and middle panel get correct data from right workspace');
  console.log(`Expected workspace: Retail Product Solutions`);
  console.log(`Expected data counts:`, EXPECTED_DATA);
  console.log(`\n${'='.repeat(80)}`);

  for (const page of TEST_PAGES) {
    try {
      console.log(`\n🔄 Testing ${page}...`);
      const response = await makeRequest(page);
      
      if (response.statusCode === 200) {
        const results = extractDataFromHTML(response.data);
        printResults(page, results);
      } else {
        console.log(`❌ HTTP ${response.statusCode} for ${page}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${page}: ${error.message}`);
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('🧪 TEST COMPLETE');
  console.log(`${'='.repeat(80)}`);
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, extractDataFromHTML, EXPECTED_DATA };
