const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateDashboardData() {
  try {
    console.log('🔍 INVESTIGATING DASHBOARD DATA DISCREPANCY');
    console.log('==========================================');
    
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const danoUserId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Check email data
    console.log('\n📧 EMAIL DATA ANALYSIS:');
    console.log('=======================');
    
    // First, get Dano's email account ID
    const danoEmailAccount = await prisma.email_accounts.findFirst({
      where: {
        workspaceId: danoWorkspaceId,
        userId: danoUserId
      }
    });
    
    if (!danoEmailAccount) {
      console.log('❌ No email account found for Dano');
      return;
    }
    
    console.log(`Dano's email account ID: ${danoEmailAccount.id}`);
    
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
    
    console.log(`Total emails in workspace: ${totalEmails}`);
    console.log(`Recent emails (last 7 days): ${recentEmails}`);
    console.log(`Emails from Dano: ${emailsFromDano}`);
    console.log(`Recent emails from Dano: ${recentEmailsFromDano}`);
    
    // Check calendar/meeting data
    console.log('\n📅 CALENDAR/MEETING DATA ANALYSIS:');
    console.log('==================================');
    
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
          { title: { contains: 'demo', mode: 'insensitive' } },
          { title: { contains: 'presentation', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`Total calendar events: ${totalEvents}`);
    console.log(`Recent events (last 7 days): ${recentEvents}`);
    console.log(`Meeting-related events: ${meetings}`);
    
    // Check phone/call data in tasks and notes
    console.log('\n📞 PHONE/CALL DATA IN TASKS & NOTES:');
    console.log('====================================');
    
    const callTasks = await prisma.activities.count({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } },
          { title: { contains: 'dial', mode: 'insensitive' } }
        ]
      }
    });
    
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
    
    console.log(`Tasks with call/phone keywords: ${callTasks}`);
    console.log(`Notes with call/phone keywords: ${callNotes}`);
    
    // Sample some call-related data
    const sampleCallTasks = await prisma.activities.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { title: { contains: 'phone', mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        status: true
      }
    });
    
    const sampleCallNotes = await prisma.notes.findMany({
      where: {
        workspaceId: danoWorkspaceId,
        OR: [
          { title: { contains: 'call', mode: 'insensitive' } },
          { content: { contains: 'call', mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true
      }
    });
    
    console.log('\n📋 SAMPLE CALL TASKS:');
    sampleCallTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title} (${task.type}) - ${task.status} - ${task.createdAt.toISOString().split('T')[0]}`);
    });
    
    console.log('\n📝 SAMPLE CALL NOTES:');
    sampleCallNotes.forEach((note, index) => {
      const preview = note.content ? note.content.substring(0, 100) + '...' : 'No content';
      console.log(`${index + 1}. ${note.title} - ${note.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Content: ${preview}`);
    });
    
    // Check dashboard metrics calculation
    console.log('\n📊 DASHBOARD METRICS INVESTIGATION:');
    console.log('===================================');
    
    // Check if there are any dashboard-specific tables or calculations
    const dashboardTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%dashboard%' OR table_name LIKE '%metric%' OR table_name LIKE '%activity%'
    `;
    
    console.log('Dashboard-related tables:', dashboardTables);
    
    // Check recent activity patterns
    const recentActivity = await prisma.activities.findMany({
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
        createdAt: true,
        status: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n🕐 RECENT ACTIVITY (Last 7 days):');
    recentActivity.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title} (${activity.type}) - ${activity.status} - ${activity.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check email linking to see if emails are properly connected
    console.log('\n🔗 EMAIL LINKING STATUS:');
    console.log('========================');
    
    const emailLinks = await prisma.emailToContact.count({
      where: {
        email_messages: {
          accountId: danoEmailAccount.id
        }
      }
    });
    
    const recentEmailLinks = await prisma.emailToContact.count({
      where: {
        email_messages: {
          accountId: danoEmailAccount.id,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }
    });
    
    console.log(`Total email-to-contact links: ${emailLinks}`);
    console.log(`Recent email-to-contact links: ${recentEmailLinks}`);
    
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log(`✅ Total emails: ${totalEmails}`);
    console.log(`✅ Recent emails: ${recentEmails}`);
    console.log(`✅ Emails from Dano: ${emailsFromDano}`);
    console.log(`✅ Recent emails from Dano: ${recentEmailsFromDano}`);
    console.log(`✅ Total calendar events: ${totalEvents}`);
    console.log(`✅ Recent events: ${recentEvents}`);
    console.log(`✅ Meeting events: ${meetings}`);
    console.log(`✅ Call tasks: ${callTasks}`);
    console.log(`✅ Call notes: ${callNotes}`);
    console.log(`✅ Email links: ${emailLinks}`);
    
    if (recentEmailsFromDano > 0 || recentEvents > 0) {
      console.log('\n🚨 ISSUE IDENTIFIED:');
      console.log('Dashboard shows 0 but we have data!');
      console.log('The dashboard metrics calculation may be broken.');
    }
    
  } catch (error) {
    console.error('❌ Error investigating dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateDashboardData();
