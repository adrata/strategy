#!/usr/bin/env tsx
/**
 * 🧪 TEST ENHANCED MATCHING
 * 
 * Test our new flexible title matching against realistic Dell enterprise titles
 */

import { BuyerGroupIdentifier } from '../src/platform/services/buyer-group/buyer-group-identifier';
import { getSellerProfile } from '../src/platform/services/buyer-group/seller-profiles';

// Simulate the method for testing
class TestIdentifier extends BuyerGroupIdentifier {
  public testFlexibleTitlePattern(titleLower: string, patterns: string[]): boolean {
    // Copy the logic from our method
    for (const pattern of patterns) {
      const patternLower = pattern.toLowerCase();
      
      // Method 1: Exact substring match (existing logic)
      if (titleLower.includes(patternLower)) {
        return true;
      }
      
      // Method 2: Handle comma-separated enterprise titles
      const titleWords = titleLower.replace(/[,]/g, ' ').split(/\s+/).filter(w => w.length > 0);
      const patternWords = patternLower.split(/\s+/).filter(w => w.length > 0);
      
      // Check if all pattern words are present in title (order doesn't matter)
      const allPatternWordsPresent = patternWords.every(patternWord => {
        return titleWords.some(titleWord => {
          // Handle VP <-> Vice President equivalence
          if ((patternWord === 'vp' && titleWord === 'vice') || 
              (patternWord === 'vice' && titleWord === 'vp')) {
            return true;
          }
          // Handle SVP <-> Senior Vice President
          if ((patternWord === 'svp' && (titleWord === 'senior' || titleWord === 'vice')) ||
              ((patternWord === 'senior' || patternWord === 'vice') && titleWord === 'svp')) {
            return true;
          }
          // Standard word matching
          return titleWord.includes(patternWord) || patternWord.includes(titleWord);
        });
      });
      
      if (allPatternWordsPresent) {
        return true;
      }
      
      // Method 3: Key role word matching for complex titles
      const keyRoleWords = ['sales', 'director', 'vp', 'vice', 'president', 'business', 'development', 'revenue', 'commercial'];
      const titleRoleWords = titleWords.filter(w => keyRoleWords.includes(w));
      const patternRoleWords = patternWords.filter(w => keyRoleWords.includes(w));
      
      if (patternRoleWords.length >= 2 && titleRoleWords.length >= 2) {
        const commonWords = patternRoleWords.filter(w => titleRoleWords.includes(w));
        if (commonWords.length >= Math.min(2, patternRoleWords.length)) {
          return true;
        }
      }
    }
    
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Enhanced Flexible Title Matching...\n');

  const sellerProfile = getSellerProfile('buyer-group-intelligence');
  const testIdentifier = new TestIdentifier();

  // Realistic Dell enterprise titles that would likely exist
  const dellTitles = [
    // Decision Maker level titles Dell might use
    'Vice President, Global Sales',
    'Vice President, Enterprise Sales', 
    'VP, Business Development',
    'Senior Vice President, Commercial Sales',
    'SVP, Sales Operations',
    'Director, Sales - Americas',
    'Director, Business Development',
    'Senior Director, Enterprise Sales',
    'Regional Director, Sales',
    
    // Champion level titles
    'Director, Sales Operations',
    'Director, Revenue Operations', 
    'Senior Manager, Sales Operations',
    'Manager, Business Development',
    'Director, Customer Success',
    'Sales Operations Manager',
    'Revenue Operations Director',
    
    // These should NOT match (stakeholders)
    'Director, IT Operations',
    'Vice President, Engineering',
    'Manager, Finance',
    
    // These should match introducers (already working)
    'Account Executive, Enterprise',
    'Senior Account Executive',
    'Territory Manager, US East'
  ];

  console.log('🎯 TESTING DECISION MAKER MATCHING:');
  let decisionMatches = 0;
  dellTitles.forEach(title => {
    const matches = testIdentifier.testFlexibleTitlePattern(
      title.toLowerCase(), 
      sellerProfile.rolePriorities.decision
    );
    if (matches) {
      console.log(`✅ "${title}" → Decision Maker`);
      decisionMatches++;
    }
  });

  console.log(`\n🎯 TESTING CHAMPION MATCHING:`);
  let championMatches = 0;
  dellTitles.forEach(title => {
    const matches = testIdentifier.testFlexibleTitlePattern(
      title.toLowerCase(), 
      sellerProfile.rolePriorities.champion
    );
    if (matches) {
      console.log(`✅ "${title}" → Champion`);
      championMatches++;
    }
  });

  console.log(`\n📊 ENHANCED MATCHING RESULTS:`);
  console.log(`Decision Maker matches: ${decisionMatches}`);
  console.log(`Champion matches: ${championMatches}`);
  
  if (decisionMatches > 0 && championMatches > 0) {
    console.log('🎉 SUCCESS: Enhanced matching should fix our Dell buyer group!');
  } else {
    console.log('❌ Need further refinement');
  }
}

main().catch(console.error);
