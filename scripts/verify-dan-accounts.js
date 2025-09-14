const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDanAccounts() {
  try {
    console.log('🔍 Verifying Dan\'s actual accounts vs lead companies...');
    
    const danWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const danUserId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Get Dan's actual accounts
    const danAccounts = await prisma.account.findMany({
      where: {
        workspaceId: danWorkspaceId,
        assignedUserId: danUserId
      },
      select: {
        name: true,
        industry: true,
        description: true,
        website: true,
        employees: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`🏢 Dan's actual accounts (${danAccounts.length}):`);
    danAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name} - ${account.industry || 'No industry'} - ${account.employees || 'Unknown'} employees`);
    });
    
    // Get lead companies to compare
    const leadCompanies = await prisma.lead.groupBy({
      by: ['company'],
      where: {
        workspaceId: danWorkspaceId,
        company: { not: null },
        company: { not: 'Unknown Company' }
      },
      _count: {
        company: true
      },
      orderBy: {
        _count: {
          company: 'desc'
        }
      },
      take: 30
    });
    
    console.log(`\n📋 Lead companies (${leadCompanies.length}):`);
    leadCompanies.forEach((stat, index) => {
      const hasMatchingAccount = danAccounts.some(acc => 
        acc.name.toLowerCase().includes(stat.company.toLowerCase()) ||
        stat.company.toLowerCase().includes(acc.name.toLowerCase())
      );
      const indicator = hasMatchingAccount ? '✅' : '❓';
      console.log(`${indicator} ${index + 1}. ${stat.company}: ${stat._count.company} leads`);
    });
    
    // Check for suspicious patterns
    console.log('\n🚨 Checking for suspicious data patterns...');
    
    const suspiciousLeads = await prisma.lead.findMany({
      where: {
        workspaceId: danWorkspaceId,
        OR: [
          // Check for leads created in bulk (same day, similar patterns)
          {
            AND: [
              { createdAt: { gte: new Date('2025-01-01') } },
              { email: { contains: '.com' } },
              { title: { contains: 'VP' } }
            ]
          }
        ]
      },
      select: {
        fullName: true,
        company: true,
        title: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    
    console.log(`⚠️  Recently created VP-level leads (potential generated data): ${suspiciousLeads.length}`);
    suspiciousLeads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - ${lead.company} - ${lead.title} - ${lead.createdAt.toISOString().split('T')[0]}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDanAccounts();
