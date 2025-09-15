#!/usr/bin/env node

/**
 * Sync Emails to Actions
 * Creates actions for all 15,588 emails
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📧 SYNCING EMAILS TO ACTIONS');
  console.log('=============================\n');

  try {
    // Get total email count
    const totalEmails = await prisma.email_messages.count();
    console.log(`Total emails to sync: ${totalEmails}\n`);

    let totalProcessed = 0;
    let totalCreated = 0;
    let totalSkipped = 0;
    const batchSize = 100;

    // Process emails in batches
    let offset = 0;
    while (true) {
      const emails = await prisma.email_messages.findMany({
        take: batchSize,
        skip: offset,
        orderBy: { sentAt: 'desc' }
      });

      if (emails.length === 0) break;

      console.log(`Processing batch: ${emails.length} emails (offset: ${offset})`);

      for (const email of emails) {
        try {
          // Check if action already exists
          const existingAction = await prisma.actions.findFirst({
            where: { externalId: `email_${email.id}` }
          });

          if (existingAction) {
            totalSkipped++;
            continue;
          }

          // Create action for this email
          const actionData = {
            workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
            userId: '01K1VBYXHD0J895XAN0HGFBKJP', // Default user
            type: 'email_conversation',
            subject: email.subject || 'Email',
            description: `Email: ${email.subject}`,
            externalId: `email_${email.id}`,
            createdAt: email.sentAt,
            updatedAt: email.updatedAt,
            status: 'completed',
            priority: 'normal'
          };

          await prisma.actions.create({ data: actionData });
          totalCreated++;
          totalProcessed++;

        } catch (error) {
          console.log(`Error processing email ${email.id}: ${error.message}`);
        }
      }

      console.log(`✅ Batch complete: ${totalCreated} created, ${totalSkipped} skipped`);
      offset += batchSize;

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Final summary
    console.log('\n🎉 EMAIL SYNC COMPLETE!');
    console.log('========================');
    console.log(`✅ Total emails processed: ${totalProcessed}`);
    console.log(`✅ Total actions created: ${totalCreated}`);
    console.log(`✅ Total emails skipped (already synced): ${totalSkipped}`);

  } catch (error) {
    console.error('❌ Error in email sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
