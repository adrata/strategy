#!/usr/bin/env node

/**
 * 🔍 DATA CONNECTIONS AUDIT
 * 
 * Comprehensive audit to analyze the current state of relationships between:
 * - Prospects ↔ People
 * - Prospects ↔ Companies  
 * - People ↔ Companies
 * - Leads ↔ People
 * - Leads ↔ Companies
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Workspace IDs
const NOTARY_EVERYDAY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
const DANO_WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';

async function auditDataConnections() {
  console.log('🔍 DATA CONNECTIONS AUDIT');
  console.log('='.repeat(60));
  console.log('Analyzing relationships between prospects, people, and companies');
  console.log('');

  try {
    // Audit both workspaces
    await auditWorkspace(NOTARY_EVERYDAY_WORKSPACE_ID, 'Notary Everyday');
    console.log('\n' + '='.repeat(60) + '\n');
    await auditWorkspace(DANO_WORKSPACE_ID, 'Dano Workspace');
    
  } catch (error) {
    console.error('❌ Error in data connections audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function auditWorkspace(workspaceId, workspaceName) {
  console.log(`📊 AUDITING WORKSPACE: ${workspaceName} (${workspaceId})`);
  console.log('-'.repeat(50));

  // Get all records
  const [prospects, leads, people, companies] = await Promise.all([
    prisma.prospects.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        company: true,
        personId: true,
        companyId: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    }),
    prisma.leads.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        company: true,
        personId: true,
        companyId: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    }),
    prisma.people.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        company: true,
        companyId: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    }),
    prisma.companies.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        name: true,
        website: true
      }
    })
  ]);

  console.log(`📈 RECORD COUNTS:`);
  console.log(`   Prospects: ${prospects.length.toLocaleString()}`);
  console.log(`   Leads: ${leads.length.toLocaleString()}`);
  console.log(`   People: ${people.length.toLocaleString()}`);
  console.log(`   Companies: ${companies.length.toLocaleString()}`);
  console.log('');

  // Analyze prospects relationships
  console.log('🔗 PROSPECTS RELATIONSHIPS:');
  const prospectsWithPersonId = prospects.filter(p => p.personId);
  const prospectsWithCompanyId = prospects.filter(p => p.companyId);
  const prospectsWithBoth = prospects.filter(p => p.personId && p.companyId);
  const prospectsWithNeither = prospects.filter(p => !p.personId && !p.companyId);

  console.log(`   With personId: ${prospectsWithPersonId.length.toLocaleString()} (${((prospectsWithPersonId.length / prospects.length) * 100).toFixed(1)}%)`);
  console.log(`   With companyId: ${prospectsWithCompanyId.length.toLocaleString()} (${((prospectsWithCompanyId.length / prospects.length) * 100).toFixed(1)}%)`);
  console.log(`   With both: ${prospectsWithBoth.length.toLocaleString()} (${((prospectsWithBoth.length / prospects.length) * 100).toFixed(1)}%)`);
  console.log(`   With neither: ${prospectsWithNeither.length.toLocaleString()} (${((prospectsWithNeither.length / prospects.length) * 100).toFixed(1)}%)`);
  console.log('');

  // Analyze leads relationships
  console.log('🔗 LEADS RELATIONSHIPS:');
  const leadsWithPersonId = leads.filter(l => l.personId);
  const leadsWithCompanyId = leads.filter(l => l.companyId);
  const leadsWithBoth = leads.filter(l => l.personId && l.companyId);
  const leadsWithNeither = leads.filter(l => !l.personId && !l.companyId);

  console.log(`   With personId: ${leadsWithPersonId.length.toLocaleString()} (${((leadsWithPersonId.length / leads.length) * 100).toFixed(1)}%)`);
  console.log(`   With companyId: ${leadsWithCompanyId.length.toLocaleString()} (${((leadsWithCompanyId.length / leads.length) * 100).toFixed(1)}%)`);
  console.log(`   With both: ${leadsWithBoth.length.toLocaleString()} (${((leadsWithBoth.length / leads.length) * 100).toFixed(1)}%)`);
  console.log(`   With neither: ${leadsWithNeither.length.toLocaleString()} (${((leadsWithNeither.length / leads.length) * 100).toFixed(1)}%)`);
  console.log('');

  // Analyze people relationships
  console.log('🔗 PEOPLE RELATIONSHIPS:');
  const peopleWithCompanyId = people.filter(p => p.companyId);
  const peopleWithoutCompanyId = people.filter(p => !p.companyId);

  console.log(`   With companyId: ${peopleWithCompanyId.length.toLocaleString()} (${((peopleWithCompanyId.length / people.length) * 100).toFixed(1)}%)`);
  console.log(`   Without companyId: ${peopleWithoutCompanyId.length.toLocaleString()} (${((peopleWithoutCompanyId.length / people.length) * 100).toFixed(1)}%)`);
  console.log('');

  // Check for potential matches
  console.log('🔍 POTENTIAL RELATIONSHIP MATCHES:');
  
  // Prospects that could be linked to people by email
  const prospectsWithEmail = prospects.filter(p => p.email || p.workEmail || p.personalEmail);
  const peopleWithEmail = people.filter(p => p.email || p.workEmail || p.personalEmail);
  
  let potentialProspectPersonMatches = 0;
  for (const prospect of prospectsWithEmail) {
    const prospectEmails = [prospect.email, prospect.workEmail, prospect.personalEmail].filter(Boolean);
    const matchingPerson = peopleWithEmail.find(person => {
      const personEmails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
      return prospectEmails.some(email => personEmails.includes(email));
    });
    if (matchingPerson && !prospect.personId) {
      potentialProspectPersonMatches++;
    }
  }
  
  console.log(`   Prospects that could be linked to people by email: ${potentialProspectPersonMatches.toLocaleString()}`);
  
  // Prospects that could be linked to companies by name
  const companyNames = new Set(companies.map(c => c.name.toLowerCase()));
  const prospectsWithCompanyName = prospects.filter(p => p.company && companyNames.has(p.company.toLowerCase()));
  const prospectsWithCompanyNameButNoId = prospectsWithCompanyName.filter(p => !p.companyId);
  
  console.log(`   Prospects with company names that exist in companies table: ${prospectsWithCompanyName.length.toLocaleString()}`);
  console.log(`   Prospects with company names but no companyId: ${prospectsWithCompanyNameButNoId.length.toLocaleString()}`);
  console.log('');

  // Sample data for inspection
  console.log('📋 SAMPLE DATA FOR INSPECTION:');
  
  if (prospectsWithNeither.length > 0) {
    console.log('   Sample prospects with no relationships:');
    prospectsWithNeither.slice(0, 3).forEach(p => {
      console.log(`   - ${p.fullName} (${p.company || 'No company'}) - ${p.email || 'No email'}`);
    });
  }
  
  if (prospectsWithCompanyNameButNoId.length > 0) {
    console.log('   Sample prospects with company names but no companyId:');
    prospectsWithCompanyNameButNoId.slice(0, 3).forEach(p => {
      console.log(`   - ${p.fullName} at ${p.company} - ${p.email || 'No email'}`);
    });
  }
  
  if (peopleWithoutCompanyId.length > 0) {
    console.log('   Sample people without company relationships:');
    peopleWithoutCompanyId.slice(0, 3).forEach(p => {
      console.log(`   - ${p.fullName} (${p.company || 'No company'}) - ${p.email || 'No email'}`);
    });
  }
  
  console.log('');

  // Data quality summary
  console.log('📊 DATA QUALITY SUMMARY:');
  const totalRecords = prospects.length + leads.length + people.length;
  const recordsWithRelationships = prospectsWithBoth.length + leadsWithBoth.length + peopleWithCompanyId.length;
  const relationshipPercentage = ((recordsWithRelationships / totalRecords) * 100).toFixed(1);
  
  console.log(`   Total records: ${totalRecords.toLocaleString()}`);
  console.log(`   Records with proper relationships: ${recordsWithRelationships.toLocaleString()}`);
  console.log(`   Relationship completeness: ${relationshipPercentage}%`);
  
  if (relationshipPercentage < 50) {
    console.log('   ⚠️  LOW RELATIONSHIP COMPLETENESS - Consider running data integrity fixes');
  } else if (relationshipPercentage < 80) {
    console.log('   ⚡ MODERATE RELATIONSHIP COMPLETENESS - Some improvements needed');
  } else {
    console.log('   ✅ GOOD RELATIONSHIP COMPLETENESS');
  }
  
  console.log('');
}

// Run the audit
auditDataConnections().catch(console.error);
