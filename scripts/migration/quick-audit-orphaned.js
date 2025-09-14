const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickAuditOrphaned() {
  console.log('🔍 QUICK AUDIT: 111 ORPHANED PIPELINE RECORDS');
  console.log('==============================================\n');

  let totalAudited = 0;
  let canLinkPerson = 0;
  let canLinkCompany = 0;
  let canLinkBoth = 0;
  let cannotLink = 0;

  // Helper function to find potential matches
  async function findPotentialMatches(record) {
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

  // Process all orphaned records
  const allOrphaned = [];

  // Get orphaned leads
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

  // Get orphaned prospects
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

  // Get orphaned opportunities
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

  // Get orphaned clients
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

  // Combine all records
  allOrphaned.push(
    ...orphanedLeads.map(r => ({ ...r, type: 'lead' })),
    ...orphanedProspects.map(r => ({ ...r, type: 'prospect' })),
    ...orphanedOpportunities.map(r => ({ ...r, type: 'opportunity' })),
    ...orphanedClients.map(r => ({ ...r, type: 'client' }))
  );

  console.log(`Found ${allOrphaned.length} total orphaned records\n`);

  // Process each record
  for (const record of allOrphaned) {
    totalAudited++;
    
    const matches = await findPotentialMatches(record);
    
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
  }

  console.log('📊 AUDIT RESULTS SUMMARY');
  console.log('========================');
  console.log(`Total orphaned records: ${totalAudited}`);
  console.log(`Can link to both person & company: ${canLinkBoth} (${((canLinkBoth/totalAudited)*100).toFixed(1)}%)`);
  console.log(`Can link to person only: ${canLinkPerson} (${((canLinkPerson/totalAudited)*100).toFixed(1)}%)`);
  console.log(`Can link to company only: ${canLinkCompany} (${((canLinkCompany/totalAudited)*100).toFixed(1)}%)`);
  console.log(`Cannot link to anything: ${cannotLink} (${((cannotLink/totalAudited)*100).toFixed(1)}%)`);
  
  const totalLinkable = canLinkBoth + canLinkPerson + canLinkCompany;
  console.log(`\n🎯 TOTAL LINKABLE: ${totalLinkable}/${totalAudited} (${((totalLinkable/totalAudited)*100).toFixed(1)}%)`);

  // Show some examples of linkable records
  console.log('\n🔍 EXAMPLES OF LINKABLE RECORDS:');
  console.log('=================================');
  
  let examplesShown = 0;
  for (const record of allOrphaned.slice(0, 10)) {
    const matches = await findPotentialMatches(record);
    const hasPersonMatch = matches.personByEmail || matches.personByName;
    const hasCompanyMatch = matches.companyByName;
    
    if (hasPersonMatch || hasCompanyMatch) {
      examplesShown++;
      const name = record.fullName || record.name || `${record.firstName} ${record.lastName}`;
      const email = record.email || record.workEmail || 'No email';
      const company = record.company || record.name || 'No company';
      
      console.log(`\n${examplesShown}. ${record.type.toUpperCase()}: ${name}`);
      console.log(`   Email: ${email}`);
      console.log(`   Company: ${company}`);
      
      if (matches.personByEmail) {
        console.log(`   ✅ Person match: ${matches.personByEmail.fullName} (${matches.personByEmail.email})`);
      } else if (matches.personByName) {
        console.log(`   ✅ Person match: ${matches.personByName.fullName} (${matches.personByName.email})`);
      }
      
      if (matches.companyByName) {
        console.log(`   ✅ Company match: ${matches.companyByName.name}`);
      }
    }
  }

  await prisma.$disconnect();
}

quickAuditOrphaned().catch(console.error);
