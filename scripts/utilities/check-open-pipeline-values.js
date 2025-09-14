#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function checkOpenPipelineValues() {
  try {
    console.log('🔍 CHECKING OPEN PIPELINE VALUES:');
    
    const opportunities = await prisma.opportunity.findMany({
      where: { workspaceId: DANO_WORKSPACE_ID },
      select: { id: true, name: true, stage: true, amount: true }
    });
    
    console.log(`📊 Total opportunities: ${opportunities.length}`);
    
    // Filter open opportunities (exclude closed stages)
    const openOpps = opportunities.filter(o => 
      o.stage && !['closed-won', 'closed-lost', 'closed-lost-to-competition'].includes(o.stage)
    );
    
    console.log(`📈 Open opportunities: ${openOpps.length}`);
    
    const openValue = openOpps.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    console.log(`💰 Open pipeline value: $${(openValue / 1000000).toFixed(1)}M`);
    
    console.log('\n📋 Open stages breakdown:');
    const openStages = {};
    openOpps.forEach(o => {
      openStages[o.stage] = (openStages[o.stage] || 0) + 1;
    });
    
    Object.entries(openStages).forEach(([stage, count]) => {
      console.log(`  ${stage}: ${count}`);
    });
    
    console.log('\n🏆 Expected left panel values:');
    console.log(`  Open Pipeline: $${(openValue / 1000000).toFixed(1)}M`);
    console.log(`  Open Deals: ${openOpps.length}`);
    
  } catch (error) {
    console.error('❌ Error checking pipeline values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOpenPipelineValues();
