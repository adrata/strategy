#!/usr/bin/env tsx

/**
 * Leads, Prospects & Opportunities Audit Script
 * 
 * Audits the auto-classification logic that promotes contacts through:
 * - LEAD → PROSPECT (when they reply or engage)
 * - PROSPECT → OPPORTUNITY (when business discussion detected)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditResults {
  people: {
    total: number;
    byStatus: Record<string, number>;
    withLinkedEmails: number;
    withLinkedMeetings: number;
    missingStatus: number;
    potentialMisclassifications: {
      shouldBeProspect: number;
      shouldBeOpportunity: number;
    };
  };
  companies: {
    total: number;
    byStatus: Record<string, number>;
    withLinkedEmails: number;
    withLinkedMeetings: number;
    missingStatus: number;
    potentialMisclassifications: {
      shouldBeProspect: number;
      shouldBeOpportunity: number;
    };
  };
  emails: {
    total: number;
    linkedToPerson: number;
    linkedToCompany: number;
    replies: number;
    businessDiscussions: number;
  };
  meetings: {
    total: number;
    linkedToPerson: number;
    linkedToCompany: number;
    businessDiscussions: number;
  };
  issues: string[];
  recommendations: string[];
}

async function main() {
  console.log('='.repeat(80));
  console.log('🔍 LEADS, PROSPECTS & OPPORTUNITIES AUDIT');
  console.log('='.repeat(80));

  // Find Victoria's workspace (TOP Engineering Plus)
  const workspace = await prisma.workspaces.findFirst({
    where: { name: { contains: 'TOP Engineering', mode: 'insensitive' } }
  });

  if (!workspace) {
    console.log('❌ Workspace not found');
    await prisma.$disconnect();
    return;
  }

  const victoria = await prisma.users.findFirst({
    where: {
      OR: [
        { name: { contains: 'Victoria', mode: 'insensitive' } },
        { email: { contains: 'victoria', mode: 'insensitive' } }
      ],
      workspace_users: { some: { workspaceId: workspace.id } }
    }
  });

  const workspaceId = workspace.id;
  console.log(`\n✅ User: ${victoria?.name || 'Victoria'}`);
  console.log(`✅ Workspace: ${workspace.name} (${workspaceId})\n`);

  const results: AuditResults = {
    people: {
      total: 0,
      byStatus: {},
      withLinkedEmails: 0,
      withLinkedMeetings: 0,
      missingStatus: 0,
      potentialMisclassifications: { shouldBeProspect: 0, shouldBeOpportunity: 0 }
    },
    companies: {
      total: 0,
      byStatus: {},
      withLinkedEmails: 0,
      withLinkedMeetings: 0,
      missingStatus: 0,
      potentialMisclassifications: { shouldBeProspect: 0, shouldBeOpportunity: 0 }
    },
    emails: {
      total: 0,
      linkedToPerson: 0,
      linkedToCompany: 0,
      replies: 0,
      businessDiscussions: 0
    },
    meetings: {
      total: 0,
      linkedToPerson: 0,
      linkedToCompany: 0,
      businessDiscussions: 0
    },
    issues: [],
    recommendations: []
  };

  // ============================================================================
  // AUDIT PEOPLE
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('👤 PEOPLE AUDIT');
  console.log('='.repeat(80));

  console.log('  Loading people...');
  const people = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    include: {
      company: true
    }
  });
  console.log(`  Found ${people.length} people`);

  // Get email and calendar counts separately
  console.log('  Checking email links...');
  const peopleWithEmails = await prisma.email_messages.groupBy({
    by: ['personId'],
    where: { workspaceId, personId: { not: null } },
    _count: true
  });
  const peopleWithEmailsSet = new Set(peopleWithEmails.map(p => p.personId));

  console.log('  Checking meeting links...');
  const peopleWithMeetings = await prisma.calendar_events.groupBy({
    by: ['personId'],
    where: { workspaceId, personId: { not: null } },
    _count: true
  });
  const peopleWithMeetingsSet = new Set(peopleWithMeetings.map(p => p.personId));

  results.people.total = people.length;

  // Count by status
  for (const person of people) {
    const status = person.status || 'NULL';
    results.people.byStatus[status] = (results.people.byStatus[status] || 0) + 1;
    
    if (!person.status) {
      results.people.missingStatus++;
    }
    
    if (peopleWithEmailsSet.has(person.id)) {
      results.people.withLinkedEmails++;
    }
    
    if (peopleWithMeetingsSet.has(person.id)) {
      results.people.withLinkedMeetings++;
    }
  }

  console.log(`\n📊 People by Status:`);
  const statusOrder = ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CLIENT', 'SUPERFAN', 'PARTNER', 'NULL'];
  for (const status of statusOrder) {
    if (results.people.byStatus[status]) {
      console.log(`   ${status}: ${results.people.byStatus[status]}`);
    }
  }
  // Show any other statuses
  for (const [status, count] of Object.entries(results.people.byStatus)) {
    if (!statusOrder.includes(status)) {
      console.log(`   ${status}: ${count}`);
    }
  }

  console.log(`\n📧 People with linked emails: ${results.people.withLinkedEmails}`);
  console.log(`📅 People with linked meetings: ${results.people.withLinkedMeetings}`);

  // ============================================================================
  // AUDIT COMPANIES
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('🏢 COMPANIES AUDIT');
  console.log('='.repeat(80));

  const companies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null }
  });

  // Get email and calendar counts for companies
  const companiesWithEmails = await prisma.email_messages.groupBy({
    by: ['companyId'],
    where: { workspaceId, companyId: { not: null } },
    _count: true
  });
  const companiesWithEmailsSet = new Set(companiesWithEmails.map(c => c.companyId));

  const companiesWithMeetings = await prisma.calendar_events.groupBy({
    by: ['companyId'],
    where: { workspaceId, companyId: { not: null } },
    _count: true
  });
  const companiesWithMeetingsSet = new Set(companiesWithMeetings.map(c => c.companyId));

  results.companies.total = companies.length;

  // Count by status
  for (const company of companies) {
    const status = company.status || 'NULL';
    results.companies.byStatus[status] = (results.companies.byStatus[status] || 0) + 1;
    
    if (!company.status) {
      results.companies.missingStatus++;
    }
    
    if (companiesWithEmailsSet.has(company.id)) {
      results.companies.withLinkedEmails++;
    }
    
    if (companiesWithMeetingsSet.has(company.id)) {
      results.companies.withLinkedMeetings++;
    }
  }

  console.log(`\n📊 Companies by Status:`);
  for (const status of statusOrder) {
    if (results.companies.byStatus[status]) {
      console.log(`   ${status}: ${results.companies.byStatus[status]}`);
    }
  }
  // Show any other statuses
  for (const [status, count] of Object.entries(results.companies.byStatus)) {
    if (!statusOrder.includes(status)) {
      console.log(`   ${status}: ${count}`);
    }
  }

  console.log(`\n📧 Companies with linked emails: ${results.companies.withLinkedEmails}`);
  console.log(`📅 Companies with linked meetings: ${results.companies.withLinkedMeetings}`);

  // ============================================================================
  // AUDIT EMAIL ENGAGEMENT
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📧 EMAIL ENGAGEMENT AUDIT');
  console.log('='.repeat(80));

  results.emails.total = await prisma.email_messages.count({ where: { workspaceId } });
  results.emails.linkedToPerson = await prisma.email_messages.count({ 
    where: { workspaceId, personId: { not: null } } 
  });
  results.emails.linkedToCompany = await prisma.email_messages.count({ 
    where: { workspaceId, companyId: { not: null } } 
  });

  // Count replies (emails with Re:/RE:/Fwd: in subject or with inReplyTo)
  const linkedEmails = await prisma.email_messages.findMany({
    where: { 
      workspaceId, 
      personId: { not: null } 
    },
    select: {
      id: true,
      subject: true,
      body: true,
      threadId: true,
      inReplyTo: true,
      from: true,
      personId: true,
      companyId: true,
      person: {
        select: { status: true, fullName: true }
      }
    }
  });

  const businessKeywords = [
    'proposal', 'quote', 'pricing', 'contract', 'agreement', 'deal',
    'project', 'scope', 'sow', 'statement of work', 'rfp', 'rfq',
    'budget', 'investment', 'purchase', 'buy', 'buying', 'procurement',
    'implementation', 'deployment', 'integration', 'onboarding',
    'timeline', 'deadline', 'deliverable', 'milestone',
    'demo', 'demonstration', 'trial', 'pilot', 'proof of concept',
    'meeting', 'call', 'discussion', 'consultation',
    'requirements', 'needs', 'solution', 'service', 'product',
    'opportunity', 'partnership', 'collaboration'
  ];

  let repliesFromPeople = 0;
  let businessDiscussionEmails = 0;
  const shouldBeProspect: Array<{ id: string; name: string; reason: string }> = [];
  const shouldBeOpportunity: Array<{ id: string; name: string; reason: string }> = [];

  for (const email of linkedEmails) {
    const subject = (email.subject || '').trim();
    const body = (email.body || '').toLowerCase();
    const text = `${subject} ${body}`.toLowerCase();
    
    // Check if it's a reply
    const isReply = subject.match(/^(Re|RE|Fwd|FWD|Fw|FW):\s*/i) || 
                   (email.threadId && email.inReplyTo);
    
    if (isReply) {
      repliesFromPeople++;
      
      // If person replied but still LEAD, flag it
      if (email.person && email.person.status === 'LEAD') {
        shouldBeProspect.push({
          id: email.personId!,
          name: email.person.fullName || 'Unknown',
          reason: `Replied to email: "${subject.substring(0, 50)}..."`
        });
      }
    }
    
    // Check for business keywords
    const keywordMatches = businessKeywords.filter(kw => text.includes(kw)).length;
    if (keywordMatches >= 2) {
      businessDiscussionEmails++;
      
      // If business discussion but not OPPORTUNITY, flag it
      if (email.person && 
          email.person.status !== 'OPPORTUNITY' && 
          email.person.status !== 'CLIENT') {
        shouldBeOpportunity.push({
          id: email.personId!,
          name: email.person.fullName || 'Unknown',
          reason: `Business discussion keywords in email: "${subject.substring(0, 50)}..."`
        });
      }
    }
  }

  results.emails.replies = repliesFromPeople;
  results.emails.businessDiscussions = businessDiscussionEmails;

  console.log(`\n📊 Email Statistics:`);
  console.log(`   Total emails: ${results.emails.total}`);
  console.log(`   Linked to person: ${results.emails.linkedToPerson}`);
  console.log(`   Linked to company: ${results.emails.linkedToCompany}`);
  console.log(`   Replies from people: ${repliesFromPeople}`);
  console.log(`   Business discussions detected: ${businessDiscussionEmails}`);

  // ============================================================================
  // AUDIT CALENDAR/MEETING ENGAGEMENT
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📅 MEETING ENGAGEMENT AUDIT');
  console.log('='.repeat(80));

  results.meetings.total = await prisma.calendar_events.count({ where: { workspaceId } });
  results.meetings.linkedToPerson = await prisma.calendar_events.count({ 
    where: { workspaceId, personId: { not: null } } 
  });
  results.meetings.linkedToCompany = await prisma.calendar_events.count({ 
    where: { workspaceId, companyId: { not: null } } 
  });

  // Check for business meetings
  const linkedMeetings = await prisma.calendar_events.findMany({
    where: { 
      workspaceId, 
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    },
    select: {
      id: true,
      title: true,
      description: true,
      personId: true,
      companyId: true,
      person: {
        select: { status: true, fullName: true }
      }
    }
  });

  let businessMeetings = 0;

  for (const meeting of linkedMeetings) {
    const text = `${meeting.title || ''} ${meeting.description || ''}`.toLowerCase();
    const keywordMatches = businessKeywords.filter(kw => text.includes(kw)).length;
    
    if (keywordMatches >= 2) {
      businessMeetings++;
      
      // If business meeting but person not OPPORTUNITY, flag it
      if (meeting.person && 
          meeting.person.status !== 'OPPORTUNITY' && 
          meeting.person.status !== 'CLIENT') {
        shouldBeOpportunity.push({
          id: meeting.personId!,
          name: meeting.person.fullName || 'Unknown',
          reason: `Business meeting: "${meeting.title?.substring(0, 50)}..."`
        });
      }
    }
  }

  results.meetings.businessDiscussions = businessMeetings;

  console.log(`\n📊 Meeting Statistics:`);
  console.log(`   Total meetings: ${results.meetings.total}`);
  console.log(`   Linked to person: ${results.meetings.linkedToPerson}`);
  console.log(`   Linked to company: ${results.meetings.linkedToCompany}`);
  console.log(`   Business discussions detected: ${businessMeetings}`);

  // ============================================================================
  // POTENTIAL MISCLASSIFICATIONS
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('⚠️ POTENTIAL MISCLASSIFICATIONS');
  console.log('='.repeat(80));

  // Deduplicate by person ID
  const uniqueShouldBeProspect = [...new Map(shouldBeProspect.map(p => [p.id, p])).values()];
  const uniqueShouldBeOpportunity = [...new Map(shouldBeOpportunity.map(p => [p.id, p])).values()];

  results.people.potentialMisclassifications.shouldBeProspect = uniqueShouldBeProspect.length;
  results.people.potentialMisclassifications.shouldBeOpportunity = uniqueShouldBeOpportunity.length;

  if (uniqueShouldBeProspect.length > 0) {
    console.log(`\n🔄 People who replied but are still LEAD (should be PROSPECT): ${uniqueShouldBeProspect.length}`);
    for (const p of uniqueShouldBeProspect.slice(0, 10)) {
      console.log(`   - ${p.name}: ${p.reason}`);
    }
    if (uniqueShouldBeProspect.length > 10) {
      console.log(`   ... and ${uniqueShouldBeProspect.length - 10} more`);
    }
  }

  if (uniqueShouldBeOpportunity.length > 0) {
    console.log(`\n🔄 People with business discussions but not OPPORTUNITY: ${uniqueShouldBeOpportunity.length}`);
    for (const p of uniqueShouldBeOpportunity.slice(0, 10)) {
      console.log(`   - ${p.name}: ${p.reason}`);
    }
    if (uniqueShouldBeOpportunity.length > 10) {
      console.log(`   ... and ${uniqueShouldBeOpportunity.length - 10} more`);
    }
  }

  // ============================================================================
  // CHECK ENGAGEMENT CLASSIFICATION SERVICE IS WORKING
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('🔧 ENGAGEMENT CLASSIFICATION SERVICE CHECK');
  console.log('='.repeat(80));

  // Check if EngagementClassificationService is being called
  // by looking for status updates with known reasons
  const recentStatusUpdates = await prisma.people.findMany({
    where: {
      workspaceId,
      statusReason: { not: null },
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      status: true,
      statusReason: true,
      statusUpdateDate: true
    },
    orderBy: { statusUpdateDate: 'desc' },
    take: 20
  });

  if (recentStatusUpdates.length > 0) {
    console.log(`\n📊 Recent Status Updates (showing engagement classification is working):`);
    for (const person of recentStatusUpdates.slice(0, 10)) {
      const date = person.statusUpdateDate?.toISOString().split('T')[0] || 'Unknown';
      console.log(`   ${person.fullName}: ${person.status} - "${person.statusReason}" (${date})`);
    }
  } else {
    console.log(`\n⚠️ No status updates with reasons found - classification may not be running`);
    results.issues.push('No status updates with reasons found - engagement classification may not be running');
  }

  // ============================================================================
  // OPPORTUNITIES AUDIT
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('💼 OPPORTUNITIES AUDIT');
  console.log('='.repeat(80));

  const opportunities = await prisma.opportunities.findMany({
    where: { workspaceId },
    include: {
      company: {
        select: { name: true, status: true }
      }
    }
  });

  console.log(`\n📊 Opportunity Statistics:`);
  console.log(`   Total opportunities: ${opportunities.length}`);

  // Group by stage
  const byStage: Record<string, number> = {};
  for (const opp of opportunities) {
    const stage = opp.stage || 'Unknown';
    byStage[stage] = (byStage[stage] || 0) + 1;
  }

  if (Object.keys(byStage).length > 0) {
    console.log(`\n   By Stage:`);
    for (const [stage, count] of Object.entries(byStage)) {
      console.log(`     ${stage}: ${count}`);
    }
  }

  // Check if companies with opportunities have OPPORTUNITY status
  const companiesWithOpportunities = opportunities
    .filter(opp => opp.companyId && opp.company)
    .map(opp => ({
      companyId: opp.companyId,
      companyName: opp.company!.name,
      companyStatus: opp.company!.status
    }));

  const companiesNotMarkedOpportunity = companiesWithOpportunities.filter(
    c => c.companyStatus !== 'OPPORTUNITY' && c.companyStatus !== 'CLIENT'
  );

  if (companiesNotMarkedOpportunity.length > 0) {
    console.log(`\n⚠️ Companies with opportunities but not marked OPPORTUNITY:`);
    for (const c of companiesNotMarkedOpportunity.slice(0, 10)) {
      console.log(`   - ${c.companyName} (status: ${c.companyStatus})`);
    }
    results.issues.push(`${companiesNotMarkedOpportunity.length} companies have opportunities but wrong status`);
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('📋 FINAL SUMMARY');
  console.log('='.repeat(80));

  console.log(`\n👤 People:`);
  console.log(`   Total: ${results.people.total}`);
  console.log(`   With linked emails: ${results.people.withLinkedEmails} (${Math.round(results.people.withLinkedEmails / results.people.total * 100)}%)`);
  console.log(`   Should be PROSPECT: ${results.people.potentialMisclassifications.shouldBeProspect}`);
  console.log(`   Should be OPPORTUNITY: ${results.people.potentialMisclassifications.shouldBeOpportunity}`);

  console.log(`\n🏢 Companies:`);
  console.log(`   Total: ${results.companies.total}`);
  console.log(`   With linked emails: ${results.companies.withLinkedEmails} (${Math.round(results.companies.withLinkedEmails / results.companies.total * 100)}%)`);

  console.log(`\n📧 Emails:`);
  console.log(`   Total: ${results.emails.total}`);
  console.log(`   Replies detected: ${results.emails.replies}`);
  console.log(`   Business discussions: ${results.emails.businessDiscussions}`);

  console.log(`\n📅 Meetings:`);
  console.log(`   Total: ${results.meetings.total}`);
  console.log(`   Business discussions: ${results.meetings.businessDiscussions}`);

  // Generate recommendations
  if (results.people.potentialMisclassifications.shouldBeProspect > 0) {
    results.recommendations.push(
      `Run engagement backfill to update ${results.people.potentialMisclassifications.shouldBeProspect} people to PROSPECT status`
    );
  }

  if (results.people.potentialMisclassifications.shouldBeOpportunity > 0) {
    results.recommendations.push(
      `Review ${results.people.potentialMisclassifications.shouldBeOpportunity} people for potential OPPORTUNITY status`
    );
  }

  if (results.issues.length > 0) {
    console.log(`\n⚠️ Issues Found:`);
    for (const issue of results.issues) {
      console.log(`   - ${issue}`);
    }
  }

  if (results.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    for (const rec of results.recommendations) {
      console.log(`   - ${rec}`);
    }
  }

  // Ask if user wants to run backfill
  if (results.people.potentialMisclassifications.shouldBeProspect > 0 ||
      results.people.potentialMisclassifications.shouldBeOpportunity > 0) {
    console.log(`\n🔄 Run: npx tsx scripts/audit-lead-prospect-opportunity-logic.ts --fix`);
    console.log(`   to automatically classify people based on their email engagement`);
  }

  // Check for --fix flag
  if (process.argv.includes('--fix')) {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 RUNNING ENGAGEMENT BACKFILL');
    console.log('='.repeat(80));

    const { EngagementClassificationService } = await import('../src/platform/services/engagement-classification-service');
    const result = await EngagementClassificationService.backfillFromEmails(workspaceId);
    
    console.log(`\n✅ Backfill complete:`);
    console.log(`   Processed: ${result.processed} emails`);
    console.log(`   Updated: ${result.updated} records`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);

