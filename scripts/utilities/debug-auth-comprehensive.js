#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE AUTHENTICATION & DATA LOADING DEBUG
 * Tests every possible issue that could cause "Loading workspace..." to get stuck
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Test all possible endpoints and scenarios
const TEST_ENDPOINTS = [
  // Core pages
  '/rps/pipeline/opportunities',
  '/rps/pipeline/speedrun',
  '/rps/pipeline/prospects',
  '/rps/pipeline/leads',
  
  // Auth endpoints
  '/api/auth/status',
  '/api/auth/me',
  '/api/auth/session',
  
  // Data endpoints
  '/api/data/unified',
  '/api/data/pipeline',
  '/api/data/speedrun',
  
  // Health checks
  '/api/health',
  '/api/status',
  
  // Root and workspace
  '/',
  '/rps',
  '/rps/pipeline'
];

// Test different user agents and scenarios
const TEST_SCENARIOS = [
  { name: 'Default Browser', headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } },
  { name: 'Mobile Browser', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15' } },
  { name: 'Desktop App', headers: { 'User-Agent': 'Tauri/2.6.0' } },
  { name: 'API Client', headers: { 'User-Agent': 'DataFlowTest/1.0', 'Accept': 'application/json' } }
];

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'DebugTest/1.0',
        'Accept': 'text/html,application/json,*/*',
        'Cache-Control': 'no-cache',
        ...headers
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
          data: data,
          path: path
        });
      });
    });

    req.on('error', (error) => {
      reject({ error, path });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject({ error: 'Request timeout', path });
    });

    req.end();
  });
}

function analyzeResponse(response) {
  const analysis = {
    path: response.path,
    statusCode: response.statusCode,
    contentType: response.headers['content-type'] || 'unknown',
    dataLength: response.data.length,
    isHTML: response.data.includes('<!DOCTYPE html>'),
    isJSON: response.data.trim().startsWith('{') || response.data.trim().startsWith('['),
    hasLoadingState: response.data.includes('Loading workspace') || response.data.includes('Initializing authentication'),
    hasError: response.data.includes('Error') || response.data.includes('404') || response.data.includes('500'),
    hasAuthContent: response.data.includes('AcquisitionOSProvider') || response.data.includes('useAcquisitionOS'),
    hasWorkspaceContent: response.data.includes('Retail Product Solutions') || response.data.includes('rps'),
    hasDataContent: response.data.includes('leads') || response.data.includes('prospects') || response.data.includes('opportunities'),
    hasDefaultWorkspace: response.data.includes('unified-default-default') || response.data.includes('workspaceId=default'),
    hasReactContent: response.data.includes('react') || response.data.includes('React') || response.data.includes('__next'),
    hasScripts: response.data.includes('<script') || response.data.includes('webpack'),
    hasStyles: response.data.includes('<style') || response.data.includes('css'),
    responseTime: Date.now()
  };

  return analysis;
}

function printAnalysis(analysis) {
  const status = analysis.statusCode === 200 ? '✅' : analysis.statusCode === 404 ? '❌' : '⚠️';
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 TESTING: ${analysis.path}`);
  console.log(`${'='.repeat(80)}`);
  
  console.log(`📊 RESPONSE ANALYSIS:`);
  console.log(`  ${status} Status: ${analysis.statusCode}`);
  console.log(`  📄 Content-Type: ${analysis.contentType}`);
  console.log(`  📏 Data Length: ${analysis.dataLength} bytes`);
  
  console.log(`\n🔍 CONTENT DETECTION:`);
  console.log(`  ${analysis.isHTML ? '✅' : '❌'} HTML Document`);
  console.log(`  ${analysis.isJSON ? '✅' : '❌'} JSON Response`);
  console.log(`  ${analysis.hasReactContent ? '✅' : '❌'} React Content`);
  console.log(`  ${analysis.hasScripts ? '✅' : '❌'} JavaScript Scripts`);
  console.log(`  ${analysis.hasStyles ? '✅' : '❌'} CSS Styles`);
  
  console.log(`\n🎯 AUTHENTICATION STATE:`);
  console.log(`  ${analysis.hasLoadingState ? '⏳' : '✅'} Loading State Detected`);
  console.log(`  ${analysis.hasAuthContent ? '✅' : '❌'} Auth Provider Content`);
  console.log(`  ${analysis.hasWorkspaceContent ? '✅' : '❌'} Workspace Content`);
  console.log(`  ${analysis.hasDataContent ? '✅' : '❌'} Data Content`);
  
  if (analysis.hasDefaultWorkspace) {
    console.log(`\n🚨 CRITICAL ISSUE DETECTED:`);
    console.log(`  ❌ DEFAULT WORKSPACE POLLUTION - API calls using wrong workspace`);
  }
  
  if (analysis.hasLoadingState) {
    console.log(`\n⏳ LOADING STATE ANALYSIS:`);
    if (analysis.data.includes('Loading workspace')) {
      console.log(`  🔴 STUCK: "Loading workspace..." - Authentication/workspace setup failed`);
    }
    if (analysis.data.includes('Initializing authentication')) {
      console.log(`  🟡 WAITING: "Initializing authentication..." - Auth hook not completing`);
    }
    if (analysis.data.includes('Setting up workspace')) {
      console.log(`  🟡 WAITING: "Setting up workspace..." - Workspace selection failed`);
    }
  }
  
  if (analysis.hasError) {
    console.log(`\n🚨 ERROR DETECTED:`);
    if (analysis.data.includes('404')) {
      console.log(`  ❌ 404 Not Found - Endpoint doesn't exist`);
    }
    if (analysis.data.includes('500')) {
      console.log(`  ❌ 500 Server Error - Backend failure`);
    }
  }
  
  // Overall assessment
  let assessment = 'UNKNOWN';
  if (analysis.hasLoadingState) {
    assessment = 'STUCK_IN_LOADING';
  } else if (analysis.hasError) {
    assessment = 'ERROR_RESPONSE';
  } else if (analysis.hasDataContent && analysis.hasWorkspaceContent) {
    assessment = 'WORKING_CORRECTLY';
  } else if (analysis.isHTML && analysis.hasReactContent) {
    assessment = 'RENDERING_BUT_NO_DATA';
  }
  
  console.log(`\n📋 OVERALL ASSESSMENT: ${assessment}`);
}

async function runComprehensiveDebug() {
  console.log('🔍 COMPREHENSIVE AUTHENTICATION & DATA LOADING DEBUG');
  console.log('Testing every possible issue that could cause "Loading workspace..." to get stuck');
  console.log(`\n${'='.repeat(80)}`);

  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`\n🔄 Testing ${endpoint}...`);
      const response = await makeRequest(endpoint);
      const analysis = analyzeResponse(response);
      results.push(analysis);
      printAnalysis(analysis);
    } catch (error) {
      console.log(`❌ Error testing ${endpoint}: ${error.error}`);
      results.push({ path: endpoint, error: error.error });
    }
  }

  // Summary analysis
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 COMPREHENSIVE DEBUG SUMMARY');
  console.log(`${'='.repeat(80)}`);
  
  const stuckInLoading = results.filter(r => r.hasLoadingState).length;
  const hasErrors = results.filter(r => r.hasError).length;
  const hasDefaultWorkspace = results.filter(r => r.hasDefaultWorkspace).length;
  const workingCorrectly = results.filter(r => r.assessment === 'WORKING_CORRECTLY').length;
  
  console.log(`\n🔍 ISSUE SUMMARY:`);
  console.log(`  ${stuckInLoading > 0 ? '🔴' : '✅'} Pages stuck in loading: ${stuckInLoading}`);
  console.log(`  ${hasErrors > 0 ? '🔴' : '✅'} Endpoints with errors: ${hasErrors}`);
  console.log(`  ${hasDefaultWorkspace > 0 ? '🔴' : '✅'} Default workspace pollution: ${hasDefaultWorkspace}`);
  console.log(`  ${workingCorrectly > 0 ? '✅' : '❌'} Working correctly: ${workingCorrectly}`);
  
  if (stuckInLoading > 0) {
    console.log(`\n🚨 ROOT CAUSE ANALYSIS:`);
    console.log(`  The main issue is that ${stuckInLoading} pages are stuck in "Loading workspace..."`);
    console.log(`  This indicates the AcquisitionOSProvider is never completing its initialization`);
    console.log(`  Possible causes:`);
    console.log(`    1. Authentication hook (useUnifiedAuth) is stuck`);
    console.log(`    2. Session management is failing`);
    console.log(`    3. Workspace selection logic is broken`);
    console.log(`    4. React context is not properly initialized`);
    console.log(`    5. Browser cache/storage issues`);
  }
  
  if (hasDefaultWorkspace > 0) {
    console.log(`\n🚨 WORKSPACE POLLUTION DETECTED:`);
    console.log(`  ${hasDefaultWorkspace} endpoints are still using "default" workspace`);
    console.log(`  This confirms the workspace selection fix is not working`);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 DEBUG COMPLETE');
  console.log(`${'='.repeat(80)}`);
  
  return results;
}

// Run the comprehensive debug
if (require.main === module) {
  runComprehensiveDebug().catch(console.error);
}

module.exports = { runComprehensiveDebug, analyzeResponse };
