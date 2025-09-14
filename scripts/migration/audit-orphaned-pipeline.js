const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditOrphanedPipeline() {
  console.log('🔍 AUDITING 111 ORPHANED PIPELINE RECORDS');
  console.log('==========================================\n');

  let totalAudited = 0;
  let potentialMatches = 0;

  // Helper function to find potential matches
  async function findPotentialMatches(record, recordType) {
    const matches = {
      personByEmail: null,
      personByName: null,
      companyByName: null
    };

    // Try to find person by email
    const emailToSearch = record.email || record.workEmail;
    if (emailToSearch) {
      matches.personByEmail = await prisma.person.findFirst({
        where: { email: emailToSearch }
      });
    }

    // Try to find person by name
    const nameToSearch = record.fullName || `${record.firstName || ''} ${record.lastName || ''}`.trim();
    if (nameToSearch && nameToSearch !== ' ') {
      matches.personByName = await prisma.person.findFirst({
        where: { fullName: nameToSearch }
      });
    }

    // Try to find company by name
    const companyNameToSearch = record.company || record.name;
    if (companyNameToSearch) {
      matches.companyByName = await prisma.company.findFirst({
        where: { name: companyNameToSearch }
      });
    }

    return matches;
  }

  // Audit LEADS
  console.log('📋 AUDITING ORPHANED LEADS...');
  const orphanedLeads = await prisma.leads.findMany({
    where: { personId: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      workEmail: true,
      company: true,
      workspaceId: true
    }
  });

  console.log(`Found ${orphanedLeads.length} orphaned leads\n`);

  for (const lead of orphanedLeads) {
    totalAudited++;
    console.log(`🔍 Lead ${totalAudited}: ${lead.fullName || `${lead.firstName} ${lead.lastName}`}`);
    console.log(`   Email: ${lead.email || lead.workEmail || 'None'}`);
    console.log(`   Company: ${lead.company || 'None'}`);
    console.log(`   Workspace: ${lead.workspaceId}`);

    const matches = await findPotentialMatches(lead, 'lead');
    
    if (matches.personByEmail) {
      console.log(`   ✅ PERSON MATCH BY EMAIL: ${matches.personByEmail.fullName} (${matches.personByEmail.email})`);
      potentialMatches++;
    } else if (matches.personByName) {
      console.log(`   ✅ PERSON MATCH BY NAME: ${matches.personByName.fullName} (${matches.personByName.email})`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No person match found`);
    }

    if (matches.companyByName) {
      console.log(`   ✅ COMPANY MATCH: ${matches.companyByName.name}`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No company match found`);
    }
    console.log('');
  }

  // Audit PROSPECTS
  console.log('📋 AUDITING ORPHANED PROSPECTS...');
  const orphanedProspects = await prisma.prospects.findMany({
    where: { personId: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      workEmail: true,
      company: true,
      workspaceId: true
    }
  });

  console.log(`Found ${orphanedProspects.length} orphaned prospects\n`);

  for (const prospect of orphanedProspects) {
    totalAudited++;
    console.log(`🔍 Prospect ${totalAudited}: ${prospect.fullName || `${prospect.firstName} ${prospect.lastName}`}`);
    console.log(`   Email: ${prospect.email || prospect.workEmail || 'None'}`);
    console.log(`   Company: ${prospect.company || 'None'}`);
    console.log(`   Workspace: ${prospect.workspaceId}`);

    const matches = await findPotentialMatches(prospect, 'prospect');
    
    if (matches.personByEmail) {
      console.log(`   ✅ PERSON MATCH BY EMAIL: ${matches.personByEmail.fullName} (${matches.personByEmail.email})`);
      potentialMatches++;
    } else if (matches.personByName) {
      console.log(`   ✅ PERSON MATCH BY NAME: ${matches.personByName.fullName} (${matches.personByName.email})`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No person match found`);
    }

    if (matches.companyByName) {
      console.log(`   ✅ COMPANY MATCH: ${matches.companyByName.name}`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No company match found`);
    }
    console.log('');
  }

  // Audit OPPORTUNITIES
  console.log('📋 AUDITING ORPHANED OPPORTUNITIES...');
  const orphanedOpportunities = await prisma.opportunities.findMany({
    where: { personId: null },
    select: {
      id: true,
      name: true,
      email: true,
      workEmail: true,
      workspaceId: true
    }
  });

  console.log(`Found ${orphanedOpportunities.length} orphaned opportunities\n`);

  for (const opportunity of orphanedOpportunities) {
    totalAudited++;
    console.log(`🔍 Opportunity ${totalAudited}: ${opportunity.name || 'Unnamed'}`);
    console.log(`   Email: ${opportunity.email || opportunity.workEmail || 'None'}`);
    console.log(`   Workspace: ${opportunity.workspaceId}`);

    const matches = await findPotentialMatches(opportunity, 'opportunity');
    
    if (matches.personByEmail) {
      console.log(`   ✅ PERSON MATCH BY EMAIL: ${matches.personByEmail.fullName} (${matches.personByEmail.email})`);
      potentialMatches++;
    } else if (matches.personByName) {
      console.log(`   ✅ PERSON MATCH BY NAME: ${matches.personByName.fullName} (${matches.personByName.email})`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No person match found`);
    }

    if (matches.companyByName) {
      console.log(`   ✅ COMPANY MATCH: ${matches.companyByName.name}`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No company match found`);
    }
    console.log('');
  }

  // Audit CLIENTS
  console.log('📋 AUDITING ORPHANED CLIENTS...');
  const orphanedClients = await prisma.clients.findMany({
    where: { personId: null },
    select: {
      id: true,
      name: true,
      email: true,
      workEmail: true,
      workspaceId: true
    }
  });

  console.log(`Found ${orphanedClients.length} orphaned clients\n`);

  for (const client of orphanedClients) {
    totalAudited++;
    console.log(`🔍 Client ${totalAudited}: ${client.name || 'Unnamed'}`);
    console.log(`   Email: ${client.email || client.workEmail || 'None'}`);
    console.log(`   Workspace: ${client.workspaceId}`);

    const matches = await findPotentialMatches(client, 'client');
    
    if (matches.personByEmail) {
      console.log(`   ✅ PERSON MATCH BY EMAIL: ${matches.personByEmail.fullName} (${matches.personByEmail.email})`);
      potentialMatches++;
    } else if (matches.personByName) {
      console.log(`   ✅ PERSON MATCH BY NAME: ${matches.personByName.fullName} (${matches.personByName.email})`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No person match found`);
    }

    if (matches.companyByName) {
      console.log(`   ✅ COMPANY MATCH: ${matches.companyByName.name}`);
      potentialMatches++;
    } else {
      console.log(`   ❌ No company match found`);
    }
    console.log('');
  }

  console.log('📊 AUDIT SUMMARY');
  console.log('================');
  console.log(`Total orphaned records audited: ${totalAudited}`);
  console.log(`Potential matches found: ${potentialMatches}`);
  console.log(`Match rate: ${((potentialMatches / totalAudited) * 100).toFixed(1)}%`);

  await prisma.$disconnect();
}

auditOrphanedPipeline().catch(console.error);
