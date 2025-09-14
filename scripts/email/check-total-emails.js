const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTotalEmails() {
  try {
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    const account = await prisma.email_accounts.findFirst({
      where: { workspaceId: workspaceId, platform: 'outlook' },
      select: { id: true }
    });
    
    if (!account) return;
    
    const totalEmails = await prisma.email_messages.count({
      where: { accountId: account.id }
    });
    
    console.log('📊 Total emails now in database:', totalEmails);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTotalEmails();
