#!/usr/bin/env node

/**
 * 🚀 PANEL PERFORMANCE TEST SCRIPT
 * 
 * Tests and compares performance between left panel and middle panel data loading
 */

const { performance } = require('perf_hooks');

async function testPanelPerformance() {
  console.log('🚀 [PANEL PERFORMANCE TEST] Starting comprehensive analysis...\n');

  const baseUrl = 'http://localhost:3000';
  const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
  const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';

  // Test URLs
  const tests = [
    {
      name: 'Left Panel (Unified API)',
      url: `${baseUrl}/api/data/unified?workspaceId=${workspaceId}&userId=${userId}&includeSpeedrun=true&includeDashboard=true`,
      type: 'left-panel'
    },
    {
      name: 'Middle Panel - Prospects',
      url: `${baseUrl}/api/pipeline?section=prospects&workspaceId=${workspaceId}&userId=${userId}`,
      type: 'middle-panel'
    },
    {
      name: 'Middle Panel - Leads', 
      url: `${baseUrl}/api/pipeline?section=leads&workspaceId=${workspaceId}&userId=${userId}`,
      type: 'middle-panel'
    },
    {
      name: 'Middle Panel - Opportunities',
      url: `${baseUrl}/api/pipeline?section=opportunities&workspaceId=${workspaceId}&userId=${userId}`,
      type: 'middle-panel'
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🔍 Testing: ${test.name}`);
    
    const timings = [];
    
    // Run each test 3 times to get average
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      
      try {
        const response = await fetch(test.url);
        const data = await response.json();
        const end = performance.now();
        
        const duration = end - start;
        timings.push(duration);
        
        // Extract relevant info
        let recordCount = 0;
        let cacheStatus = 'MISS';
        
        if (test.type === 'left-panel') {
          if (data.success && data.data) {
            recordCount = Object.values(data.data.counts || {}).reduce((sum, count) => sum + (count || 0), 0);
          }
        } else {
          recordCount = Array.isArray(data) ? data.length : 0;
        }
        
        console.log(`  Run ${i + 1}: ${duration.toFixed(1)}ms | ${recordCount} records | ${response.status}`);
        
      } catch (error) {
        console.error(`  Run ${i + 1}: ERROR - ${error.message}`);
        timings.push(9999); // High penalty for errors
      }
    }
    
    const avgTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
    const minTime = Math.min(...timings);
    const maxTime = Math.max(...timings);
    
    results.push({
      name: test.name,
      type: test.type,
      avgTime,
      minTime,
      maxTime,
      timings
    });
    
    console.log(`  📊 Average: ${avgTime.toFixed(1)}ms | Min: ${minTime.toFixed(1)}ms | Max: ${maxTime.toFixed(1)}ms\n`);
  }

  // Performance Analysis
  console.log('📈 [PERFORMANCE ANALYSIS]');
  console.log('=' .repeat(80));
  
  const leftPanelTest = results.find(r => r.type === 'left-panel');
  const middlePanelTests = results.filter(r => r.type === 'middle-panel');
  const avgMiddlePanelTime = middlePanelTests.reduce((sum, test) => sum + test.avgTime, 0) / middlePanelTests.length;
  
  console.log(`Left Panel Average:  ${leftPanelTest.avgTime.toFixed(1)}ms`);
  console.log(`Middle Panel Average: ${avgMiddlePanelTime.toFixed(1)}ms`);
  
  const performanceDiff = leftPanelTest.avgTime - avgMiddlePanelTime;
  const performanceRatio = leftPanelTest.avgTime / avgMiddlePanelTime;
  
  if (performanceDiff > 50) {
    console.log(`🔴 LEFT PANEL IS SLOWER by ${performanceDiff.toFixed(1)}ms (${performanceRatio.toFixed(1)}x slower)`);
    console.log('🎯 RECOMMENDATION: Optimize left panel to use same caching as middle panel');
  } else if (performanceDiff < -50) {
    console.log(`🟢 LEFT PANEL IS FASTER by ${Math.abs(performanceDiff).toFixed(1)}ms`);
  } else {
    console.log(`🟡 PANELS ARE SIMILAR in performance (${Math.abs(performanceDiff).toFixed(1)}ms difference)`);
  }
  
  console.log('\n🎯 [DETAILED RESULTS]');
  results.forEach(result => {
    console.log(`${result.name}: ${result.avgTime.toFixed(1)}ms avg (${result.minTime.toFixed(1)}-${result.maxTime.toFixed(1)}ms range)`);
  });
  
  // Cache Analysis
  console.log('\n🔄 [CACHE ANALYSIS]');
  console.log('Testing cache performance with second round...');
  
  // Test cache performance
  for (const test of tests.slice(0, 2)) { // Just test first 2 for cache
    console.log(`🔍 Cache Test: ${test.name}`);
    
    const start = performance.now();
    const response = await fetch(test.url);
    const end = performance.now();
    
    const cacheTime = end - start;
    console.log(`  Cached: ${cacheTime.toFixed(1)}ms`);
  }
  
  console.log('\n✅ [PERFORMANCE TEST COMPLETE]');
}

// Run the test
testPanelPerformance().catch(console.error);
