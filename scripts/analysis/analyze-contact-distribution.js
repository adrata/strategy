import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeContactDistribution() {
  console.log('\n🔍 Analyzing Contact Distribution for Dano...');
  const danoWorkspaceId = "01K1VBYV8ETM2RCQA4GNN9EG72";

  try {
    // Get all contacts
    const allContacts = await prisma.contact.count({
      where: { workspaceId: danoWorkspaceId }
    });

    // Get all people
    const allPeople = await prisma.person.count({
      where: { workspaceId: danoWorkspaceId }
    });

    // Get leads 
    const allLeads = await prisma.lead.count({
      where: { workspaceId: danoWorkspaceId }
    });

    // Get prospects
    const allProspects = await prisma.prospect.count({
      where: { workspaceId: danoWorkspaceId }
    });

    console.log('\n📊 OVERALL COUNTS:');
    console.log(`- Contacts: ${allContacts}`);
    console.log(`- People: ${allPeople}`);
    console.log(`- Leads: ${allLeads}`);
    console.log(`- Prospects: ${allProspects}`);

    // Get sample contacts to understand their structure
    const sampleContacts = await prisma.contact.findMany({
      where: { workspaceId: danoWorkspaceId },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        workEmail: true,
        createdAt: true
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n👥 SAMPLE CONTACTS:');
    sampleContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.fullName || 'No Name'}`);
      console.log(`   Title: ${contact.jobTitle || 'No Title'}`);
      console.log(`   Email: ${contact.workEmail || 'No Email'}`);
      console.log('');
    });

    // Contacts don't have status field - they are raw data
    console.log('\n📋 CONTACTS are raw data without status field');

    // Check if there are people that should be leads/prospects
    const peopleWithStatus = await prisma.person.groupBy({
      by: ['status'],
      where: { workspaceId: danoWorkspaceId },
      _count: { _all: true }
    });

    console.log('\n📈 PEOPLE BY STATUS:');
    peopleWithStatus.forEach(group => {
      console.log(`- ${group.status || 'NULL'}: ${group._count._all} people`);
    });

    // Check for response data
    const emailsWithResponses = await prisma.emailMessage.count({
      where: {
        workspaceId: danoWorkspaceId,
        response: { not: null }
      }
    });

    console.log(`\n📧 EMAILS WITH RESPONSES: ${emailsWithResponses}`);

    // Get companies with response status
    const companiesWithResponses = await prisma.$queryRaw`
      SELECT 
        COALESCE(c.company, p.company, 'Unknown Company') as company_name,
        COUNT(*) as contact_count,
        COUNT(CASE WHEN em.response IS NOT NULL THEN 1 END) as responded_count
      FROM "Contact" c
      LEFT JOIN "Person" p ON c.id = p.contactId
      LEFT JOIN "EmailMessage" em ON (em.contactId = c.id OR em.personId = p.id)
      WHERE c."workspaceId" = ${danoWorkspaceId}
      GROUP BY COALESCE(c.company, p.company, 'Unknown Company')
      HAVING COUNT(*) > 0
      ORDER BY contact_count DESC
      LIMIT 20
    `;

    console.log('\n🏢 TOP COMPANIES WITH CONTACT/RESPONSE STATUS:');
    companiesWithResponses.forEach((row, index) => {
      console.log(`${index + 1}. ${row.company_name}: ${row.contact_count} contacts, ${row.responded_count} responded`);
    });

    console.log('\n🎯 ANALYSIS:');
    console.log(`1. Total raw contacts: ${allContacts}`);
    console.log(`2. Processed into People records: ${allPeople}`);
    console.log(`3. Currently in Lead pipeline: ${allLeads}`);
    console.log(`4. Currently in Prospect pipeline: ${allProspects}`);
    console.log(`5. Contacts not processed into People: ${allContacts - allPeople}`);

    if (allContacts - allPeople > 100) {
      console.log('\n⚠️  MAJOR GAP DETECTED:');
      console.log(`   Most contacts (${allContacts - allPeople}) have not been processed into People records`);
      console.log('   People records are what get converted to Leads/Prospects');
      console.log('   Recommendation: Migrate contacts to People, then categorize as leads/prospects based on engagement');
    }

  } catch (error) {
    console.error('❌ Error analyzing contact distribution:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeContactDistribution().catch(console.error);
