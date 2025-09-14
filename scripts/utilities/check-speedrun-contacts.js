const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpeedrunContacts() {
  try {
    console.log('🏃‍♂️ Checking Speedrun contacts for test email person...');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Retail Product Solutions
    
    // Look for John Smith or Test Prospect Company
    console.log('🔍 Searching for "John Smith" or "Test Prospect Company"...');
    
    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId: workspaceId,
        OR: [
          { fullName: { contains: 'John Smith', mode: 'insensitive' } },
          { fullName: { contains: 'Test Prospect', mode: 'insensitive' } },
          { email: { contains: 'john.smith@prospectcompany.com', mode: 'insensitive' } },
          { email: { contains: 'test@prospectcompany.com', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        jobTitle: true,
        createdAt: true,
        updatedAt: true,
        account: {
          select: {
            id: true,
            name: true,
            website: true
          }
        },
        emails: {
          take: 5,
          orderBy: { receivedAt: 'desc' },
          select: {
            id: true,
            subject: true,
            from: true,
            receivedAt: true,
            buyingSignal: true,
            buyingSignalScore: true
          }
        },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            description: true,
            createdAt: true
          }
        }
      }
    });

    console.log(`📧 Found ${contacts.length} matching contacts:`);
    
    if (contacts.length === 0) {
      console.log('⚠️ No contacts found matching test email criteria');
      
      // Check recent contacts (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentContacts = await prisma.contact.findMany({
        where: {
          workspaceId: workspaceId,
          createdAt: {
            gte: oneHourAgo
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
          account: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log(`\n📋 Recent contacts created in last hour (${recentContacts.length}):`);
      recentContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.fullName} (${contact.email}) from ${contact.account?.name || 'Unknown Company'} - ${contact.createdAt}`);
      });
      
    } else {
      contacts.forEach((contact, index) => {
        console.log(`\n${index + 1}. 👤 ${contact.fullName}`);
        console.log(`   📧 Email: ${contact.email || contact.workEmail || 'No email'}`);
        console.log(`   💼 Title: ${contact.jobTitle || 'Unknown'}`);
        console.log(`   🏢 Company: ${contact.account?.name || 'Unknown'}`);
        console.log(`   📅 Created: ${contact.createdAt}`);
        console.log(`   📅 Updated: ${contact.updatedAt}`);
        
        if (contact.emails.length > 0) {
          console.log(`   📧 Recent emails (${contact.emails.length}):`);
          contact.emails.forEach((email, emailIndex) => {
            console.log(`      ${emailIndex + 1}. "${email.subject}" from ${email.from} (${email.receivedAt})`);
            if (email.buyingSignal) {
              console.log(`         🎯 Buying Signal: ${email.buyingSignal} (Score: ${email.buyingSignalScore})`);
            }
          });
        }
        
        if (contact.activities.length > 0) {
          console.log(`   📋 Recent activities (${contact.activities.length}):`);
          contact.activities.forEach((activity, actIndex) => {
            console.log(`      ${actIndex + 1}. ${activity.type}: ${activity.description} (${activity.createdAt})`);
          });
        }
      });
    }

    // Check leads and prospects for the same criteria
    console.log('\n🔍 Checking leads and prospects...');
    
    const leads = await prisma.lead.findMany({
      where: {
        workspaceId: workspaceId,
        OR: [
          { fullName: { contains: 'John Smith', mode: 'insensitive' } },
          { fullName: { contains: 'Test Prospect', mode: 'insensitive' } },
          { email: { contains: 'john.smith@prospectcompany.com', mode: 'insensitive' } },
          { email: { contains: 'test@prospectcompany.com', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        account: {
          select: {
            name: true
          }
        }
      }
    });

    const prospects = await prisma.prospect.findMany({
      where: {
        workspaceId: workspaceId,
        OR: [
          { fullName: { contains: 'John Smith', mode: 'insensitive' } },
          { fullName: { contains: 'Test Prospect', mode: 'insensitive' } },
          { email: { contains: 'john.smith@prospectcompany.com', mode: 'insensitive' } },
          { email: { contains: 'test@prospectcompany.com', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        account: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`🔥 Found ${leads.length} matching leads`);
    console.log(`🎯 Found ${prospects.length} matching prospects`);

    if (leads.length > 0 || prospects.length > 0) {
      console.log('\n📋 Lead/Prospect matches:');
      leads.forEach(lead => {
        console.log(`   Lead: ${lead.fullName} (${lead.email}) - ${lead.account?.name}`);
      });
      prospects.forEach(prospect => {
        console.log(`   Prospect: ${prospect.fullName} (${prospect.email}) - ${prospect.account?.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking Speedrun contacts:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpeedrunContacts();
