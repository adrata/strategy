const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugEmailAccounts() {
  try {
    console.log('🔍 DEBUGGING EMAIL ACCOUNTS');
    console.log('===========================');
    
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const danoUserId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Check all email accounts
    console.log('\n📧 ALL EMAIL ACCOUNTS:');
    console.log('======================');
    
    const allEmailAccounts = await prisma.email_accounts.findMany({
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        email: true,
        platform: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log(`Total email accounts: ${allEmailAccounts.length}`);
    allEmailAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.email} (${account.platform})`);
      console.log(`   Workspace: ${account.workspaceId}`);
      console.log(`   User: ${account.userId}`);
      console.log(`   Active: ${account.isActive}`);
      console.log(`   Created: ${account.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Check specifically for Dano's workspace
    console.log('\n🎯 DANO WORKSPACE EMAIL ACCOUNTS:');
    console.log('=================================');
    
    const danoWorkspaceAccounts = await prisma.email_accounts.findMany({
      where: { workspaceId: danoWorkspaceId },
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        email: true,
        platform: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log(`Email accounts in Dano's workspace: ${danoWorkspaceAccounts.length}`);
    danoWorkspaceAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.email} (${account.platform})`);
      console.log(`   User: ${account.userId}`);
      console.log(`   Active: ${account.isActive}`);
      console.log('');
    });
    
    // Check for any email messages
    console.log('\n📨 EMAIL MESSAGES ANALYSIS:');
    console.log('===========================');
    
    const totalEmails = await prisma.email_messages.count();
    console.log(`Total email messages in database: ${totalEmails}`);
    
    if (totalEmails > 0) {
      // Get sample email messages
      const sampleEmails = await prisma.email_messages.findMany({
        take: 5,
        select: {
          id: true,
          accountId: true,
          from: true,
          subject: true,
          sentAt: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📋 SAMPLE EMAIL MESSAGES:');
      sampleEmails.forEach((email, index) => {
        console.log(`${index + 1}. From: ${email.from}`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Account ID: ${email.accountId}`);
        console.log(`   Sent: ${email.sentAt.toISOString().split('T')[0]}`);
        console.log(`   Created: ${email.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      });
      
      // Check unique account IDs in email messages
      const uniqueAccountIds = await prisma.email_messages.findMany({
        select: { accountId: true },
        distinct: ['accountId']
      });
      
      console.log(`Unique account IDs in email messages: ${uniqueAccountIds.length}`);
      uniqueAccountIds.forEach((item, index) => {
        console.log(`${index + 1}. Account ID: ${item.accountId}`);
      });
    }
    
    // Check if there are any users in Dano's workspace
    console.log('\n👥 USERS IN DANO WORKSPACE:');
    console.log('===========================');
    
    const workspaceUsers = await prisma.users.findMany({
      where: { workspaceId: danoWorkspaceId },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log(`Users in Dano's workspace: ${workspaceUsers.length}`);
    workspaceUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Check activities and notes for phone/call data
    console.log('\n📞 PHONE/CALL DATA IN ACTIVITIES:');
    console.log('=================================');
    
    const callActivities = await prisma.activities.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { title: { contains: 'dial', mode: 'insensitive' } },
          { type: { contains: 'call', mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        userId: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Call-related activities: ${callActivities.length}`);
    callActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.type})`);
      console.log(`   Status: ${activity.status}`);
      console.log(`   User: ${activity.userId}`);
      console.log(`   Created: ${activity.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
    // Check notes for phone/call data
    console.log('\n📝 PHONE/CALL DATA IN NOTES:');
    console.log('============================');
    
    const callNotes = await prisma.notes.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { content: { contains: 'call', mode: 'insensitive' } },
          { content: { contains: 'phone', mode: 'insensitive' } }
        ]
      },
      take: 10,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        userId: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Call-related notes: ${callNotes.length}`);
    callNotes.forEach((note, index) => {
      const preview = note.content ? note.content.substring(0, 100) + '...' : 'No content';
      console.log(`${index + 1}. ${note.title}`);
      console.log(`   Content: ${preview}`);
      console.log(`   User: ${note.userId}`);
      console.log(`   Created: ${note.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error debugging email accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEmailAccounts();
