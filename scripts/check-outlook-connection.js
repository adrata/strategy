#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOutlookConnection() {
  try {
    console.log('🔍 Checking Outlook connection status...\n');

    const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';

    // Check connections
    const connections = await prisma.grand_central_connections.findMany({
      where: {
        workspaceId,
        provider: 'outlook'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log(`📊 Found ${connections.length} Outlook connection(s):\n`);
    connections.forEach((conn, i) => {
      console.log(`${i + 1}. Connection ID: ${conn.id}`);
      console.log(`   Nango Connection ID: ${conn.nangoConnectionId}`);
      console.log(`   Status: ${conn.status}`);
      console.log(`   Created: ${conn.createdAt}`);
      console.log(`   Last Sync: ${conn.lastSyncAt || 'Never'}`);
      console.log(`   User ID: ${conn.userId}`);
      console.log('');
    });

    // Check emails
    const emailCount = await prisma.email_messages.count({
      where: { workspaceId }
    });

    const emails = await prisma.email_messages.findMany({
      where: { workspaceId },
      orderBy: { receivedAt: 'desc' },
      take: 5
    });

    console.log(`\n📧 Email Statistics:`);
    console.log(`   Total emails: ${emailCount}`);
    console.log(`\n📬 Recent emails:`);
    
    if (emails.length === 0) {
      console.log('   ❌ No emails found in database');
    } else {
      emails.forEach((email, i) => {
        console.log(`\n${i + 1}. ${email.subject || '(No Subject)'}`);
        console.log(`   From: ${email.fromEmail}`);
        console.log(`   Provider: ${email.provider || 'Unknown'}`);
        console.log(`   Received: ${email.receivedAt}`);
        console.log(`   Message ID: ${email.messageId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOutlookConnection();

