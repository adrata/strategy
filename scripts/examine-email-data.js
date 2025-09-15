#!/usr/bin/env node

/**
 * Examine Email Data Structure
 * Look at actual email data to understand linking strategy
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 EXAMINING EMAIL DATA STRUCTURE');
  console.log('==================================\n');

  try {
    // Get a few sample emails
    console.log('📧 Sample Emails:');
    console.log('-----------------');
    
    const sampleEmails = await prisma.email_messages.findMany({
      take: 3,
      orderBy: { sentAt: 'desc' },
      select: {
        id: true,
        subject: true,
        from: true,
        to: true,
        cc: true,
        bcc: true,
        sentAt: true,
        accountId: true,
        buyingSignal: true,
        buyingSignalScore: true
      }
    });

    for (let i = 0; i < sampleEmails.length; i++) {
      const email = sampleEmails[i];
      console.log(`\n📧 Email ${i + 1}:`);
      console.log(`   ID: ${email.id}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   From: ${email.from}`);
      console.log(`   To: ${email.to.join(', ')}`);
      console.log(`   CC: ${email.cc.join(', ')}`);
      console.log(`   BCC: ${email.bcc.join(', ')}`);
      console.log(`   Sent: ${email.sentAt}`);
      console.log(`   Account ID: ${email.accountId}`);
      console.log(`   Buying Signal: ${email.buyingSignal || 'None'}`);
      console.log(`   Signal Score: ${email.buyingSignalScore || 'None'}`);
    }

    // Check email accounts
    console.log('\n📬 Email Accounts:');
    console.log('------------------');
    
    const emailAccounts = await prisma.email_accounts.findMany({
      select: {
        id: true,
        email: true,
        workspaceId: true,
        platform: true
      }
    });

    for (const account of emailAccounts) {
      console.log(`   Account: ${account.email} (${account.platform})`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Workspace: ${account.workspaceId}`);
    }

    // Check if emails are linked to accounts
    console.log('\n🔗 Email-Account Linking:');
    console.log('-------------------------');
    
    const emailAccountLinking = await prisma.$queryRaw`
      SELECT 
        ea.email as account_email,
        COUNT(em.id) as email_count
      FROM email_accounts ea
      LEFT JOIN email_messages em ON ea.id = em."accountId"
      GROUP BY ea.id, ea.email
    `;

    for (const link of emailAccountLinking) {
      console.log(`   ${link.account_email}: ${link.email_count} emails`);
    }

    // Check people data
    console.log('\n👤 Sample People:');
    console.log('-----------------');
    
    const samplePeople = await prisma.people.findMany({
      take: 3,
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        companyId: true
      }
    });

    for (let i = 0; i < samplePeople.length; i++) {
      const person = samplePeople[i];
      console.log(`\n👤 Person ${i + 1}:`);
      console.log(`   ID: ${person.id}`);
      console.log(`   Name: ${person.fullName}`);
      console.log(`   Email: ${person.email || 'None'}`);
      console.log(`   Work Email: ${person.workEmail || 'None'}`);
      console.log(`   Personal Email: ${person.personalEmail || 'None'}`);
      console.log(`   Company ID: ${person.companyId || 'None'}`);
    }

    // Check companies data
    console.log('\n🏢 Sample Companies:');
    console.log('--------------------');
    
    const sampleCompanies = await prisma.companies.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        email: true,
        website: true
      }
    });

    for (let i = 0; i < sampleCompanies.length; i++) {
      const company = sampleCompanies[i];
      console.log(`\n🏢 Company ${i + 1}:`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Name: ${company.name}`);
      console.log(`   Email: ${company.email || 'None'}`);
      console.log(`   Website: ${company.website || 'None'}`);
    }

    // Analyze linking potential
    console.log('\n🎯 Linking Analysis:');
    console.log('--------------------');
    
    // Check how many emails have matching people
    const emailPeopleMatches = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      WHERE EXISTS (
        SELECT 1 FROM people p 
        WHERE p.email = em.from 
           OR p.work_email = em.from 
           OR p.personal_email = em.from
           OR em.from = ANY(SELECT unnest(em.to))
           OR em.from = ANY(SELECT unnest(em.cc))
      )
    `;

    console.log(`   Emails with matching people: ${emailPeopleMatches[0]?.count || 0}`);

    // Check how many emails have matching companies
    const emailCompanyMatches = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM email_messages em
      WHERE EXISTS (
        SELECT 1 FROM companies c 
        WHERE c.email = em.from 
           OR em.from LIKE '%@' || SPLIT_PART(c.website, '://', 2)
      )
    `;

    console.log(`   Emails with matching companies: ${emailCompanyMatches[0]?.count || 0}`);

  } catch (error) {
    console.error('❌ Error examining email data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
