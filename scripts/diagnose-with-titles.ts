#!/usr/bin/env tsx
/**
 * 🔍 DIAGNOSE WITH TITLES
 * 
 * Re-run the buyer group analysis but log all the actual titles we have
 * to understand why matching is failing
 */

import { readFileSync } from 'fs';
import { getSellerProfile } from '../src/platform/services/buyer-group/seller-profiles';
import { BuyerGroupIdentifier } from '../src/platform/services/buyer-group/buyer-group-identifier';

// Create a diagnostic version that exposes the title matching
class DiagnosticBuyerGroupIdentifier extends BuyerGroupIdentifier {
  public diagnoseTitleMatching(titleLower: string, patterns: string[], roleType: string): boolean {
    console.log(`\n🔍 Testing "${titleLower}" for ${roleType}:`);
    
    for (const pattern of patterns) {
      const patternLower = pattern.toLowerCase();
      
      // Test exact match
      if (titleLower.includes(patternLower)) {
        console.log(`   ✅ MATCHES "${pattern}" (exact substring)`);
        return true;
      }
    }
    
    console.log(`   ❌ No matches in ${patterns.length} patterns`);
    console.log(`   First 5 patterns: ${patterns.slice(0, 5).join(', ')}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Diagnosing title matching with sample Dell titles...\n');

  const sellerProfile = getSellerProfile('buyer-group-intelligence');
  const identifier = new DiagnosticBuyerGroupIdentifier();

  // Based on our data analysis, we know Dell has people with sales experience
  // Let's test what realistic Dell titles might look like
  const realisticDellTitles = [
    // What Dell likely uses (enterprise format)
    'Vice President, Sales',
    'Vice President, Enterprise Sales', 
    'Director, Sales',
    'Director, Business Development',
    'Senior Director, Sales',
    'Manager, Sales Operations',
    'Senior Manager, Sales Operations',
    'Account Executive',
    'Senior Account Executive',
    'Principal Account Executive',
    'Territory Manager',
    'Regional Manager',
    'Business Development Manager',
    'Customer Success Manager',
    'Principal Sales Engineer',
    'Solutions Architect',
    
    // Also test some titles that might be in stakeholders
    'Director, IT',
    'Manager, Finance',
    'Vice President, Engineering'
  ];

  console.log('🎯 TESTING DECISION MAKER MATCHING:');
  realisticDellTitles.forEach(title => {
    identifier.diagnoseTitleMatching(
      title.toLowerCase(), 
      sellerProfile.rolePriorities.decision,
      'Decision Maker'
    );
  });

  console.log('\n🎯 TESTING CHAMPION MATCHING:');
  realisticDellTitles.forEach(title => {
    identifier.diagnoseTitleMatching(
      title.toLowerCase(), 
      sellerProfile.rolePriorities.champion,
      'Champion'
    );
  });

  console.log('\n🎯 TESTING INTRODUCER MATCHING (THESE WORK):');
  realisticDellTitles.forEach(title => {
    identifier.diagnoseTitleMatching(
      title.toLowerCase(), 
      sellerProfile.rolePriorities.introducer,
      'Introducer'
    );
  });

  console.log('\n💡 ANALYSIS:');
  console.log('- If "Account Executive" matches introducers but "Vice President, Sales" doesn\'t match decision makers,');
  console.log('  then the issue is our patterns don\'t handle comma-separated enterprise titles');
  console.log('- Dell uses "Vice President, Sales" but we look for "VP Sales"');
  console.log('- Dell uses "Director, Sales" but we look for "Director Sales"');
}

main().catch(console.error);
