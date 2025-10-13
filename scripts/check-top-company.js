const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTopCompany() {
  try {
    const workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK';
    
    const company = await prisma.companies.findFirst({
      where: {
        workspaceId: workspaceId,
        OR: [
          { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
          { name: { contains: 'TOP Engineers', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        description: true,
        businessChallenges: true,
        businessPriorities: true,
        competitiveAdvantages: true,
        growthOpportunities: true,
        marketPosition: true,
        strategicInitiatives: true,
        successMetrics: true
      }
    });

    console.log(JSON.stringify(company, null, 2));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTopCompany();

