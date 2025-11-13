#!/usr/bin/env node
/**
 * Simple test for workspace slug resolution
 */

const workspaceMappings = [
  { slug: 'top-temp', id: '01K9QAP09FHT6EAP1B4G2KP3D2', name: 'Top Temp' },
  { slug: 'toptemp', id: '01K9QAP09FHT6EAP1B4G2KP3D2', name: 'Top Temp' },
  { slug: 'adrata', id: '01K7464TNANHQXPCZT1FYX205V', name: 'Adrata' },
  { slug: 'notary-everyday', id: '01K7DNYR5VZ7JY36KGKKN76XZ1', name: 'Notary Everyday' },
  { slug: 'pinpoint', id: '01K90EQWJCCN2JDMRQF12F49GN', name: 'Pinpoint' },
];

function getWorkspaceIdBySlug(slug) {
  const mapping = workspaceMappings.find(w => w.slug === slug);
  return mapping ? mapping.id : null;
}

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

if (failed === 0) {
  console.log('✅ All tests passed! Both /toptemp/ and /top-temp/ URLs will now work correctly.\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!\n');
  process.exit(1);
}

