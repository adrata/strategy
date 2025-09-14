import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugPipelineValues() {
  console.log('\n🔍 Debugging pipeline value discrepancies for Dano...');
  const danoWorkspaceId = "01K1VBYV8ETM2RCQA4GNN9EG72";

  try {
    // Get Dano's opportunities
    const opportunities = await prisma.opportunity.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { assignedUserId: "DANO01RETAILPRODUCTSOLUTIONS" },
          { assignedUserId: null }
        ]
      },
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        createdAt: true,
        assignedUserId: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`\n📊 Found ${opportunities.length} opportunities for Dano`);
    
    // Analyze amount field
    let hasAmount = 0;
    let totalAmount = 0;
    let openAmount = 0;
    
    const openStages = opportunities.filter(opp => {
      const stage = opp.stage?.toLowerCase() || '';
      return !stage.includes('closed') && !stage.includes('won') && !stage.includes('lost');
    });
    
    opportunities.forEach(opp => {
      if (opp.amount) {
        hasAmount++;
        totalAmount += parseFloat(opp.amount) || 0;
      }
    });
    
    openStages.forEach(opp => {
      if (opp.amount) openAmount += parseFloat(opp.amount) || 0;
    });

    console.log('\n💵 AMOUNT FIELD ANALYSIS:');
    console.log(`- Opportunities with 'amount' field: ${hasAmount}`);
    console.log(`- Total 'amount' sum: $${totalAmount.toLocaleString()}`);
    console.log(`- Open pipeline 'amount': $${openAmount.toLocaleString()}`);
    
    console.log('\n🎯 STAGE BREAKDOWN:');
    const stageGroups = {};
    opportunities.forEach(opp => {
      const stage = opp.stage || 'No Stage';
      if (!stageGroups[stage]) {
        stageGroups[stage] = { count: 0, amount: 0 };
      }
      stageGroups[stage].count++;
      stageGroups[stage].amount += parseFloat(opp.amount) || 0;
    });
    
    Object.entries(stageGroups).forEach(([stage, data]) => {
      console.log(`- ${stage}: ${data.count} opps, Amount: $${data.amount.toLocaleString()}`);
    });
    
    console.log('\n🔍 UNKNOWN OPPORTUNITIES:');
    const unknownOpps = opportunities.filter(opp => 
      opp.name?.toLowerCase().includes('unknown') || 
      opp.name === 'Unknown Opportunity'
    );
    console.log(`- Found ${unknownOpps.length} unknown opportunities`);
    unknownOpps.slice(0, 5).forEach(opp => {
      console.log(`  • ${opp.name} - Stage: ${opp.stage}, Amount: $${opp.amount || 0}`);
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('✅ Use "amount" field for pipeline calculations');
    
    if (openAmount > 0) {
      console.log(`✅ Open pipeline should show: $${(openAmount / 1000000).toFixed(1)}M`);
    }

  } catch (error) {
    console.error('❌ Error debugging pipeline values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPipelineValues().catch(console.error);
