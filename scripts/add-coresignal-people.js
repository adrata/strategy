const { PrismaClient } = require('@prisma/client');

async function addCoreSignalPeople() {
  const prisma = new PrismaClient();
  const companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
  
  try {
    console.log('👥 ADDING CORESIGNAL PEOPLE TO 5BARS SERVICES');
    console.log('=============================================');
    
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

    // CoreSignal people data
    const coresignalPeople = [
      {
        firstName: 'John',
        lastName: 'Delisi',
        fullName: 'John Delisi',
        title: 'Chief Executive Officer',
        email: 'john.delisi@5bars.net',
        department: 'Executive',
        companyId: companyId,
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
        tags: ['CoreSignal', 'Executive', 'Decision Maker'],
        customFields: {
          coresignalId: 770302196,
          buyerGroupRole: 'Decision Maker',
          influenceLevel: 'High',
          engagementPriority: 'High',
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
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
        tags: ['CoreSignal', 'Operations', 'Champion'],
        customFields: {
          coresignalId: 447442560,
          buyerGroupRole: 'Champion',
          influenceLevel: 'High',
          engagementPriority: 'High',
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

    console.log(`👥 Adding ${coresignalPeople.length} people from CoreSignal data...`);

    // Add each person to the database
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
          console.log(`   ⚠️ Person already exists: ${personData.fullName}`);
          continue;
        }

        const person = await prisma.people.create({
          data: personData
        });
        console.log(`   ✅ Added: ${person.fullName} (${person.title})`);
      } catch (error) {
        console.error(`   ❌ Error adding ${personData.fullName}:`, error.message);
      }
    }

    // Get final count
    const peopleCount = await prisma.people.count({
      where: { companyId: companyId }
    });

    console.log(`\n📊 SUMMARY`);
    console.log(`===========`);
    console.log(`👥 Total people in database for ${company.name}: ${peopleCount}`);

    // List all people for this company
    const allPeople = await prisma.people.findMany({
      where: { companyId: companyId },
      select: {
        fullName: true,
        title: true,
        email: true,
        customFields: true
      }
    });

    if (allPeople.length > 0) {
      console.log('\n👥 All people for this company:');
      allPeople.forEach(person => {
        console.log(`   - ${person.fullName} (${person.title})`);
        console.log(`     Email: ${person.email}`);
        console.log(`     Buyer Group Role: ${person.customFields?.buyerGroupRole || 'Not assigned'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addCoreSignalPeople();
