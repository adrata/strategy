#!/usr/bin/env tsx

/**
 * Reprocess Victoria's Communications
 * 
 * This script reprocesses all of Victoria's emails and calendar events to:
 * 1. Re-link emails to people/companies using improved matching
 * 2. Re-link calendar events using improved matching
 * 3. Create missing action records
 * 4. Update lastActionDate on companies/people
 * 
 * Usage: npx tsx scripts/reprocess-victoria-communications.ts [--dry-run]
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

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

interface ReprocessStats {
  emails: {
    processed: number;
    linkedToPerson: number;
    linkedToCompany: number;
    actionsCreated: number;
  };
  calendarEvents: {
    processed: number;
    linkedToPerson: number;
    linkedToCompany: number;
    actionsCreated: number;
  };
  lastActionUpdates: {
    people: number;
    companies: number;
  };
}

/**
 * Extract clean email address from potentially formatted string
 */
function extractCleanEmailAddress(emailStr: string | null | undefined): string | null {
  if (!emailStr || typeof emailStr !== 'string') return null;
  
  const angleMatch = emailStr.match(/<([^>]+@[^>]+)>/);
  if (angleMatch) {
    return angleMatch[1].toLowerCase().trim();
  }
  
  const directEmail = emailStr.toLowerCase().trim();
  if (directEmail.includes('@')) {
    return directEmail;
  }
  
  return null;
}

/**
 * Extract all clean email addresses from an array
 */
function extractAllCleanEmailAddresses(emails: (string | null | undefined)[]): string[] {
  return emails
    .filter(Boolean)
    .map(e => extractCleanEmailAddress(e))
    .filter((e): e is string => e !== null);
}

/**
 * Extract domain from email address
 */
function extractDomain(email: string | null | undefined): string | null {
  const cleanEmail = extractCleanEmailAddress(email);
  if (!cleanEmail) return null;
  const match = cleanEmail.match(/@([^@]+)$/);
  return match ? match[1] : null;
}

/**
 * Normalize domain
 */
function normalizeDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim();
}

/**
 * Extract base domain (e.g., "example.com" from "mail.example.com")
 */
function extractBaseDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;
  const parts = normalized.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return normalized;
}

async function findVictoria(): Promise<{ user: any; workspace: any } | null> {
  console.log('🔍 Finding Victoria...\n');
  
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
    console.log('❌ Victoria not found');
    return null;
  }
  
  const victoriaName = victoria.name || `${victoria.firstName || ''} ${victoria.lastName || ''}`.trim() || victoria.email;
  console.log(`✅ Found Victoria: ${victoriaName} (${victoria.id})`);
  
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

async function reprocessEmails(workspaceId: string, userId: string): Promise<ReprocessStats['emails']> {
  console.log('📧 Reprocessing emails...\n');
  
  const stats = {
    processed: 0,
    linkedToPerson: 0,
    linkedToCompany: 0,
    actionsCreated: 0
  };
  
  // Pre-fetch all people for efficient matching
  const allPeople = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    select: {
      id: true,
      email: true,
      workEmail: true,
      personalEmail: true,
      companyId: true
    }
  });
  
  // Build email -> person map
  const emailToPersonMap = new Map<string, { id: string; companyId: string | null }>();
  for (const person of allPeople) {
    const emails = extractAllCleanEmailAddresses([person.email, person.workEmail, person.personalEmail]);
    for (const email of emails) {
      emailToPersonMap.set(email, { id: person.id, companyId: person.companyId });
    }
  }
  
  // Pre-fetch all companies for domain matching
  const allCompanies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, domain: true, email: true, website: true }
  });
  
  // Build domain -> company map
  const domainToCompanyMap = new Map<string, string>();
  for (const company of allCompanies) {
    if (company.domain) {
      const normalized = normalizeDomain(company.domain);
      if (normalized) {
        domainToCompanyMap.set(normalized, company.id);
        const base = extractBaseDomain(normalized);
        if (base && base !== normalized) domainToCompanyMap.set(base, company.id);
      }
    }
    if (company.email) {
      const domain = extractDomain(company.email);
      if (domain) {
        domainToCompanyMap.set(domain, company.id);
        const base = extractBaseDomain(domain);
        if (base && base !== domain) domainToCompanyMap.set(base, company.id);
      }
    }
    if (company.website) {
      const normalized = normalizeDomain(company.website);
      if (normalized) {
        domainToCompanyMap.set(normalized, company.id);
        const base = extractBaseDomain(normalized);
        if (base && base !== normalized) domainToCompanyMap.set(base, company.id);
      }
    }
  }
  
  console.log(`   Pre-loaded ${emailToPersonMap.size} person emails and ${domainToCompanyMap.size} company domains\n`);
  
  // Get workspace user for action assignment
  const workspaceUser = await prisma.workspace_users.findFirst({
    where: { workspaceId, isActive: true }
  });
  
  if (!workspaceUser) {
    console.log('   ⚠️  No active workspace user found - cannot create actions');
    return stats;
  }
  
  // Process emails in batches
  let skip = 0;
  const batchSize = 500;
  let hasMore = true;
  
  while (hasMore) {
    const emails = await prisma.email_messages.findMany({
      where: { workspaceId },
      take: batchSize,
      skip: skip,
      orderBy: { receivedAt: 'desc' }
    });
    
    if (emails.length === 0) {
      hasMore = false;
      break;
    }
    
    console.log(`   Processing batch: ${emails.length} emails (skip: ${skip})`);
    
    for (const email of emails) {
      stats.processed++;
      
      // Extract all email addresses
      const rawAddresses = [
        email.from,
        ...(email.to || []),
        ...(email.cc || []),
        ...(email.bcc || [])
      ];
      const emailAddresses = extractAllCleanEmailAddresses(rawAddresses);
      
      let personId = email.personId;
      let companyId = email.companyId;
      let needsUpdate = false;
      
      // Try to link to person
      if (!personId && emailAddresses.length > 0) {
        for (const addr of emailAddresses) {
          const match = emailToPersonMap.get(addr);
          if (match) {
            personId = match.id;
            if (!companyId && match.companyId) {
              companyId = match.companyId;
            }
            needsUpdate = true;
            stats.linkedToPerson++;
            break;
          }
        }
      }
      
      // Try to link to company by domain
      if (!companyId && emailAddresses.length > 0) {
        for (const addr of emailAddresses) {
          const domain = extractDomain(addr);
          if (domain) {
            let match = domainToCompanyMap.get(domain);
            if (!match) {
              const baseDomain = extractBaseDomain(domain);
              if (baseDomain) {
                match = domainToCompanyMap.get(baseDomain);
              }
            }
            if (match) {
              companyId = match;
              needsUpdate = true;
              stats.linkedToCompany++;
              break;
            }
          }
        }
      }
      
      // Update email if needed
      if (needsUpdate && !DRY_RUN) {
        await prisma.email_messages.update({
          where: { id: email.id },
          data: {
            personId: personId || null,
            companyId: companyId || null
          }
        });
      }
      
      // Create action if linked to person and doesn't exist
      if (personId) {
        const existingAction = await prisma.actions.findFirst({
          where: {
            workspaceId,
            personId,
            type: 'EMAIL',
            subject: email.subject,
            completedAt: email.receivedAt
          }
        });
        
        if (!existingAction && !DRY_RUN) {
          await prisma.actions.create({
            data: {
              workspaceId,
              userId: workspaceUser.userId,
              companyId: companyId || undefined,
              personId,
              type: 'EMAIL',
              subject: email.subject || '(No Subject)',
              description: email.body?.substring(0, 500) || '',
              status: 'COMPLETED',
              completedAt: email.receivedAt,
              createdAt: email.receivedAt,
              updatedAt: email.receivedAt
            }
          });
          stats.actionsCreated++;
        }
      }
    }
    
    skip += batchSize;
    hasMore = emails.length === batchSize;
  }
  
  console.log(`\n   ✅ Emails processed: ${stats.processed}`);
  console.log(`   ✅ Newly linked to person: ${stats.linkedToPerson}`);
  console.log(`   ✅ Newly linked to company: ${stats.linkedToCompany}`);
  console.log(`   ✅ Actions created: ${stats.actionsCreated}\n`);
  
  return stats;
}

async function reprocessCalendarEvents(workspaceId: string, userId: string): Promise<ReprocessStats['calendarEvents']> {
  console.log('📅 Reprocessing calendar events...\n');
  
  const stats = {
    processed: 0,
    linkedToPerson: 0,
    linkedToCompany: 0,
    actionsCreated: 0
  };
  
  // Pre-fetch all people for efficient matching
  const allPeople = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    select: {
      id: true,
      email: true,
      workEmail: true,
      personalEmail: true,
      companyId: true
    }
  });
  
  const emailToPersonMap = new Map<string, { id: string; companyId: string | null }>();
  for (const person of allPeople) {
    const emails = extractAllCleanEmailAddresses([person.email, person.workEmail, person.personalEmail]);
    for (const email of emails) {
      emailToPersonMap.set(email, { id: person.id, companyId: person.companyId });
    }
  }
  
  // Pre-fetch all companies
  const allCompanies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, name: true, domain: true, email: true, website: true }
  });
  
  const domainToCompanyMap = new Map<string, string>();
  for (const company of allCompanies) {
    if (company.domain) {
      const normalized = normalizeDomain(company.domain);
      if (normalized) domainToCompanyMap.set(normalized, company.id);
    }
    if (company.email) {
      const domain = extractDomain(company.email);
      if (domain) domainToCompanyMap.set(domain, company.id);
    }
    if (company.website) {
      const normalized = normalizeDomain(company.website);
      if (normalized) domainToCompanyMap.set(normalized, company.id);
    }
  }
  
  // Get workspace user for action assignment
  const workspaceUser = await prisma.workspace_users.findFirst({
    where: { workspaceId, isActive: true }
  });
  
  if (!workspaceUser) {
    console.log('   ⚠️  No active workspace user found - cannot create actions');
    return stats;
  }
  
  // Process events in batches
  let skip = 0;
  const batchSize = 500;
  let hasMore = true;
  
  while (hasMore) {
    const events = await prisma.events.findMany({
      where: { workspaceId },
      take: batchSize,
      skip: skip,
      orderBy: { startTime: 'desc' }
    });
    
    if (events.length === 0) {
      hasMore = false;
      break;
    }
    
    console.log(`   Processing batch: ${events.length} events (skip: ${skip})`);
    
    for (const event of events) {
      stats.processed++;
      
      // Extract attendee emails
      const attendees = (event.attendees as any[] || []);
      const attendeeEmails = extractAllCleanEmailAddresses(
        attendees.map((a: any) => a.email || a.emailAddress?.address)
      );
      
      let personId = event.personId;
      let companyId = event.companyId;
      let needsUpdate = false;
      
      // Try to link to person
      if (!personId && attendeeEmails.length > 0) {
        for (const addr of attendeeEmails) {
          const match = emailToPersonMap.get(addr);
          if (match) {
            personId = match.id;
            if (!companyId && match.companyId) {
              companyId = match.companyId;
            }
            needsUpdate = true;
            stats.linkedToPerson++;
            break;
          }
        }
      }
      
      // Try to link to company by domain
      if (!companyId && attendeeEmails.length > 0) {
        for (const addr of attendeeEmails) {
          const domain = extractDomain(addr);
          if (domain) {
            const match = domainToCompanyMap.get(domain);
            if (match) {
              companyId = match;
              needsUpdate = true;
              stats.linkedToCompany++;
              break;
            }
          }
        }
      }
      
      // Update event if needed
      if (needsUpdate && !DRY_RUN) {
        await prisma.events.update({
          where: { id: event.id },
          data: {
            personId: personId || null,
            companyId: companyId || null
          }
        });
      }
      
      // Create action if linked
      if (personId || companyId) {
        const existingAction = await prisma.actions.findFirst({
          where: {
            workspaceId,
            type: 'MEETING',
            subject: event.title,
            completedAt: event.startTime
          }
        });
        
        if (!existingAction && !DRY_RUN) {
          const now = new Date();
          const isCompleted = event.startTime < now;
          
          await prisma.actions.create({
            data: {
              workspaceId,
              userId: workspaceUser.userId,
              companyId: companyId || undefined,
              personId: personId || undefined,
              type: 'MEETING',
              subject: event.title,
              description: event.description?.substring(0, 500) || undefined,
              status: isCompleted ? 'COMPLETED' : 'PLANNED',
              completedAt: isCompleted ? event.startTime : undefined,
              scheduledAt: !isCompleted ? event.startTime : undefined,
              createdAt: event.startTime,
              updatedAt: new Date()
            }
          });
          stats.actionsCreated++;
        }
      }
    }
    
    skip += batchSize;
    hasMore = events.length === batchSize;
  }
  
  console.log(`\n   ✅ Events processed: ${stats.processed}`);
  console.log(`   ✅ Newly linked to person: ${stats.linkedToPerson}`);
  console.log(`   ✅ Newly linked to company: ${stats.linkedToCompany}`);
  console.log(`   ✅ Actions created: ${stats.actionsCreated}\n`);
  
  return stats;
}

async function updateLastActionDates(workspaceId: string): Promise<ReprocessStats['lastActionUpdates']> {
  console.log('📊 Updating lastActionDate on people and companies...\n');
  
  const stats = {
    people: 0,
    companies: 0
  };
  
  // Update people lastActionDate from their most recent completed action
  const peopleWithActions = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, lastActionDate: true }
  });
  
  for (const person of peopleWithActions) {
    const latestAction = await prisma.actions.findFirst({
      where: {
        personId: person.id,
        deletedAt: null,
        status: 'COMPLETED',
        type: { in: ['EMAIL', 'MEETING'] }
      },
      orderBy: { completedAt: 'desc' },
      select: { subject: true, completedAt: true }
    });
    
    if (latestAction?.completedAt) {
      // Only update if the action date is more recent than current lastActionDate
      if (!person.lastActionDate || latestAction.completedAt > person.lastActionDate) {
        if (!DRY_RUN) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              lastAction: latestAction.subject,
              lastActionDate: latestAction.completedAt
            }
          });
        }
        stats.people++;
      }
    }
  }
  
  // Update companies lastActionDate from their most recent completed action
  // (either direct company action or via person)
  const companiesWithPeople = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, lastActionDate: true },
    include: {
      people: {
        where: { deletedAt: null },
        select: { id: true }
      }
    }
  });
  
  for (const company of companiesWithPeople) {
    const personIds = company.people.map(p => p.id);
    
    const latestAction = await prisma.actions.findFirst({
      where: {
        deletedAt: null,
        status: 'COMPLETED',
        type: { in: ['EMAIL', 'MEETING'] },
        OR: [
          { companyId: company.id },
          ...(personIds.length > 0 ? [{ personId: { in: personIds } }] : [])
        ]
      },
      orderBy: { completedAt: 'desc' },
      select: { subject: true, completedAt: true }
    });
    
    if (latestAction?.completedAt) {
      if (!company.lastActionDate || latestAction.completedAt > company.lastActionDate) {
        if (!DRY_RUN) {
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              lastAction: latestAction.subject,
              lastActionDate: latestAction.completedAt
            }
          });
        }
        stats.companies++;
      }
    }
  }
  
  console.log(`   ✅ People updated: ${stats.people}`);
  console.log(`   ✅ Companies updated: ${stats.companies}\n`);
  
  return stats;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔄 Reprocess Victoria Communications');
  console.log('='.repeat(70));
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }
  console.log('');
  
  try {
    const result = await findVictoria();
    if (!result) {
      console.log('❌ Could not find Victoria or workspace. Exiting.');
      await prisma.$disconnect();
      return;
    }
    
    const { user, workspace } = result;
    
    // Reprocess emails
    const emailStats = await reprocessEmails(workspace.id, user.id);
    
    // Reprocess calendar events
    const calendarStats = await reprocessCalendarEvents(workspace.id, user.id);
    
    // Update lastActionDate
    const lastActionStats = await updateLastActionDates(workspace.id);
    
    // Summary
    console.log('='.repeat(70));
    console.log('📋 SUMMARY');
    console.log('='.repeat(70));
    console.log('');
    console.log('📧 Emails:');
    console.log(`   - Processed: ${emailStats.processed}`);
    console.log(`   - Newly linked to person: ${emailStats.linkedToPerson}`);
    console.log(`   - Newly linked to company: ${emailStats.linkedToCompany}`);
    console.log(`   - Actions created: ${emailStats.actionsCreated}`);
    console.log('');
    console.log('📅 Calendar Events:');
    console.log(`   - Processed: ${calendarStats.processed}`);
    console.log(`   - Newly linked to person: ${calendarStats.linkedToPerson}`);
    console.log(`   - Newly linked to company: ${calendarStats.linkedToCompany}`);
    console.log(`   - Actions created: ${calendarStats.actionsCreated}`);
    console.log('');
    console.log('📊 Last Action Updates:');
    console.log(`   - People updated: ${lastActionStats.people}`);
    console.log(`   - Companies updated: ${lastActionStats.companies}`);
    console.log('');
    
    if (DRY_RUN) {
      console.log('⚠️  This was a DRY RUN - no changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('✅ All changes have been applied.');
    }
    
  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

