#!/usr/bin/env node

/**
 * TEST EMAIL API QUERY
 * Simulates what the API should return for the user
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testEmailApiQuery() {
  try {
    console.log('🧪 Testing email API query...\n');

    // Find user ross
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'ross', mode: 'insensitive' } },
          { name: { contains: 'ross', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        activeWorkspaceId: true
      }
    });

    if (!user || !user.activeWorkspaceId) {
      console.log('❌ User or activeWorkspaceId not found');
      return;
    }

    console.log(`👤 User: ${user.name || user.email}`);
    console.log(`📦 Active Workspace ID: ${user.activeWorkspaceId}\n`);

    // Simulate the API query exactly as it would run
    const workspaceId = user.activeWorkspaceId;
    const where = {
      workspaceId: workspaceId
    };

    console.log('📋 Query where clause:', JSON.stringify(where, null, 2));
    console.log('');

    // Fetch emails exactly as the API does
    const [emails, total] = await Promise.all([
      prisma.email_messages.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: 100,
        skip: 0,
        include: {
          person: {
            select: {
              id: true,
              fullName: true,
              email: true,
              jobTitle: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          }
        }
      }),
      prisma.email_messages.count({ where })
    ]);

    console.log(`📧 Found ${emails.length} emails (total: ${total})\n`);

    if (emails.length === 0) {
      console.log('⚠️  No emails found! Checking if emails exist in workspace...\n');
      
      // Check all emails in workspace
      const allEmails = await prisma.email_messages.findMany({
        where: { workspaceId: workspaceId },
        select: {
          id: true,
          subject: true,
          provider: true,
          workspaceId: true
        }
      });
      
      console.log(`📊 Total emails in workspace ${workspaceId}: ${allEmails.length}`);
      allEmails.forEach(email => {
        console.log(`   - ${email.subject} (provider: ${email.provider})`);
      });
    } else {
      console.log('✅ Emails found:');
      emails.forEach((email, index) => {
        console.log(`   ${index + 1}. ${email.subject}`);
        console.log(`      Provider: ${email.provider}, Read: ${email.isRead}, Important: ${email.isImportant}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
testEmailApiQuery()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

