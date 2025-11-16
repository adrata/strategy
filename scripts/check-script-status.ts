/**
 * Check Script Execution Status
 * 
 * Verifies if backfill/fix scripts have already been run to avoid duplicate data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workspaceId = process.argv[2];
  
  if (!workspaceId) {
    console.error('❌ Please provide a workspace ID as an argument');
    console.log('Usage: npx tsx scripts/check-script-status.ts <workspaceId>');
    process.exit(1);
  }

  console.log('🔍 Checking Script Execution Status');
  console.log('======================================================================');
  console.log(`📁 Workspace: ${workspaceId}\n`);

  try {
    // 1. Check fix-prospects-last-action.ts
    console.log('1️⃣ Checking fix-prospects-last-action.ts status...');
    const prospectsWithActions = await prisma.people.findMany({
      where: {
        workspaceId,
        status: 'PROSPECT',
        actions: {
          some: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lastAction: true,
        lastActionDate: true,
        actions: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: {
            type: true,
            completedAt: true
          }
        }
      },
      take: 10
    });

    const prospectsNeedingLastAction = prospectsWithActions.filter(p => {
      const latestAction = p.actions[0];
      if (!latestAction) return false;
      if (!p.lastAction || p.lastAction === 'Never') return true;
      if (p.lastActionDate && latestAction.completedAt) {
        return new Date(p.lastActionDate) < new Date(latestAction.completedAt);
      }
      return false;
    });

    console.log(`   Prospects with actions: ${prospectsWithActions.length} (sampled)`);
    console.log(`   Need lastAction fix: ${prospectsNeedingLastAction.length > 0 ? 'YES' : 'NO'}\n`);

    // 2. Check create-missing-prospect-actions.ts
    console.log('2️⃣ Checking create-missing-prospect-actions.ts status...');
    const prospectsNoActions = await prisma.people.findMany({
      where: {
        workspaceId,
        status: 'PROSPECT',
        actions: {
          none: {}
        }
      },
      select: {
        id: true
      },
      take: 10
    });

    // Check if any of these have emails or meetings
    let prospectsWithEmailsNoActions = 0;
    for (const person of prospectsNoActions.slice(0, 5)) {
      const emailCount = await prisma.email_messages.count({
        where: {
          workspaceId,
          personId: person.id
        }
      });
      const meetingCount = await prisma.events.count({
        where: {
          workspaceId,
          personId: person.id
        }
      });
      if (emailCount > 0 || meetingCount > 0) {
        prospectsWithEmailsNoActions++;
      }
    }

    console.log(`   Prospects with emails/meetings but no actions: ${prospectsWithEmailsNoActions} (sampled from ${prospectsNoActions.length})`);
    console.log(`   Need action creation: ${prospectsWithEmailsNoActions > 0 ? 'YES' : 'NO'}\n`);

    // 3. Check upgrade-engaged-leads.ts
    console.log('3️⃣ Checking upgrade-engaged-leads.ts status...');
    const allLeads = await prisma.people.findMany({
      where: {
        workspaceId,
        status: 'LEAD'
      },
      select: {
        id: true
      },
      take: 10
    });

    // Check if any have emails, meetings, or actions
    let engagedLeads = 0;
    for (const person of allLeads.slice(0, 5)) {
      const emailCount = await prisma.email_messages.count({
        where: {
          workspaceId,
          personId: person.id
        }
      });
      const meetingCount = await prisma.events.count({
        where: {
          workspaceId,
          personId: person.id
        }
      });
      const actionCount = await prisma.actions.count({
        where: {
          workspaceId,
          personId: person.id,
          deletedAt: null
        }
      });
      if (emailCount > 0 || meetingCount > 0 || actionCount > 0) {
        engagedLeads++;
      }
    }

    console.log(`   Engaged leads still as LEAD: ${engagedLeads} (sampled from ${allLeads.length})`);
    console.log(`   Need lead upgrade: ${engagedLeads > 0 ? 'YES' : 'NO'}\n`);

    // 4. Check backfill-prospect-cascade.ts
    console.log('4️⃣ Checking backfill-prospect-cascade.ts status...');
    const prospectsWithCompany = await prisma.people.findMany({
      where: {
        workspaceId,
        status: 'PROSPECT',
        companyId: { not: null }
      },
      include: {
        company: {
          select: {
            id: true,
            status: true
          }
        }
      },
      take: 10
    });

    const prospectsNeedingCascade = prospectsWithCompany.filter(p => {
      return p.company && p.company.status !== 'PROSPECT';
    });

    console.log(`   Prospects with companies: ${prospectsWithCompany.length} (sampled)`);
    console.log(`   Companies need cascade: ${prospectsNeedingCascade.length > 0 ? 'YES' : 'NO'}\n`);

    // 5. Check backfill-opportunity-next-actions.ts
    console.log('5️⃣ Checking backfill-opportunity-next-actions.ts status...');
    const opportunitiesWithoutNextAction = await prisma.companies.findMany({
      where: {
        workspaceId,
        status: 'OPPORTUNITY',
        OR: [
          { nextAction: null },
          { nextAction: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        nextAction: true
      },
      take: 5
    });

    console.log(`   Opportunities without nextAction: ${opportunitiesWithoutNextAction.length} (sampled)`);
    console.log(`   Need nextAction backfill: ${opportunitiesWithoutNextAction.length > 0 ? 'YES' : 'NO'}\n`);

    // 6. Check backfill-opportunity-deal-values.ts
    console.log('6️⃣ Checking backfill-opportunity-deal-values.ts status...');
    const opportunitiesWithoutDealValue = await prisma.companies.findMany({
      where: {
        workspaceId,
        status: 'OPPORTUNITY',
        OR: [
          { opportunityAmount: null },
          { opportunityAmount: 0 }
        ]
      },
      select: {
        id: true,
        name: true,
        opportunityAmount: true
      },
      take: 5
    });

    console.log(`   Opportunities without deal value: ${opportunitiesWithoutDealValue.length} (sampled)`);
    console.log(`   Need deal value backfill: ${opportunitiesWithoutDealValue.length > 0 ? 'YES' : 'NO'}\n`);

    // Summary
    console.log('======================================================================');
    console.log('📊 Summary:');
    console.log(`   1. fix-prospects-last-action.ts: ${prospectsNeedingLastAction.length > 0 ? 'NEEDS RUN' : 'ALREADY RUN'}`);
    console.log(`   2. create-missing-prospect-actions.ts: ${prospectsWithEmailsNoActions.length > 0 ? 'NEEDS RUN' : 'ALREADY RUN'}`);
    console.log(`   3. upgrade-engaged-leads.ts: ${engagedLeads.length > 0 ? 'NEEDS RUN' : 'ALREADY RUN'}`);
    console.log(`   4. backfill-prospect-cascade.ts: ${prospectsNeedingCascade.length > 0 ? 'NEEDS RUN' : 'ALREADY RUN'}`);
    console.log(`   5. backfill-opportunity-next-actions.ts: ${opportunitiesWithoutNextAction.length > 0 ? 'NEEDS RUN' : 'ALREADY RUN'}`);
    console.log(`   6. backfill-opportunity-deal-values.ts: ${opportunitiesWithoutDealValue.length > 0 ? 'NEEDS RUN' : 'ALREADY RUN'}`);
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Error checking script status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

