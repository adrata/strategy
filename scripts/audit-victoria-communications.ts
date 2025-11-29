#!/usr/bin/env tsx

/**
 * Victoria Communications Audit Script
 * 
 * Diagnoses email and calendar linking gaps to identify why action dates
 * may not reflect actual communication timestamps.
 * 
 * Usage: npx tsx scripts/audit-victoria-communications.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

interface AuditResults {
  workspace: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  emails: {
    total: number;
    linkedToPerson: number;
    linkedToCompany: number;
    unlinked: number;
    dateRange: {
      oldest: Date | null;
      newest: Date | null;
    };
  };
  calendarEvents: {
    total: number;
    linkedToPerson: number;
    linkedToCompany: number;
    unlinked: number;
    dateRange: {
      oldest: Date | null;
      newest: Date | null;
    };
  };
  actions: {
    total: number;
    emailActions: number;
    meetingActions: number;
    otherActions: number;
    dateRange: {
      oldest: Date | null;
      newest: Date | null;
    };
  };
  linkingGaps: {
    unlinkedEmailSamples: Array<{
      id: string;
      from: string;
      to: string[];
      subject: string;
      receivedAt: Date;
      potentialMatches: string[];
    }>;
    unlinkedEventSamples: Array<{
      id: string;
      title: string;
      startTime: Date;
      attendees: string[];
      potentialMatches: string[];
    }>;
    emailsWithoutActions: number;
    eventsWithoutActions: number;
  };
  companies: {
    total: number;
    withEmailDomain: number;
    domains: string[];
  };
  people: {
    total: number;
    withEmails: number;
    emailPatterns: Map<string, number>;
  };
}

/**
 * Extract email address from potentially formatted string like "Name <email@domain.com>"
 */
function extractEmailAddress(emailStr: string): string {
  if (!emailStr) return '';
  
  // Check for format: "Name <email@domain.com>"
  const match = emailStr.match(/<([^>]+)>/);
  if (match) {
    return match[1].toLowerCase().trim();
  }
  
  // Just return the email as-is (lowercase, trimmed)
  return emailStr.toLowerCase().trim();
}

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string | null {
  const cleanEmail = extractEmailAddress(email);
  const parts = cleanEmail.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

async function findVictoria(): Promise<{ user: any; workspace: any } | null> {
  console.log('🔍 Finding Victoria...\n');
  
  // Find Victoria's user record
  const victoria = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { contains: 'victoria', mode: 'insensitive' } },
        { name: { contains: 'victoria', mode: 'insensitive' } },
        { firstName: { contains: 'victoria', mode: 'insensitive' } },
        { lastName: { contains: 'victoria', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true
    }
  });
  
  if (!victoria) {
    console.log('❌ Victoria not found in users table');
    return null;
  }
  
  const victoriaName = victoria.name || `${victoria.firstName || ''} ${victoria.lastName || ''}`.trim() || victoria.email;
  console.log(`✅ Found Victoria: ${victoriaName}`);
  console.log(`   User ID: ${victoria.id}`);
  console.log(`   Email: ${victoria.email}\n`);
  
  // Find her workspace (TOP Engineering Plus)
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
        { name: { contains: 'Engineering Plus', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true
    }
  });
  
  if (!workspace) {
    console.log('❌ TOP Engineering Plus workspace not found');
    return null;
  }
  
  console.log(`📁 Workspace: ${workspace.name} (${workspace.id})\n`);
  
  return { user: victoria, workspace };
}

async function auditEmails(workspaceId: string): Promise<AuditResults['emails']> {
  console.log('📧 Auditing emails...\n');
  
  const total = await prisma.email_messages.count({
    where: { workspaceId }
  });
  
  const linkedToPerson = await prisma.email_messages.count({
    where: { workspaceId, personId: { not: null } }
  });
  
  const linkedToCompany = await prisma.email_messages.count({
    where: { workspaceId, companyId: { not: null } }
  });
  
  const unlinked = await prisma.email_messages.count({
    where: { 
      workspaceId,
      personId: null,
      companyId: null
    }
  });
  
  const oldest = await prisma.email_messages.findFirst({
    where: { workspaceId },
    orderBy: { receivedAt: 'asc' },
    select: { receivedAt: true }
  });
  
  const newest = await prisma.email_messages.findFirst({
    where: { workspaceId },
    orderBy: { receivedAt: 'desc' },
    select: { receivedAt: true }
  });
  
  console.log(`   Total emails: ${total}`);
  console.log(`   Linked to person: ${linkedToPerson} (${((linkedToPerson/total)*100).toFixed(1)}%)`);
  console.log(`   Linked to company: ${linkedToCompany} (${((linkedToCompany/total)*100).toFixed(1)}%)`);
  console.log(`   Completely unlinked: ${unlinked} (${((unlinked/total)*100).toFixed(1)}%)`);
  console.log(`   Date range: ${oldest?.receivedAt?.toISOString().split('T')[0] || 'N/A'} to ${newest?.receivedAt?.toISOString().split('T')[0] || 'N/A'}\n`);
  
  return {
    total,
    linkedToPerson,
    linkedToCompany,
    unlinked,
    dateRange: {
      oldest: oldest?.receivedAt || null,
      newest: newest?.receivedAt || null
    }
  };
}

async function auditCalendarEvents(workspaceId: string): Promise<AuditResults['calendarEvents']> {
  console.log('📅 Auditing calendar events...\n');
  
  const total = await prisma.events.count({
    where: { workspaceId }
  });
  
  const linkedToPerson = await prisma.events.count({
    where: { workspaceId, personId: { not: null } }
  });
  
  const linkedToCompany = await prisma.events.count({
    where: { workspaceId, companyId: { not: null } }
  });
  
  const unlinked = await prisma.events.count({
    where: { 
      workspaceId,
      personId: null,
      companyId: null
    }
  });
  
  const oldest = await prisma.events.findFirst({
    where: { workspaceId },
    orderBy: { startTime: 'asc' },
    select: { startTime: true }
  });
  
  const newest = await prisma.events.findFirst({
    where: { workspaceId },
    orderBy: { startTime: 'desc' },
    select: { startTime: true }
  });
  
  console.log(`   Total calendar events: ${total}`);
  console.log(`   Linked to person: ${linkedToPerson} (${total > 0 ? ((linkedToPerson/total)*100).toFixed(1) : 0}%)`);
  console.log(`   Linked to company: ${linkedToCompany} (${total > 0 ? ((linkedToCompany/total)*100).toFixed(1) : 0}%)`);
  console.log(`   Completely unlinked: ${unlinked} (${total > 0 ? ((unlinked/total)*100).toFixed(1) : 0}%)`);
  console.log(`   Date range: ${oldest?.startTime?.toISOString().split('T')[0] || 'N/A'} to ${newest?.startTime?.toISOString().split('T')[0] || 'N/A'}\n`);
  
  return {
    total,
    linkedToPerson,
    linkedToCompany,
    unlinked,
    dateRange: {
      oldest: oldest?.startTime || null,
      newest: newest?.startTime || null
    }
  };
}

async function auditActions(workspaceId: string): Promise<AuditResults['actions']> {
  console.log('⚡ Auditing actions...\n');
  
  const total = await prisma.actions.count({
    where: { workspaceId, deletedAt: null }
  });
  
  const emailActions = await prisma.actions.count({
    where: { workspaceId, type: 'EMAIL', deletedAt: null }
  });
  
  const meetingActions = await prisma.actions.count({
    where: { workspaceId, type: 'MEETING', deletedAt: null }
  });
  
  const otherActions = total - emailActions - meetingActions;
  
  const oldest = await prisma.actions.findFirst({
    where: { workspaceId, deletedAt: null },
    orderBy: { completedAt: 'asc' },
    select: { completedAt: true }
  });
  
  const newest = await prisma.actions.findFirst({
    where: { workspaceId, deletedAt: null },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true }
  });
  
  console.log(`   Total actions: ${total}`);
  console.log(`   Email actions: ${emailActions}`);
  console.log(`   Meeting actions: ${meetingActions}`);
  console.log(`   Other actions: ${otherActions}`);
  console.log(`   Date range: ${oldest?.completedAt?.toISOString().split('T')[0] || 'N/A'} to ${newest?.completedAt?.toISOString().split('T')[0] || 'N/A'}\n`);
  
  return {
    total,
    emailActions,
    meetingActions,
    otherActions,
    dateRange: {
      oldest: oldest?.completedAt || null,
      newest: newest?.completedAt || null
    }
  };
}

async function auditCompanies(workspaceId: string): Promise<AuditResults['companies']> {
  console.log('🏢 Auditing companies...\n');
  
  const companies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, domain: true, email: true, website: true }
  });
  
  const total = companies.length;
  const withEmailDomain = companies.filter(c => c.domain || c.email || c.website).length;
  
  // Extract unique domains
  const domains = new Set<string>();
  for (const company of companies) {
    if (company.domain) domains.add(company.domain.toLowerCase());
    if (company.email) {
      const domain = extractDomain(company.email);
      if (domain) domains.add(domain);
    }
    if (company.website) {
      // Extract domain from website
      try {
        const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
        const hostname = new URL(url).hostname.replace('www.', '');
        domains.add(hostname);
      } catch {}
    }
  }
  
  console.log(`   Total companies: ${total}`);
  console.log(`   With email/domain: ${withEmailDomain} (${((withEmailDomain/total)*100).toFixed(1)}%)`);
  console.log(`   Unique domains: ${domains.size}\n`);
  
  return {
    total,
    withEmailDomain,
    domains: Array.from(domains)
  };
}

async function auditPeople(workspaceId: string): Promise<AuditResults['people']> {
  console.log('👤 Auditing people...\n');
  
  const people = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, email: true, workEmail: true, personalEmail: true }
  });
  
  const total = people.length;
  const withEmails = people.filter(p => p.email || p.workEmail || p.personalEmail).length;
  
  // Count email patterns (domains)
  const emailPatterns = new Map<string, number>();
  for (const person of people) {
    const emails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
    for (const email of emails) {
      const domain = extractDomain(email!);
      if (domain) {
        emailPatterns.set(domain, (emailPatterns.get(domain) || 0) + 1);
      }
    }
  }
  
  console.log(`   Total people: ${total}`);
  console.log(`   With emails: ${withEmails} (${((withEmails/total)*100).toFixed(1)}%)`);
  console.log(`   Unique email domains: ${emailPatterns.size}\n`);
  
  return {
    total,
    withEmails,
    emailPatterns
  };
}

async function findLinkingGaps(workspaceId: string): Promise<AuditResults['linkingGaps']> {
  console.log('🔗 Analyzing linking gaps...\n');
  
  // Get all people emails for potential matching
  const people = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    select: { 
      id: true, 
      fullName: true,
      email: true, 
      workEmail: true, 
      personalEmail: true,
      companyId: true
    }
  });
  
  // Get all company domains
  const companies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, name: true, domain: true, email: true, website: true }
  });
  
  // Build lookup maps
  const emailToPerson = new Map<string, string>();
  const domainToCompany = new Map<string, { id: string; name: string }>();
  
  for (const person of people) {
    const emails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
    for (const email of emails) {
      emailToPerson.set(extractEmailAddress(email!), person.fullName || person.id);
    }
  }
  
  for (const company of companies) {
    if (company.domain) {
      domainToCompany.set(company.domain.toLowerCase(), { id: company.id, name: company.name });
    }
    if (company.email) {
      const domain = extractDomain(company.email);
      if (domain) {
        domainToCompany.set(domain, { id: company.id, name: company.name });
      }
    }
    if (company.website) {
      try {
        const url = company.website.startsWith('http') ? company.website : `https://${company.website}`;
        const hostname = new URL(url).hostname.replace('www.', '');
        domainToCompany.set(hostname, { id: company.id, name: company.name });
      } catch {}
    }
  }
  
  // Find unlinked emails with potential matches
  const unlinkedEmails = await prisma.email_messages.findMany({
    where: {
      workspaceId,
      personId: null,
      companyId: null
    },
    take: 100,
    orderBy: { receivedAt: 'desc' },
    select: {
      id: true,
      from: true,
      to: true,
      subject: true,
      receivedAt: true
    }
  });
  
  const unlinkedEmailSamples: AuditResults['linkingGaps']['unlinkedEmailSamples'] = [];
  
  for (const email of unlinkedEmails.slice(0, 20)) {
    const allEmails = [email.from, ...(email.to || [])].filter(Boolean);
    const potentialMatches: string[] = [];
    
    for (const addr of allEmails) {
      const cleanEmail = extractEmailAddress(addr);
      const domain = extractDomain(addr);
      
      // Check for exact person match
      if (emailToPerson.has(cleanEmail)) {
        potentialMatches.push(`Person: ${emailToPerson.get(cleanEmail)} (exact email match)`);
      }
      
      // Check for company domain match
      if (domain && domainToCompany.has(domain)) {
        potentialMatches.push(`Company: ${domainToCompany.get(domain)!.name} (domain: ${domain})`);
      }
    }
    
    if (potentialMatches.length > 0) {
      unlinkedEmailSamples.push({
        id: email.id,
        from: email.from || '',
        to: email.to || [],
        subject: email.subject || '',
        receivedAt: email.receivedAt,
        potentialMatches
      });
    }
  }
  
  // Find unlinked calendar events with potential matches
  const unlinkedEvents = await prisma.events.findMany({
    where: {
      workspaceId,
      personId: null,
      companyId: null
    },
    take: 100,
    orderBy: { startTime: 'desc' },
    select: {
      id: true,
      title: true,
      startTime: true,
      attendees: true
    }
  });
  
  const unlinkedEventSamples: AuditResults['linkingGaps']['unlinkedEventSamples'] = [];
  
  for (const event of unlinkedEvents.slice(0, 20)) {
    const attendees = (event.attendees as any[] || []).map((a: any) => a.email).filter(Boolean);
    const potentialMatches: string[] = [];
    
    for (const addr of attendees) {
      const cleanEmail = extractEmailAddress(addr);
      const domain = extractDomain(addr);
      
      if (emailToPerson.has(cleanEmail)) {
        potentialMatches.push(`Person: ${emailToPerson.get(cleanEmail)} (exact email match)`);
      }
      
      if (domain && domainToCompany.has(domain)) {
        potentialMatches.push(`Company: ${domainToCompany.get(domain)!.name} (domain: ${domain})`);
      }
    }
    
    if (potentialMatches.length > 0) {
      unlinkedEventSamples.push({
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        attendees,
        potentialMatches
      });
    }
  }
  
  // Count emails with person link but no action
  const linkedEmailsWithPerson = await prisma.email_messages.findMany({
    where: { workspaceId, personId: { not: null } },
    select: { id: true, personId: true, subject: true, receivedAt: true }
  });
  
  const existingEmailActions = await prisma.actions.findMany({
    where: { workspaceId, type: 'EMAIL', deletedAt: null },
    select: { personId: true, subject: true, completedAt: true }
  });
  
  const actionKeys = new Set(
    existingEmailActions.map(a => `${a.personId}|${a.subject}|${a.completedAt?.getTime()}`)
  );
  
  let emailsWithoutActions = 0;
  for (const email of linkedEmailsWithPerson) {
    const key = `${email.personId}|${email.subject}|${email.receivedAt.getTime()}`;
    if (!actionKeys.has(key)) {
      emailsWithoutActions++;
    }
  }
  
  // Count events with person/company link but no action
  const linkedEvents = await prisma.events.findMany({
    where: { 
      workspaceId, 
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    },
    select: { id: true, personId: true, companyId: true, title: true, startTime: true }
  });
  
  const existingMeetingActions = await prisma.actions.findMany({
    where: { workspaceId, type: 'MEETING', deletedAt: null },
    select: { personId: true, companyId: true, subject: true, completedAt: true }
  });
  
  const meetingActionKeys = new Set(
    existingMeetingActions.map(a => `${a.personId || ''}|${a.companyId || ''}|${a.subject}|${a.completedAt?.getTime()}`)
  );
  
  let eventsWithoutActions = 0;
  for (const event of linkedEvents) {
    const key = `${event.personId || ''}|${event.companyId || ''}|${event.title}|${event.startTime.getTime()}`;
    if (!meetingActionKeys.has(key)) {
      eventsWithoutActions++;
    }
  }
  
  console.log(`   Unlinked emails with potential matches: ${unlinkedEmailSamples.length}`);
  console.log(`   Unlinked events with potential matches: ${unlinkedEventSamples.length}`);
  console.log(`   Linked emails missing actions: ${emailsWithoutActions}`);
  console.log(`   Linked events missing actions: ${eventsWithoutActions}\n`);
  
  return {
    unlinkedEmailSamples,
    unlinkedEventSamples,
    emailsWithoutActions,
    eventsWithoutActions
  };
}

async function checkConnections(workspaceId: string): Promise<void> {
  console.log('🔌 Checking email/calendar connections...\n');
  
  const connections = await prisma.grand_central_connections.findMany({
    where: {
      workspaceId,
      provider: { in: ['outlook', 'gmail', 'google-calendar'] },
    },
    select: {
      id: true,
      provider: true,
      status: true,
      lastSyncAt: true,
      createdAt: true,
      nangoConnectionId: true
    }
  });
  
  console.log(`   Total connections: ${connections.length}`);
  for (const conn of connections) {
    console.log(`   - ${conn.provider}: ${conn.status}`);
    console.log(`     Last sync: ${conn.lastSyncAt?.toISOString() || 'Never'}`);
    console.log(`     Created: ${conn.createdAt.toISOString()}`);
  }
  console.log('');
}

async function main() {
  console.log('='.repeat(70));
  console.log('📊 Victoria Communications Audit');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // Find Victoria and her workspace
    const result = await findVictoria();
    if (!result) {
      console.log('❌ Could not find Victoria or workspace. Exiting.');
      await prisma.$disconnect();
      return;
    }
    
    const { user, workspace } = result;
    
    // Check connections
    await checkConnections(workspace.id);
    
    // Audit all data
    const emails = await auditEmails(workspace.id);
    const calendarEvents = await auditCalendarEvents(workspace.id);
    const actions = await auditActions(workspace.id);
    const companies = await auditCompanies(workspace.id);
    const people = await auditPeople(workspace.id);
    const linkingGaps = await findLinkingGaps(workspace.id);
    
    // Summary and recommendations
    console.log('='.repeat(70));
    console.log('📋 SUMMARY AND RECOMMENDATIONS');
    console.log('='.repeat(70));
    console.log('');
    
    // Calculate issues
    const emailLinkingRate = emails.total > 0 ? (emails.linkedToPerson / emails.total) * 100 : 0;
    const eventLinkingRate = calendarEvents.total > 0 ? (calendarEvents.linkedToPerson / calendarEvents.total) * 100 : 0;
    
    if (emailLinkingRate < 50) {
      console.log('⚠️  LOW EMAIL LINKING RATE: Only', emailLinkingRate.toFixed(1) + '% of emails are linked to people');
      console.log('    This means many communications are NOT creating action records.');
      console.log('    Recommendation: Run reprocess-victoria-communications.ts to re-link emails\n');
    }
    
    if (linkingGaps.unlinkedEmailSamples.length > 0) {
      console.log('🔗 LINKING GAPS FOUND:');
      console.log(`   ${linkingGaps.unlinkedEmailSamples.length} unlinked emails could be matched to existing records`);
      console.log('   Sample potential matches:');
      for (const sample of linkingGaps.unlinkedEmailSamples.slice(0, 5)) {
        console.log(`   - "${sample.subject}" from ${sample.from}`);
        for (const match of sample.potentialMatches) {
          console.log(`     → ${match}`);
        }
      }
      console.log('');
    }
    
    if (linkingGaps.emailsWithoutActions > 0) {
      console.log('📧 MISSING EMAIL ACTIONS:');
      console.log(`   ${linkingGaps.emailsWithoutActions} linked emails don't have corresponding action records`);
      console.log('   These communications exist but are NOT reflected in action dates.\n');
    }
    
    if (linkingGaps.eventsWithoutActions > 0) {
      console.log('📅 MISSING MEETING ACTIONS:');
      console.log(`   ${linkingGaps.eventsWithoutActions} linked calendar events don't have corresponding action records`);
      console.log('   These meetings exist but are NOT reflected in action dates.\n');
    }
    
    if (calendarEvents.total === 0) {
      console.log('⚠️  NO CALENDAR EVENTS SYNCED');
      console.log('   Calendar events have not been synced. This means meetings are not creating actions.');
      console.log('   Recommendation: Run historical calendar sync to import past meetings.\n');
    }
    
    console.log('='.repeat(70));
    console.log('🎯 NEXT STEPS');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. Run: npx tsx scripts/reprocess-victoria-communications.ts');
    console.log('   This will re-link emails and create missing actions');
    console.log('');
    console.log('2. Verify email/calendar connections are active and syncing');
    console.log('');
    console.log('3. Check that Nango webhooks are firing for real-time sync');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

