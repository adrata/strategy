#!/usr/bin/env tsx
/**
 * 🔍 ANALYZE EXISTING DELL DATA
 * 
 * Re-process our existing Dell buyer group data to extract actual titles
 * and understand why matching failed
 */

import { readFileSync } from 'fs';
import { IntelligenceReport, BuyerGroupRole } from '../src/platform/services/buyer-group/types';

async function main() {
  console.log('🔍 Analyzing existing Dell Technologies data...\n');

  // Load the latest Dell report
  const reportPath = 'data/production/reports/buyer-group-dell-technologies-2025-08-11T18-30-43-448Z.json';
  const reportData: IntelligenceReport = JSON.parse(readFileSync(reportPath, 'utf8'));

  console.log('📊 Current Buyer Group Composition:');
  Object.entries(reportData.buyerGroup.roles).forEach(([role, members]) => {
    console.log(`   ${role}: ${members.length}`);
  });

  // The problem: we don't have the original titles in our report
  // But we can analyze the role assignments and pain intelligence data
  
  console.log('\n🔍 Analyzing Role Assignment Patterns:');
  
  // Look at introducers (these worked) to understand the pattern
  const introducers = reportData.buyerGroup.roles.introducer;
  console.log(`\n✅ INTRODUCERS (Working - ${introducers.length} found):`);
  introducers.slice(0, 5).forEach((member: BuyerGroupRole, i: number) => {
    console.log(`   ${i + 1}. Score: ${member.score}, Confidence: ${member.confidence}`);
    console.log(`      Rationale: ${member.rationale.join('; ')}`);
    console.log(`      Sales Experience: +${member.scoreBreakdown?.sales_experience || 0}`);
    console.log('');
  });

  // Look at stakeholders (these got "default classification")
  const stakeholders = reportData.buyerGroup.roles.stakeholder;
  console.log(`\n⚠️ STAKEHOLDERS (Default classification - ${stakeholders.length} found):`);
  stakeholders.forEach((member: BuyerGroupRole, i: number) => {
    console.log(`   ${i + 1}. Score: ${member.score}, Confidence: ${member.confidence}`);
    console.log(`      Rationale: ${member.rationale.join('; ')}`);
    console.log(`      Sales Experience: +${member.scoreBreakdown?.sales_experience || 0}`);
    console.log('');
  });

  // Look at the one blocker (this worked)
  const blockers = reportData.buyerGroup.roles.blocker;
  console.log(`\n✅ BLOCKERS (Working - ${blockers.length} found):`);
  blockers.forEach((member: BuyerGroupRole, i: number) => {
    console.log(`   ${i + 1}. Score: ${member.score}, Confidence: ${member.confidence}`);
    console.log(`      Rationale: ${member.rationale.join('; ')}`);
    console.log(`      Sales Experience: +${member.scoreBreakdown?.sales_experience || 0}`);
    console.log('');
  });

  console.log('\n💡 KEY INSIGHTS:');
  console.log('1. Introducers have "Role suggests good introduction potential" → titles matched');
  console.log('2. Stakeholders have "Default stakeholder classification" → titles did NOT match');
  console.log('3. Blockers have "Department/title suggests potential blocking role" → matched');
  console.log('4. Notice some stakeholders have sales_experience boost → they ARE sales people!');

  console.log('\n🎯 CRITICAL DISCOVERY:');
  console.log('Some "stakeholders" have sales_experience scores, meaning they ARE sales people');
  console.log('but our Decision Maker/Champion patterns are too narrow!');

  // Count how many stakeholders have sales experience
  const stakeholdersWithSalesExp = stakeholders.filter(s => s.scoreBreakdown?.sales_experience);
  console.log(`\n📊 ${stakeholdersWithSalesExp.length} out of ${stakeholders.length} stakeholders have sales experience!`);
  console.log('These should probably be Decision Makers or Champions!');

  console.log('\n🔧 SOLUTION:');
  console.log('We need to create a script that can re-analyze our existing data');
  console.log('WITHOUT making new API calls by extracting titles from the pain intelligence');
  console.log('or by looking at the evidence fields that mention "Revenue/sales role"');

  // Let's see if we can extract any title info from pain intelligence
  console.log('\n🔍 Extracting clues from Pain Intelligence:');
  const allMembers = Object.values(reportData.buyerGroup.roles).flat();
  allMembers.forEach((member: BuyerGroupRole, i: number) => {
    if (member.painIntelligence?.primaryChallenges) {
      member.painIntelligence.primaryChallenges.forEach(challenge => {
        if (challenge.evidence?.some((e: string) => e.includes('Revenue/sales'))) {
          console.log(`   Member ${member.personId}: Has revenue/sales evidence`);
          console.log(`   Current role: ${member.role}`);
          console.log(`   Sales experience: +${member.scoreBreakdown?.sales_experience || 0}`);
        }
      });
    }
  });
}

main().catch(console.error);
