#!/usr/bin/env node

/**
 * API Integration Validation Script
 * Tests all external APIs with real data to ensure end-to-end pipeline works
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// API Configuration
const API_CONFIGS = {
  coresignal: {
    baseUrl: process.env.CORESIGNAL_API_URL || 'https://api.coresignal.com',
    apiKey: process.env.CORESIGNAL_API_KEY,
    testEndpoints: [
      '/v1/linkedin/person/search',
      '/v1/linkedin/company/search'
    ]
  },
  perplexity: {
    baseUrl: 'https://api.perplexity.ai',
    apiKey: process.env.PERPLEXITY_API_KEY,
    testEndpoints: ['/chat/completions']
  },
  unified_enrichment: {
    baseUrl: 'http://localhost:3000',
    testEndpoints: ['/api/enrichment/unified']
  }
};

// Real test cases with TOP's actual data
const API_TEST_CASES = [
  {
    id: 'coresignal_person_search',
    api: 'coresignal',
    endpoint: '/v1/linkedin/person/search',
    payload: {
      title: 'Communications Engineer',
      company_name: 'Idaho Power Company',
      location: 'Idaho'
    },
    expectedFields: ['id', 'name', 'title', 'company', 'location'],
    description: 'Search for communications engineers at Idaho Power'
  },
  {
    id: 'coresignal_company_search',
    api: 'coresignal',
    endpoint: '/v1/linkedin/company/search',
    payload: {
      name: 'Puget Sound Energy',
      industry: 'Utilities'
    },
    expectedFields: ['id', 'name', 'industry', 'size', 'location'],
    description: 'Search for Puget Sound Energy company data'
  },
  {
    id: 'perplexity_employment_verification',
    api: 'perplexity',
    endpoint: '/chat/completions',
    payload: {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'user',
          content: 'Is Chris Mantle currently employed at Puget Sound Energy as of September 2025? Please verify his current employment status and role.'
        }
      ]
    },
    expectedFields: ['choices', 'usage'],
    description: 'Verify Chris Mantle employment at PSE'
  },
  {
    id: 'unified_enrichment_buyer_group',
    api: 'unified_enrichment',
    endpoint: '/api/enrichment/unified',
    payload: {
      type: 'buyer_group_research',
      company: 'Idaho Power Company',
      context: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        sellerProfile: {
          company: 'TOP Engineers Plus PLLC',
          industry: 'Communications Engineering',
          services: ['Critical Infrastructure', 'Broadband Deployment']
        }
      }
    },
    expectedFields: ['buyerGroup', 'contacts', 'recommendations'],
    description: 'Generate buyer group for Idaho Power'
  },
  {
    id: 'unified_enrichment_person_lookup',
    api: 'unified_enrichment',
    endpoint: '/api/enrichment/unified',
    payload: {
      type: 'person_lookup',
      query: 'Chris Mantle Puget Sound Energy',
      context: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        industry: 'Utilities',
        role: 'Communications Engineer'
      }
    },
    expectedFields: ['person', 'employment', 'recommendations'],
    description: 'Lookup Chris Mantle with context'
  }
];

async function validateAPIIntegrations() {
  console.log('🔍 Starting API Integration Validation');
  console.log('=' .repeat(60));

  const results = {
    total_tests: API_TEST_CASES.length,
    successful_tests: 0,
    failed_tests: [],
    api_status: {},
    performance_metrics: {},
    data_quality: {}
  };

  for (const testCase of API_TEST_CASES) {
    console.log(`\n🧪 Testing: ${testCase.id}`);
    console.log(`📝 ${testCase.description}`);
    console.log(`🎯 API: ${testCase.api} - ${testCase.endpoint}`);

    try {
      const startTime = Date.now();
      
      const testResult = await executeAPITest(testCase);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (testResult.success) {
        results.successful_tests++;
        console.log(`✅ SUCCESS (${responseTime}ms)`);
        
        // Track API status
        if (!results.api_status[testCase.api]) {
          results.api_status[testCase.api] = { success: 0, total: 0 };
        }
        results.api_status[testCase.api].success++;
        results.api_status[testCase.api].total++;

        // Store performance metrics
        results.performance_metrics[testCase.id] = {
          responseTime,
          dataSize: testResult.dataSize || 0,
          recordsReturned: testResult.recordsReturned || 0
        };

        // Validate data quality
        const dataQuality = validateDataQuality(testResult.data, testCase.expectedFields);
        results.data_quality[testCase.id] = dataQuality;
        console.log(`📊 Data Quality: ${Math.round(dataQuality * 100)}%`);

        if (testResult.data && Object.keys(testResult.data).length > 0) {
          console.log(`📦 Sample Data:`, JSON.stringify(testResult.data, null, 2).slice(0, 200) + '...');
        }

      } else {
        console.log(`❌ FAILED: ${testResult.error}`);
        results.failed_tests.push({
          testCase: testCase.id,
          api: testCase.api,
          error: testResult.error,
          endpoint: testCase.endpoint
        });

        // Track API status
        if (!results.api_status[testCase.api]) {
          results.api_status[testCase.api] = { success: 0, total: 0 };
        }
        results.api_status[testCase.api].total++;
      }

    } catch (error) {
      console.log(`💥 ERROR: ${error.message}`);
      results.failed_tests.push({
        testCase: testCase.id,
        api: testCase.api,
        error: error.message,
        endpoint: testCase.endpoint
      });
    }

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Generate validation report
  await generateValidationReport(results);
  
  console.log('\n🏁 API Integration Validation Complete');
  console.log(`✅ Success Rate: ${results.successful_tests}/${results.total_tests} (${Math.round(results.successful_tests/results.total_tests*100)}%)`);

  return results;
}

async function executeAPITest(testCase) {
  const config = API_CONFIGS[testCase.api];
  
  if (!config) {
    return {
      success: false,
      error: `Unknown API: ${testCase.api}`
    };
  }

  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add API key based on the service
    if (testCase.api === 'coresignal' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (testCase.api === 'perplexity' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const url = `${config.baseUrl}${testCase.endpoint}`;
    
    console.log(`🌐 Calling: ${url}`);
    
    const response = await axios({
      method: testCase.payload ? 'POST' : 'GET',
      url,
      headers,
      data: testCase.payload,
      timeout: 30000 // 30 second timeout
    });

    return {
      success: true,
      data: response.data,
      dataSize: JSON.stringify(response.data).length,
      recordsReturned: Array.isArray(response.data) ? response.data.length : 
                      (response.data.data && Array.isArray(response.data.data)) ? response.data.data.length : 1,
      status: response.status
    };

  } catch (error) {
    if (error.response) {
      return {
        success: false,
        error: `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`,
        status: error.response.status
      };
    } else if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Connection refused - service may be down'
      };
    } else {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

function validateDataQuality(data, expectedFields) {
  if (!data || typeof data !== 'object') {
    return 0;
  }

  let score = 0;
  const totalFields = expectedFields.length;

  for (const field of expectedFields) {
    if (hasNestedProperty(data, field)) {
      score++;
    }
  }

  return score / totalFields;
}

function hasNestedProperty(obj, property) {
  if (property.includes('.')) {
    const parts = property.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }
    return true;
  } else {
    return obj && typeof obj === 'object' && property in obj;
  }
}

async function generateValidationReport(results) {
  const reportContent = `
# API Integration Validation Report

**Date:** ${new Date().toISOString()}
**Test Scope:** End-to-end API pipeline validation
**Environment:** ${process.env.NODE_ENV || 'development'}

## Executive Summary

- **Total API Tests:** ${results.total_tests}
- **Successful Tests:** ${results.successful_tests}
- **Failed Tests:** ${results.failed_tests.length}
- **Success Rate:** ${Math.round(results.successful_tests/results.total_tests*100)}%

## API Status Summary

${Object.entries(results.api_status).map(([api, status]) => {
  const successRate = Math.round((status.success / status.total) * 100);
  return `- **${api}:** ${status.success}/${status.total} (${successRate}%)`;
}).join('\n')}

## Performance Metrics

${Object.entries(results.performance_metrics).map(([testId, metrics]) => 
  `- **${testId}:** ${metrics.responseTime}ms, ${metrics.recordsReturned} records, ${Math.round(metrics.dataSize/1024)}KB`
).join('\n')}

## Data Quality Scores

${Object.entries(results.data_quality).map(([testId, quality]) => 
  `- **${testId}:** ${Math.round(quality * 100)}%`
).join('\n')}

## Failed Tests

${results.failed_tests.length > 0 ? 
  results.failed_tests.map(failure => 
    `- **${failure.testCase}** (${failure.api}): ${failure.error}`
  ).join('\n') : 
  'No failed tests ✅'
}

## API Configuration Status

${Object.entries(API_CONFIGS).map(([api, config]) => {
  const hasKey = api === 'coresignal' ? !!config.apiKey : 
                 api === 'perplexity' ? !!config.apiKey : true;
  return `- **${api}:** ${hasKey ? '✅ Configured' : '❌ Missing API Key'}`;
}).join('\n')}

## Recommendations

1. ${results.successful_tests === results.total_tests ? 
     'All APIs working correctly - ready for production' : 
     'Address failed API tests before production deployment'}
2. Monitor API response times and implement caching where appropriate
3. Set up API rate limiting and retry mechanisms
4. Implement comprehensive error handling for all API failures
5. Add API health monitoring and alerting

## Next Steps

${results.successful_tests === results.total_tests ? 
  '✅ All API integrations validated - proceed with production deployment' :
  '⚠️ Fix failed API integrations before production deployment'}
`;

  // Write report to file
  const fs = require('fs');
  const path = require('path');
  
  const reportDir = 'src/app/(locker)/private/TOP/';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(reportDir, 'api-integration-validation-report.md'),
    reportContent
  );
  
  console.log(`📊 API Validation Report: ${reportDir}api-integration-validation-report.md`);
}

// Run the validation if called directly
if (require.main === module) {
  validateAPIIntegrations()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

module.exports = { validateAPIIntegrations, API_TEST_CASES };
