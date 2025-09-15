#!/usr/bin/env node

/**
 * Test Email Sync
 * Test creating one action from an email
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 TESTING EMAIL SYNC');
  console.log('======================\n');

  try {
    // Get one email to test with
    const testEmail = await prisma.email_messages.findFirst({
      select: { id: true, subject: true, sentAt: true }
    });
    
    console.log('Test email:', testEmail);
    
    // Check if action already exists
    const existingAction = await prisma.actions.findFirst({
      where: { externalId: `email_${testEmail.id}` }
    });
    
    console.log('Existing action:', existingAction ? 'Found' : 'Not found');
    
    if (!existingAction) {
      // Create test action
      const actionData = {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        userId: '01K1VBYXHD0J895XAN0HGFBKJP',
        type: 'email_conversation',
        subject: testEmail.subject || 'Email',
        description: `Email: ${testEmail.subject}`,
        externalId: `email_${testEmail.id}`,
        createdAt: testEmail.sentAt,
        updatedAt: new Date(),
        status: 'completed',
        priority: 'normal'
      };
      
      const newAction = await prisma.actions.create({ data: actionData });
      console.log('✅ Test action created:', newAction.id);
    } else {
      console.log('✅ Action already exists, test passed');
    }
    
    // Check total actions count
    const totalActions = await prisma.actions.count();
    console.log(`Total actions now: ${totalActions}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
