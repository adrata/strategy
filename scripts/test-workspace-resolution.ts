#!/usr/bin/env ts-node
/**
 * Test workspace slug resolution
 */

import { getWorkspaceIdBySlug, getWorkspaceSlugById } from '../src/platform/config/workspace-mapping.js';

async function testWorkspaceResolution() {
  console.log('\n🧪 Testing Workspace Resolution\n');
  
  const testCases = [
    { slug: 'toptemp', expectedId: '01K9QAP09FHT6EAP1B4G2KP3D2', name: 'Top Temp' },
    { slug: 'top-temp', expectedId: '01K9QAP09FHT6EAP1B4G2KP3D2', name: 'Top Temp' },
    { slug: 'adrata', expectedId: '01K7464TNANHQXPCZT1FYX205V', name: 'Adrata' },
    { slug: 'notary-everyday', expectedId: '01K7DNYR5VZ7JY36KGKKN76XZ1', name: 'Notary Everyday' },
    { slug: 'pinpoint', expectedId: '01K90EQWJCCN2JDMRQF12F49GN', name: 'Pinpoint' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(test => {
    const resolvedId = getWorkspaceIdBySlug(test.slug);
    const isCorrect = resolvedId === test.expectedId;
    
    if (isCorrect) {
      console.log(`✅ ${test.slug} → ${resolvedId} (${test.name})`);
      passed++;
    } else {
      console.log(`❌ ${test.slug} → ${resolvedId || 'NULL'} (expected: ${test.expectedId})`);
      failed++;
    }
  });
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  // Test reverse mapping
  console.log('🔄 Testing reverse mapping:\n');
  
  const topTempSlug = getWorkspaceSlugById('01K9QAP09FHT6EAP1B4G2KP3D2');
  console.log(`Top Temp ID → ${topTempSlug} (expected: top-temp or toptemp)`);
  
  if (topTempSlug === 'top-temp' || topTempSlug === 'toptemp') {
    console.log('✅ Reverse mapping works\n');
  } else {
    console.log('❌ Reverse mapping failed\n');
  }
  
  // Test URL simulation
  console.log('🌐 Simulating URL requests:\n');
  
  const urls = [
    '/toptemp/companies/litelinx-01K9QD3V1XX8M1FXQ54B2MTDKG',
    '/top-temp/companies/litelinx-01K9QD3V1XX8M1FXQ54B2MTDKG',
  ];
  
  urls.forEach(url => {
    const slug = url.split('/')[1];
    const workspaceId = getWorkspaceIdBySlug(slug);
    console.log(`${url}`);
    console.log(`  → Workspace ID: ${workspaceId}`);
    console.log(`  → Status: ${workspaceId === '01K9QAP09FHT6EAP1B4G2KP3D2' ? '✅ Correct' : '❌ Wrong'}\n`);
  });
  
  console.log('🎉 Workspace resolution test complete!\n');
}

testWorkspaceResolution();

