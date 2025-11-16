const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '01K9QD3RTJNEZFWAGJS701PQ2V';
  
  console.log('Checking people for company:', companyId);
  
  // Check all people for this company
  const allPeople = await prisma.people.findMany({
    where: {
      companyId: companyId,
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      jobTitle: true,
      buyerGroupRole: true,
      isBuyerGroupMember: true,
      workspaceId: true
    }
  });
  
  console.log(`\nFound ${allPeople.length} total people for this company\n`);
  
  console.log('All people:');
  allPeople.forEach((p, i) => {
    console.log(`${i + 1}. ${p.fullName}`);
    console.log(`   Job Title: ${p.jobTitle || 'N/A'}`);
    console.log(`   Email: ${p.email || 'N/A'}`);
    console.log(`   buyerGroupRole: ${p.buyerGroupRole || 'null'}`);
    console.log(`   isBuyerGroupMember: ${p.isBuyerGroupMember}`);
    console.log('');
  });
  
  const bgMembers = allPeople.filter(p => p.isBuyerGroupMember || p.buyerGroupRole);
  console.log(`\n${bgMembers.length} are marked as buyer group members`);
  
  // Check BuyerGroupMembers table
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, workspaceId: true }
  });
  
  if (company) {
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: {
        companyId: companyId,
        workspaceId: company.workspaceId
      },
      include: {
        BuyerGroupMembers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true
          }
        }
      }
    });
    
    console.log(`\nFound ${buyerGroups.length} buyer groups in BuyerGroups table`);
    buyerGroups.forEach((bg, i) => {
      console.log(`\nBuyer Group ${i + 1}: ${bg.id}`);
      console.log(`Members: ${bg.BuyerGroupMembers.length}`);
      bg.BuyerGroupMembers.forEach((m, j) => {
        console.log(`  ${j + 1}. ${m.name} (${m.title || 'N/A'}): role=${m.role}`);
      });
    });
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);

