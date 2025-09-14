import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeUnknownOpportunities() {
  console.log('\n🔍 Analyzing Unknown Opportunities for Dano...');
  const danoWorkspaceId = "01K1VBYV8ETM2RCQA4GNN9EG72";

  try {
    // Get all opportunities for Dano's workspace first
    const allOpps = await prisma.opportunity.findMany({
      where: {
        workspaceId: danoWorkspaceId
      },
      include: {
        account: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter for unknown/empty opportunities
    const unknownOpps = allOpps.filter(opp => 
      !opp.name || 
      opp.name === '' || 
      opp.name === 'Unknown Opportunity' ||
      opp.name.toLowerCase().includes('unknown')
    );

    console.log(`\n📊 Found ${unknownOpps.length} unknown/empty opportunities`);
    
    if (unknownOpps.length > 0) {
      console.log('\n🔍 UNKNOWN OPPORTUNITY BREAKDOWN:');
      
      const byStage = {};
      const byAssignment = { assigned: 0, unassigned: 0 };
      const byAccountStatus = { hasAccount: 0, noAccount: 0 };
      
      unknownOpps.forEach(opp => {
        // Stage breakdown
        const stage = opp.stage || 'No Stage';
        byStage[stage] = (byStage[stage] || 0) + 1;
        
        // Assignment breakdown
        if (opp.assignedUserId) {
          byAssignment.assigned++;
        } else {
          byAssignment.unassigned++;
        }
        
        // Account breakdown
        if (opp.accountId && opp.account) {
          byAccountStatus.hasAccount++;
        } else {
          byAccountStatus.noAccount++;
        }
      });
      
      console.log('\n📈 BY STAGE:');
      Object.entries(byStage).forEach(([stage, count]) => {
        console.log(`- ${stage}: ${count} opportunities`);
      });
      
      console.log('\n👤 BY ASSIGNMENT:');
      console.log(`- Assigned to Dano: ${byAssignment.assigned}`);
      console.log(`- Unassigned: ${byAssignment.unassigned}`);
      
      console.log('\n🏢 BY ACCOUNT STATUS:');
      console.log(`- Has Account: ${byAccountStatus.hasAccount}`);
      console.log(`- No Account: ${byAccountStatus.noAccount}`);
      
      console.log('\n📝 SAMPLE RECORDS (first 5):');
      unknownOpps.slice(0, 5).forEach((opp, index) => {
        console.log(`${index + 1}. ID: ${opp.id.slice(-8)}`);
        console.log(`   Name: "${opp.name || 'EMPTY'}"`);
        console.log(`   Stage: ${opp.stage}`);
        console.log(`   Amount: $${opp.amount || 0}`);
        console.log(`   Account: ${opp.account?.name || 'None'}`);
        console.log(`   Assigned: ${opp.assignedUserId ? 'Yes' : 'No'}`);
        console.log(`   Created: ${opp.createdAt.toLocaleDateString()}`);
        console.log(`   Demo Data: ${opp.isDemoData}`);
        console.log('');
      });
      
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('1. Delete opportunities with empty names and no account');
      console.log('2. For opportunities with accounts, update names to match account names');
      console.log('3. Review if these are legitimate opportunities or data artifacts');
      
      // Check if they're all from the same time period (bulk import issue)
      const dates = unknownOpps.map(opp => opp.createdAt.toDateString());
      const uniqueDates = [...new Set(dates)];
      if (uniqueDates.length <= 3) {
        console.log('4. ⚠️  Most unknown opportunities created on similar dates - likely bulk import issue');
        console.log(`   Dates: ${uniqueDates.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ Error analyzing unknown opportunities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeUnknownOpportunities().catch(console.error);
