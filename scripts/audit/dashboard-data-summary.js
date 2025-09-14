const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function dashboardDataSummary() {
  try {
    console.log('📊 DASHBOARD DATA SUMMARY');
    console.log('=========================');
    
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const danoUserId = '01K1VBYYV7TRPY04NW4TW4XWRB'; // From the email accounts
    
    // Get Dano's email account
    const danoEmailAccount = await prisma.email_accounts.findFirst({
      where: {
        workspaceId: danoWorkspaceId,
        userId: danoUserId,
        email: 'dano@retail-products.com'
      }
    });
    
    if (!danoEmailAccount) {
      console.log('❌ No email account found for Dano');
      return;
    }
    
    console.log(`✅ Dano's email account: ${danoEmailAccount.email} (${danoEmailAccount.platform})`);
    console.log(`   Account ID: ${danoEmailAccount.id}`);
    console.log(`   User ID: ${danoEmailAccount.userId}`);
    console.log('');
    
    // Check email data
    console.log('📧 EMAIL DATA:');
    console.log('==============');
    
    const totalEmails = await prisma.email_messages.count({
      where: { accountId: danoEmailAccount.id }
    });
    
    const recentEmails = await prisma.email_messages.count({
      where: {
        accountId: danoEmailAccount.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    const emailsFromDano = await prisma.email_messages.count({
      where: {
        accountId: danoEmailAccount.id,
        from: {
          contains: 'dano@retail-products.com'
        }
      }
    });
    
    const recentEmailsFromDano = await prisma.email_messages.count({
      where: {
        accountId: danoEmailAccount.id,
        from: {
          contains: 'dano@retail-products.com'
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    console.log(`Total emails: ${totalEmails}`);
    console.log(`Recent emails (last 7 days): ${recentEmails}`);
    console.log(`Emails from Dano: ${emailsFromDano}`);
    console.log(`Recent emails from Dano: ${recentEmailsFromDano}`);
    console.log('');
    
    // Check calendar data
    console.log('📅 CALENDAR DATA:');
    console.log('=================');
    
    const totalEvents = await prisma.events.count({
      where: { workspaceId: danoWorkspaceId }
    });
    
    const recentEvents = await prisma.events.count({
      where: {
        workspaceId: danoWorkspaceId,
        startTime: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    const meetings = await prisma.events.count({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'meeting', mode: 'insensitive' } },
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'demo', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`Total calendar events: ${totalEvents}`);
    console.log(`Recent events (last 7 days): ${recentEvents}`);
    console.log(`Meeting-related events: ${meetings}`);
    console.log('');
    
    // Check phone/call data in activities
    console.log('📞 PHONE/CALL DATA IN ACTIVITIES:');
    console.log('=================================');
    
    const callActivities = await prisma.activities.count({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { type: { contains: 'call', mode: 'insensitive' } }
        ]
      }
    });
    
    const recentCallActivities = await prisma.activities.count({
      where: {
        workspaceId: danoWorkspaceId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { type: { contains: 'call', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`Total call activities: ${callActivities}`);
    console.log(`Recent call activities (last 7 days): ${recentCallActivities}`);
    console.log('');
    
    // Check phone/call data in notes
    console.log('📝 PHONE/CALL DATA IN NOTES:');
    console.log('============================');
    
    const callNotes = await prisma.notes.count({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { content: { contains: 'call', mode: 'insensitive' } },
          { content: { contains: 'phone', mode: 'insensitive' } }
        ]
      }
    });
    
    const recentCallNotes = await prisma.notes.count({
      where: {
        workspaceId: danoWorkspaceId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { content: { contains: 'call', mode: 'insensitive' } },
          { content: { contains: 'phone', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`Total call notes: ${callNotes}`);
    console.log(`Recent call notes (last 7 days): ${recentCallNotes}`);
    console.log('');
    
    // Sample recent activities
    console.log('🕐 RECENT ACTIVITIES (Last 7 days):');
    console.log('===================================');
    
    const recentActivities = await prisma.activities.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Recent activities: ${recentActivities.length}`);
    recentActivities.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.type}) - ${activity.status}`);
      console.log(`   Created: ${activity.createdAt.toISOString().split('T')[0]}`);
    });
    console.log('');
    
    // Sample recent emails from Dano
    console.log('📧 RECENT EMAILS FROM DANO (Last 7 days):');
    console.log('==========================================');
    
    const recentDanoEmails = await prisma.email_messages.findMany({
      where: {
        accountId: danoEmailAccount.id,
        from: {
          contains: 'dano@retail-products.com'
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      select: {
        id: true,
        subject: true,
        sentAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Recent emails from Dano: ${recentDanoEmails.length}`);
    recentDanoEmails.forEach((email, index) => {
      console.log(`${index + 1}. ${email.subject}`);
      console.log(`   Sent: ${email.sentAt.toISOString().split('T')[0]}`);
    });
    console.log('');
    
    // Summary
    console.log('🎯 DASHBOARD DISCREPANCY ANALYSIS:');
    console.log('==================================');
    console.log(`Dashboard shows: 0 emails sent, 0 meetings`);
    console.log(`Actual data: ${recentEmailsFromDano} emails from Dano, ${recentEvents} calendar events`);
    console.log(`Call data: ${recentCallActivities} call activities, ${recentCallNotes} call notes`);
    console.log('');
    
    if (recentEmailsFromDano > 0 || recentEvents > 0) {
      console.log('🚨 ISSUE IDENTIFIED:');
      console.log('The dashboard is not showing the actual processed data!');
      console.log('This suggests the dashboard metrics calculation is broken or');
      console.log('not properly connected to the processed email/calendar data.');
    } else {
      console.log('✅ Dashboard is accurate - no recent activity found.');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

dashboardDataSummary();
