const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmailData() {
  try {
    console.log('🔍 Checking Email data for retail-product-solutions workspace...\n');
    
    // Check if there are any emails in the workspace
    const emails = await prisma.email.findMany({
      where: {
        workspace: {
          slug: 'retail-product-solutions'
        }
      },
      select: {
        id: true,
        subject: true,
        from: true,
        to: true,
        receivedAt: true,
        body: true
      },
      take: 5
    });
    
    console.log(`📧 Found ${emails.length} emails in workspace`);
    
    if (emails.length > 0) {
      console.log('\n📋 Sample emails:');
      emails.forEach((email, index) => {
        console.log(`\n${index + 1}. Subject: ${email.subject}`);
        console.log(`   From: ${email.from}`);
        console.log(`   To: ${email.to.join(', ')}`);
        console.log(`   Date: ${email.receivedAt}`);
        console.log(`   Body preview: ${email.body.substring(0, 100)}...`);
      });
    }
    
    // Check ConnectedProvider data
    const providers = await prisma.connectedProvider.findMany({
      where: {
        workspace: {
          slug: 'retail-product-solutions'
        }
      },
      select: {
        id: true,
        provider: true,
        email: true,
        emails: {
          select: {
            id: true,
            subject: true
          },
          take: 3
        }
      }
    });
    
    console.log(`\n🔗 Found ${providers.length} connected providers`);
    providers.forEach(provider => {
      console.log(`   - ${provider.provider}: ${provider.email} (${provider.emails.length} emails)`);
    });
    
    // Check if there are any leads, opportunities, accounts, contacts with email data
    const leadsWithEmails = await prisma.lead.findMany({
      where: {
        workspace: {
          slug: 'retail-product-solutions'
        },
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      },
      take: 3
    });
    
    console.log(`\n👥 Found ${leadsWithEmails.length} leads with email addresses`);
    leadsWithEmails.forEach(lead => {
      console.log(`   - ${lead.fullName}: ${lead.email || lead.workEmail || lead.personalEmail}`);
    });
    
    const contactsWithEmails = await prisma.contact.findMany({
      where: {
        workspace: {
          slug: 'retail-product-solutions'
        },
        OR: [
          { email: { not: null } },
          { workEmail: { not: null } },
          { personalEmail: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      },
      take: 3
    });
    
    console.log(`\n👤 Found ${contactsWithEmails.length} contacts with email addresses`);
    contactsWithEmails.forEach(contact => {
      console.log(`   - ${contact.fullName}: ${contact.email || contact.workEmail || contact.personalEmail}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailData(); 