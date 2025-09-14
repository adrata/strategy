#!/usr/bin/env tsx
/**
 * 🧪 TEST FIXED MATCHING
 * 
 * Test our corrected comma-handling logic
 */

// Copy the exact fixed logic for testing
function testFlexibleTitlePattern(titleLower: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    const patternLower = pattern.toLowerCase();
    
    // Method 1: Exact substring match (existing logic)
    if (titleLower.includes(patternLower)) {
      return true;
    }
    
    // Method 2: COMMA-HANDLING - Remove commas and normalize spaces
    // "Director, Sales" becomes "director sales" to match "Director Sales"
    const normalizedTitle = titleLower.replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim();
    const normalizedPattern = patternLower.replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (normalizedTitle.includes(normalizedPattern)) {
      return true;
    }
    
    // Method 3: VP/SVP expansion - handle abbreviation differences
    // "Vice President, Sales" should match "VP Sales"
    let expandedTitle = normalizedTitle;
    expandedTitle = expandedTitle.replace(/\bvice president\b/g, 'vp');
    expandedTitle = expandedTitle.replace(/\bsenior vice president\b/g, 'svp');
    
    if (expandedTitle.includes(normalizedPattern)) {
      return true;
    }
    
    // Method 4: Reverse - "VP Sales" should match "Vice President, Sales"
    let expandedPattern = normalizedPattern;
    expandedPattern = expandedPattern.replace(/\bvp\b/g, 'vice president');
    expandedPattern = expandedPattern.replace(/\bsvp\b/g, 'senior vice president');
    
    if (normalizedTitle.includes(expandedPattern)) {
      return true;
    }
    
    // Method 5: Word-order independent matching for key terms
    const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);
    const patternWords = normalizedPattern.split(/\s+/).filter(w => w.length > 2);
    
    // For roles like "Director Sales", both "director" and "sales" must be present
    if (patternWords.length >= 2) {
      const matchingWords = patternWords.filter(pw => 
        titleWords.some(tw => tw.includes(pw) || pw.includes(tw))
      );
      
      if (matchingWords.length >= patternWords.length) {
        return true;
      }
    }
  }
  
  return false;
}

async function main() {
  console.log('🧪 Testing FIXED flexible title matching...\n');

  // Our patterns
  const decisionPatterns = ['VP Sales', 'SVP Sales', 'Director Sales', 'Senior Director Sales', 'VP Business Development'];
  const championPatterns = ['Director Sales', 'Senior Director Sales', 'Director Business Development', 'Director Sales Operations'];

  // Dell's actual formats
  const dellTitles = [
    'Vice President, Sales',
    'Vice President, Enterprise Sales', 
    'Director, Sales',
    'Director, Business Development',
    'Senior Director, Sales',
    'Manager, Sales Operations'
  ];

  console.log('🎯 TESTING FIXED DECISION MAKER MATCHING:');
  dellTitles.forEach(title => {
    const matches = testFlexibleTitlePattern(title.toLowerCase(), decisionPatterns);
    if (matches) {
      console.log(`✅ "${title}" → Decision Maker`);
    } else {
      console.log(`❌ "${title}" → NO MATCH`);
    }
  });

  console.log('\n🎯 TESTING FIXED CHAMPION MATCHING:');
  dellTitles.forEach(title => {
    const matches = testFlexibleTitlePattern(title.toLowerCase(), championPatterns);
    if (matches) {
      console.log(`✅ "${title}" → Champion`);
    } else {
      console.log(`❌ "${title}" → NO MATCH`);
    }
  });

  console.log('\n🚀 EXPECTED RESULTS:');
  console.log('- "Vice President, Sales" should match "VP Sales" ✅');
  console.log('- "Director, Sales" should match "Director Sales" ✅');
  console.log('- "Director, Business Development" should match "Director Business Development" ✅');
}

main().catch(console.error);
