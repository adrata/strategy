#!/usr/bin/env node

/**
 * Audit Leads vs Prospects with Real Engagement Data
 * 
 * Now that we have real deal data, let's audit the current leads and prospects
 * to ensure proper engagement-based categorization using real activity data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditLeadsProspectsWithRealData() {
  console.log('🔍 AUDITING LEADS VS PROSPECTS WITH REAL ACTIVITY DATA\n');

  try {
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Adrata workspace

    // 1. Get leads with real activities and emails
    console.log('📊 LOADING LEADS WITH ACTIVITY DATA...');
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
            description: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        emails: {
          select: {
            id: true,
            sentAt: true,
            receivedAt: true,
            isRead: true,
            createdAt: true,
          },
          take: 5
        },
        opportunities: {
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
          }
        }
      },
      take: 50
    });

    console.log(`✅ Found ${leads.length} leads\n`);

    // 2. Get prospects with real activities and emails
    console.log('📊 LOADING PROSPECTS WITH ACTIVITY DATA...');
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
            description: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        emails: {
          select: {
            id: true,
            sentAt: true,
            receivedAt: true,
            isRead: true,
            createdAt: true,
          },
          take: 5
        },
        opportunities: {
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
          }
        }
      },
      take: 50
    });

    console.log(`✅ Found ${prospects.length} prospects\n`);

    // 3. Analyze engagement patterns
    console.log('🎯 ANALYZING REAL ENGAGEMENT PATTERNS:\n');

    // Analyze leads
    console.log('LEADS ANALYSIS:');
    const leadStats = {
      total: leads.length,
      withActivities: 0,
      withEmails: 0,
      withOpportunities: 0,
      withPositiveOutcome: 0,
      withCompletedActivities: 0,
      withEmailReads: 0,
      withRecentActivity: 0,
      lastContactedNever: 0
    };

    console.log('Sample Leads:');
    leads.slice(0, 10).forEach((lead, index) => {
      const hasActivities = lead.activities && lead.activities.length > 0;
      const hasEmails = lead.emails && lead.emails.length > 0;
      const hasOpportunities = lead.opportunities && lead.opportunities.length > 0;
      const hasPositiveOutcome = lead.activities?.some(a => a.outcome === 'positive');
      const hasCompletedActivities = lead.activities?.some(a => a.status === 'completed');
      const hasEmailReads = lead.emails?.some(e => e.isRead);
      const hasRecentActivity = lead.activities?.some(a => {
        const daysDiff = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 30;
      });
      const lastContacted = lead.lastActionDate || 'Never';

      if (hasActivities) leadStats.withActivities++;
      if (hasEmails) leadStats.withEmails++;
      if (hasOpportunities) leadStats.withOpportunities++;
      if (hasPositiveOutcome) leadStats.withPositiveOutcome++;
      if (hasCompletedActivities) leadStats.withCompletedActivities++;
      if (hasEmailReads) leadStats.withEmailReads++;
      if (hasRecentActivity) leadStats.withRecentActivity++;
      if (lastContacted === 'Never') leadStats.lastContactedNever++;

      console.log(`  ${index + 1}. ${lead.fullName} (${lead.company})`);
      console.log(`     Last Contact: ${lastContacted}`);
      console.log(`     Activities: ${lead.activities?.length || 0} | Emails: ${lead.emails?.length || 0} | Opportunities: ${lead.opportunities?.length || 0}`);
      if (hasPositiveOutcome) console.log(`     ✅ Has positive outcomes`);
      if (hasCompletedActivities) console.log(`     ✅ Has completed activities`);
      if (hasEmailReads) console.log(`     ✅ Has email engagement`);
      console.log('');
    });

    // Analyze prospects
    console.log('PROSPECTS ANALYSIS:');
    const prospectStats = {
      total: prospects.length,
      withActivities: 0,
      withEmails: 0,
      withOpportunities: 0,
      withPositiveOutcome: 0,
      withCompletedActivities: 0,
      withEmailReads: 0,
      withRecentActivity: 0,
      lastContactedNever: 0
    };

    console.log('Sample Prospects:');
    prospects.slice(0, 10).forEach((prospect, index) => {
      const hasActivities = prospect.activities && prospect.activities.length > 0;
      const hasEmails = prospect.emails && prospect.emails.length > 0;
      const hasOpportunities = prospect.opportunities && prospect.opportunities.length > 0;
      const hasPositiveOutcome = prospect.activities?.some(a => a.outcome === 'positive');
      const hasCompletedActivities = prospect.activities?.some(a => a.status === 'completed');
      const hasEmailReads = prospect.emails?.some(e => e.isRead);
      const hasRecentActivity = prospect.activities?.some(a => {
        const daysDiff = (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 30;
      });
      const lastContacted = prospect.lastActionDate || 'Never';

      if (hasActivities) prospectStats.withActivities++;
      if (hasEmails) prospectStats.withEmails++;
      if (hasOpportunities) prospectStats.withOpportunities++;
      if (hasPositiveOutcome) prospectStats.withPositiveOutcome++;
      if (hasCompletedActivities) prospectStats.withCompletedActivities++;
      if (hasEmailReads) prospectStats.withEmailReads++;
      if (hasRecentActivity) prospectStats.withRecentActivity++;
      if (lastContacted === 'Never') prospectStats.lastContactedNever++;

      console.log(`  ${index + 1}. ${prospect.fullName} (${prospect.company})`);
      console.log(`     Last Contact: ${lastContacted}`);
      console.log(`     Activities: ${prospect.activities?.length || 0} | Emails: ${prospect.emails?.length || 0} | Opportunities: ${prospect.opportunities?.length || 0}`);
      if (hasPositiveOutcome) console.log(`     ✅ Has positive outcomes`);
      if (hasCompletedActivities) console.log(`     ✅ Has completed activities`);
      if (hasEmailReads) console.log(`     ✅ Has email engagement`);
      console.log('');
    });

    // 4. Statistical comparison
    console.log('📈 STATISTICAL COMPARISON:\n');

    console.log('LEADS STATS:');
    console.log(`  Total: ${leadStats.total}`);
    console.log(`  With Activities: ${leadStats.withActivities} (${((leadStats.withActivities/leadStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Emails: ${leadStats.withEmails} (${((leadStats.withEmails/leadStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Opportunities: ${leadStats.withOpportunities} (${((leadStats.withOpportunities/leadStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Positive Outcomes: ${leadStats.withPositiveOutcome} (${((leadStats.withPositiveOutcome/leadStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Completed Activities: ${leadStats.withCompletedActivities} (${((leadStats.withCompletedActivities/leadStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Email Reads: ${leadStats.withEmailReads} (${((leadStats.withEmailReads/leadStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Recent Activity (30 days): ${leadStats.withRecentActivity} (${((leadStats.withRecentActivity/leadStats.total)*100).toFixed(1)}%)`);
    console.log(`  Never Contacted: ${leadStats.lastContactedNever} (${((leadStats.lastContactedNever/leadStats.total)*100).toFixed(1)}%)`);
    console.log('');

    console.log('PROSPECTS STATS:');
    console.log(`  Total: ${prospectStats.total}`);
    console.log(`  With Activities: ${prospectStats.withActivities} (${((prospectStats.withActivities/prospectStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Emails: ${prospectStats.withEmails} (${((prospectStats.withEmails/prospectStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Opportunities: ${prospectStats.withOpportunities} (${((prospectStats.withOpportunities/prospectStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Positive Outcomes: ${prospectStats.withPositiveOutcome} (${((prospectStats.withPositiveOutcome/prospectStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Completed Activities: ${prospectStats.withCompletedActivities} (${((prospectStats.withCompletedActivities/prospectStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Email Reads: ${prospectStats.withEmailReads} (${((prospectStats.withEmailReads/prospectStats.total)*100).toFixed(1)}%)`);
    console.log(`  With Recent Activity (30 days): ${prospectStats.withRecentActivity} (${((prospectStats.withRecentActivity/prospectStats.total)*100).toFixed(1)}%)`);
    console.log(`  Never Contacted: ${prospectStats.lastContactedNever} (${((prospectStats.lastContactedNever/prospectStats.total)*100).toFixed(1)}%)`);
    console.log('');

    // 5. Issues identification
    console.log('🚨 ISSUES IDENTIFIED:\n');

    if (prospectStats.lastContactedNever > 0) {
      const percentage = ((prospectStats.lastContactedNever/prospectStats.total)*100).toFixed(1);
      console.log(`❌ CRITICAL: ${prospectStats.lastContactedNever} prospects (${percentage}%) show "Never" contacted`);
      console.log('   This is incorrect - prospects should have engagement history by definition');
    }

    if (leadStats.withPositiveOutcome > 0) {
      const percentage = ((leadStats.withPositiveOutcome/leadStats.total)*100).toFixed(1);
      console.log(`⚠️  POTENTIAL: ${leadStats.withPositiveOutcome} leads (${percentage}%) have positive outcomes`);
      console.log('   These should likely be converted to prospects');
    }

    if (prospectStats.withActivities === 0 && prospectStats.withEmails === 0) {
      console.log(`❌ CRITICAL: No prospects have activity or email data`);
      console.log('   This suggests engagement tracking is not working properly');
    }

    console.log('');

    // 6. Recommendations
    console.log('💡 RECOMMENDATIONS:\n');
    console.log('1. ENGAGEMENT DATA INTEGRATION:');
    console.log('   - Update API routes to include activities and emails with leads/prospects');
    console.log('   - Fix "Never" contacted for prospects - use real activity timestamps');
    console.log('   - Implement proper last contact date calculation from activities');
    console.log('');

    console.log('2. PROPER CATEGORIZATION RULES:');
    console.log('   LEADS = No meaningful engagement OR negative responses');
    console.log('   - No positive outcomes in activities');
    console.log('   - No email opens/clicks/replies');
    console.log('   - No completed meetings/calls');
    console.log('   - No opportunities created');
    console.log('');

    console.log('   PROSPECTS = Positive engagement evidence');
    console.log('   - Positive outcomes in activities (calls answered, meetings attended)');
    console.log('   - Email engagement (opens, clicks, replies)');
    console.log('   - Opportunities created');
    console.log('   - Recent activity within 90 days');
    console.log('');

    console.log('3. COMPANY-LEVEL PROMOTION:');
    console.log('   - If ANY person at a company engages positively, move ALL contacts to prospects');
    console.log('   - This reflects real sales behavior where one engagement opens company doors');
    console.log('');

    console.log('4. ACTIVITY TRACKING:');
    console.log('   - Ensure all email sends/opens/clicks are tracked in activities');
    console.log('   - Record call outcomes and meeting completions');
    console.log('   - Update lastActionDate from real activity timestamps');

  } catch (error) {
    console.error('❌ AUDIT ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditLeadsProspectsWithRealData()
  .then(() => {
    console.log('✅ Audit complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
