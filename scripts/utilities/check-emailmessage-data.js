const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmailMessageData() {
  try {
    console.log('🔍 Checking EmailMessage data for retail-product-solutions workspace...\n');
    
    // Check if there are any email accounts in the workspace
    const emailAccounts = await prisma.emailAccount.findMany({
      where: {
        workspace: {
          slug: 'retail-product-solutions'
        }
      },
      select: {
        id: true,
        platform: true,
        email: true,
        displayName: true,
        isActive: true,
        lastSyncAt: true,
        emails: {
          select: {
            id: true,
            subject: true,
            from: true,
            to: true,
            sentAt: true,
            receivedAt: true,
            body: true
          },
          take: 5
        }
      }
    });
    
    console.log(`📧 Found ${emailAccounts.length} email accounts in workspace`);
    
    emailAccounts.forEach((account, index) => {
      console.log(`\n${index + 1}. ${account.platform}: ${account.email} (${account.emails.length} emails)`);
      console.log(`   Display Name: ${account.displayName}`);
      console.log(`   Active: ${account.isActive}`);
      console.log(`   Last Sync: ${account.lastSyncAt}`);
      
      if (account.emails.length > 0) {
        console.log(`   Sample emails:`);
        account.emails.forEach((email, emailIndex) => {
          console.log(`     ${emailIndex + 1}. Subject: ${email.subject}`);
          console.log(`        From: ${email.from}`);
          console.log(`        To: ${email.to.join(', ')}`);
          console.log(`        Date: ${email.receivedAt}`);
          console.log(`        Body preview: ${email.body.substring(0, 100)}...`);
        });
      }
    });
    
    // Check total email count
    const totalEmails = await prisma.emailMessage.count({
      where: {
        account: {
          workspace: {
            slug: 'retail-product-solutions'
          }
        }
      }
    });
    
    console.log(`\n📊 Total emails in workspace: ${totalEmails}`);
    
    // Check for buying signals in email content
    if (totalEmails > 0) {
      console.log('\n🔍 Scanning for buying signals...');
      
      const emailsWithBuyingSignals = await prisma.emailMessage.findMany({
        where: {
          account: {
            workspace: {
              slug: 'retail-product-solutions'
            }
          },
          OR: [
            { body: { contains: 'want to buy', mode: 'insensitive' } },
            { body: { contains: 'interested in purchasing', mode: 'insensitive' } },
            { body: { contains: 'looking to buy', mode: 'insensitive' } },
            { body: { contains: 'ready to purchase', mode: 'insensitive' } },
            { body: { contains: 'need to buy', mode: 'insensitive' } },
            { body: { contains: 'pricing', mode: 'insensitive' } },
            { body: { contains: 'quote', mode: 'insensitive' } },
            { body: { contains: 'demo', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          subject: true,
          from: true,
          to: true,
          receivedAt: true,
          body: true
        },
        take: 10
      });
      
      console.log(`🎯 Found ${emailsWithBuyingSignals.length} emails with potential buying signals`);
      
      emailsWithBuyingSignals.forEach((email, index) => {
        console.log(`\n${index + 1}. Subject: ${email.subject}`);
        console.log(`   From: ${email.from}`);
        console.log(`   To: ${email.to.join(', ')}`);
        console.log(`   Date: ${email.receivedAt}`);
        console.log(`   Body preview: ${email.body.substring(0, 200)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailMessageData(); 