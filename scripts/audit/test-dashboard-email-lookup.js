const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardEmailLookup() {
  try {
    console.log('🔍 TESTING DASHBOARD EMAIL LOOKUP');
    console.log('==================================');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    console.log('Parameters:', { workspaceId, userId });
    
    // Test the exact query from the dashboard API
    const userEmailAccount = await prisma.email_accounts.findFirst({
      where: {
        workspaceId,
        userId: userId
      }
    });
    
    console.log('Email account found:', !!userEmailAccount);
    if (userEmailAccount) {
      console.log('Account details:', {
        id: userEmailAccount.id,
        email: userEmailAccount.email,
        platform: userEmailAccount.platform,
        isActive: userEmailAccount.isActive
      });
    }
    
    // Check all email accounts for this workspace
    const allWorkspaceAccounts = await prisma.email_accounts.findMany({
      where: { workspaceId },
      select: {
        id: true,
        userId: true,
        email: true,
        platform: true,
        isActive: true
      }
    });
    
    console.log('\nAll email accounts in workspace:');
    allWorkspaceAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.email} - User: ${account.userId} - Active: ${account.isActive}`);
    });
    
    // Test email count if account found
    if (userEmailAccount) {
      const now = new Date();
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay();
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      console.log('\nTesting email count for this week:');
      console.log('Week range:', startOfWeek.toISOString(), 'to', endOfWeek.toISOString());
      
      const thisWeekEmails = await prisma.email_messages.count({
        where: {
          accountId: userEmailAccount.id,
          from: {
            contains: userEmailAccount.email
          },
          createdAt: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        }
      });
      
      console.log('This week emails from user:', thisWeekEmails);
      
      // Also check total emails from this account
      const totalEmails = await prisma.email_messages.count({
        where: {
          accountId: userEmailAccount.id,
          from: {
            contains: userEmailAccount.email
          }
        }
      });
      
      console.log('Total emails from user:', totalEmails);
    }
    
    // Test calendar events
    console.log('\nTesting calendar events:');
    const thisWeekEvents = await prisma.events.count({
      where: {
        workspaceId,
        userId: userId,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date()
        }
      }
    });
    
    console.log('This week calendar events:', thisWeekEvents);
    
  } catch (error) {
    console.error('❌ Error testing dashboard email lookup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardEmailLookup();
