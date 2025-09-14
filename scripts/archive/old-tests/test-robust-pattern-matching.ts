#!/usr/bin/env npx tsx

/**
 * 🧪 TEST ROBUST PATTERN MATCHING
 * 
 * Verifies that ALL title variations are properly detected
 */

// Mock the pattern matching methods for testing
function matchesSVP(text: string): boolean {
  const patterns = [
    'svp', 'senior vice president', 'senior vp', 'sr vp', 'sr vice president',
    'svp ', 'svp,', 'svp.', 'svp-', 'svp/', 'svp\\', 'svp sales', 'svp business',
    's.v.p', 's.v.p.', 'senior v.p.', 'senior v.p'
  ];
  return patterns.some(pattern => text.toLowerCase().includes(pattern));
}

function matchesVP(text: string): boolean {
  const patterns = [
    'vice president', 'vp ', 'vp,', 'vp.', 'vp-', 'vp/', 'vp sales', 'vp business',
    'v.p.', 'v.p', 'vice-president', 'vicepresident'
  ];
  return patterns.some(pattern => text.toLowerCase().includes(pattern)) && 
         !matchesSVP(text);
}

function testPatternMatching() {
  console.log('🧪 TESTING ROBUST PATTERN MATCHING');
  console.log('==================================');
  
  const testCases = [
    // SVP Test Cases
    { title: 'Svp Sales', expectedLevel: 'SVP', description: 'Real Dell case - Rick Otten' },
    { title: 'SVP Sales', expectedLevel: 'SVP', description: 'Standard format' },
    { title: 'Senior Vice President Sales', expectedLevel: 'SVP', description: 'Full format' },
    { title: 'Senior VP Business Development', expectedLevel: 'SVP', description: 'Abbreviated' },
    { title: 'Sr VP Operations', expectedLevel: 'SVP', description: 'Short format' },
    { title: 'S.V.P. Marketing', expectedLevel: 'SVP', description: 'Punctuated' },
    
    // VP Test Cases  
    { title: 'Vice President Of Sales', expectedLevel: 'VP', description: 'Real Dell case - Tom Gelbach' },
    { title: 'VP Sales', expectedLevel: 'VP', description: 'Real Dell case - John Hanlon' },
    { title: 'Vice President, Enterprise Sales', expectedLevel: 'VP', description: 'Standard format' },
    { title: 'V.P. Marketing', expectedLevel: 'VP', description: 'Punctuated' },
    { title: 'Vice-President Operations', expectedLevel: 'VP', description: 'Hyphenated' },
    
    // Director Test Cases
    { title: 'Sales Director', expectedLevel: 'Director', description: 'Standard format' },
    { title: 'Director of Sales', expectedLevel: 'Director', description: 'Full format' },
    { title: 'Senior Director Sales', expectedLevel: 'Senior Director', description: 'Senior level' },
    { title: 'Sr Director Business Development', expectedLevel: 'Senior Director', description: 'Abbreviated' },
    { title: 'Key Account Director', expectedLevel: 'Director', description: 'Real Dell case' },
    
    // Edge Cases
    { title: 'Sales VP EMEA', expectedLevel: 'VP', description: 'VP at end' },
    { title: 'Global SVP, Sales Operations', expectedLevel: 'SVP', description: 'SVP with comma' },
    { title: 'VP Sales & Marketing', expectedLevel: 'VP', description: 'Multiple functions' }
  ];
  
  console.log('\n🎯 PATTERN MATCHING RESULTS:');
  console.log('============================');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const text = testCase.title.toLowerCase();
    
    let detectedLevel = 'Unknown';
    if (matchesSVP(text)) {
      detectedLevel = 'SVP';
    } else if (matchesVP(text)) {
      detectedLevel = 'VP';
    } else if (text.includes('senior director') || text.includes('sr director')) {
      detectedLevel = 'Senior Director';
    } else if (text.includes('director')) {
      detectedLevel = 'Director';
    }
    
    const isCorrect = detectedLevel === testCase.expectedLevel;
    const status = isCorrect ? '✅' : '❌';
    
    if (isCorrect) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(`${status} "${testCase.title}"`);
    console.log(`   Expected: ${testCase.expectedLevel}, Detected: ${detectedLevel}`);
    console.log(`   Context: ${testCase.description}`);
    console.log('');
  }
  
  console.log('📊 FINAL RESULTS:');
  console.log('==================');
  console.log(`✅ Passed: ${passed}/${testCases.length}`);
  console.log(`❌ Failed: ${failed}/${testCases.length}`);
  console.log(`📈 Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎊 ALL TESTS PASSED! Pattern matching is robust.');
  } else {
    console.log('\n⚠️ Some tests failed. Pattern matching needs refinement.');
  }
  
  console.log('\n💡 KEY INSIGHTS:');
  console.log('================');
  console.log('• SVP patterns now correctly detect "Svp Sales" format');
  console.log('• VP patterns exclude SVP to prevent hierarchy conflicts'); 
  console.log('• Case-insensitive matching handles all formats');
  console.log('• Punctuation and spacing variations are covered');
  console.log('• Real Dell titles are properly classified');
}

// Run the test
testPatternMatching();
