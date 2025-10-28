#!/usr/bin/env node

/**
 * Test Chronicle Integration
 * 
 * This script tests the Chronicle report generation and Atrium storage integration
 * for the Notary Everyday workspace.
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const NOTARY_EVERYDAY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = (url.startsWith('https') ? https : http).request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testMetricsAPI() {
  console.log('🧪 Testing Metrics API...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v1/metrics/notary-everyday?workspaceId=${NOTARY_EVERYDAY_WORKSPACE_ID}`);
    
    if (response.status === 200) {
      console.log('✅ Metrics API working');
      console.log(`📊 Current Period: ${response.data.currentPeriod}`);
      console.log(`👥 Total Clients: ${response.data.metrics.clients.total}`);
      console.log(`💰 Monthly Revenue: $${(response.data.metrics.orders.monthlyRevenue / 1000).toFixed(1)}K`);
      return true;
    } else {
      console.log('❌ Metrics API failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Metrics API error:', error.message);
    return false;
  }
}

async function testChronicleGeneration() {
  console.log('\n🧪 Testing Chronicle Report Generation...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v1/chronicle/generate-enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      reportType: 'DAILY',
      workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID
    }));
    
    if (response.status === 200) {
      console.log('✅ Chronicle generation working');
      console.log(`📄 Report ID: ${response.data.id}`);
      console.log(`📝 Title: ${response.data.title}`);
      console.log(`📊 Report Type: ${response.data.reportType}`);
      return true;
    } else {
      console.log('❌ Chronicle generation failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Chronicle generation error:', error.message);
    return false;
  }
}

async function testSchedulerStatus() {
  console.log('\n🧪 Testing Scheduler Status...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v1/chronicle/scheduler?workspaceId=${NOTARY_EVERYDAY_WORKSPACE_ID}`);
    
    if (response.status === 200) {
      console.log('✅ Scheduler status working');
      console.log(`📋 Recent reports: ${response.data.totalReports}`);
      if (response.data.recentReports.length > 0) {
        console.log(`📄 Latest report: ${response.data.recentReports[0].title}`);
        console.log(`📅 Created: ${new Date(response.data.recentReports[0].createdAt).toLocaleString()}`);
      }
      return true;
    } else {
      console.log('❌ Scheduler status failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Scheduler status error:', error.message);
    return false;
  }
}

async function testSchedulerGeneration() {
  console.log('\n🧪 Testing Scheduler Generation...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v1/chronicle/scheduler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      reportType: 'DAILY',
      workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID
    }));
    
    if (response.status === 200) {
      console.log('✅ Scheduler generation working');
      console.log(`📊 Generated reports for ${response.data.results.filter(r => r.success).length} users`);
      
      const failedReports = response.data.results.filter(r => !r.success);
      if (failedReports.length > 0) {
        console.log('⚠️  Some reports failed:');
        failedReports.forEach(r => console.log(`  - ${r.userEmail}: ${r.error}`));
      }
      return true;
    } else {
      console.log('❌ Scheduler generation failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Scheduler generation error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Chronicle Integration Test');
  console.log('=============================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Workspace ID: ${NOTARY_EVERYDAY_WORKSPACE_ID}`);
  console.log('');

  const results = {
    metrics: await testMetricsAPI(),
    chronicleGeneration: await testChronicleGeneration(),
    schedulerStatus: await testSchedulerStatus(),
    schedulerGeneration: await testSchedulerGeneration()
  };

  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Metrics API: ${results.metrics ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Chronicle Generation: ${results.chronicleGeneration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Scheduler Status: ${results.schedulerStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Scheduler Generation: ${results.schedulerGeneration ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  if (!allPassed) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('- Make sure the development server is running (npm run dev)');
    console.log('- Check that the Notary Everyday workspace exists in the database');
    console.log('- Verify that users exist in the workspace');
    console.log('- Check the console for any error messages');
  }

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = {
  testMetricsAPI,
  testChronicleGeneration,
  testSchedulerStatus,
  testSchedulerGeneration
};

