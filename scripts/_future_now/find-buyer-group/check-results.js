const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBuyerGroupResults() {
  // Check if buyer group was created
  const buyerGroup = await prisma.buyerGroups.findFirst({
    where: {
      workspaceId: '01K9QAP09FHT6EAP1B4G2KP3D2',
      companyName: { contains: 'Central New Mexico', mode: 'insensitive' }
    },
    include: {
      BuyerGroupMembers: {
        take: 10
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  if (buyerGroup) {
    console.log('Buyer Group Found:');
    console.log(`  ID: ${buyerGroup.id}`);
    console.log(`  Company: ${buyerGroup.companyName}`);
    console.log(`  Members: ${buyerGroup.totalMembers}`);
    console.log('\nMembers:');
    buyerGroup.BuyerGroupMembers.forEach(m => {
      console.log(`  - ${m.name} (${m.title || 'N/A'}) - Role: ${m.role}`);
    });
  } else {
    console.log('No buyer group found in database');
  }
  
  // Check people records
  const people = await prisma.people.findMany({
    where: {
      workspaceId: '01K9QAP09FHT6EAP1B4G2KP3D2',
      companyId: '01K9QD2F4TWKN1P4KE5EXXDZB5',
      isBuyerGroupMember: true,
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      buyerGroupRole: true,
      email: true,
      linkedinUrl: true,
      tags: true
    },
    take: 10
  });
  
  console.log(`\nPeople tagged as buyer group members: ${people.length}`);
  people.forEach(p => {
    console.log(`  - ${p.fullName} (${p.jobTitle || 'N/A'}) - Role: ${p.buyerGroupRole || 'N/A'}`);
    console.log(`    Tags: ${(p.tags || []).join(', ')}`);
  });
  
  await prisma.$disconnect();
}

checkBuyerGroupResults().catch(console.error);

