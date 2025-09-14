const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function smartPipelineLinking() {
  console.log('🚀 SMART PIPELINE DATA LINKING');
  console.log('===============================');
  console.log('Pipeline Flow: Prospects → Leads → Opportunities → Customers');
  console.log('Customers can have multiple Opportunities (upsells/renewals)');
  console.log('Core Records: People & Companies\n');
  
  let stats = {
    peopleCreated: 0,
    companiesCreated: 0,
    leadsLinked: 0,
    prospectsLinked: 0,
    opportunitiesLinked: 0,
    customersLinked: 0,
    customerOpportunitiesLinked: 0,
    errors: 0
  };

  try {
    // STEP 1: Create core PEOPLE records from all leads and prospects
    console.log('👥 STEP 1: Creating core PEOPLE records...');
    
    const allLeads = await prisma.leads.findMany({
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        phone: true,
        workPhone: true,
        jobTitle: true,
        title: true,
        company: true,
        buyerGroupRole: true,
        workspaceId: true,
        assignedUserId: true
      }
    });

    const allProspects = await prisma.prospects.findMany({
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        phone: true,
        workPhone: true,
        jobTitle: true,
        title: true,
        company: true,
        buyerGroupRole: true,
        workspaceId: true,
        assignedUserId: true
      }
    });

    // Combine and deduplicate by email/name
    const allRecords = [...allLeads, ...allProspects];
    const uniquePeople = new Map();

    for (const record of allRecords) {
      const key = record.email || record.workEmail || record.fullName;
      if (key && !uniquePeople.has(key)) {
        uniquePeople.set(key, record);
      }
    }

    console.log(`Found ${uniquePeople.size} unique people to create`);

    // STEP 2: Create core COMPANIES
    console.log('\n🏢 STEP 2: Creating core COMPANIES...');
    
    const companyNames = new Set();
    for (const person of uniquePeople.values()) {
      if (person.company && person.company.trim()) {
        companyNames.add(person.company.trim());
      }
    }

    const companyMap = new Map();
    for (const companyName of companyNames) {
      // Check if company already exists
      let company = await prisma.companies.findFirst({
        where: {
          name: { equals: companyName, mode: 'insensitive' }
        }
      });

      if (!company) {
        // Create new company
        company = await prisma.companies.create({
          data: {
            name: companyName,
            workspaceId: allRecords[0]?.workspaceId, // Use first workspace
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        stats.companiesCreated++;
        console.log(`✅ Created company: ${companyName}`);
      }
      
      companyMap.set(companyName, company.id);
    }

    // STEP 3: Create PEOPLE records with proper company linking
    console.log('\n👤 STEP 3: Creating PEOPLE records...');
    
    const peopleMap = new Map();
    for (const person of uniquePeople.values()) {
      const companyId = person.company ? companyMap.get(person.company) : null;
      
      // Check if person already exists
      let existingPerson = await prisma.people.findFirst({
        where: {
          OR: [
            { email: person.email },
            { workEmail: person.workEmail },
            { fullName: person.fullName }
          ]
        }
      });

      if (!existingPerson) {
        // Create new person
        existingPerson = await prisma.people.create({
          data: {
            firstName: person.firstName,
            lastName: person.lastName,
            fullName: person.fullName,
            email: person.email,
            workEmail: person.workEmail,
            phone: person.phone,
            workPhone: person.workPhone,
            jobTitle: person.jobTitle || person.title,
            role: person.buyerGroupRole,
            companyId: companyId,
            workspaceId: person.workspaceId,
            assignedUserId: person.assignedUserId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        stats.peopleCreated++;
        console.log(`✅ Created person: ${person.fullName} (Company: ${person.company || 'None'})`);
      }
      
      peopleMap.set(person.fullName, existingPerson.id);
    }

    // STEP 4: Link PROSPECTS to people and companies
    console.log('\n🎯 STEP 4: Linking PROSPECTS...');
    
    for (const prospect of allProspects) {
      const personId = peopleMap.get(prospect.fullName);
      const companyId = prospect.company ? companyMap.get(prospect.company) : null;
      
      if (personId) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: {
            personId: personId,
            companyId: companyId
          }
        });
        stats.prospectsLinked++;
        console.log(`✅ Linked prospect: ${prospect.fullName}`);
      }
    }

    // STEP 5: Link LEADS to people and companies
    console.log('\n🔥 STEP 5: Linking LEADS...');
    
    for (const lead of allLeads) {
      const personId = peopleMap.get(lead.fullName);
      const companyId = lead.company ? companyMap.get(lead.company) : null;
      
      if (personId) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: {
            personId: personId,
            companyId: companyId
          }
        });
        stats.leadsLinked++;
        console.log(`✅ Linked lead: ${lead.fullName}`);
      }
    }

    // STEP 6: Link OPPORTUNITIES through leads
    console.log('\n💰 STEP 6: Linking OPPORTUNITIES...');
    
    const opportunities = await prisma.opportunities.findMany({
      select: {
        id: true,
        name: true,
        leadId: true,
        workspaceId: true
      }
    });

    for (const opportunity of opportunities) {
      if (opportunity.leadId) {
        // Find the lead to get personId and companyId
        const lead = await prisma.leads.findUnique({
          where: { id: opportunity.leadId },
          select: { personId: true, companyId: true }
        });
        
        if (lead && (lead.personId || lead.companyId)) {
          await prisma.opportunities.update({
            where: { id: opportunity.id },
            data: {
              personId: lead.personId,
              companyId: lead.companyId
            }
          });
          stats.opportunitiesLinked++;
          console.log(`✅ Linked opportunity: ${opportunity.name} via lead`);
        }
      }
    }

    // FINAL STATS
    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('======================');
    console.log(`👥 People created: ${stats.peopleCreated}`);
    console.log(`🏢 Companies created: ${stats.companiesCreated}`);
    console.log(`🎯 Prospects linked: ${stats.prospectsLinked}`);
    console.log(`🔥 Leads linked: ${stats.leadsLinked}`);
    console.log(`💰 Opportunities linked: ${stats.opportunitiesLinked}`);
    console.log(`❌ Errors: ${stats.errors}`);

    // Verify the data structure
    console.log('\n🔍 VERIFICATION:');
    const peopleCount = await prisma.people.count();
    const companiesCount = await prisma.companies.count();
    const leadsWithPeople = await prisma.leads.count({ where: { personId: { not: null } } });
    const prospectsWithPeople = await prisma.prospects.count({ where: { personId: { not: null } } });
    const opportunitiesWithPeople = await prisma.opportunities.count({ where: { personId: { not: null } } });

    console.log(`📊 Total people: ${peopleCount}`);
    console.log(`📊 Total companies: ${companiesCount}`);
    console.log(`📊 Leads with people: ${leadsWithPeople}`);
    console.log(`📊 Prospects with people: ${prospectsWithPeople}`);
    console.log(`📊 Opportunities with people: ${opportunitiesWithPeople}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    stats.errors++;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
smartPipelineLinking().catch(console.error);
