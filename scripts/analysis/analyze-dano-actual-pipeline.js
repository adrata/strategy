#!/usr/bin/env node

/**
 * Analyze Dano's ACTUAL pipeline based on the stages he mentioned
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
const danoUserId = '01K1VBYYV7TRPY04NW4TW4XWRB';

async function analyzePipeline() {
  console.log('📊 Analyzing Dano\'s ACTUAL pipeline data...\n');
  
  try {
    // Get ALL opportunities for Dano's workspace
    const allOpportunities = await prisma.opportunity.findMany({
      where: { 
        workspaceId: danoWorkspaceId,
        deletedAt: null 
      },
      select: {
        id: true,
        name: true,
        amount: true,
        stage: true,
        assignedUserId: true,
        createdAt: true
      }
    });
    
    console.log(`🔍 Total opportunities in workspace: ${allOpportunities.length}`);
    
    // Separate assigned vs unassigned
    const assignedOpps = allOpportunities.filter(opp => opp.assignedUserId === danoUserId);
    const unassignedOpps = allOpportunities.filter(opp => !opp.assignedUserId);
    
    console.log(`👤 Assigned to Dano: ${assignedOpps.length}`);
    console.log(`❓ Unassigned: ${unassignedOpps.length}\n`);
    
    // Analyze the opportunities Dano should see (assigned + unassigned per API fix)
    const danoOpportunities = [...assignedOpps, ...unassignedOpps];
    
    // Group by stage (exact matching)
    const stageGroups = {};
    danoOpportunities.forEach(opp => {
      const stage = opp.stage || 'Unknown';
      if (!stageGroups[stage]) {
        stageGroups[stage] = { count: 0, amount: 0, opportunities: [] };
      }
      stageGroups[stage].count++;
      stageGroups[stage].amount += (opp.amount || 0);
      stageGroups[stage].opportunities.push(opp);
    });
    
    console.log('📋 ALL STAGES BREAKDOWN:');
    Object.entries(stageGroups)
      .sort(([,a], [,b]) => b.amount - a.amount)
      .forEach(([stage, data]) => {
        console.log(`   ${stage}: ${data.count} opps, $${data.amount.toLocaleString()}`);
      });
    
    // Calculate OPEN pipeline (excluding closed stages)
    const closedStages = [
      'closed-won',
      'closed-lost', 
      'closed-lost-to-competition',
      'Closed Won',
      'Closed Lost',
      'Closed - Lost'
    ];
    
    const openOpportunities = danoOpportunities.filter(opp => 
      !closedStages.some(closedStage => 
        opp.stage?.toLowerCase().includes(closedStage.toLowerCase())
      )
    );
    
    const closedOpportunities = danoOpportunities.filter(opp => 
      closedStages.some(closedStage => 
        opp.stage?.toLowerCase().includes(closedStage.toLowerCase())
      )
    );
    
    console.log('\n🎯 OPEN vs CLOSED BREAKDOWN:');
    console.log(`   📈 Open: ${openOpportunities.length} opps, $${openOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0).toLocaleString()}`);
    console.log(`   📉 Closed: ${closedOpportunities.length} opps, $${closedOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0).toLocaleString()}`);
    
    // Detailed OPEN stages breakdown (matching what user described)
    console.log('\n📊 OPEN PIPELINE STAGES (what left panel should show):');
    
    const openStageMapping = {
      'qualification': 'Qualification',
      'needs-analysis': 'Needs Analysis', 
      'value-proposition': 'Value Proposition',
      'identify-decision-makers': 'Identify Decision Makers',
      'proposal-price-quote': 'Proposal/Price Quote',
      'negotiation-review': 'Negotiation/Review',
      'Build Rapport': 'Build Rapport',
      'Understand Needs': 'Understand Needs'
    };
    
    let totalOpenCount = 0;
    let totalOpenAmount = 0;
    
    Object.entries(openStageMapping).forEach(([stageKey, stageName]) => {
      const stageOpps = openOpportunities.filter(opp => 
        opp.stage === stageKey || opp.stage === stageName
      );
      const count = stageOpps.length;
      const amount = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);
      
      if (count > 0) {
        console.log(`   ✅ ${stageName}: ${count} opps, $${amount.toLocaleString()}`);
        totalOpenCount += count;
        totalOpenAmount += amount;
      } else {
        console.log(`   ❌ ${stageName}: 0 opps, $0`);
      }
    });
    
    console.log(`\n💰 TOTAL OPEN PIPELINE: ${totalOpenCount} opportunities, $${totalOpenAmount.toLocaleString()}`);
    
    // WIN RATE CALCULATION (research-based)
    const wonOpportunities = closedOpportunities.filter(opp => 
      opp.stage?.toLowerCase().includes('won')
    );
    
    const lostOpportunities = closedOpportunities.filter(opp => 
      opp.stage?.toLowerCase().includes('lost')
    );
    
    const totalClosed = wonOpportunities.length + lostOpportunities.length;
    const winRate = totalClosed > 0 ? Math.round((wonOpportunities.length / totalClosed) * 100) : 0;
    
    console.log('\n🎯 WIN RATE CALCULATION:');
    console.log(`   Won: ${wonOpportunities.length} opportunities`);
    console.log(`   Lost: ${lostOpportunities.length} opportunities`);
    console.log(`   Total Closed: ${totalClosed} opportunities`);
    console.log(`   Win Rate: ${winRate}% (${wonOpportunities.length}/${totalClosed})`);
    
    // SPEEDRUN STATS (should be 0/40 daily, 0/200 weekly for Dano)
    console.log('\n🏃 SPEEDRUN TARGETS:');
    console.log('   Daily Goal: 40 people');
    console.log('   Weekly Goal: 200 people');
    console.log('   Current Progress: 0/40 daily, 0/200 weekly (actual usage)');
    
    console.log('\n🔧 WHAT NEEDS TO BE FIXED:');
    console.log(`   1. Left panel Open Pipeline should show: $${(totalOpenAmount / 1000000).toFixed(1)}M (not $64.4M)`);
    console.log(`   2. Left panel Open Deals should show: ${totalOpenCount} (not 142)`);
    console.log(`   3. Win Rate should show: ${winRate}%`);
    console.log('   4. Speedrun should show: 0/40 daily, 0/200 weekly');
    
  } catch (error) {
    console.error('❌ Error analyzing pipeline:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePipeline();
