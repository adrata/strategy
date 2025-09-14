const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDanoCompanies() {
  try {
    const companies = await prisma.lead.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { company: true, vertical: true },
      distinct: ['company']
    });
    
    console.log('Companies in Dano\'s workspace:');
    companies.forEach(c => console.log(`- ${c.company}: ${c.vertical}`));
    
    const verticalCounts = companies.reduce((acc, c) => {
      acc[c.vertical] = (acc[c.vertical] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nVertical distribution:');
    Object.entries(verticalCounts).forEach(([v, count]) => console.log(`${v}: ${count} companies`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDanoCompanies();
