const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpeedrunData() {
  try {
    console.log('🏃 Checking Speedrun Production Data...\n');

    // Check if there are any opportunities that could be used for Speedrun
    const opportunities = await prisma.opportunity.findMany({
      where: {
        workspaceId: 'adrata',
        stage: {
          in: ['Build Rapport', 'Qualify', 'Propose', 'Negotiate', 'Close']
        }
      },
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        account: {
          select: {
            name: true,
            contacts: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                jobTitle: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${opportunities.length} opportunities for Speedrun:`);
    opportunities.forEach(opp => {
      console.log(`\n💰 ${opp.name} (${opp.stage}) - $${opp.amount?.toLocaleString() || 'N/A'}`);
      console.log(`   Company: ${opp.account?.name || 'Unknown'}`);
      console.log(`   Contacts: ${opp.account?.contacts?.length || 0}`);
      
      if (opp.account?.contacts?.length > 0) {
        opp.account.contacts.forEach(contact => {
          console.log(`     - ${contact.firstName} ${contact.lastName} (${contact.jobTitle || 'No title'}) - ${contact.email || 'No email'}`);
        });
      }
    });

    // Check Speedrun action logs
    const actionLogs = await prisma.speedrunActionLog.findMany({
      where: {
        workspaceId: 'adrata'
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10,
      select: {
        id: true,
        personName: true,
        actionLog: true,
        type: true,
        notes: true,
        nextAction: true,
        nextActionDate: true,
        timestamp: true
      }
    });

    console.log(`\n📝 Recent Speedrun Action Logs (${actionLogs.length}):`);
    actionLogs.forEach(log => {
      console.log(`\n   ${log.personName} - ${log.actionLog} (${log.type})`);
      console.log(`   Notes: ${log.notes || 'None'}`);
      console.log(`   Next: ${log.nextAction || 'None'} - ${log.nextActionDate || 'No date'}`);
      console.log(`   Time: ${log.timestamp.toLocaleString()}`);
    });

    // Check Speedrun daily progress
    const dailyProgress = await prisma.speedrunDailyProgress.findMany({
      where: {
        workspaceId: 'adrata'
      },
      orderBy: {
        date: 'desc'
      },
      take: 5,
      select: {
        id: true,
        date: true,
        targetCompleted: true,
        actualCompleted: true,
        targetCompanies: true,
        actualCompanies: true,
        targetLeads: true,
        actualLeads: true
      }
    });

    console.log(`\n📈 Speedrun Daily Progress (${dailyProgress.length}):`);
    dailyProgress.forEach(progress => {
      console.log(`\n   ${progress.date.toDateString()}:`);
      console.log(`     Completed: ${progress.actualCompleted}/${progress.targetCompleted}`);
      console.log(`     Companies: ${progress.actualCompanies}/${progress.targetCompanies}`);
      console.log(`     Leads: ${progress.actualLeads}/${progress.targetLeads}`);
    });

  } catch (error) {
    console.error('❌ Error checking Speedrun data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpeedrunData(); 