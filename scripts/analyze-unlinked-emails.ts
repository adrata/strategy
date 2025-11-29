#!/usr/bin/env tsx

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  const workspace = await prisma.workspaces.findFirst({
    where: { name: { contains: 'TOP Engineering', mode: 'insensitive' } }
  });
  
  if (!workspace) {
    console.log('Workspace not found');
    return;
  }
  
  console.log(`Workspace: ${workspace.name}\n`);
  
  // Get all unlinked emails
  const unlinked = await prisma.email_messages.findMany({
    where: { workspaceId: workspace.id, personId: null, companyId: null },
    select: { from: true }
  });
  
  console.log(`Total unlinked emails: ${unlinked.length}\n`);
  
  // Count by domain
  const domainCounts = new Map<string, number>();
  for (const email of unlinked) {
    const match = email.from?.match(/@([^@>]+)/);
    const domain = match ? match[1].toLowerCase().trim() : 'unknown';
    domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
  }
  
  // Sort by count
  const sorted = [...domainCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
  
  console.log('📧 TOP 30 UNLINKED EMAIL DOMAINS:');
  console.log('='.repeat(60));
  for (const [domain, count] of sorted) {
    console.log(`   ${domain}: ${count} emails`);
  }
  
  // Get all company domains
  const companies = await prisma.companies.findMany({
    where: { workspaceId: workspace.id, deletedAt: null },
    select: { name: true, domain: true, email: true, website: true }
  });
  
  const companyDomains = new Set<string>();
  for (const c of companies) {
    if (c.domain) companyDomains.add(c.domain.toLowerCase());
    if (c.email) {
      const match = c.email.match(/@([^@]+)$/);
      if (match) companyDomains.add(match[1].toLowerCase());
    }
    if (c.website) {
      const w = c.website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      companyDomains.add(w);
    }
  }
  
  console.log(`\n🏢 Total company domains in database: ${companyDomains.size}`);
  
  console.log('\n🔍 TOP UNLINKED DOMAINS - COMPANY MATCH STATUS:');
  console.log('='.repeat(60));
  for (const [domain, count] of sorted.slice(0, 20)) {
    const hasCompany = companyDomains.has(domain);
    const status = hasCompany ? '✅ HAS COMPANY' : '❌ NO COMPANY';
    console.log(`   ${domain}: ${count} emails - ${status}`);
  }
  
  // Calculate how many emails COULD be linked if we added companies for these domains
  let potentiallyLinkable = 0;
  for (const [domain, count] of sorted) {
    if (!companyDomains.has(domain) && 
        !domain.includes('google.com') && 
        !domain.includes('gmail.com') && 
        !domain.includes('outlook.com') &&
        !domain.includes('microsoft.com') &&
        !domain.includes('yahoo.com') &&
        domain !== 'unknown') {
      potentiallyLinkable += count;
    }
  }
  
  console.log(`\n📊 LINKABILITY ANALYSIS:`);
  console.log(`   Total unlinked: ${unlinked.length}`);
  console.log(`   Could link if companies added: ${potentiallyLinkable}`);
  console.log(`   Generic email providers (gmail, etc.): ${unlinked.length - potentiallyLinkable}`);
  
  await prisma.$disconnect();
}

analyze().catch(console.error);

