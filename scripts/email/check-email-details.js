const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmailDetails() {
  try {
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    const account = await prisma.email_accounts.findFirst({
      where: { workspaceId: workspaceId, platform: 'outlook' },
      select: { id: true, lastSyncAt: true }
    });
    
    if (!account) return;
    
    // Get date range of stored emails
    const dateRange = await prisma.email_messages.aggregate({
      where: { accountId: account.id },
      _min: { receivedAt: true },
      _max: { receivedAt: true },
      _count: { receivedAt: true }
    });
    
    console.log('📊 Email Details:');
    console.log('   Total emails:', dateRange._count.receivedAt);
    console.log('   Date range:', dateRange._min.receivedAt?.toDateString(), 'to', dateRange._max.receivedAt?.toDateString());
    console.log('   Last sync filter:', account.lastSyncAt.toDateString());
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailDetails();
