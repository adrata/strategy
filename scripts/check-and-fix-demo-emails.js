#!/usr/bin/env node

/**
 * CHECK AND FIX DEMO EMAILS
 * Verifies demo emails are in the correct workspace and fixes if needed
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkAndFixDemoEmails() {
  try {
    console.log('🔍 Checking demo emails setup...\n');

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

    if (!user) {
      console.log('❌ User ross not found');
      return;
    }

    console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);
    console.log(`   Active Workspace ID: ${user.activeWorkspaceId || 'None'}\n`);

    // Get the active workspace
    let activeWorkspace = null;
    if (user.activeWorkspaceId) {
      activeWorkspace = await prisma.workspaces.findUnique({
        where: { id: user.activeWorkspaceId },
        select: { id: true, name: true, slug: true }
      });
      
      if (activeWorkspace) {
        console.log(`✅ Active workspace: ${activeWorkspace.name} (${activeWorkspace.id})\n`);
      } else {
        console.log(`⚠️  Active workspace ID ${user.activeWorkspaceId} not found\n`);
      }
    }

    // Get Adrata workspace
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: { 
        OR: [
          { name: 'Adrata' },
          { slug: 'adrata' }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (!adrataWorkspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }

    console.log(`✅ Adrata workspace: ${adrataWorkspace.name} (${adrataWorkspace.id})\n`);

    // Check if active workspace matches Adrata
    if (activeWorkspace && activeWorkspace.id === adrataWorkspace.id) {
      console.log('✅ User active workspace matches Adrata workspace\n');
    } else {
      console.log('⚠️  User active workspace does NOT match Adrata workspace');
      console.log(`   Updating user's activeWorkspaceId to Adrata...\n`);
      
      await prisma.users.update({
        where: { id: user.id },
        data: { activeWorkspaceId: adrataWorkspace.id }
      });
      
      console.log('✅ Updated user activeWorkspaceId to Adrata\n');
    }

    // Check for demo emails in Adrata workspace
    const demoEmailSubjects = [
      'Welcome to Adrata - Getting Started Guide',
      'Quarterly Business Review - Action Items',
      'Re: Product Demo Request'
    ];

    const existingEmails = await prisma.email_messages.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        subject: {
          in: demoEmailSubjects
        }
      },
      select: {
        id: true,
        subject: true,
        workspaceId: true
      }
    });

    console.log(`📧 Found ${existingEmails.length} demo emails in Adrata workspace:`);
    existingEmails.forEach(email => {
      console.log(`   - ${email.subject}`);
    });
    console.log('');

    if (existingEmails.length === 3) {
      console.log('✅ All 3 demo emails are present in Adrata workspace');
      console.log('✅ Setup is correct! Emails should be visible in the inbox.\n');
    } else {
      console.log(`⚠️  Only ${existingEmails.length} demo emails found. Need to create ${3 - existingEmails.length} more.\n`);
      console.log('   Run: node scripts/create-demo-emails-production.js\n');
    }

    // Also check if there are any emails in the active workspace
    if (user.activeWorkspaceId) {
      const emailsInActiveWorkspace = await prisma.email_messages.count({
        where: {
          workspaceId: user.activeWorkspaceId
        }
      });
      
      console.log(`📊 Total emails in active workspace: ${emailsInActiveWorkspace}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAndFixDemoEmails()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

