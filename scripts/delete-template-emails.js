#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTemplateEmails() {
  try {
    console.log('🗑️ Deleting template emails for Adrata workspace...\n');

    const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';

    // First, show what we're about to delete
    const emails = await prisma.email_messages.findMany({
      where: { workspaceId },
      select: {
        id: true,
        subject: true,
        fromEmail: true,
        messageId: true,
        provider: true
      }
    });

    console.log(`📧 Found ${emails.length} emails to delete:\n`);
    emails.forEach((email, i) => {
      console.log(`${i + 1}. ${email.subject || '(No Subject)'}`);
      console.log(`   From: ${email.fromEmail}`);
      console.log(`   Message ID: ${email.messageId}`);
      console.log(`   Provider: ${email.provider || 'None'}`);
      console.log('');
    });

    // Delete all emails for this workspace
    const result = await prisma.email_messages.deleteMany({
      where: { workspaceId }
    });

    console.log(`✅ Deleted ${result.count} template emails from database\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTemplateEmails();

