#!/usr/bin/env node

/**
 * Link Emails to Actions
 * Creates actions for existing emails and links them to people/companies
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('📧 LINKING EMAILS TO ACTIONS');
  console.log('=============================\n');

  try {
    // Step 1: Get all email accounts for the workspace
    console.log('🔍 Step 1: Getting email accounts...');
    
    const emailAccounts = await prisma.email_accounts.findMany({
      select: {
        id: true,
        workspaceId: true,
        email: true
      }
    });

    console.log(`Found ${emailAccounts.length} email accounts`);

    // Step 2: Process emails in batches
    console.log('\n📨 Step 2: Processing emails...');
    
    let totalProcessed = 0;
    let totalLinked = 0;
    const batchSize = 100;

    for (const account of emailAccounts) {
      console.log(`\nProcessing account: ${account.email}`);
      
      // Get emails for this account
      const emails = await prisma.email_messages.findMany({
        where: { accountId: account.id },
        take: batchSize,
        orderBy: { sentAt: 'desc' }
      });

      console.log(`Found ${emails.length} emails to process`);

      for (const email of emails) {
        try {
          // Check if action already exists for this email
          const existingAction = await prisma.actions.findFirst({
            where: {
              externalId: `email_${email.id}`
            }
          });

          if (existingAction) {
            continue; // Skip if already linked
          }

          // Try to find people from email addresses
          const emailAddresses = [...email.to, email.from, ...email.cc, ...email.bcc];
          const people = [];
          const companies = [];

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
                if (company) companies.push(company);
              }
            }
          }

          // Create action for this email
          const actionData = {
            workspaceId: account.workspaceId,
            type: email.from === account.email ? 'email_sent' : 'email_received',
            name: email.subject || 'Email',
            description: `Email: ${email.subject}`,
            externalId: `email_${email.id}`,
            createdAt: email.sentAt,
            updatedAt: email.updatedAt,
            personId: people[0]?.id || null,
            companyId: companies[0]?.id || null
          };

          const action = await prisma.actions.create({
            data: actionData
          });

          totalProcessed++;
          if (action.personId || action.companyId) {
            totalLinked++;
          }

          // Update lastAction for the person if linked
          if (action.personId) {
            await prisma.people.update({
              where: { id: action.personId },
              data: {
                lastAction: `Email: ${email.subject}`,
                lastActionDate: email.sentAt
              }
            });
          }

          // Update lastAction for the company if linked
          if (action.companyId) {
            await prisma.companies.update({
              where: { id: action.companyId },
              data: {
                lastAction: `Email: ${email.subject}`,
                lastActionDate: email.sentAt
              }
            });
          }

        } catch (error) {
          console.log(`Error processing email ${email.id}: ${error.message}`);
        }
      }

      console.log(`✅ Processed ${emails.length} emails for ${account.email}`);
    }

    // Step 3: Summary
    console.log('\n🎉 EMAIL LINKING COMPLETE!');
    console.log('===========================');
    console.log(`✅ Total emails processed: ${totalProcessed}`);
    console.log(`✅ Total emails linked to people/companies: ${totalLinked}`);
    console.log(`✅ Success rate: ${totalProcessed > 0 ? Math.round((totalLinked / totalProcessed) * 100) : 0}%`);

  } catch (error) {
    console.error('❌ Error in email linking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
