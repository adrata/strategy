/**
 * 🎯 ASSIGN DEMO RECORDS TO SELLERS
 * Assigns existing demo records to Kirk and David
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function assignDemoRecords() {
  try {
    console.log('🚀 Assigning demo records to sellers...');

    const DEMO_WORKSPACE_ID = 'demo-workspace-2025';

    // Get Kirk and David user IDs
    const kirkUser = await prisma.users.findFirst({
      where: { email: 'demo@winning-variant.com' }
    });

    const davidUser = await prisma.users.findFirst({
      where: { email: 'david@winning-variant.com' }
    });

    if (!kirkUser || !davidUser) {
      console.error('❌ Kirk or David user not found');
      return;
    }

    console.log('👤 Kirk user ID:', kirkUser.id);
    console.log('👤 David user ID:', davidUser.id);

    // Get existing companies in demo workspace
    const companies = await prisma.companies.findMany({
      where: { workspaceId: DEMO_WORKSPACE_ID }
    });

    console.log('🏢 Found companies:', companies.map(c => c.name));

    // Assign companies to sellers
    // Kirk gets 2 companies (Brex and First Premier Bank)
    // David gets 1 company (Match Group)
    const brexCompany = companies.find(c => c.name.includes('Brex'));
    const firstPremierCompany = companies.find(c => c.name.includes('First Premier'));
    const matchCompany = companies.find(c => c.name.includes('Match'));

    if (brexCompany) {
      await prisma.companies.update({
        where: { id: brexCompany.id },
        data: { assignedUserId: kirkUser.id }
      });
      console.log('✅ Assigned Brex to Kirk');
    }

    if (firstPremierCompany) {
      await prisma.companies.update({
        where: { id: firstPremierCompany.id },
        data: { assignedUserId: kirkUser.id }
      });
      console.log('✅ Assigned First Premier Bank to Kirk');
    }

    if (matchCompany) {
      await prisma.companies.update({
        where: { id: matchCompany.id },
        data: { assignedUserId: davidUser.id }
      });
      console.log('✅ Assigned Match Group to David');
    }

    // Get existing prospects in demo workspace
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: DEMO_WORKSPACE_ID }
    });

    console.log('👥 Found prospects:', prospects.length);

    // Assign prospects based on their company
    for (const prospect of prospects) {
      if (prospect.company && prospect.company.includes('Brex')) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { assignedUserId: kirkUser.id }
        });
        console.log(`✅ Assigned ${prospect.fullName} (Brex) to Kirk`);
      } else if (prospect.company && prospect.company.includes('First Premier')) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { assignedUserId: kirkUser.id }
        });
        console.log(`✅ Assigned ${prospect.fullName} (First Premier) to Kirk`);
      } else if (prospect.company && prospect.company.includes('Match')) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { assignedUserId: davidUser.id }
        });
        console.log(`✅ Assigned ${prospect.fullName} (Match) to David`);
      }
    }

    // Get existing leads in demo workspace
    const leads = await prisma.leads.findMany({
      where: { workspaceId: DEMO_WORKSPACE_ID }
    });

    console.log('🎯 Found leads:', leads.length);

    // Assign leads based on their company
    for (const lead of leads) {
      if (lead.company && lead.company.includes('Brex')) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { assignedUserId: kirkUser.id }
        });
        console.log(`✅ Assigned ${lead.fullName} (Brex) to Kirk`);
      } else if (lead.company && lead.company.includes('First Premier')) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { assignedUserId: kirkUser.id }
        });
        console.log(`✅ Assigned ${lead.fullName} (First Premier) to Kirk`);
      } else if (lead.company && lead.company.includes('Match')) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { assignedUserId: davidUser.id }
        });
        console.log(`✅ Assigned ${lead.fullName} (Match) to David`);
      }
    }

    // Get existing opportunities in demo workspace
    const opportunities = await prisma.opportunities.findMany({
      where: { workspaceId: DEMO_WORKSPACE_ID }
    });

    console.log('💰 Found opportunities:', opportunities.length);

    // Assign opportunities based on their company
    for (const opportunity of opportunities) {
      if (opportunity.company && opportunity.company.includes('Brex')) {
        await prisma.opportunities.update({
          where: { id: opportunity.id },
          data: { assignedUserId: kirkUser.id }
        });
        console.log(`✅ Assigned ${opportunity.name} (Brex) to Kirk`);
      } else if (opportunity.company && opportunity.company.includes('First Premier')) {
        await prisma.opportunities.update({
          where: { id: opportunity.id },
          data: { assignedUserId: kirkUser.id }
        });
        console.log(`✅ Assigned ${opportunity.name} (First Premier) to Kirk`);
      } else if (opportunity.company && opportunity.company.includes('Match')) {
        await prisma.opportunities.update({
          where: { id: opportunity.id },
          data: { assignedUserId: davidUser.id }
        });
        console.log(`✅ Assigned ${opportunity.name} (Match) to David`);
      }
    }

    console.log('🎉 Demo records assignment finished!');
    console.log('');
    console.log('Summary:');
    console.log('- Kirk assigned: Brex + First Premier Bank (2 companies)');
    console.log('- David assigned: Match Group (1 company)');
    console.log('- All prospects, leads, and opportunities assigned based on company');
    console.log('');
    console.log('Sellers can now see their assigned records!');

  } catch (error) {
    console.error('❌ Error assigning demo records:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the assignment
assignDemoRecords()
  .then(() => {
    console.log('✅ Assignment completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Assignment failed:', error);
    process.exit(1);
  });
