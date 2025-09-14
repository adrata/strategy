#!/usr/bin/env tsx

/**
 * 🧪 TEST SIMPLIFIED PIPELINE LOGIC
 * 
 * Test the two critical fixes without expensive API calls:
 * 1. SVP vs VP classification 
 * 2. Blocker discovery (not filtered out)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { BuyerGroupIdentifier } from '../src/platform/services/buyer-group/buyer-group-identifier';
import { ProfileAnalyzer } from '../src/platform/services/buyer-group/profile-analyzer';
import { SellerProfileGenerator } from '../src/platform/services/buyer-group/seller-profiles';
import { PersonProfile, SellerProfile } from '../src/platform/services/buyer-group/types';

async function testSimplifiedPipelineLogic() {
  console.log('🧪 TESTING SIMPLIFIED PIPELINE LOGIC');
  console.log('===================================');
  console.log('💡 Testing two critical fixes:');
  console.log('   1. SVP vs VP classification');
  console.log('   2. Blocker discovery (not filtered out)');
  console.log();

  const sellerProfile = SellerProfileGenerator.generateProfile('dell-na-enterprise-250k');
  if (!sellerProfile) {
    throw new Error('Could not generate Dell seller profile');
  }

  const analyzer = new ProfileAnalyzer();
  const identifier = new BuyerGroupIdentifier();

  // Test profiles representing the two issues
  const testProfiles: PersonProfile[] = [
    // Issue 1: SVP should be Decision Maker (higher than VP)
    {
      id: 1,
      fullName: 'John Senior',
      title: 'Senior Vice President Sales', // SVP - should be Decision Maker
      department: 'Sales',
      company: 'Dell Technologies',
      seniorityLevel: 'SVP',
      influenceScore: 85,
      location: 'Austin, TX',
      tenure: 36,
      emailAddress: 'john.senior@dell.com',
      linkedinUrl: 'https://linkedin.com/in/johnsenior'
    },
    {
      id: 2,
      fullName: 'Jane Vice',
      title: 'Vice President Sales', // VP - should also be Decision Maker but lower priority
      department: 'Sales', 
      company: 'Dell Technologies',
      seniorityLevel: 'VP',
      influenceScore: 80,
      location: 'Austin, TX',
      tenure: 24,
      emailAddress: 'jane.vice@dell.com',
      linkedinUrl: 'https://linkedin.com/in/janevice'
    },
    
    // Issue 2: Blockers should NOT be filtered out
    {
      id: 3,
      fullName: 'Mike Procurement',
      title: 'Director Procurement', // Should be Blocker, not filtered out
      department: 'Procurement',
      company: 'Dell Technologies',
      seniorityLevel: 'Director',
      influenceScore: 70,
      location: 'Austin, TX',
      tenure: 48,
      emailAddress: 'mike.procurement@dell.com',
      linkedinUrl: 'https://linkedin.com/in/mikeprocurement'
    },
    {
      id: 4,
      fullName: 'Sarah Legal',
      title: 'VP Legal', // Should be Blocker, not filtered out
      department: 'Legal',
      company: 'Dell Technologies', 
      seniorityLevel: 'VP',
      influenceScore: 75,
      location: 'Austin, TX',
      tenure: 60,
      emailAddress: 'sarah.legal@dell.com',
      linkedinUrl: 'https://linkedin.com/in/sarahlegal'
    }
  ];

  console.log('🔍 TESTING FILTERING LOGIC (Should NOT filter out blockers):');
  console.log('============================================================');
  
  const analysisConfig = {
    minInfluenceScore: 6,
    requireDirector: false,
    allowIC: true
  };

  testProfiles.forEach(profile => {
    const passes = analyzer.passesQualityFilters(profile, sellerProfile, analysisConfig);
    const shouldPass = !profile.title.includes('HR') && !profile.title.includes('Facilities'); // Only invalid ones should fail
    
    console.log(`${profile.title} (${profile.department}): ${passes ? '✅ PASSED' : '❌ FILTERED OUT'}`);
    
    if (passes !== shouldPass) {
      console.log(`   ⚠️  UNEXPECTED: Expected ${shouldPass ? 'PASS' : 'FAIL'}`);
    }
  });

  console.log();
  console.log('🎯 TESTING ROLE ASSIGNMENT LOGIC:');
  console.log('=================================');

  // Test role assignment
  const buyerGroup = identifier.identifyBuyerGroup(testProfiles, sellerProfile);
  
  console.log('📊 ROLE ASSIGNMENTS:');
  console.log(`Decision Makers: ${buyerGroup.roles.decision.length}`);
  buyerGroup.roles.decision.forEach((role, i) => {
    const profile = testProfiles.find(p => p.id === role.personId);
    console.log(`   ${i + 1}. ${profile?.title} (${profile?.fullName}) - Score: ${role.score}`);
  });

  console.log(`Champions: ${buyerGroup.roles.champion.length}`);
  buyerGroup.roles.champion.forEach((role, i) => {
    const profile = testProfiles.find(p => p.id === role.personId);
    console.log(`   ${i + 1}. ${profile?.title} (${profile?.fullName}) - Score: ${role.score}`);
  });

  console.log(`Stakeholders: ${buyerGroup.roles.stakeholder.length}`);
  buyerGroup.roles.stakeholder.forEach((role, i) => {
    const profile = testProfiles.find(p => p.id === role.personId);
    console.log(`   ${i + 1}. ${profile?.title} (${profile?.fullName}) - Score: ${role.score}`);
  });

  console.log(`Blockers: ${buyerGroup.roles.blocker.length}`);
  buyerGroup.roles.blocker.forEach((role, i) => {
    const profile = testProfiles.find(p => p.id === role.personId);
    console.log(`   ${i + 1}. ${profile?.title} (${profile?.fullName}) - Score: ${role.score}`);
  });

  console.log(`Introducers: ${buyerGroup.roles.introducer.length}`);
  buyerGroup.roles.introducer.forEach((role, i) => {
    const profile = testProfiles.find(p => p.id === role.personId);
    console.log(`   ${i + 1}. ${profile?.title} (${profile?.fullName}) - Score: ${role.score}`);
  });

  console.log();
  console.log('🎯 PRIORITY TESTING (SVP should rank higher than VP):');
  console.log('====================================================');
  
  const decisionMakers = buyerGroup.roles.decision;
  if (decisionMakers.length >= 2) {
    const svpRole = decisionMakers.find(role => {
      const profile = testProfiles.find(p => p.id === role.personId);
      return profile?.title.includes('Senior Vice President');
    });
    
    const vpRole = decisionMakers.find(role => {
      const profile = testProfiles.find(p => p.id === role.personId);
      return profile?.title.includes('Vice President') && !profile?.title.includes('Senior');
    });

    if (svpRole && vpRole) {
      console.log(`SVP Score: ${svpRole.score}`);
      console.log(`VP Score: ${vpRole.score}`);
      
      if (svpRole.score > vpRole.score) {
        console.log('✅ CORRECT: SVP ranks higher than VP');
      } else {
        console.log('❌ ISSUE: VP ranks same or higher than SVP');
      }
    }
  }

  console.log();
  console.log('📋 SUMMARY:');
  console.log('===========');
  console.log(`✅ Filtering allows blockers: ${buyerGroup.roles.blocker.length > 0 ? 'YES' : 'NO'}`);
  console.log(`✅ SVP classification: ${decisionMakers.some(role => {
    const profile = testProfiles.find(p => p.id === role.personId);
    return profile?.title.includes('Senior Vice President');
  }) ? 'DECISION MAKER' : 'OTHER'}`);
  console.log(`✅ VP classification: ${decisionMakers.some(role => {
    const profile = testProfiles.find(p => p.id === role.personId);
    return profile?.title.includes('Vice President') && !profile?.title.includes('Senior');
  }) ? 'DECISION MAKER' : 'OTHER'}`);

  const allTestsPassed = 
    buyerGroup.roles.blocker.length > 0 && // Blockers found
    decisionMakers.some(role => {
      const profile = testProfiles.find(p => p.id === role.personId);
      return profile?.title.includes('Senior Vice President');
    }); // SVP is decision maker

  console.log();
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Pipeline should work correctly.');
    console.log('✅ Ready to run expensive Dell pipeline with confidence.');
  } else {
    console.log('⚠️  SOME TESTS FAILED! Need to fix issues before running expensive pipeline.');
  }
  
  return allTestsPassed;
}

// Run the test
testSimplifiedPipelineLogic()
  .then(success => {
    if (success) {
      console.log('\n🚀 RECOMMENDATION: Proceed with full Dell pipeline run');
    } else {
      console.log('\n🛠️  RECOMMENDATION: Fix identified issues first');
    }
  })
  .catch(console.error);
