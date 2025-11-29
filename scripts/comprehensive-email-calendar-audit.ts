#!/usr/bin/env tsx

/**
 * Comprehensive Email & Calendar Audit with AI-Powered Linking
 * 
 * This script performs a thorough audit and fix of Victoria's communications:
 * 1. Detects and removes duplicate emails, actions, and calendar events
 * 2. Uses multiple strategies to link unlinked communications:
 *    - Exact email match
 *    - Domain-based company match
 *    - Fuzzy name matching
 *    - AI-powered entity resolution for complex cases
 * 3. Creates missing action records
 * 4. Updates lastActionDate on all entities
 * 
 * Usage: npx tsx scripts/comprehensive-email-calendar-audit.ts [--dry-run] [--use-ai]
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const USE_AI = args.includes('--use-ai');

// Initialize Anthropic client for AI-powered matching
let anthropic: Anthropic | null = null;
if (USE_AI && process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}

interface AuditStats {
  duplicates: {
    emails: { found: number; removed: number };
    actions: { found: number; removed: number };
    calendarEvents: { found: number; removed: number };
  };
  linking: {
    emails: {
      total: number;
      alreadyLinked: number;
      newlyLinkedToPerson: number;
      newlyLinkedToCompany: number;
      unlinkedRemaining: number;
      aiMatched: number;
    };
    calendarEvents: {
      total: number;
      alreadyLinked: number;
      newlyLinkedToPerson: number;
      newlyLinkedToCompany: number;
      unlinkedRemaining: number;
      aiMatched: number;
    };
  };
  actions: {
    created: number;
    existing: number;
  };
  lastActionUpdates: {
    people: number;
    companies: number;
  };
}

const stats: AuditStats = {
  duplicates: {
    emails: { found: 0, removed: 0 },
    actions: { found: 0, removed: 0 },
    calendarEvents: { found: 0, removed: 0 }
  },
  linking: {
    emails: {
      total: 0,
      alreadyLinked: 0,
      newlyLinkedToPerson: 0,
      newlyLinkedToCompany: 0,
      unlinkedRemaining: 0,
      aiMatched: 0
    },
    calendarEvents: {
      total: 0,
      alreadyLinked: 0,
      newlyLinkedToPerson: 0,
      newlyLinkedToCompany: 0,
      unlinkedRemaining: 0,
      aiMatched: 0
    }
  },
  actions: {
    created: 0,
    existing: 0
  },
  lastActionUpdates: {
    people: 0,
    companies: 0
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract clean email address from potentially formatted string
 * Handles: "John Doe <john@example.com>", "john@example.com", etc.
 */
function extractCleanEmail(emailStr: string | null | undefined): string | null {
  if (!emailStr || typeof emailStr !== 'string') return null;
  
  // Handle "Name <email>" format
  const angleMatch = emailStr.match(/<([^>]+@[^>]+)>/);
  if (angleMatch) {
    return angleMatch[1].toLowerCase().trim();
  }
  
  // Handle direct email
  const directEmail = emailStr.toLowerCase().trim();
  if (directEmail.includes('@') && !directEmail.includes(' ')) {
    return directEmail;
  }
  
  // Try to extract email from any string containing @
  const emailMatch = directEmail.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    return emailMatch[0].toLowerCase();
  }
  
  return null;
}

/**
 * Extract all clean emails from array
 */
function extractAllCleanEmails(emails: (string | null | undefined)[]): string[] {
  return emails
    .filter(Boolean)
    .map(e => extractCleanEmail(e))
    .filter((e): e is string => e !== null);
}

/**
 * Extract domain from email
 */
function extractDomain(email: string | null | undefined): string | null {
  const clean = extractCleanEmail(email);
  if (!clean) return null;
  const parts = clean.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Normalize domain (remove www, subdomains for comparison)
 */
function normalizeDomain(domain: string | null | undefined): string | null {
  if (!domain) return null;
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .split('/')[0]
    .trim();
}

/**
 * Get base domain (e.g., "company.com" from "mail.company.com")
 */
function getBaseDomain(domain: string | null | undefined): string | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;
  const parts = normalized.split('.');
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return normalized;
}

/**
 * Fuzzy string similarity (Levenshtein-based)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Simple Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

/**
 * Extract name from email address (e.g., "john.doe" from "john.doe@company.com")
 */
function extractNameFromEmail(email: string): { firstName: string; lastName: string } | null {
  const clean = extractCleanEmail(email);
  if (!clean) return null;
  
  const localPart = clean.split('@')[0];
  if (!localPart) return null;
  
  // Common separators: . _ -
  const parts = localPart.split(/[._-]/);
  
  if (parts.length >= 2) {
    return {
      firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
      lastName: parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1)
    };
  }
  
  return null;
}

// ============================================================================
// AI-POWERED MATCHING
// ============================================================================

interface PersonCandidate {
  id: string;
  fullName: string;
  email: string | null;
  workEmail: string | null;
  personalEmail: string | null;
  jobTitle: string | null;
  companyName: string | null;
  companyId: string | null;
}

interface CompanyCandidate {
  id: string;
  name: string;
  domain: string | null;
  website: string | null;
}

/**
 * Use AI to match an email to a person
 */
async function aiMatchEmailToPerson(
  emailFrom: string,
  emailSubject: string,
  emailBody: string,
  candidates: PersonCandidate[]
): Promise<{ personId: string; confidence: number } | null> {
  if (!anthropic || candidates.length === 0) return null;
  
  try {
    const candidateList = candidates.slice(0, 20).map((c, i) => 
      `${i + 1}. ${c.fullName} (${c.email || c.workEmail || 'no email'}) - ${c.jobTitle || 'Unknown title'} at ${c.companyName || 'Unknown company'}`
    ).join('\n');
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Given this email, identify which person from the list is most likely the sender or a key recipient.

Email From: ${emailFrom}
Subject: ${emailSubject}
Body Preview: ${emailBody.substring(0, 500)}

Candidates:
${candidateList}

Respond with ONLY a JSON object: {"match": <number or null>, "confidence": <0.0-1.0>}
If no good match, return {"match": null, "confidence": 0}`
      }]
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      if (result.match !== null && result.confidence >= 0.7) {
        const candidate = candidates[result.match - 1];
        if (candidate) {
          return { personId: candidate.id, confidence: result.confidence };
        }
      }
    }
  } catch (error) {
    console.error('AI matching error:', error);
  }
  
  return null;
}

/**
 * Use AI to match an email to a company
 */
async function aiMatchEmailToCompany(
  emailFrom: string,
  emailSubject: string,
  emailDomain: string,
  candidates: CompanyCandidate[]
): Promise<{ companyId: string; confidence: number } | null> {
  if (!anthropic || candidates.length === 0) return null;
  
  try {
    const candidateList = candidates.slice(0, 20).map((c, i) => 
      `${i + 1}. ${c.name} (domain: ${c.domain || c.website || 'unknown'})`
    ).join('\n');
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Given this email, identify which company from the list is most likely associated with it.

Email From: ${emailFrom}
Email Domain: ${emailDomain}
Subject: ${emailSubject}

Companies:
${candidateList}

Consider:
- Domain similarity (company.com vs thecompany.com are likely same)
- Company name in email domain
- Subject line mentions

Respond with ONLY a JSON object: {"match": <number or null>, "confidence": <0.0-1.0>}
If no good match, return {"match": null, "confidence": 0}`
      }]
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      if (result.match !== null && result.confidence >= 0.6) {
        const candidate = candidates[result.match - 1];
        if (candidate) {
          return { companyId: candidate.id, confidence: result.confidence };
        }
      }
    }
  } catch (error) {
    console.error('AI company matching error:', error);
  }
  
  return null;
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

async function detectAndRemoveDuplicateEmails(workspaceId: string): Promise<void> {
  console.log('\n📧 Detecting duplicate emails...');
  
  // Find emails with duplicate messageIds
  const duplicateMessageIds = await prisma.$queryRaw<{ messageId: string; count: bigint }[]>`
    SELECT "messageId", COUNT(*) as count
    FROM email_messages
    WHERE "workspaceId" = ${workspaceId}
    AND "messageId" IS NOT NULL
    GROUP BY "messageId"
    HAVING COUNT(*) > 1
  `;
  
  console.log(`   Found ${duplicateMessageIds.length} message IDs with duplicates`);
  
  for (const dup of duplicateMessageIds) {
    const emails = await prisma.email_messages.findMany({
      where: { workspaceId, messageId: dup.messageId },
      orderBy: { createdAt: 'asc' }
    });
    
    if (emails.length > 1) {
      stats.duplicates.emails.found += emails.length - 1;
      
      // Keep the first one, delete the rest
      const toDelete = emails.slice(1).map(e => e.id);
      
      if (!DRY_RUN && toDelete.length > 0) {
        await prisma.email_messages.deleteMany({
          where: { id: { in: toDelete } }
        });
        stats.duplicates.emails.removed += toDelete.length;
      }
    }
  }
  
  // Also check for duplicates based on from+subject+receivedAt
  const duplicateContent = await prisma.$queryRaw<{ from_addr: string; subject: string; received: Date; count: bigint }[]>`
    SELECT "from" as from_addr, subject, "receivedAt" as received, COUNT(*) as count
    FROM email_messages
    WHERE "workspaceId" = ${workspaceId}
    GROUP BY "from", subject, "receivedAt"
    HAVING COUNT(*) > 1
  `;
  
  console.log(`   Found ${duplicateContent.length} content-based duplicates`);
  
  for (const dup of duplicateContent) {
    const emails = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        from: dup.from_addr,
        subject: dup.subject,
        receivedAt: dup.received
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (emails.length > 1) {
      stats.duplicates.emails.found += emails.length - 1;
      
      const toDelete = emails.slice(1).map(e => e.id);
      
      if (!DRY_RUN && toDelete.length > 0) {
        await prisma.email_messages.deleteMany({
          where: { id: { in: toDelete } }
        });
        stats.duplicates.emails.removed += toDelete.length;
      }
    }
  }
  
  console.log(`   ✅ Duplicate emails: ${stats.duplicates.emails.found} found, ${stats.duplicates.emails.removed} removed`);
}

async function detectAndRemoveDuplicateActions(workspaceId: string): Promise<void> {
  console.log('\n⚡ Detecting duplicate actions...');
  
  // Find duplicate EMAIL actions (same person, subject, completedAt)
  const duplicateEmailActions = await prisma.$queryRaw<{ personId: string; subject: string; completedAt: Date; count: bigint }[]>`
    SELECT "personId", subject, "completedAt", COUNT(*) as count
    FROM actions
    WHERE "workspaceId" = ${workspaceId}
    AND type = 'EMAIL'
    AND "deletedAt" IS NULL
    AND "personId" IS NOT NULL
    GROUP BY "personId", subject, "completedAt"
    HAVING COUNT(*) > 1
  `;
  
  console.log(`   Found ${duplicateEmailActions.length} duplicate email action groups`);
  
  for (const dup of duplicateEmailActions) {
    const actions = await prisma.actions.findMany({
      where: {
        workspaceId,
        type: 'EMAIL',
        personId: dup.personId,
        subject: dup.subject,
        completedAt: dup.completedAt,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (actions.length > 1) {
      stats.duplicates.actions.found += actions.length - 1;
      
      const toDelete = actions.slice(1).map(a => a.id);
      
      if (!DRY_RUN && toDelete.length > 0) {
        // Soft delete
        await prisma.actions.updateMany({
          where: { id: { in: toDelete } },
          data: { deletedAt: new Date() }
        });
        stats.duplicates.actions.removed += toDelete.length;
      }
    }
  }
  
  // Find duplicate MEETING actions (same person/company, subject, completedAt/scheduledAt)
  const duplicateMeetingActions = await prisma.$queryRaw<{ subject: string; startTime: Date; count: bigint }[]>`
    SELECT subject, COALESCE("completedAt", "scheduledAt") as startTime, COUNT(*) as count
    FROM actions
    WHERE "workspaceId" = ${workspaceId}
    AND type = 'MEETING'
    AND "deletedAt" IS NULL
    GROUP BY subject, COALESCE("completedAt", "scheduledAt")
    HAVING COUNT(*) > 1
  `;
  
  console.log(`   Found ${duplicateMeetingActions.length} duplicate meeting action groups`);
  
  for (const dup of duplicateMeetingActions) {
    const actions = await prisma.actions.findMany({
      where: {
        workspaceId,
        type: 'MEETING',
        subject: dup.subject,
        deletedAt: null,
        OR: [
          { completedAt: dup.startTime },
          { scheduledAt: dup.startTime }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (actions.length > 1) {
      stats.duplicates.actions.found += actions.length - 1;
      
      const toDelete = actions.slice(1).map(a => a.id);
      
      if (!DRY_RUN && toDelete.length > 0) {
        await prisma.actions.updateMany({
          where: { id: { in: toDelete } },
          data: { deletedAt: new Date() }
        });
        stats.duplicates.actions.removed += toDelete.length;
      }
    }
  }
  
  console.log(`   ✅ Duplicate actions: ${stats.duplicates.actions.found} found, ${stats.duplicates.actions.removed} removed`);
}

async function detectAndRemoveDuplicateCalendarEvents(workspaceId: string): Promise<void> {
  console.log('\n📅 Detecting duplicate calendar events...');
  
  // Find events with duplicate externalIds
  const duplicateExternalIds = await prisma.$queryRaw<{ externalId: string; count: bigint }[]>`
    SELECT "externalId", COUNT(*) as count
    FROM events
    WHERE "workspaceId" = ${workspaceId}
    AND "externalId" IS NOT NULL
    GROUP BY "externalId"
    HAVING COUNT(*) > 1
  `;
  
  console.log(`   Found ${duplicateExternalIds.length} external IDs with duplicates`);
  
  for (const dup of duplicateExternalIds) {
    const events = await prisma.events.findMany({
      where: { workspaceId, externalId: dup.externalId },
      orderBy: { createdAt: 'asc' }
    });
    
    if (events.length > 1) {
      stats.duplicates.calendarEvents.found += events.length - 1;
      
      const toDelete = events.slice(1).map(e => e.id);
      
      if (!DRY_RUN && toDelete.length > 0) {
        await prisma.events.deleteMany({
          where: { id: { in: toDelete } }
        });
        stats.duplicates.calendarEvents.removed += toDelete.length;
      }
    }
  }
  
  // Also check for duplicates based on title+startTime
  const duplicateContent = await prisma.$queryRaw<{ title: string; startTime: Date; count: bigint }[]>`
    SELECT title, "startTime", COUNT(*) as count
    FROM events
    WHERE "workspaceId" = ${workspaceId}
    GROUP BY title, "startTime"
    HAVING COUNT(*) > 1
  `;
  
  console.log(`   Found ${duplicateContent.length} content-based duplicates`);
  
  for (const dup of duplicateContent) {
    const events = await prisma.events.findMany({
      where: {
        workspaceId,
        title: dup.title,
        startTime: dup.startTime
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (events.length > 1) {
      stats.duplicates.calendarEvents.found += events.length - 1;
      
      const toDelete = events.slice(1).map(e => e.id);
      
      if (!DRY_RUN && toDelete.length > 0) {
        await prisma.events.deleteMany({
          where: { id: { in: toDelete } }
        });
        stats.duplicates.calendarEvents.removed += toDelete.length;
      }
    }
  }
  
  console.log(`   ✅ Duplicate calendar events: ${stats.duplicates.calendarEvents.found} found, ${stats.duplicates.calendarEvents.removed} removed`);
}

// ============================================================================
// COMPREHENSIVE LINKING
// ============================================================================

async function comprehensiveEmailLinking(workspaceId: string): Promise<void> {
  console.log('\n📧 Comprehensive email linking...');
  
  // Pre-load all people and companies for matching
  const allPeople = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    include: {
      company: {
        select: { id: true, name: true }
      }
    }
  });
  
  const allCompanies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null }
  });
  
  // Build comprehensive lookup maps
  const emailToPersonMap = new Map<string, { id: string; companyId: string | null }>();
  const domainToPersonMap = new Map<string, { id: string; companyId: string | null }[]>();
  const nameToPersonMap = new Map<string, { id: string; companyId: string | null }[]>();
  
  for (const person of allPeople) {
    const emails = extractAllCleanEmails([person.email, person.workEmail, person.personalEmail]);
    
    for (const email of emails) {
      emailToPersonMap.set(email, { id: person.id, companyId: person.companyId });
      
      const domain = extractDomain(email);
      if (domain) {
        const existing = domainToPersonMap.get(domain) || [];
        existing.push({ id: person.id, companyId: person.companyId });
        domainToPersonMap.set(domain, existing);
      }
    }
    
    // Index by name for fuzzy matching
    const nameParts = person.fullName.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 2) {
        const existing = nameToPersonMap.get(part) || [];
        existing.push({ id: person.id, companyId: person.companyId });
        nameToPersonMap.set(part, existing);
      }
    }
  }
  
  // Build company domain map
  const domainToCompanyMap = new Map<string, string>();
  const nameToCompanyMap = new Map<string, string>();
  
  for (const company of allCompanies) {
    // Add by domain
    if (company.domain) {
      const normalized = normalizeDomain(company.domain);
      if (normalized) {
        domainToCompanyMap.set(normalized, company.id);
        const base = getBaseDomain(normalized);
        if (base) domainToCompanyMap.set(base, company.id);
      }
    }
    
    // Add by email domain
    if (company.email) {
      const domain = extractDomain(company.email);
      if (domain) {
        domainToCompanyMap.set(domain, company.id);
        const base = getBaseDomain(domain);
        if (base) domainToCompanyMap.set(base, company.id);
      }
    }
    
    // Add by website
    if (company.website) {
      const normalized = normalizeDomain(company.website);
      if (normalized) {
        domainToCompanyMap.set(normalized, company.id);
        const base = getBaseDomain(normalized);
        if (base) domainToCompanyMap.set(base, company.id);
      }
    }
    
    // Index by name parts for fuzzy matching
    const nameParts = company.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 2 && !['inc', 'llc', 'ltd', 'corp', 'company', 'co', 'the'].includes(part)) {
        nameToCompanyMap.set(part, company.id);
      }
    }
  }
  
  console.log(`   Pre-loaded ${emailToPersonMap.size} person emails, ${domainToCompanyMap.size} company domains`);
  
  // Process all emails
  const totalEmails = await prisma.email_messages.count({ where: { workspaceId } });
  stats.linking.emails.total = totalEmails;
  
  let skip = 0;
  const batchSize = 500;
  let aiMatchAttempts = 0;
  const MAX_AI_MATCHES = USE_AI ? 100 : 0; // Limit AI calls
  
  while (true) {
    const emails = await prisma.email_messages.findMany({
      where: { workspaceId },
      take: batchSize,
      skip,
      orderBy: { receivedAt: 'desc' }
    });
    
    if (emails.length === 0) break;
    
    console.log(`   Processing batch: ${emails.length} emails (skip: ${skip})`);
    
    for (const email of emails) {
      if (email.personId) {
        stats.linking.emails.alreadyLinked++;
        continue;
      }
      
      const rawAddresses = extractAllCleanEmails([
        email.from,
        ...(email.to || []),
        ...(email.cc || []),
        ...(email.bcc || [])
      ]);
      
      let personId: string | null = null;
      let companyId: string | null = email.companyId;
      let matched = false;
      
      // Strategy 1: Exact email match
      for (const addr of rawAddresses) {
        const match = emailToPersonMap.get(addr);
        if (match) {
          personId = match.id;
          if (!companyId && match.companyId) companyId = match.companyId;
          matched = true;
          break;
        }
      }
      
      // Strategy 2: Domain-based person match (same domain = same company person)
      if (!personId) {
        for (const addr of rawAddresses) {
          const domain = extractDomain(addr);
          if (domain) {
            const matches = domainToPersonMap.get(domain);
            if (matches && matches.length > 0) {
              // If multiple people at same domain, try to match by name in email
              const nameFromEmail = extractNameFromEmail(addr);
              if (nameFromEmail && matches.length > 1) {
                for (const match of matches) {
                  const person = allPeople.find(p => p.id === match.id);
                  if (person) {
                    const similarity = Math.max(
                      stringSimilarity(person.firstName || '', nameFromEmail.firstName),
                      stringSimilarity(person.lastName || '', nameFromEmail.lastName)
                    );
                    if (similarity > 0.7) {
                      personId = match.id;
                      if (!companyId && match.companyId) companyId = match.companyId;
                      matched = true;
                      break;
                    }
                  }
                }
              }
              
              // If still no match but only one person at domain, use them
              if (!personId && matches.length === 1) {
                personId = matches[0].id;
                if (!companyId && matches[0].companyId) companyId = matches[0].companyId;
                matched = true;
              }
            }
          }
          if (matched) break;
        }
      }
      
      // Strategy 3: Domain-based company match
      if (!companyId) {
        for (const addr of rawAddresses) {
          const domain = extractDomain(addr);
          if (domain) {
            // Try exact domain
            let match = domainToCompanyMap.get(domain);
            
            // Try base domain
            if (!match) {
              const base = getBaseDomain(domain);
              if (base) match = domainToCompanyMap.get(base);
            }
            
            // Try partial domain match (e.g., "acme" matches "acme.com")
            if (!match) {
              const domainParts = domain.split('.');
              for (const part of domainParts) {
                if (part.length > 3) {
                  match = nameToCompanyMap.get(part);
                  if (match) break;
                }
              }
            }
            
            if (match) {
              companyId = match;
              stats.linking.emails.newlyLinkedToCompany++;
              break;
            }
          }
        }
      }
      
      // Strategy 4: AI-powered matching for remaining unlinked emails
      if (!personId && USE_AI && aiMatchAttempts < MAX_AI_MATCHES && rawAddresses.length > 0) {
        aiMatchAttempts++;
        
        // Get potential candidates based on domain
        const domain = extractDomain(rawAddresses[0]);
        if (domain) {
          const candidates: PersonCandidate[] = allPeople
            .filter(p => {
              const personEmails = extractAllCleanEmails([p.email, p.workEmail, p.personalEmail]);
              return personEmails.some(e => extractDomain(e) === domain || stringSimilarity(extractDomain(e) || '', domain) > 0.6);
            })
            .slice(0, 20)
            .map(p => ({
              id: p.id,
              fullName: p.fullName,
              email: p.email,
              workEmail: p.workEmail,
              personalEmail: p.personalEmail,
              jobTitle: p.jobTitle,
              companyName: p.company?.name || null,
              companyId: p.companyId
            }));
          
          if (candidates.length > 0) {
            const aiMatch = await aiMatchEmailToPerson(
              email.from || '',
              email.subject || '',
              email.body || '',
              candidates
            );
            
            if (aiMatch) {
              personId = aiMatch.personId;
              const candidate = candidates.find(c => c.id === aiMatch.personId);
              if (candidate && !companyId) companyId = candidate.companyId;
              stats.linking.emails.aiMatched++;
              matched = true;
            }
          }
        }
      }
      
      // Update email if we found links
      if (personId || (companyId && companyId !== email.companyId)) {
        if (!DRY_RUN) {
          await prisma.email_messages.update({
            where: { id: email.id },
            data: {
              personId: personId || email.personId,
              companyId: companyId || email.companyId
            }
          });
        }
        
        if (personId) stats.linking.emails.newlyLinkedToPerson++;
      } else {
        stats.linking.emails.unlinkedRemaining++;
      }
    }
    
    skip += batchSize;
  }
  
  console.log(`   ✅ Emails: ${stats.linking.emails.newlyLinkedToPerson} linked to person, ${stats.linking.emails.newlyLinkedToCompany} linked to company`);
  if (USE_AI) {
    console.log(`   ✅ AI matches: ${stats.linking.emails.aiMatched}`);
  }
}

async function comprehensiveCalendarLinking(workspaceId: string): Promise<void> {
  console.log('\n📅 Comprehensive calendar event linking...');
  
  // Pre-load people and companies (similar to email linking)
  const allPeople = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    include: { company: { select: { id: true, name: true } } }
  });
  
  const allCompanies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null }
  });
  
  // Build lookup maps
  const emailToPersonMap = new Map<string, { id: string; companyId: string | null }>();
  const domainToCompanyMap = new Map<string, string>();
  const nameToCompanyMap = new Map<string, string>();
  
  for (const person of allPeople) {
    const emails = extractAllCleanEmails([person.email, person.workEmail, person.personalEmail]);
    for (const email of emails) {
      emailToPersonMap.set(email, { id: person.id, companyId: person.companyId });
    }
  }
  
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
    
    // Name-based lookup
    const nameParts = company.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length > 3 && !['inc', 'llc', 'ltd', 'corp', 'company'].includes(part)) {
        nameToCompanyMap.set(part, company.id);
      }
    }
  }
  
  // Process all calendar events
  const totalEvents = await prisma.events.count({ where: { workspaceId } });
  stats.linking.calendarEvents.total = totalEvents;
  
  const events = await prisma.events.findMany({
    where: { workspaceId },
    orderBy: { startTime: 'desc' }
  });
  
  for (const event of events) {
    if (event.personId && event.companyId) {
      stats.linking.calendarEvents.alreadyLinked++;
      continue;
    }
    
    let personId = event.personId;
    let companyId = event.companyId;
    
    // Extract attendee emails
    const attendees = (event.attendees as any[] || []);
    const attendeeEmails = extractAllCleanEmails(
      attendees.map((a: any) => a.email || a.emailAddress?.address)
    );
    
    // Strategy 1: Match attendees to people
    if (!personId) {
      for (const email of attendeeEmails) {
        const match = emailToPersonMap.get(email);
        if (match) {
          personId = match.id;
          if (!companyId && match.companyId) companyId = match.companyId;
          break;
        }
      }
    }
    
    // Strategy 2: Match attendee domains to companies
    if (!companyId) {
      for (const email of attendeeEmails) {
        const domain = extractDomain(email);
        if (domain) {
          const match = domainToCompanyMap.get(domain) || domainToCompanyMap.get(getBaseDomain(domain) || '');
          if (match) {
            companyId = match;
            break;
          }
        }
      }
    }
    
    // Strategy 3: Extract company name from event title
    if (!companyId) {
      const titleWords = event.title.toLowerCase().split(/\s+/);
      for (const word of titleWords) {
        if (word.length > 3) {
          const match = nameToCompanyMap.get(word);
          if (match) {
            companyId = match;
            break;
          }
        }
      }
    }
    
    // Update event if linked
    if ((personId && personId !== event.personId) || (companyId && companyId !== event.companyId)) {
      if (!DRY_RUN) {
        await prisma.events.update({
          where: { id: event.id },
          data: {
            personId: personId || event.personId,
            companyId: companyId || event.companyId
          }
        });
      }
      
      if (personId && personId !== event.personId) stats.linking.calendarEvents.newlyLinkedToPerson++;
      if (companyId && companyId !== event.companyId) stats.linking.calendarEvents.newlyLinkedToCompany++;
    } else if (!event.personId && !event.companyId) {
      stats.linking.calendarEvents.unlinkedRemaining++;
    }
  }
  
  console.log(`   ✅ Calendar: ${stats.linking.calendarEvents.newlyLinkedToPerson} linked to person, ${stats.linking.calendarEvents.newlyLinkedToCompany} linked to company`);
}

// ============================================================================
// ACTION CREATION
// ============================================================================

async function createMissingActions(workspaceId: string): Promise<void> {
  console.log('\n⚡ Creating missing action records...');
  
  // Get workspace user
  const workspaceUser = await prisma.workspace_users.findFirst({
    where: { workspaceId, isActive: true }
  });
  
  if (!workspaceUser) {
    console.log('   ⚠️ No active workspace user found');
    return;
  }
  
  // Get existing actions for deduplication
  const existingActions = await prisma.actions.findMany({
    where: { workspaceId, deletedAt: null, type: { in: ['EMAIL', 'MEETING'] } },
    select: { personId: true, companyId: true, subject: true, completedAt: true, type: true }
  });
  
  const actionKeys = new Set(
    existingActions.map(a => `${a.type}|${a.personId || ''}|${a.subject}|${a.completedAt?.getTime() || ''}`)
  );
  
  // Create actions for linked emails without actions
  const linkedEmails = await prisma.email_messages.findMany({
    where: { workspaceId, personId: { not: null } }
  });
  
  for (const email of linkedEmails) {
    const key = `EMAIL|${email.personId}|${email.subject}|${email.receivedAt.getTime()}`;
    
    if (!actionKeys.has(key)) {
      if (!DRY_RUN) {
        await prisma.actions.create({
          data: {
            workspaceId,
            userId: workspaceUser.userId,
            personId: email.personId,
            companyId: email.companyId,
            type: 'EMAIL',
            subject: email.subject || '(No Subject)',
            description: email.body?.substring(0, 500) || '',
            status: 'COMPLETED',
            completedAt: email.receivedAt,
            createdAt: email.receivedAt,
            updatedAt: email.receivedAt
          }
        });
      }
      stats.actions.created++;
      actionKeys.add(key);
    } else {
      stats.actions.existing++;
    }
  }
  
  // Create actions for linked calendar events without actions
  const linkedEvents = await prisma.events.findMany({
    where: {
      workspaceId,
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    }
  });
  
  for (const event of linkedEvents) {
    const key = `MEETING|${event.personId || ''}|${event.title}|${event.startTime.getTime()}`;
    
    if (!actionKeys.has(key)) {
      const now = new Date();
      const isCompleted = event.startTime < now;
      
      if (!DRY_RUN) {
        await prisma.actions.create({
          data: {
            workspaceId,
            userId: workspaceUser.userId,
            personId: event.personId,
            companyId: event.companyId,
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
      }
      stats.actions.created++;
      actionKeys.add(key);
    } else {
      stats.actions.existing++;
    }
  }
  
  console.log(`   ✅ Actions created: ${stats.actions.created}, already existing: ${stats.actions.existing}`);
}

// ============================================================================
// LAST ACTION UPDATES
// ============================================================================

async function updateLastActionDates(workspaceId: string): Promise<void> {
  console.log('\n📊 Updating lastActionDate on people and companies...');
  
  // Update people
  const people = await prisma.people.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, lastActionDate: true }
  });
  
  for (const person of people) {
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
    
    if (latestAction?.completedAt && (!person.lastActionDate || latestAction.completedAt > person.lastActionDate)) {
      if (!DRY_RUN) {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            lastAction: latestAction.subject,
            lastActionDate: latestAction.completedAt
          }
        });
      }
      stats.lastActionUpdates.people++;
    }
  }
  
  // Update companies
  const companies = await prisma.companies.findMany({
    where: { workspaceId, deletedAt: null },
    include: { people: { where: { deletedAt: null }, select: { id: true } } }
  });
  
  for (const company of companies) {
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
    
    if (latestAction?.completedAt && (!company.lastActionDate || latestAction.completedAt > company.lastActionDate)) {
      if (!DRY_RUN) {
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            lastAction: latestAction.subject,
            lastActionDate: latestAction.completedAt
          }
        });
      }
      stats.lastActionUpdates.companies++;
    }
  }
  
  console.log(`   ✅ People updated: ${stats.lastActionUpdates.people}, Companies updated: ${stats.lastActionUpdates.companies}`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log('🔍 COMPREHENSIVE EMAIL & CALENDAR AUDIT');
  console.log('='.repeat(80));
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }
  if (USE_AI) {
    console.log('🤖 AI-POWERED MATCHING ENABLED\n');
  }
  
  // Find Victoria's workspace
  const victoria = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { contains: 'victoria', mode: 'insensitive' } },
        { name: { contains: 'victoria', mode: 'insensitive' } }
      ]
    }
  });
  
  if (!victoria) {
    console.log('❌ Victoria not found');
    return;
  }
  
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
        { name: { contains: 'Engineering Plus', mode: 'insensitive' } }
      ]
    }
  });
  
  if (!workspace) {
    console.log('❌ Workspace not found');
    return;
  }
  
  console.log(`✅ User: ${victoria.name || victoria.email}`);
  console.log(`✅ Workspace: ${workspace.name} (${workspace.id})\n`);
  
  try {
    // Phase 1: Duplicate Detection & Removal
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 1: DUPLICATE DETECTION & REMOVAL');
    console.log('='.repeat(80));
    
    await detectAndRemoveDuplicateEmails(workspace.id);
    await detectAndRemoveDuplicateActions(workspace.id);
    await detectAndRemoveDuplicateCalendarEvents(workspace.id);
    
    // Phase 2: Comprehensive Linking
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: COMPREHENSIVE LINKING');
    console.log('='.repeat(80));
    
    await comprehensiveEmailLinking(workspace.id);
    await comprehensiveCalendarLinking(workspace.id);
    
    // Phase 3: Action Creation
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 3: ACTION CREATION');
    console.log('='.repeat(80));
    
    await createMissingActions(workspace.id);
    
    // Phase 4: Last Action Updates
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 4: LAST ACTION DATE UPDATES');
    console.log('='.repeat(80));
    
    await updateLastActionDates(workspace.id);
    
    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 FINAL SUMMARY');
    console.log('='.repeat(80));
    
    console.log('\n🔄 Duplicates:');
    console.log(`   Emails: ${stats.duplicates.emails.found} found, ${stats.duplicates.emails.removed} removed`);
    console.log(`   Actions: ${stats.duplicates.actions.found} found, ${stats.duplicates.actions.removed} removed`);
    console.log(`   Calendar Events: ${stats.duplicates.calendarEvents.found} found, ${stats.duplicates.calendarEvents.removed} removed`);
    
    console.log('\n📧 Email Linking:');
    console.log(`   Total: ${stats.linking.emails.total}`);
    console.log(`   Already linked: ${stats.linking.emails.alreadyLinked}`);
    console.log(`   Newly linked to person: ${stats.linking.emails.newlyLinkedToPerson}`);
    console.log(`   Newly linked to company: ${stats.linking.emails.newlyLinkedToCompany}`);
    if (USE_AI) console.log(`   AI matched: ${stats.linking.emails.aiMatched}`);
    console.log(`   Remaining unlinked: ${stats.linking.emails.unlinkedRemaining}`);
    
    console.log('\n📅 Calendar Event Linking:');
    console.log(`   Total: ${stats.linking.calendarEvents.total}`);
    console.log(`   Already linked: ${stats.linking.calendarEvents.alreadyLinked}`);
    console.log(`   Newly linked to person: ${stats.linking.calendarEvents.newlyLinkedToPerson}`);
    console.log(`   Newly linked to company: ${stats.linking.calendarEvents.newlyLinkedToCompany}`);
    console.log(`   Remaining unlinked: ${stats.linking.calendarEvents.unlinkedRemaining}`);
    
    console.log('\n⚡ Actions:');
    console.log(`   Created: ${stats.actions.created}`);
    console.log(`   Already existing: ${stats.actions.existing}`);
    
    console.log('\n📊 Last Action Updates:');
    console.log(`   People: ${stats.lastActionUpdates.people}`);
    console.log(`   Companies: ${stats.lastActionUpdates.companies}`);
    
    // Calculate final linking rates
    const emailLinkRate = stats.linking.emails.total > 0 
      ? ((stats.linking.emails.alreadyLinked + stats.linking.emails.newlyLinkedToPerson) / stats.linking.emails.total * 100).toFixed(1)
      : '0';
    const calendarLinkRate = stats.linking.calendarEvents.total > 0
      ? ((stats.linking.calendarEvents.alreadyLinked + stats.linking.calendarEvents.newlyLinkedToPerson + stats.linking.calendarEvents.newlyLinkedToCompany) / stats.linking.calendarEvents.total * 100).toFixed(1)
      : '0';
    
    console.log('\n🎯 LINKING RATES:');
    console.log(`   Email linking rate: ${emailLinkRate}%`);
    console.log(`   Calendar linking rate: ${calendarLinkRate}%`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ All changes have been applied.');
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);

