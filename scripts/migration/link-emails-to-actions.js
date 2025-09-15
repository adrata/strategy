#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function linkEmailsToActions() {
  const prisma = new PrismaClient();
  
  console.log('🔗 LINKING EMAIL MESSAGES TO ACTIONS TABLE');
  console.log('===========================================');
  
  const stats = {
    totalEmails: 0,
    emailsLinked: 0,
    emailsSkipped: 0,
    errors: 0
  };
  
  try {
    // STEP 1: Get email messages count
    console.log('\n🔄 STEP 1: Analyzing email messages...');
    const totalEmails = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM email_messages
    `;
    stats.totalEmails = parseInt(totalEmails[0].count);
    console.log(`Total email messages: ${stats.totalEmails}`);
    
    // STEP 2: Check how many emails already have actions
    const emailsWithActions = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM email_messages e
      WHERE EXISTS (
        SELECT 1 FROM actions a 
        WHERE a.externalRefId = e.id 
        AND a.externalRefType = 'email'
      )
    `;
    const alreadyLinked = parseInt(emailsWithActions[0].count);
    console.log(`Email messages already linked to actions: ${alreadyLinked}`);
    
    // STEP 3: Link emails to actions (create action records that reference emails)
    console.log('\n🔄 STEP 2: Linking email messages to actions...');
    
    const batchSize = 100;
    let offset = 0;
    let processed = 0;
    
    while (offset < stats.totalEmails) {
      console.log(`\nProcessing batch ${Math.floor(offset / batchSize) + 1} (${offset + 1}-${Math.min(offset + batchSize, stats.totalEmails)})...`);
      
      const emails = await prisma.$queryRaw`
        SELECT 
          id,
          "messageId",
          "threadId",
          "accountId",
          subject,
          body,
          "from",
          "to",
          "sentAt",
          "receivedAt",
          "createdAt"
        FROM email_messages
        ORDER BY "sentAt" DESC
        LIMIT ${batchSize} OFFSET ${offset}
      `;
      
      for (const email of emails) {
        try {
          // Check if this email is already linked to an action
          const existingAction = await prisma.actions.findFirst({
            where: {
              externalRefId: email.id,
              externalRefType: 'email'
            }
          });
          
          if (existingAction) {
            stats.emailsSkipped++;
            continue;
          }
          
          // Find the company from accountId
          let companyId = null;
          if (email.accountId) {
            const company = await prisma.companies.findFirst({
              where: { entity_id: email.accountId }
            });
            if (company) {
              companyId = company.id;
            }
          }
          
          // Create action record that links to the email
          await prisma.actions.create({
            data: {
              type: 'email',
              subject: email.subject || 'Email Message',
              description: email.body ? email.body.substring(0, 500) : null,
              companyId: companyId,
              workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
              externalRefId: email.id,
              externalRefType: 'email',
              externalRefData: {
                messageId: email.messageId,
                threadId: email.threadId,
                from: email.from,
                to: email.to,
                sentAt: email.sentAt,
                receivedAt: email.receivedAt
              },
              createdAt: email.createdAt,
              updatedAt: new Date()
            }
          });
          
          stats.emailsLinked++;
          processed++;
          
          if (processed % 50 === 0) {
            console.log(`  ✅ Processed ${processed} emails...`);
          }
          
        } catch (error) {
          console.error(`❌ Error linking email ${email.id}:`, error.message);
          stats.errors++;
        }
      }
      
      offset += batchSize;
    }
    
    // STEP 4: Summary
    console.log('\n🎉 EMAIL LINKING COMPLETE!');
    console.log('==========================');
    console.log(`📊 Total emails: ${stats.totalEmails}`);
    console.log(`🔗 Emails linked: ${stats.emailsLinked}`);
    console.log(`⏭️  Emails skipped: ${stats.emailsSkipped}`);
    console.log(`❌ Errors: ${stats.errors}`);
    
    // STEP 5: Verify linking
    console.log('\n🔍 VERIFICATION:');
    const linkedCount = await prisma.actions.count({
      where: { externalRefType: 'email' }
    });
    console.log(`✅ Total email actions in database: ${linkedCount}`);
    
    const sampleLinkedActions = await prisma.actions.findMany({
      where: { externalRefType: 'email' },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n📧 Sample linked email actions:');
    sampleLinkedActions.forEach((action, i) => {
      console.log(`  ${i+1}. Subject: "${action.subject}", CompanyId: ${action.companyId || 'none'}, ExternalRefId: ${action.externalRefId}`);
    });
    
  } catch (error) {
    console.error('💥 Linking failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the linking
linkEmailsToActions().catch(console.error);
