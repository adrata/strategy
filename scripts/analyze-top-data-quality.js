#!/usr/bin/env node

/**
 * TOP Data Quality Analysis
 * 
 * Analyzes the relationship between people, leads, and prospects
 * to identify data duplication and quality issues
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDataQuality() {
  console.log('🔍 TOP Data Quality Analysis');
  console.log('============================\n');

  try {
    // Get TOP workspace ID
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
    console.log(`Expected Leads (People - Prospects): ${totalPeople - totalProspects}`);
    console.log(`Actual vs Expected Difference: ${totalLeads - (totalPeople - totalProspects)}`);
    console.log('');

    // 2. ANALYZE PEOPLE-PROSPECT RELATIONSHIPS
    console.log('🔗 PEOPLE-PROSPECT RELATIONSHIPS');
    console.log('=================================');
    
    const peopleWithPersonId = await prisma.people.count({
      where: {
        workspaceId: topWorkspace.id,
        id: {
          in: await prisma.prospects.findMany({
            where: { workspaceId: topWorkspace.id },
            select: { personId: true }
          }).then(prospects => prospects.map(p => p.personId).filter(Boolean))
        }
      }
    });

    const prospectsWithPersonId = await prisma.prospects.count({
      where: {
        workspaceId: topWorkspace.id,
        personId: { not: null }
      }
    });

    console.log(`People that are also Prospects: ${peopleWithPersonId}`);
    console.log(`Prospects with personId: ${prospectsWithPersonId}`);
    console.log('');

    // 3. ANALYZE DUPLICATE DATA
    console.log('🔄 DUPLICATE ANALYSIS');
    console.log('=====================');
    
    // Find people who might be duplicated as leads
    const peopleEmails = await prisma.people.findMany({
      where: {
        workspaceId: topWorkspace.id,
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });

    const leadsEmails = await prisma.leads.findMany({
      where: {
        workspaceId: topWorkspace.id,
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });

    // Find potential duplicates by email
    const emailMap = new Map();
    const duplicates = [];

    // Index people by email
    peopleEmails.forEach(person => {
      const emails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (!emailMap.has(email)) {
          emailMap.set(email, []);
        }
        emailMap.get(email).push({ type: 'person', id: person.id, name: person.fullName });
      });
    });

    // Check leads against people
    leadsEmails.forEach(lead => {
      const emails = [lead.email, lead.workEmail, lead.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (emailMap.has(email)) {
          emailMap.get(email).push({ type: 'lead', id: lead.id, name: lead.fullName });
        }
      });
    });

    // Find actual duplicates
    emailMap.forEach((records, email) => {
      if (records.length > 1) {
        const hasPerson = records.some(r => r.type === 'person');
        const hasLead = records.some(r => r.type === 'lead');
        if (hasPerson && hasLead) {
          duplicates.push({ email, records });
        }
      }
    });

    console.log(`Potential duplicates found: ${duplicates.length}`);
    console.log('');

    // 4. ANALYZE BY COMPANY
    console.log('🏢 COMPANY-BASED ANALYSIS');
    console.log('=========================');
    
    const companiesWithPeople = await prisma.companies.findMany({
      where: { workspaceId: topWorkspace.id },
      include: {
        people: {
          select: { id: true, fullName: true, buyerGroupRole: true }
        }
      }
    });

    const companiesWithLeads = await prisma.leads.groupBy({
      by: ['company'],
      where: {
        workspaceId: topWorkspace.id,
        company: { not: null }
      },
      _count: { company: true }
    });

    const companiesWithProspects = await prisma.prospects.groupBy({
      by: ['company'],
      where: {
        workspaceId: topWorkspace.id,
        company: { not: null }
      },
      _count: { company: true }
    });

    console.log(`Companies with people: ${companiesWithPeople.length}`);
    console.log(`Companies with leads: ${companiesWithLeads.length}`);
    console.log(`Companies with prospects: ${companiesWithProspects.length}`);
    console.log('');

    // 5. SAMPLE DUPLICATES
    console.log('📋 SAMPLE DUPLICATES (First 10)');
    console.log('================================');
    
    duplicates.slice(0, 10).forEach((dup, index) => {
      console.log(`${index + 1}. Email: ${dup.email}`);
      dup.records.forEach(record => {
        console.log(`   - ${record.type.toUpperCase()}: ${record.name} (${record.id})`);
      });
      console.log('');
    });

    // 6. RECOMMENDATIONS
    console.log('💡 RECOMMENDATIONS');
    console.log('==================');
    console.log(`1. Expected leads should be: ${totalPeople - totalProspects} (not ${totalLeads})`);
    console.log(`2. ${duplicates.length} potential duplicates need to be resolved`);
    console.log(`3. Consider merging people and leads where appropriate`);
    console.log(`4. Ensure prospects are properly linked to people via personId`);
    console.log('');

    // 7. SUMMARY
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`Current State:`);
    console.log(`  People: ${totalPeople}`);
    console.log(`  Leads: ${totalLeads} (should be ~${totalPeople - totalProspects})`);
    console.log(`  Prospects: ${totalProspects}`);
    console.log(`  Duplicates: ${duplicates.length}`);
    console.log('');
    console.log(`Data Quality Issues:`);
    console.log(`  - ${totalLeads - (totalPeople - totalProspects)} extra leads`);
    console.log(`  - ${duplicates.length} email-based duplicates`);
    console.log(`  - Need to consolidate people/leads relationships`);

  } catch (error) {
    console.error('❌ Error analyzing data quality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeDataQuality();
