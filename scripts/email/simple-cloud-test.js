const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCloudProcessor() {
  try {
    console.log('🧪 Testing Cloud Email Processor (Simple Test)...');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Test basic functionality
    console.log('📧 Testing email processing logic...');
    
    // Get recent emails
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEmails = await prisma.email_messages.findMany({
      where: {
        sentAt: { gte: thirtyDaysAgo }
      },
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: {
        id: true,
        subject: true,
        from: true,
        to: true,
        cc: true,
        bcc: true,
        sentAt: true
      }
    });
    
    console.log(`📧 Found ${recentEmails.length} recent emails to process`);
    
    // Get entities for linking
    const [contacts, accounts, leads, opportunities, prospects, persons, companies] = await Promise.all([
      prisma.contacts.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.accounts.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, name: true } 
      }),
      prisma.leads.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.opportunities.findMany({ 
        where: { workspaceId },
        select: { id: true, name: true } 
      }),
      prisma.prospects.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.person.findMany({ 
        where: { workspaceId },
        select: { id: true, email: true, fullName: true } 
      }),
      prisma.company.findMany({ 
        where: { workspaceId },
        select: { id: true, name: true } 
      })
    ]);
    
    console.log(`🔗 Loaded entities: ${contacts.length} contacts, ${accounts.length} accounts, ${leads.length} leads, ${opportunities.length} opportunities, ${prospects.length} prospects, ${persons.length} persons, ${companies.length} companies`);
    
    // Test linking logic
    let linksCreated = 0;
    
    for (const email of recentEmails) {
      console.log(`   Processing: ${email.subject}`);
      
      // Link based on email addresses
      const allEmails = [
        email.from,
        ...email.to,
        ...email.cc,
        ...email.bcc
      ].filter(Boolean);
      
      for (const emailAddress of allEmails) {
        if (!emailAddress) continue;
        
        // Check for matches
        const matchingContacts = contacts.filter(c => c.email?.toLowerCase() === emailAddress.toLowerCase());
        const matchingLeads = leads.filter(l => l.email?.toLowerCase() === emailAddress.toLowerCase());
        const matchingProspects = prospects.filter(p => p.email?.toLowerCase() === emailAddress.toLowerCase());
        const matchingPersons = persons.filter(p => p.email?.toLowerCase() === emailAddress.toLowerCase());
        
        if (matchingContacts.length > 0 || matchingLeads.length > 0 || matchingProspects.length > 0 || matchingPersons.length > 0) {
          linksCreated++;
          console.log(`     ✅ Found matches for ${emailAddress}`);
        }
      }
    }
    
    console.log('✅ Cloud processor test completed:');
    console.log(`   Processed: ${recentEmails.length} emails`);
    console.log(`   Potential links: ${linksCreated}`);
    console.log(`   Success rate: ${recentEmails.length > 0 ? (linksCreated / recentEmails.length * 100).toFixed(1) : 0}%`);
    
  } catch (error) {
    console.error('❌ Cloud processor test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCloudProcessor();
