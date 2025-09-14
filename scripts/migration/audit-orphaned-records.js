const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditOrphanedRecords() {
  console.log('🔍 AUDITING 111 ORPHANED PIPELINE RECORDS');
  console.log('==========================================\n');

  let totalAudited = 0;
  let canLinkPerson = 0;
  let canLinkCompany = 0;
  let canLinkBoth = 0;
  let cannotLink = 0;
  let examples = [];

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
    const nameToSearch = record.fullName || record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim();
    if (nameToSearch && nameToSearch !== ' ' && nameToSearch !== 'null') {
      matches.personByName = await prisma.person.findFirst({
        where: { fullName: nameToSearch }
      });
    }

    // Try to find company by name
    const companyNameToSearch = record.company || record.name;
    if (companyNameToSearch && companyNameToSearch !== 'null') {
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
    const matches = await findPotentialMatches(lead, 'lead');
    
    const hasPersonMatch = matches.personByEmail || matches.personByName;
    const hasCompanyMatch = matches.companyByName;
    
    if (hasPersonMatch && hasCompanyMatch) {
      canLinkBoth++;
    } else if (hasPersonMatch) {
      canLinkPerson++;
    } else if (hasCompanyMatch) {
      canLinkCompany++;
    } else {
      cannotLink++;
    }

    // Store examples for detailed review
    if (examples.length < 10) {
      examples.push({
        type: 'lead',
        id: lead.id,
        name: lead.fullName || `${lead.firstName} ${lead.lastName}`,
        email: lead.email || lead.workEmail,
        company: lead.company,
        workspace: lead.workspaceId,
        personMatch: hasPersonMatch,
        companyMatch: hasCompanyMatch,
        matches: matches
      });
    }
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
    const matches = await findPotentialMatches(prospect, 'prospect');
    
    const hasPersonMatch = matches.personByEmail || matches.personByName;
    const hasCompanyMatch = matches.companyByName;
    
    if (hasPersonMatch && hasCompanyMatch) {
      canLinkBoth++;
    } else if (hasPersonMatch) {
      canLinkPerson++;
    } else if (hasCompanyMatch) {
      canLinkCompany++;
    } else {
      cannotLink++;
    }

    // Store examples for detailed review
    if (examples.length < 10) {
      examples.push({
        type: 'prospect',
        id: prospect.id,
        name: prospect.fullName || `${prospect.firstName} ${prospect.lastName}`,
        email: prospect.email || prospect.workEmail,
        company: prospect.company,
        workspace: prospect.workspaceId,
        personMatch: hasPersonMatch,
        companyMatch: hasCompanyMatch,
        matches: matches
      });
    }
  }

  // Audit OPPORTUNITIES (these don't have email fields)
  console.log('📋 AUDITING ORPHANED OPPORTUNITIES...');
  const orphanedOpportunities = await prisma.opportunities.findMany({
    where: { personId: null },
    select: {
      id: true,
      name: true,
      workspaceId: true
    }
  });

  console.log(`Found ${orphanedOpportunities.length} orphaned opportunities\n`);

  for (const opportunity of orphanedOpportunities) {
    totalAudited++;
    const matches = await findPotentialMatches(opportunity, 'opportunity');
    
    const hasPersonMatch = matches.personByEmail || matches.personByName;
    const hasCompanyMatch = matches.companyByName;
    
    if (hasPersonMatch && hasCompanyMatch) {
      canLinkBoth++;
    } else if (hasPersonMatch) {
      canLinkPerson++;
    } else if (hasCompanyMatch) {
      canLinkCompany++;
    } else {
      cannotLink++;
    }

    // Store examples for detailed review
    if (examples.length < 10) {
      examples.push({
        type: 'opportunity',
        id: opportunity.id,
        name: opportunity.name,
        email: 'N/A',
        company: opportunity.name,
        workspace: opportunity.workspaceId,
        personMatch: hasPersonMatch,
        companyMatch: hasCompanyMatch,
        matches: matches
      });
    }
  }

  // Audit CLIENTS (these don't have email fields)
  console.log('📋 AUDITING ORPHANED CLIENTS...');
  const orphanedClients = await prisma.clients.findMany({
    where: { personId: null },
    select: {
      id: true,
      name: true,
      workspaceId: true
    }
  });

  console.log(`Found ${orphanedClients.length} orphaned clients\n`);

  for (const client of orphanedClients) {
    totalAudited++;
    const matches = await findPotentialMatches(client, 'client');
    
    const hasPersonMatch = matches.personByEmail || matches.personByName;
    const hasCompanyMatch = matches.companyByName;
    
    if (hasPersonMatch && hasCompanyMatch) {
      canLinkBoth++;
    } else if (hasPersonMatch) {
      canLinkPerson++;
    } else if (hasCompanyMatch) {
      canLinkCompany++;
    } else {
      cannotLink++;
    }

    // Store examples for detailed review
    if (examples.length < 10) {
      examples.push({
        type: 'client',
        id: client.id,
        name: client.name,
        email: 'N/A',
        company: client.name,
        workspace: client.workspaceId,
        personMatch: hasPersonMatch,
        companyMatch: hasCompanyMatch,
        matches: matches
      });
    }
  }

  // Display results
  console.log('📊 AUDIT RESULTS SUMMARY');
  console.log('========================');
  console.log(`Total orphaned records audited: ${totalAudited}`);
  console.log(`Can link to both person & company: ${canLinkBoth} (${((canLinkBoth/totalAudited)*100).toFixed(1)}%)`);
  console.log(`Can link to person only: ${canLinkPerson} (${((canLinkPerson/totalAudited)*100).toFixed(1)}%)`);
  console.log(`Can link to company only: ${canLinkCompany} (${((canLinkCompany/totalAudited)*100).toFixed(1)}%)`);
  console.log(`Cannot link to anything: ${cannotLink} (${((cannotLink/totalAudited)*100).toFixed(1)}%)`);
  
  const totalLinkable = canLinkBoth + canLinkPerson + canLinkCompany;
  console.log(`\n🎯 TOTAL LINKABLE: ${totalLinkable}/${totalAudited} (${((totalLinkable/totalAudited)*100).toFixed(1)}%)`);

  // Show detailed examples
  console.log('\n🔍 DETAILED EXAMPLES OF ORPHANED RECORDS:');
  console.log('==========================================');
  
  examples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.type.toUpperCase()}: ${example.name}`);
    console.log(`   ID: ${example.id}`);
    console.log(`   Email: ${example.email}`);
    console.log(`   Company: ${example.company}`);
    console.log(`   Workspace: ${example.workspace}`);
    console.log(`   Person Match: ${example.personMatch ? '✅' : '❌'}`);
    console.log(`   Company Match: ${example.companyMatch ? '✅' : '❌'}`);
    
    if (example.matches.personByEmail) {
      console.log(`   → Person by email: ${example.matches.personByEmail.fullName} (${example.matches.personByEmail.email})`);
    } else if (example.matches.personByName) {
      console.log(`   → Person by name: ${example.matches.personByName.fullName} (${example.matches.personByName.email})`);
    }
    
    if (example.matches.companyByName) {
      console.log(`   → Company match: ${example.matches.companyByName.name}`);
    }
  });

  await prisma.$disconnect();
}

auditOrphanedRecords().catch(console.error);
