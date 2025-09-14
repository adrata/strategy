#!/usr/bin/env npx tsx

/**
 * 🔬 DELL DATA DEPTH ANALYSIS
 * 
 * Analyzes our current Dell data collection to determine:
 * 1. Is 61 profiles enough? (vs 100,000+ at Dell)
 * 2. Are we collecting the RIGHT roles?
 * 3. What's the SEARCH vs COLLECT optimization strategy?
 * 4. How can we get ACCURATE role assignment?
 */

import path from 'path';
import fs from 'fs';

async function analyzeDellDataDepth() {
  console.log('🔬 DELL DATA DEPTH ANALYSIS');
  console.log('============================');
  console.log('🎯 Goal: From 100,000+ Dell employees to ACCURATE 8-12 person buyer group');
  console.log('');

  try {
    const dellPath = path.join(process.cwd(), 'data/production/dell-analysis/dell-1754955111533');
    
    // Read core data files
    const buyerGroupData = JSON.parse(fs.readFileSync(path.join(dellPath, '02-buyer-group-structure.json'), 'utf-8'));
    const costData = JSON.parse(fs.readFileSync(path.join(dellPath, '05-cost-analysis.json'), 'utf-8'));
    const pipelineData = JSON.parse(fs.readFileSync(path.join(dellPath, '06-pipeline-stats.json'), 'utf-8'));
    
    console.log('📊 CURRENT DATA COLLECTION ANALYSIS:');
    console.log('====================================');
    console.log(`📈 Profiles Collected: ${pipelineData.cacheStats?.size || 'Unknown'}`);
    console.log(`💰 Total Cost: ${costData.costBreakdown.total} credits ($${costData.costBreakdown.realWorldCost.currentPlan.cost})`);
    console.log(`🔍 Search Queries: ${costData.costBreakdown.mainSearch.cost / 2} queries (${costData.costBreakdown.mainSearch.cost} credits)`);
    console.log(`📊 Collections: ${costData.costBreakdown.mainCollection.description}`);
    
    console.log('\n🎯 ROLE DISTRIBUTION ANALYSIS:');
    console.log('==============================');
    
    const roleStats = Object.entries(buyerGroupData.roles).map(([role, members]: [string, any[]]) => ({
      role: role.toUpperCase(),
      current: members.length,
      optimal: getOptimalRoleCount(role),
      gap: getOptimalRoleCount(role) - members.length,
      status: members.length >= getOptimalRoleCount(role) ? '✅' : '❌'
    }));
    
    roleStats.forEach(stat => {
      console.log(`${stat.status} ${stat.role}: ${stat.current}/${stat.optimal} (gap: ${stat.gap})`);
    });
    
    const totalCurrent = roleStats.reduce((sum, stat) => sum + stat.current, 0);
    const totalOptimal = roleStats.reduce((sum, stat) => sum + stat.optimal, 0);
    console.log(`\n📊 TOTAL: ${totalCurrent}/${totalOptimal} members`);
    
    console.log('\n🔍 SEARCH vs COLLECT STRATEGY ANALYSIS:');
    console.log('=======================================');
    console.log('📋 CoreSignal API Cost Structure:');
    console.log('  • SEARCH: 2 credits per query (cheap, broad reach)');
    console.log('  • COLLECT: 2 credits per profile (expensive, detailed data)');
    console.log('');
    console.log('🎯 OPTIMAL STRATEGY for Dell (100,000+ employees):');
    console.log('  1. SEARCH: Cast wide net with micro-targeted queries');
    console.log('  2. COLLECT: Focus on highest-potential candidates');
    console.log('  3. ACCURACY: Ensure role patterns capture all variations');
    console.log('');
    
    // Analyze title patterns in our data
    console.log('🏅 TITLE PATTERN ANALYSIS:');
    console.log('==========================');
    
    const titleCounts = new Map<string, number>();
    const roleByTitle = new Map<string, string>();
    
    Object.entries(buyerGroupData.roles).forEach(([role, members]: [string, any[]]) => {
      members.forEach(member => {
        member.rationale?.forEach((line: string) => {
          const titleMatch = line.match(/Title "([^"]+)"/);
          if (titleMatch) {
            const title = titleMatch[1];
            titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
            roleByTitle.set(title, role);
          }
        });
      });
    });
    
    console.log('📋 Titles Found by Role:');
    ['decision', 'champion', 'stakeholder', 'blocker', 'introducer'].forEach(role => {
      const roleTitles = Array.from(roleByTitle.entries())
        .filter(([_, r]) => r === role)
        .map(([title, _]) => title);
      
      console.log(`\n${role.toUpperCase()} (${roleTitles.length}):`);
      roleTitles.forEach((title, i) => {
        console.log(`  ${i + 1}. "${title}"`);
      });
    });
    
    console.log('\n💡 STRATEGIC RECOMMENDATIONS:');
    console.log('==============================');
    
    // Check if we need more data or better classification
    const hasEnoughProfiles = (pipelineData.cacheStats?.size || 0) >= 50;
    const hasBalancedRoles = roleStats.every(stat => stat.gap <= 1);
    
    if (hasEnoughProfiles && !hasBalancedRoles) {
      console.log('✅ DATA COLLECTION: Sufficient profiles collected (61)');
      console.log('❌ ROLE CLASSIFICATION: Needs improvement');
      console.log('');
      console.log('🎯 RECOMMENDED ACTIONS:');
      console.log('  1. Enhance VP pattern matching for all variations');
      console.log('  2. Add enterprise-specific role overrides');
      console.log('  3. Implement smart role rebalancing');
      console.log('  4. Focus on Executive Assistants → Introducers');
      console.log('  5. Focus on Regional/Process VPs → Stakeholders');
      console.log('  6. Search for Finance/Procurement/Security → Blockers');
    } else if (!hasEnoughProfiles) {
      console.log('❌ DATA COLLECTION: Need more targeted searches');
      console.log('❌ ROLE CLASSIFICATION: Also needs improvement');
      console.log('');
      console.log('🎯 RECOMMENDED ACTIONS:');
      console.log('  1. Increase micro-targeted searches for missing roles');
      console.log('  2. Add blocker-specific search patterns');
      console.log('  3. Add introducer-specific search patterns');
      console.log('  4. Enhance role classification logic');
    } else {
      console.log('✅ Both data collection and classification look good!');
    }
    
    // SEARCH vs COLLECT efficiency analysis
    console.log('\n📊 SEARCH vs COLLECT EFFICIENCY:');
    console.log('=================================');
    const searchCredits = costData.costBreakdown.mainSearch.cost;
    const collectCredits = costData.costBreakdown.mainCollection.cost;
    const searchQueries = searchCredits / 2;
    const profilesCollected = collectCredits / 2;
    
    console.log(`🔍 SEARCH Efficiency: ${searchQueries} queries → ${profilesCollected} candidates`);
    console.log(`📊 COLLECT Efficiency: ${profilesCollected} profiles → ${totalCurrent} buyer group members`);
    console.log(`🎯 Overall Pipeline: 100,000+ employees → ${totalCurrent} buyer group (${(totalCurrent/100000*100).toFixed(4)}% precision)`);
    
    const searchToCollectRatio = searchCredits / collectCredits;
    console.log(`\n💰 COST RATIO: Search ${Math.round(searchToCollectRatio * 100)}% : Collect ${Math.round((1-searchToCollectRatio) * 100)}%`);
    
    if (searchToCollectRatio < 0.1) {
      console.log('⚠️  LOW SEARCH USAGE: Consider more micro-targeted searches');
    } else if (searchToCollectRatio > 0.5) {
      console.log('⚠️  HIGH SEARCH USAGE: Consider more selective collection');
    } else {
      console.log('✅ BALANCED SEARCH/COLLECT ratio');
    }
    
    console.log('\n🎊 ANALYSIS COMPLETE!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

function getOptimalRoleCount(role: string): number {
  const optimal = {
    decision: 2,
    champion: 3, 
    stakeholder: 2,
    blocker: 1,
    introducer: 2
  };
  return optimal[role as keyof typeof optimal] || 1;
}

// Run the analysis
if (require.main === module) {
  analyzeDellDataDepth().catch(console.error);
}
