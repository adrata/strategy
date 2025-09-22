const { PrismaClient } = require('@prisma/client');

async function create5BarsPeopleRecords() {
  const prisma = new PrismaClient();
  const companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
  const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
  
  try {
    console.log('👥 CREATING 5BARS SERVICES PEOPLE RECORDS');
    console.log('==========================================');
    
    // Check if company exists
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { name: true }
    });

    if (!company) {
      console.log('❌ Company not found');
      return;
    }

    console.log(`📋 Company: ${company.name}`);

    // CoreSignal people data - create real people records
    const coresignalPeople = [
      {
        firstName: 'John',
        lastName: 'Delisi',
        fullName: 'John Delisi',
        title: 'Chief Executive Officer',
        email: 'john.delisi@5bars.net',
        department: 'Executive',
        companyId: companyId,
        workspaceId: workspaceId,
        tags: ['External Data Source', 'Executive', 'Decision Maker'],
        customFields: {
          coresignalId: 770302196,
          buyerGroupRole: 'Decision Maker',
          influenceLevel: 'High',
          engagementPriority: 'High',
          dataSource: 'External',
          painPoints: [
            'Company growth and scalability challenges',
            'Resource allocation and capacity planning',
            'Market expansion and competitive positioning',
            'Operational efficiency and cost management'
          ],
          valueProps: [
            'Strategic engineering talent acquisition',
            'Scalable project management solutions',
            'Technology modernization consulting',
            'Market expansion support'
          ]
        }
      },
      {
        firstName: 'Dustin',
        lastName: 'Stephens',
        fullName: 'Dustin Stephens',
        title: 'Project Director',
        email: 'dustin.stephens@5bars.net',
        department: 'Operations',
        companyId: companyId,
        workspaceId: workspaceId,
        tags: ['External Data Source', 'Operations', 'Champion'],
        customFields: {
          coresignalId: 447442560,
          buyerGroupRole: 'Champion',
          influenceLevel: 'High',
          engagementPriority: 'High',
          dataSource: 'External',
          painPoints: [
            'Project delivery and timeline management',
            'Resource coordination across multiple locations',
            'Quality control and safety compliance',
            'Technology integration and efficiency'
          ],
          valueProps: [
            'Project management expertise and tools',
            'Quality assurance and safety programs',
            'Technology consulting and implementation',
            'Process optimization and efficiency gains'
          ]
        }
      }
    ];

    console.log(`👥 Creating ${coresignalPeople.length} people records...`);

    const createdPeople = [];

    // Create each person record
    for (const personData of coresignalPeople) {
      try {
        // Check if person already exists
        const existingPerson = await prisma.people.findFirst({
          where: {
            fullName: personData.fullName,
            companyId: companyId
          }
        });

        if (existingPerson) {
          console.log(`   ⚠️ Person already exists: ${personData.fullName} (ID: ${existingPerson.id})`);
          createdPeople.push(existingPerson);
          continue;
        }

        const person = await prisma.people.create({
          data: personData
        });
        console.log(`   ✅ Created: ${person.fullName} (ID: ${person.id})`);
        createdPeople.push(person);
      } catch (error) {
        console.error(`   ❌ Error creating ${personData.fullName}:`, error.message);
      }
    }

    // Get final count
    const peopleCount = await prisma.people.count({
      where: { companyId: companyId }
    });

    console.log(`\n📊 SUMMARY`);
    console.log(`===========`);
    console.log(`👥 Total people in database for ${company.name}: ${peopleCount}`);
    console.log(`🆔 Created/Found people records:`);
    
    createdPeople.forEach(person => {
      console.log(`   - ${person.fullName} (${person.title}) - ID: ${person.id}`);
    });

    // Update company with buyer group analysis
    const buyerGroupAnalysis = {
      totalMembers: createdPeople.length,
      decisionMakers: createdPeople.filter(p => p.customFields?.buyerGroupRole === 'Decision Maker').length,
      champions: createdPeople.filter(p => p.customFields?.buyerGroupRole === 'Champion').length,
      influencers: createdPeople.filter(p => p.customFields?.buyerGroupRole === 'Influencer').length,
      primaryContact: {
        name: 'John Delisi',
        role: 'Decision Maker',
        reason: 'CEO with highest influence',
        engagementApproach: 'Executive-level strategic discussions'
      },
      engagementStrategy: {
        sequence: [
          {
            step: 1,
            person: 'John Delisi',
            role: 'Decision Maker',
            approach: 'Executive-level strategic discussions',
            timeline: '1-2 weeks'
          },
          {
            step: 2,
            person: 'Dustin Stephens',
            role: 'Champion',
            approach: 'Technical solution discussions',
            timeline: '2-3 weeks'
          }
        ]
      },
      analysisDate: new Date().toISOString()
    };

    const currentCompany = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { customFields: true }
    });

    const updatedCustomFields = {
      ...currentCompany?.customFields,
      buyerGroupAnalysis: buyerGroupAnalysis
    };

    await prisma.companies.update({
      where: { id: companyId },
      data: {
        customFields: updatedCustomFields,
        updatedAt: new Date()
      }
    });

    console.log('   ✅ Updated company with buyer group analysis');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

create5BarsPeopleRecords();
