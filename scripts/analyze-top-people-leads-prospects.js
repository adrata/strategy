#!/usr/bin/env node

/**
 * TOP Workspace Data Integrity Analysis
 * 
 * Analyzes the relationship between leads, prospects, and people in TOP workspace
 * to identify missing people records or excess lead records.
 * 
 * Expected: leads + prospects = people
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeTopDataIntegrity() {
  console.log('🔍 TOP Workspace Data Integrity Analysis');
  console.log('========================================\n');

  try {
    // Get TOP workspace ID (Dan's workspace)
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'TOP',
          mode: 'insensitive'
        }
      }
    });

    if (!topWorkspace) {
      console.log('❌ TOP workspace not found');
      return;
    }

    console.log(`📊 Analyzing workspace: ${topWorkspace.name} (${topWorkspace.id})\n`);

    // 1. BASIC COUNTS
    console.log('📊 BASIC COUNTS');
    console.log('===============');
    
    const totalPeople = await prisma.people.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const totalLeads = await prisma.leads.count({
      where: { workspaceId: topWorkspace.id }
    });
    
    const totalProspects = await prisma.prospects.count({
      where: { workspaceId: topWorkspace.id }
    });

    console.log(`Total People: ${totalPeople}`);
    console.log(`Total Leads: ${totalLeads}`);
    console.log(`Total Prospects: ${totalProspects}`);
    console.log(`Leads + Prospects: ${totalLeads + totalProspects}`);
    console.log(`Difference (People - (Leads + Prospects)): ${totalPeople - (totalLeads + totalProspects)}\n`);

    // 2. ANALYZE PEOPLE WITHOUT CORRESPONDING LEADS OR PROSPECTS
    console.log('👥 PEOPLE WITHOUT LEADS OR PROSPECTS');
    console.log('=====================================');
    
    const peopleWithoutLeadsOrProspects = await prisma.people.findMany({
      where: {
        workspaceId: topWorkspace.id,
        AND: [
          { leads: { none: {} } },
          { prospects: { none: {} } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        company: {
          select: { name: true }
        },
        createdAt: true
      },
      take: 20
    });

    console.log(`People without leads or prospects: ${peopleWithoutLeadsOrProspects.length}`);
    console.log('\nFirst 20 people without leads or prospects:');
    peopleWithoutLeadsOrProspects.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email || 'No email'}) - ${person.jobTitle || 'No title'} at ${person.company?.name || 'No company'}`);
    });
    console.log('');

    // 3. ANALYZE LEADS WITHOUT CORRESPONDING PEOPLE
    console.log('🎯 LEADS WITHOUT PEOPLE RECORDS');
    console.log('===============================');
    
    const leadsWithoutPeople = await prisma.leads.findMany({
      where: {
        workspaceId: topWorkspace.id,
        people: { none: {} }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        company: {
          select: { name: true }
        },
        createdAt: true
      },
      take: 20
    });

    console.log(`Leads without people records: ${leadsWithoutPeople.length}`);
    console.log('\nFirst 20 leads without people records:');
    leadsWithoutPeople.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} (${lead.email || 'No email'}) - ${lead.jobTitle || 'No title'} at ${lead.company?.name || 'No company'}`);
    });
    console.log('');

    // 4. ANALYZE PROSPECTS WITHOUT CORRESPONDING PEOPLE
    console.log('🔍 PROSPECTS WITHOUT PEOPLE RECORDS');
    console.log('===================================');
    
    const prospectsWithoutPeople = await prisma.prospects.findMany({
      where: {
        workspaceId: topWorkspace.id,
        people: { none: {} }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        company: {
          select: { name: true }
        },
        createdAt: true
      },
      take: 20
    });

    console.log(`Prospects without people records: ${prospectsWithoutPeople.length}`);
    console.log('\nFirst 20 prospects without people records:');
    prospectsWithoutPeople.forEach((prospect, index) => {
      console.log(`${index + 1}. ${prospect.fullName} (${prospect.email || 'No email'}) - ${prospect.jobTitle || 'No title'} at ${prospect.company?.name || 'No company'}`);
    });
    console.log('');

    // 5. ANALYZE PEOPLE WITH BOTH LEADS AND PROSPECTS
    console.log('🔄 PEOPLE WITH BOTH LEADS AND PROSPECTS');
    console.log('=======================================');
    
    const peopleWithBoth = await prisma.people.findMany({
      where: {
        workspaceId: topWorkspace.id,
        AND: [
          { leads: { some: {} } },
          { prospects: { some: {} } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        company: {
          select: { name: true }
        },
        leads: {
          select: { id: true, status: true }
        },
        prospects: {
          select: { id: true, status: true }
        }
      },
      take: 20
    });

    console.log(`People with both leads and prospects: ${peopleWithBoth.length}`);
    console.log('\nFirst 20 people with both leads and prospects:');
    peopleWithBoth.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email || 'No email'}) - ${person.jobTitle || 'No title'} at ${person.company?.name || 'No company'}`);
      console.log(`   Leads: ${person.leads.length}, Prospects: ${person.prospects.length}`);
    });
    console.log('');

    // 6. ANALYZE DUPLICATE EMAILS ACROSS TABLES
    console.log('📧 DUPLICATE EMAIL ANALYSIS');
    console.log('===========================');
    
    // Get all emails from people
    const peopleEmails = await prisma.people.findMany({
      where: {
        workspaceId: topWorkspace.id,
        email: { not: null }
      },
      select: { email: true }
    });

    // Get all emails from leads
    const leadsEmails = await prisma.leads.findMany({
      where: {
        workspaceId: topWorkspace.id,
        email: { not: null }
      },
      select: { email: true }
    });

    // Get all emails from prospects
    const prospectsEmails = await prisma.prospects.findMany({
      where: {
        workspaceId: topWorkspace.id,
        email: { not: null }
      },
      select: { email: true }
    });

    const peopleEmailSet = new Set(peopleEmails.map(p => p.email));
    const leadsEmailSet = new Set(leadsEmails.map(l => l.email));
    const prospectsEmailSet = new Set(prospectsEmails.map(p => p.email));

    // Find emails that exist in leads/prospects but not in people
    const leadsEmailsNotInPeople = leadsEmails.filter(l => !peopleEmailSet.has(l.email));
    const prospectsEmailsNotInPeople = prospectsEmails.filter(p => !peopleEmailSet.has(p.email));

    console.log(`People with emails: ${peopleEmails.length}`);
    console.log(`Leads with emails: ${leadsEmails.length}`);
    console.log(`Prospects with emails: ${prospectsEmails.length}`);
    console.log(`Leads emails not in people: ${leadsEmailsNotInPeople.length}`);
    console.log(`Prospects emails not in people: ${prospectsEmailsNotInPeople.length}\n`);

    // 7. DATE ANALYSIS
    console.log('📅 DATE ANALYSIS');
    console.log('================');
    
    const peopleDateRange = await prisma.people.aggregate({
      where: { workspaceId: topWorkspace.id },
      _min: { createdAt: true },
      _max: { createdAt: true }
    });

    const leadsDateRange = await prisma.leads.aggregate({
      where: { workspaceId: topWorkspace.id },
      _min: { createdAt: true },
      _max: { createdAt: true }
    });

    const prospectsDateRange = await prisma.prospects.aggregate({
      where: { workspaceId: topWorkspace.id },
      _min: { createdAt: true },
      _max: { createdAt: true }
    });

    console.log('Date ranges:');
    console.log(`People: ${peopleDateRange._min.createdAt} to ${peopleDateRange._max.createdAt}`);
    console.log(`Leads: ${leadsDateRange._min.createdAt} to ${leadsDateRange._max.createdAt}`);
    console.log(`Prospects: ${prospectsDateRange._min.createdAt} to ${prospectsDateRange._max.createdAt}\n`);

    // 8. SUMMARY REPORT
    console.log('📋 SUMMARY REPORT');
    console.log('==================');
    console.log(`Data Integrity Analysis for TOP Workspace:`);
    console.log(`  Total People: ${totalPeople}`);
    console.log(`  Total Leads: ${totalLeads}`);
    console.log(`  Total Prospects: ${totalProspects}`);
    console.log(`  Expected People (Leads + Prospects): ${totalLeads + totalProspects}`);
    console.log(`  Actual Difference: ${totalPeople - (totalLeads + totalProspects)}`);
    
    if (totalPeople > (totalLeads + totalProspects)) {
      console.log(`  ⚠️  More people than expected - possible orphaned people records`);
    } else if (totalPeople < (totalLeads + totalProspects)) {
      console.log(`  ⚠️  Fewer people than expected - possible missing people records`);
    } else {
      console.log(`  ✅ Perfect match - leads + prospects = people`);
    }
    
    console.log(`\nData Quality Issues:`);
    console.log(`  People without leads/prospects: ${peopleWithoutLeadsOrProspects.length}`);
    console.log(`  Leads without people: ${leadsWithoutPeople.length}`);
    console.log(`  Prospects without people: ${prospectsWithoutPeople.length}`);
    console.log(`  People with both leads and prospects: ${peopleWithBoth.length}`);
    console.log(`  Leads emails not in people: ${leadsEmailsNotInPeople.length}`);
    console.log(`  Prospects emails not in people: ${prospectsEmailsNotInPeople.length}`);

  } catch (error) {
    console.error('❌ Error analyzing TOP data integrity:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeTopDataIntegrity();
