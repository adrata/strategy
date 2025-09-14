#!/usr/bin/env node

/**
 * Audit Leads vs Prospects Engagement Data
 * 
 * This script checks:
 * 1. Current leads vs prospects data
 * 2. What activities and engagement data exist
 * 3. Whether categorization makes sense
 * 4. Recommendations for proper engagement-based classification
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditLeadsProspectsEngagement() {
  console.log('🔍 AUDITING LEADS VS PROSPECTS ENGAGEMENT DATA\n');

  try {
    const workspaceId = 'adrata';

    // 1. Get leads with activities and email data
    console.log('📊 LOADING LEADS DATA...');
    const leads = await prisma.lead.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      include: {
        activities: {
          select: {
            id: true,
            type: true,
            outcome: true,
            completedAt: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        emails: {
          select: {
            id: true,
            sentAt: true,
            status: true,
            tracking: true,
          },
          take: 3
        }
      },
      take: 20
    });

    console.log(`✅ Found ${leads.length} leads\n`);

    // 2. Get prospects with activities and email data
    console.log('📊 LOADING PROSPECTS DATA...');
    const prospects = await prisma.prospect.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
      include: {
        activities: {
          select: {
            id: true,
            type: true,
            outcome: true,
            completedAt: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        emails: {
          select: {
            id: true,
            sentAt: true,
            status: true,
            tracking: true,
          },
          take: 3
        }
      },
      take: 20
    });

    console.log(`✅ Found ${prospects.length} prospects\n`);

    // 3. Analyze engagement data
    console.log('🎯 ENGAGEMENT ANALYSIS:\n');

    console.log('LEADS ENGAGEMENT:');
    let leadsWithActivities = 0;
    let leadsWithEmails = 0;
    let leadsWithPositiveOutcome = 0;
    let leadsWithCompletedActivities = 0;

    leads.forEach((lead, index) => {
      const hasActivities = lead.activities && lead.activities.length > 0;
      const hasEmails = lead.emails && lead.emails.length > 0;
      const hasPositiveOutcome = lead.activities?.some(a => a.outcome === 'positive');
      const hasCompletedActivities = lead.activities?.some(a => a.status === 'completed');

      if (hasActivities) leadsWithActivities++;
      if (hasEmails) leadsWithEmails++;
      if (hasPositiveOutcome) leadsWithPositiveOutcome++;
      if (hasCompletedActivities) leadsWithCompletedActivities++;

      if (index < 5) {
        console.log(`  Lead ${index + 1}: ${lead.fullName}`);
        console.log(`    Activities: ${lead.activities?.length || 0}`);
        console.log(`    Emails: ${lead.emails?.length || 0}`);
        console.log(`    Last Contact: ${lead.lastActionDate || 'Never'}`);
        console.log(`    Status: ${lead.status}`);
        console.log('');
      }
    });

    console.log('PROSPECTS ENGAGEMENT:');
    let prospectsWithActivities = 0;
    let prospectsWithEmails = 0;
    let prospectsWithPositiveOutcome = 0;
    let prospectsWithCompletedActivities = 0;

    prospects.forEach((prospect, index) => {
      const hasActivities = prospect.activities && prospect.activities.length > 0;
      const hasEmails = prospect.emails && prospect.emails.length > 0;
      const hasPositiveOutcome = prospect.activities?.some(a => a.outcome === 'positive');
      const hasCompletedActivities = prospect.activities?.some(a => a.status === 'completed');

      if (hasActivities) prospectsWithActivities++;
      if (hasEmails) prospectsWithEmails++;
      if (hasPositiveOutcome) prospectsWithPositiveOutcome++;
      if (hasCompletedActivities) prospectsWithCompletedActivities++;

      if (index < 5) {
        console.log(`  Prospect ${index + 1}: ${prospect.fullName}`);
        console.log(`    Activities: ${prospect.activities?.length || 0}`);
        console.log(`    Emails: ${prospect.emails?.length || 0}`);
        console.log(`    Last Contact: ${prospect.lastActionDate || 'Never'}`);
        console.log(`    Status: ${prospect.status}`);
        console.log('');
      }
    });

    // 4. Summary statistics
    console.log('📈 SUMMARY STATISTICS:\n');
    
    console.log('LEADS:');
    console.log(`  Total: ${leads.length}`);
    console.log(`  With Activities: ${leadsWithActivities} (${((leadsWithActivities/leads.length)*100).toFixed(1)}%)`);
    console.log(`  With Emails: ${leadsWithEmails} (${((leadsWithEmails/leads.length)*100).toFixed(1)}%)`);
    console.log(`  With Positive Outcomes: ${leadsWithPositiveOutcome} (${((leadsWithPositiveOutcome/leads.length)*100).toFixed(1)}%)`);
    console.log(`  With Completed Activities: ${leadsWithCompletedActivities} (${((leadsWithCompletedActivities/leads.length)*100).toFixed(1)}%)`);
    console.log('');

    console.log('PROSPECTS:');
    console.log(`  Total: ${prospects.length}`);
    console.log(`  With Activities: ${prospectsWithActivities} (${((prospectsWithActivities/prospects.length)*100).toFixed(1)}%)`);
    console.log(`  With Emails: ${prospectsWithEmails} (${((prospectsWithEmails/prospects.length)*100).toFixed(1)}%)`);
    console.log(`  With Positive Outcomes: ${prospectsWithPositiveOutcome} (${((prospectsWithPositiveOutcome/prospects.length)*100).toFixed(1)}%)`);
    console.log(`  With Completed Activities: ${prospectsWithCompletedActivities} (${((prospectsWithCompletedActivities/prospects.length)*100).toFixed(1)}%)`);
    console.log('');

    // 5. Check for proper engagement classification issues
    console.log('🚨 POTENTIAL ISSUES:\n');
    
    const prospectsWithNoEngagement = prospects.filter(p => 
      (!p.activities || p.activities.length === 0) &&
      (!p.emails || p.emails.length === 0) &&
      !p.lastActionDate
    );

    const leadsWithHighEngagement = leads.filter(l => 
      l.activities?.some(a => a.outcome === 'positive') ||
      l.activities?.some(a => a.status === 'completed' && a.type === 'meeting')
    );

    console.log(`❌ Prospects with NO engagement data: ${prospectsWithNoEngagement.length}`);
    if (prospectsWithNoEngagement.length > 0) {
      console.log('   These should likely be leads instead:');
      prospectsWithNoEngagement.slice(0, 3).forEach(p => {
        console.log(`   - ${p.fullName} (${p.company}) - Status: ${p.status}`);
      });
    }
    console.log('');

    console.log(`✅ Leads with HIGH engagement: ${leadsWithHighEngagement.length}`);
    if (leadsWithHighEngagement.length > 0) {
      console.log('   These should likely be prospects instead:');
      leadsWithHighEngagement.slice(0, 3).forEach(l => {
        console.log(`   - ${l.fullName} (${l.company}) - Status: ${l.status}`);
      });
    }
    console.log('');

    // 6. Recommendations
    console.log('💡 RECOMMENDATIONS:\n');
    console.log('1. UPDATE API ROUTES: Include activities and email tracking in bulk lead/prospect queries');
    console.log('2. FIX ENGAGEMENT LOGIC: Use real activity data (not hardcoded classification)');
    console.log('3. PROPER CATEGORIZATION:');
    console.log('   - LEADS: No meaningful engagement OR negative responses');
    console.log('   - PROSPECTS: Positive engagement (email opens, replies, completed calls/meetings)');
    console.log('4. COMPANY-LEVEL PROMOTION: If anyone in company engages, move whole company to prospects');
    console.log('5. LAST CONTACTED: Use actual activity timestamps, not dummy "Never" values');

    // 7. Check activity types
    console.log('\n🎯 ACTIVITY TYPES FOUND:');
    const allActivities = [...leads.flatMap(l => l.activities || []), ...prospects.flatMap(p => p.activities || [])];
    const activityTypes = [...new Set(allActivities.map(a => a.type))];
    console.log(`Activity Types: ${activityTypes.join(', ')}`);
    
    const activityOutcomes = [...new Set(allActivities.map(a => a.outcome).filter(Boolean))];
    console.log(`Activity Outcomes: ${activityOutcomes.join(', ')}`);

  } catch (error) {
    console.error('❌ AUDIT ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditLeadsProspectsEngagement()
  .then(() => {
    console.log('✅ Audit complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
