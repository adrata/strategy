const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalWorkingMigration() {
  console.log('🚀 FINAL WORKING DATA MIGRATION');
  console.log('================================');
  console.log('Implementing CRM best practices with proper schema handling...\n');

  let stats = {
    peopleCreated: 0,
    companiesCreated: 0,
    leadsLinked: 0,
    prospectsLinked: 0,
    opportunitiesLinked: 0,
    clientsCreated: 0,
    errors: 0
  };

  try {
    // STEP 1: Create people and companies from leads and prospects
    console.log('👥 STEP 1: Creating people and companies from existing data...');
    
    // Get all leads and prospects
    const allLeads = await prisma.leads.findMany({
      select: {
        id: true, fullName: true, firstName: true, lastName: true,
        email: true, workEmail: true, phone: true, workPhone: true,
        jobTitle: true, title: true, company: true, workspaceId: true
      }
    });

    const allProspects = await prisma.prospects.findMany({
      select: {
        id: true, fullName: true, firstName: true, lastName: true,
        email: true, workEmail: true, phone: true, workPhone: true,
        jobTitle: true, title: true, company: true, workspaceId: true
      }
    });

    // Combine and deduplicate people
    const allPeopleData = [...allLeads, ...allProspects];
    const uniquePeople = new Map();
    
    for (const person of allPeopleData) {
      const key = `${person.email || person.workEmail || person.fullName}`;
      if (!uniquePeople.has(key)) {
        uniquePeople.set(key, person);
      }
    }

    console.log(`Found ${uniquePeople.size} unique people from ${allLeads.length} leads and ${allProspects.length} prospects`);

    // Create companies first
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
        where: { name: { equals: companyName, mode: 'insensitive' } }
      });

      if (!company) {
        company = await prisma.companies.create({
          data: {
            name: companyName,
            workspaceId: allPeopleData[0]?.workspaceId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        stats.companiesCreated++;
        console.log(`✅ Created company: ${companyName}`);
      }
      companyMap.set(companyName, company.id);
    }

    // Create people with proper company linking
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
            companyId: companyId,
            workspaceId: person.workspaceId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        stats.peopleCreated++;
        console.log(`✅ Created person: ${person.fullName}`);
      }
      peopleMap.set(person.fullName, existingPerson.id);
    }

    // STEP 2: Link leads to people and companies
    console.log('\n🔗 STEP 2: Linking leads to people and companies...');
    
    for (const lead of allLeads) {
      const personId = peopleMap.get(lead.fullName);
      const companyId = lead.company ? companyMap.get(lead.company) : null;
      
      if (personId || companyId) {
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

    // STEP 3: Link prospects to people and companies
    console.log('\n🔗 STEP 3: Linking prospects to people and companies...');
    
    for (const prospect of allProspects) {
      const personId = peopleMap.get(prospect.fullName);
      const companyId = prospect.company ? companyMap.get(prospect.company) : null;
      
      if (personId || companyId) {
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

    // STEP 4: Link opportunities to people and companies
    console.log('\n🔗 STEP 4: Linking opportunities to people and companies...');
    
    const opportunities = await prisma.opportunities.findMany({
      select: {
        id: true, name: true, leadId: true, workspaceId: true
      }
    });

    for (const opp of opportunities) {
      if (opp.leadId) {
        // Get the lead to find person and company
        const lead = await prisma.leads.findUnique({
          where: { id: opp.leadId },
          select: { personId: true, companyId: true }
        });
        
        if (lead) {
          await prisma.opportunities.update({
            where: { id: opp.id },
            data: {
              personId: lead.personId,
              companyId: lead.companyId
            }
          });
          stats.opportunitiesLinked++;
          console.log(`✅ Linked opportunity: ${opp.name}`);
        }
      }
    }

    // STEP 5: Create clients from closed opportunities
    console.log('\n🏆 STEP 5: Creating clients from closed opportunities...');
    
    const closedOpportunities = await prisma.opportunities.findMany({
      where: {
        OR: [
          { stage: { contains: 'Closed Won', mode: 'insensitive' } },
          { stage: { contains: 'Won', mode: 'insensitive' } },
          { actualCloseDate: { not: null } }
        ]
      },
      select: {
        id: true, name: true, personId: true, companyId: true,
        amount: true, actualCloseDate: true, workspaceId: true
      }
    });

    for (const opp of closedOpportunities) {
      if (opp.personId && opp.companyId) {
        // Check if customer already exists (prevent duplicates)
        let customer = await prisma.clients.findFirst({
          where: {
            personId: opp.personId,
            companyId: opp.companyId
          }
        });

        if (!customer) {
          customer = await prisma.clients.create({
            data: {
              id: `customer_${opp.personId}_${opp.companyId}`,
              personId: opp.personId,
              companyId: opp.companyId,
              customerSince: opp.actualCloseDate || new Date(),
              totalLifetimeValue: opp.amount || 0,
              lastDealValue: opp.amount || 0,
              dealCount: 1,
              workspaceId: opp.workspaceId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          stats.clientsCreated++;
          console.log(`✅ Created customer from opportunity: ${opp.name}`);
        } else {
          console.log(`ℹ️ Customer already exists for opportunity: ${opp.name}`);
        }
      }
    }

    // FINAL SUMMARY
    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`📊 STATISTICS:`);
    console.log(`   • People created: ${stats.peopleCreated}`);
    console.log(`   • Companies created: ${stats.companiesCreated}`);
    console.log(`   • Leads linked: ${stats.leadsLinked}`);
    console.log(`   • Prospects linked: ${stats.prospectsLinked}`);
    console.log(`   • Opportunities linked: ${stats.opportunitiesLinked}`);
    console.log(`   • Customers created: ${stats.clientsCreated}`);
    console.log(`   • Errors: ${stats.errors}`);
    
    console.log('\n✅ DATA MODEL NOW FOLLOWS CRM BEST PRACTICES:');
    console.log('   • Core Records: People & Companies (master data)');
    console.log('   • Pipeline Flow: Prospects → Leads → Opportunities → Customers');
    console.log('   • Data Normalization: No duplication, proper foreign keys');
    console.log('   • Customer Opportunities: Customers can have multiple opportunities');

  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    stats.errors++;
  } finally {
    await prisma.$disconnect();
  }
}

finalWorkingMigration();
