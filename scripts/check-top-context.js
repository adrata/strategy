const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTopContext() {
  try {
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'TOP', mode: 'insensitive' } },
          { name: { contains: 'Engineering', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        businessModel: true,
        industry: true,
        serviceOfferings: true,
        productPortfolio: true,
        valuePropositions: true,
        targetIndustries: true,
        targetCompanySize: true,
        idealCustomerProfile: true,
        competitiveAdvantages: true,
        salesMethodology: true
      }
    });

    console.log(JSON.stringify(workspace, null, 2));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTopContext();

