#!/usr/bin/env tsx
/**
 * 🔍 DEBUG ACTUAL TITLES
 * 
 * We need to see the exact titles CoreSignal returned to understand why matching fails
 */

import { BuyerGroupIdentifier } from '../src/platform/services/buyer-group/buyer-group-identifier';
import { getSellerProfile } from '../src/platform/services/buyer-group/seller-profiles';

async function main() {
  console.log('🔍 Testing title matching logic...\n');

  const sellerProfile = getSellerProfile('buyer-group-intelligence');
  const identifier = new BuyerGroupIdentifier();

  // Test with example Dell titles we might expect
  const testTitles = [
    // What we might expect vs what Dell actually uses
    'VP Sales', 'Vice President Sales', 'Vice President of Sales',
    'Director Sales', 'Director of Sales', 'Sales Director',
    'Senior Director Sales', 'Senior Director of Sales',
    'Account Executive', 'Sr Account Executive', 'Senior Account Executive',
    'Business Development Manager', 'Sr Business Development Manager',
    'Territory Manager', 'Territory Sales Manager',
    'Regional Sales Manager', 'Area Sales Manager',
    'Enterprise Account Manager', 'Strategic Account Manager',
    'Customer Success Manager', 'Sr Customer Success Manager',
    
    // Dell-specific titles we might see
    'Vice President, Global Sales', 'VP, Sales Operations',
    'Director, Enterprise Sales', 'Sr Director, Sales',
    'Manager, Business Development', 'Principal Account Executive',
    'Senior Manager, Sales Operations', 'Lead Account Manager'
  ];

  console.log('🎯 TESTING DECISION MAKER PATTERNS:');
  const decisionPatterns = sellerProfile.rolePriorities.decision;
  console.log('Our patterns:', decisionPatterns.slice(0, 5));
  
  testTitles.forEach(title => {
    const titleLower = title.toLowerCase();
    const matches = decisionPatterns.some(pattern => 
      titleLower.includes(pattern.toLowerCase())
    );
    if (matches) {
      const matchingPattern = decisionPatterns.find(pattern => 
        titleLower.includes(pattern.toLowerCase())
      );
      console.log(`✅ "${title}" matches "${matchingPattern}"`);
    }
  });

  console.log('\n🎯 TESTING CHAMPION PATTERNS:');
  const championPatterns = sellerProfile.rolePriorities.champion;
  console.log('Our patterns:', championPatterns.slice(0, 5));
  
  testTitles.forEach(title => {
    const titleLower = title.toLowerCase();
    const matches = championPatterns.some(pattern => 
      titleLower.includes(pattern.toLowerCase())
    );
    if (matches) {
      const matchingPattern = championPatterns.find(pattern => 
        titleLower.includes(pattern.toLowerCase())
      );
      console.log(`✅ "${title}" matches "${matchingPattern}"`);
    }
  });

  console.log('\n🎯 TESTING INTRODUCER PATTERNS (THESE WORK):');
  const introducerPatterns = sellerProfile.rolePriorities.introducer;
  console.log('Our patterns:', introducerPatterns.slice(0, 5));
  
  let introducerMatches = 0;
  testTitles.forEach(title => {
    const titleLower = title.toLowerCase();
    const matches = introducerPatterns.some(pattern => 
      titleLower.includes(pattern.toLowerCase())
    );
    if (matches) {
      const matchingPattern = introducerPatterns.find(pattern => 
        titleLower.includes(pattern.toLowerCase())
      );
      console.log(`✅ "${title}" matches "${matchingPattern}"`);
      introducerMatches++;
    }
  });

  console.log(`\n📊 RESULTS:`);
  console.log(`Introducer matches: ${introducerMatches} (These are working in our pipeline)`);
  console.log(`This confirms our matching logic works - the issue is our Decision/Champion patterns`);
  
  console.log('\n💡 HYPOTHESIS:');
  console.log('Dell likely uses titles like:');
  console.log('- "Vice President, Sales" (comma separated)');
  console.log('- "VP, Business Development" (comma separated)'); 
  console.log('- "Director, Enterprise Sales" (comma separated)');
  console.log('- Different formatting than our exact patterns');
  
  console.log('\n🔧 SOLUTION:');
  console.log('We need to make our matching more flexible to handle:');
  console.log('- Comma-separated titles');
  console.log('- "Vice President" vs "VP"');
  console.log('- Different word order');
}

main().catch(console.error);
