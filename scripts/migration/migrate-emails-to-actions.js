const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateEmailsToActions() {
  console.log('📧 MIGRATING EMAIL MESSAGES TO ACTIONS');
  console.log('======================================');
  console.log('Migrating email messages to unified actions table...\n');

  let stats = {
    totalEmails: 0,
    emailsMigrated: 0,
    emailsSkipped: 0,
    errors: 0
  };

  try {
    // STEP 1: Get email messages count
    console.log('🔄 STEP 1: Analyzing email messages...');
    
    const totalEmails = await prisma.email_messages.count();
    stats.totalEmails = totalEmails;
    console.log(`Total email messages: ${totalEmails}`);

    // Check how many are already in actions table
    const emailsInActions = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      INNER JOIN actions a ON em.id = a.id
    `;
    console.log(`Email messages already in actions table: ${emailsInActions[0].count}`);

    // STEP 2: Get sample email messages to understand structure
    console.log('\n🔄 STEP 2: Analyzing email structure...');
    
    const sampleEmails = await prisma.$queryRaw`
      SELECT 
        id,
        "messageId",
        "threadId",
        "accountId",
        subject,
        body,
        "sentAt",
        "receivedAt",
        "createdAt"
      FROM email_messages
      ORDER BY "sentAt" DESC
      LIMIT 3
    `;
    
    console.log('Sample email messages:');
    sampleEmails.forEach((email, index) => {
      console.log(`  ${index + 1}. Subject: "${email.subject}", AccountId: ${email.accountId}`);
    });

    // STEP 3: Migrate email messages to actions table
    console.log('\n🔄 STEP 3: Migrating email messages to actions...');
    
    // Process in batches to avoid memory issues
    const batchSize = 100;
    let offset = 0;
    let processed = 0;
    
    while (offset < totalEmails) {
      console.log(`\nProcessing batch ${Math.floor(offset / batchSize) + 1} (${offset + 1}-${Math.min(offset + batchSize, totalEmails)})...`);
      
      const emails = await prisma.$queryRaw`
        SELECT 
          id,
          "messageId",
          "threadId",
          "accountId",
          subject,
          body,
          "bodyHtml",
          "from",
          "to",
          cc,
          bcc,
          "replyTo",
          "sentAt",
          "receivedAt",
          "isRead",
          "isImportant",
          labels,
          attachments,
          tracking,
          "createdAt",
          "updatedAt",
          "buyingSignal",
          "buyingSignalScore"
        FROM email_messages
        ORDER BY "sentAt" DESC
        LIMIT ${batchSize} OFFSET ${offset}
      `;
      
      for (const email of emails) {
        try {
          // Check if this email is already in actions table
          const existingAction = await prisma.actions.findUnique({
            where: { id: email.id }
          });
          
          if (existingAction) {
            stats.emailsSkipped++;
            continue;
          }
          
          // Create action from email
          const actionData = {
            id: email.id,
            workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
            userId: '01K1VBYXHD0J895XAN0HGFBKJP', // Default to Dan's user ID
            companyId: email.companyId,
            type: 'email',
            subject: email.subject,
            description: email.body ? email.body.substring(0, 500) : null, // Truncate long bodies
            scheduledAt: email.sentAt,
            completedAt: email.sentAt,
            status: 'completed',
            priority: 'normal',
            metadata: {
              from: email.from,
              to: email.to,
              cc: email.cc || [],
              bcc: email.bcc || [],
              replyTo: email.replyTo,
              threadId: email.threadId,
              messageId: email.messageId,
              isRead: email.isRead,
              isImportant: email.isImportant,
              labels: email.labels || [],
              attachments: email.attachments,
              tracking: email.tracking,
              buyingSignal: email.buyingSignal,
              buyingSignalScore: email.buyingSignalScore
            },
            createdAt: email.createdAt,
            updatedAt: email.updatedAt
          };
          
          await prisma.actions.create({
            data: actionData
          });
          
          stats.emailsMigrated++;
          processed++;
          
          if (processed % 1000 === 0) {
            console.log(`  ✅ Migrated ${processed} emails...`);
          }
          
        } catch (error) {
          console.error(`  ❌ Failed to migrate email ${email.id}:`, error.message);
          stats.errors++;
        }
      }
      
      offset += batchSize;
    }

    // STEP 4: Summary
    console.log('\n📋 EMAIL MIGRATION SUMMARY');
    console.log('===========================');
    console.log(`Total email messages: ${stats.totalEmails}`);
    console.log(`Emails migrated: ${stats.emailsMigrated}`);
    console.log(`Emails skipped (already in actions): ${stats.emailsSkipped}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Email migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
    }

    // STEP 5: Verify migration
    console.log('\n🔍 VERIFICATION:');
    
    const emailsInActionsAfter = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      INNER JOIN actions a ON em.id = a.id
    `;
    console.log(`Email messages now in actions table: ${emailsInActionsAfter[0].count}`);
    
    const totalActions = await prisma.actions.count();
    console.log(`Total actions in database: ${totalActions}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateEmailsToActions()
  .then(() => {
    console.log('\n✅ Email migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
