const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function validateDashboardData() {
  try {
    console.log('🔍 COMPREHENSIVE DASHBOARD DATA VALIDATION');
    console.log('==========================================');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Calculate date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    console.log('Date ranges:');
    console.log(`This week: ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}`);
    console.log('');
    
    // Test the actual dashboard API
    console.log('📊 TESTING DASHBOARD API:');
    console.log('=========================');
    
    const dashboardResponse = await fetch(`http://localhost:3000/api/pipeline/dashboard?workspaceId=${workspaceId}&userId=${userId}`);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API Response:');
      console.log(JSON.stringify(dashboardData, null, 2));
    } else {
      console.log('❌ Dashboard API Error:', dashboardResponse.status, await dashboardResponse.text());
    }
    
    console.log('\n📊 VALIDATING EACH DASHBOARD METRIC:');
    console.log('====================================');
    
    // 1. Calls Made
    console.log('\n📞 CALLS MADE:');
    console.log('==============');
    
    const callsThisWeek = await prisma.activities.count({
      where: {
        workspaceId,
        userId: userId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        OR: [
          { type: { contains: 'call', mode: 'insensitive' } },
          { subject: { contains: 'call', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`Calls this week: ${callsThisWeek}`);
    
    // 2. Emails Sent
    console.log('\n📧 EMAILS SENT:');
    console.log('===============');
    
    // Get user's email account
    const userEmailAccount = await prisma.email_accounts.findFirst({
      where: {
        workspaceId,
        userId: userId,
        platform: 'outlook'
      }
    }) || await prisma.email_accounts.findFirst({
      where: {
        workspaceId,
        userId: userId,
        email: {
          contains: '@retail-products.com'
        }
      }
    });
    
    console.log('User email account:', userEmailAccount ? {
      id: userEmailAccount.id,
      email: userEmailAccount.email,
      platform: userEmailAccount.platform
    } : 'NOT FOUND');
    
    const emailsThisWeek = userEmailAccount ? await prisma.email_messages.count({
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
    }) : 0;
    
    console.log(`Emails sent this week: ${emailsThisWeek}`);
    
    // 3. Meetings Scheduled
    console.log('\n📅 MEETINGS SCHEDULED:');
    console.log('======================');
    
    const meetingsThisWeek = await prisma.events.count({
      where: {
        workspaceId,
        userId: userId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });
    
    console.log(`Meetings this week: ${meetingsThisWeek}`);
    
    // Check for meetings with wrong user ID
    const meetingsWithWrongUserId = await prisma.events.count({
      where: {
        workspaceId,
        userId: workspaceId, // Wrong - using workspace ID as user ID
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });
    
    console.log(`Meetings with wrong user ID (workspace ID): ${meetingsWithWrongUserId}`);
    
    // 4. Total Pipeline Value
    console.log('\n💰 TOTAL PIPELINE VALUE:');
    console.log('========================');
    
    const totalPipelineValue = await prisma.opportunities.aggregate({
      where: {
        workspaceId,
        deletedAt: null,
        stage: {
          notIn: ['closed_won', 'closed_lost']
        }
      },
      _sum: {
        amount: true
      }
    });
    
    console.log(`Total pipeline value: $${(totalPipelineValue._sum.amount || 0).toLocaleString()}`);
    
    // 5. Total Leads Count
    console.log('\n👥 TOTAL LEADS COUNT:');
    console.log('=====================');
    
    const totalLeadsCount = await prisma.leads.count({
      where: {
        workspaceId,
        deletedAt: null
      }
    });
    
    console.log(`Total leads count: ${totalLeadsCount}`);
    
    // 6. Open Opportunities Count
    console.log('\n🎯 OPEN OPPORTUNITIES COUNT:');
    console.log('============================');
    
    const openOpportunitiesCount = await prisma.opportunities.count({
      where: {
        workspaceId,
        deletedAt: null,
        stage: {
          notIn: ['closed_won', 'closed_lost']
        }
      }
    });
    
    console.log(`Open opportunities count: ${openOpportunitiesCount}`);
    
    // 7. Lead Conversion Rate
    console.log('\n📈 LEAD CONVERSION RATE:');
    console.log('========================');
    
    const totalOpportunities = await prisma.opportunities.count({
      where: {
        workspaceId,
        deletedAt: null
      }
    });
    
    const leadConversionRate = totalLeadsCount > 0 ? (totalOpportunities / totalLeadsCount) * 100 : 0;
    console.log(`Lead conversion rate: ${leadConversionRate.toFixed(1)}%`);
    
    // 8. Weekly Revenue
    console.log('\n💵 WEEKLY REVENUE:');
    console.log('==================');
    
    const weeklyRevenue = await prisma.opportunities.aggregate({
      where: {
        workspaceId,
        deletedAt: null,
        stage: 'closed_won',
        actualCloseDate: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      _sum: {
        amount: true
      }
    });
    
    console.log(`Weekly revenue: $${(weeklyRevenue._sum.amount || 0).toLocaleString()}`);
    
    // 9. Average Deal Size
    console.log('\n📊 AVERAGE DEAL SIZE:');
    console.log('=====================');
    
    const avgDealSize = await prisma.opportunities.aggregate({
      where: {
        workspaceId,
        deletedAt: null,
        stage: 'closed_won',
        actualCloseDate: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      },
      _avg: {
        amount: true
      }
    });
    
    console.log(`Average deal size this week: $${(avgDealSize._avg.amount || 0).toLocaleString()}`);
    
    // 10. Team Performance
    console.log('\n👥 TEAM PERFORMANCE:');
    console.log('====================');
    
    const teamCallsTotal = await prisma.activities.count({
      where: {
        workspaceId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        OR: [
          { type: { contains: 'call', mode: 'insensitive' } },
          { subject: { contains: 'call', mode: 'insensitive' } }
        ]
      }
    });
    
    const teamMeetingsTotal = await prisma.events.count({
      where: {
        workspaceId,
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });
    
    console.log(`Team calls total: ${teamCallsTotal}`);
    console.log(`Team meetings total: ${teamMeetingsTotal}`);
    
    // Summary
    console.log('\n🎯 DASHBOARD VALIDATION SUMMARY:');
    console.log('=================================');
    console.log(`📞 Calls Made: ${callsThisWeek}`);
    console.log(`📧 Emails Sent: ${emailsThisWeek}`);
    console.log(`📅 Meetings Scheduled: ${meetingsThisWeek} (${meetingsWithWrongUserId} with wrong user ID)`);
    console.log(`💰 Total Pipeline Value: $${(totalPipelineValue._sum.amount || 0).toLocaleString()}`);
    console.log(`👥 Total Leads Count: ${totalLeadsCount}`);
    console.log(`🎯 Open Opportunities Count: ${openOpportunitiesCount}`);
    console.log(`📈 Lead Conversion Rate: ${leadConversionRate.toFixed(1)}%`);
    console.log(`💵 Weekly Revenue: $${(weeklyRevenue._sum.amount || 0).toLocaleString()}`);
    console.log(`📊 Average Deal Size: $${(avgDealSize._avg.amount || 0).toLocaleString()}`);
    console.log(`👥 Team Calls Total: ${teamCallsTotal}`);
    console.log(`👥 Team Meetings Total: ${teamMeetingsTotal}`);
    
    // Issues found
    console.log('\n🚨 ISSUES FOUND:');
    console.log('================');
    
    if (meetingsWithWrongUserId > 0) {
      console.log(`❌ ${meetingsWithWrongUserId} meetings have wrong user ID (using workspace ID instead of user ID)`);
    }
    
    if (!userEmailAccount) {
      console.log('❌ No email account found for user');
    }
    
    if (callsThisWeek === 0 && teamCallsTotal > 0) {
      console.log('❌ User has 0 calls but team has calls - possible user ID mismatch');
    }
    
    if (meetingsThisWeek === 0 && meetingsWithWrongUserId > 0) {
      console.log('❌ User has 0 meetings but meetings exist with wrong user ID');
    }
    
  } catch (error) {
    console.error('❌ Error validating dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateDashboardData();
