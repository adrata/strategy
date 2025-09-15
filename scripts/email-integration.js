#!/usr/bin/env node

/**
 * Email Integration Script
 * Links 15,588 emails to actions and people/companies
 * Processes in small batches for performance
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📧 EMAIL INTEGRATION - LINKING TO ACTIONS');
  console.log('==========================================\n');

  try {
    // Step 1: Get unique account IDs from emails
    console.log('🔍 Step 1: Getting email account IDs...');
    const accountGroups = await prisma.email_messages.groupBy({
      by: ['accountId'],
      _count: { accountId: true }
    });
    console.log(`Found ${accountGroups.length} email account groups\n`);

    let totalProcessed = 0;
    let totalLinked = 0;
    let totalSkipped = 0;
    const batchSize = 50; // Small batches for performance

    // Step 2: Process each account ID
    for (const group of accountGroups) {
      const accountId = group.accountId;
      const emailCount = group._count.accountId;
      console.log(`📨 Processing account: ${accountId} (${emailCount} emails)`);
      
      let accountProcessed = 0;
      let accountLinked = 0;
      let accountSkipped = 0;

      // Get emails for this account in batches
      let offset = 0;
      while (true) {
        const emails = await prisma.email_messages.findMany({
          where: { accountId: accountId },
          take: batchSize,
          skip: offset,
          orderBy: { sentAt: 'desc' }
        });

        if (emails.length === 0) break;

        console.log(`  Processing batch: ${emails.length} emails (offset: ${offset})`);

        for (const email of emails) {
          try {
            // Check if action already exists
            const existingAction = await prisma.actions.findFirst({
              where: { externalId: `email_${email.id}` }
            });

            if (existingAction) {
              accountSkipped++;
              continue;
            }

            // Find people from email addresses
            const emailAddresses = [...email.to, email.from, ...email.cc, ...email.bcc];
            const people = [];
            const companies = new Set();

            for (const emailAddr of emailAddresses) {
              if (!emailAddr || emailAddr === account.email) continue;

              // Find person by email
              const person = await prisma.people.findFirst({
                where: {
                  OR: [
                    { email: emailAddr },
                    { workEmail: emailAddr },
                    { personalEmail: emailAddr },
                    { secondaryEmail: emailAddr }
                  ]
                }
              });

              if (person) {
                people.push(person);
                
                // Get company from person
                if (person.companyId) {
                  const company = await prisma.companies.findUnique({
                    where: { id: person.companyId }
                  });
                  if (company) companies.add(company);
                }
              }
            }

            // Get workspaceId from the first person found, or use a default
            let workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP'; // Dan's workspace as default
            if (people.length > 0) {
              workspaceId = people[0].workspaceId;
            }

            // Create action for this email
            const actionData = {
              workspaceId: workspaceId,
              type: 'email_conversation', // Generic email type
              name: email.subject || 'Email',
              description: `Email: ${email.subject}`,
              externalId: `email_${email.id}`,
              createdAt: email.sentAt,
              updatedAt: email.updatedAt,
              personId: people[0]?.id || null,
              companyId: companies.size > 0 ? Array.from(companies)[0].id : null
            };

            await prisma.actions.create({ data: actionData });
            accountProcessed++;

            if (actionData.personId || actionData.companyId) {
              accountLinked++;

              // Update lastAction for the person
              if (actionData.personId) {
                await prisma.people.update({
                  where: { id: actionData.personId },
                  data: {
                    lastAction: `Email: ${email.subject}`,
                    lastActionDate: email.sentAt
                  }
                });
              }

              // Update lastAction for the company
              if (actionData.companyId) {
                await prisma.companies.update({
                  where: { id: actionData.companyId },
                  data: {
                    lastAction: `Email: ${email.subject}`,
                    lastActionDate: email.sentAt
                  }
                });
              }
            }

          } catch (error) {
            console.log(`    Error processing email ${email.id}: ${error.message}`);
          }
        }

        console.log(`  ✅ Batch complete: ${accountProcessed} processed, ${accountLinked} linked, ${accountSkipped} skipped`);
        
        totalProcessed += accountProcessed;
        totalLinked += accountLinked;
        totalSkipped += accountSkipped;

        // Reset counters for next batch
        accountProcessed = 0;
        accountLinked = 0;
        accountSkipped = 0;

        offset += batchSize;

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Account complete: ${accountId}\n`);
    }

    // Final summary
    console.log('🎉 EMAIL INTEGRATION COMPLETE!');
    console.log('===============================');
    console.log(`✅ Total emails processed: ${totalProcessed}`);
    console.log(`✅ Total emails linked: ${totalLinked}`);
    console.log(`✅ Total emails skipped (already linked): ${totalSkipped}`);
    console.log(`✅ Success rate: ${totalProcessed > 0 ? Math.round((totalLinked / totalProcessed) * 100) : 0}%`);

  } catch (error) {
    console.error('❌ Error in email integration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
