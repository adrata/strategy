const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEmailEngagement() {
  try {
    console.log('📧 TESTING EMAIL ENGAGEMENT ANALYSIS');
    console.log('='.repeat(50));
    console.log('');
    
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // 1. Check current email data structure
    console.log('📊 EMAIL DATA STRUCTURE:');
    console.log('-'.repeat(30));
    
    const sampleEmail = await prisma.email_messages.findFirst({
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
    
    if (sampleEmail) {
      console.log('✅ Sample email found:');
      console.log(`   Subject: "${sampleEmail.subject}"`);
      console.log(`   From: ${sampleEmail.from}`);
      console.log(`   To: ${JSON.stringify(sampleEmail.to)}`);
      console.log(`   CC: ${JSON.stringify(sampleEmail.cc)}`);
      console.log(`   BCC: ${JSON.stringify(sampleEmail.bcc)}`);
      console.log(`   Sent: ${sampleEmail.sentAt.toLocaleString()}`);
    } else {
      console.log('❌ No emails found in database');
      return;
    }
    console.log('');
    
    // 2. Analyze email participation levels
    console.log('🔍 EMAIL PARTICIPATION ANALYSIS:');
    console.log('-'.repeat(30));
    
    const emails = await prisma.email_messages.findMany({
      take: 5,
      select: {
        id: true,
        subject: true,
        from: true,
        to: true,
        cc: true,
        bcc: true,
        sentAt: true
      },
      orderBy: { sentAt: 'desc' }
    });
    
    for (const email of emails) {
      console.log(`📧 "${email.subject}"`);
      console.log(`   Sent: ${email.sentAt.toLocaleDateString()}`);
      
      // Analyze participation levels
      const participants = [];
      
      if (email.from) {
        participants.push(`FROM: ${email.from} (Weight: 1.0)`);
      }
      
      email.to.forEach(recipient => {
        participants.push(`TO: ${recipient} (Weight: 0.8)`);
      });
      
      email.cc.forEach(ccRecipient => {
        participants.push(`CC: ${ccRecipient} (Weight: 0.3)`);
      });
      
      email.bcc.forEach(bccRecipient => {
        participants.push(`BCC: ${bccRecipient} (Weight: 0.1)`);
      });
      
      participants.forEach(participant => {
        console.log(`   ${participant}`);
      });
      
      const activeCount = (email.from ? 1 : 0) + email.to.length;
      const passiveCount = email.cc.length + email.bcc.length;
      const totalCount = activeCount + passiveCount;
      
      console.log(`   Active Participants: ${activeCount}, Passive Participants: ${passiveCount}, Total: ${totalCount}`);
      console.log('');
    }
    
    // 3. Analyze contact engagement patterns
    console.log('👥 CONTACT ENGAGEMENT ANALYSIS:');
    console.log('-'.repeat(30));
    
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: danoWorkspaceId },
      take: 10,
      select: {
        id: true,
        email: true,
        fullName: true
      }
    });
    
    for (const contact of contacts) {
      if (!contact.email) continue;
      
      // Count email participations
      const [sentEmails, receivedEmails, ccEmails, bccEmails] = await Promise.all([
        prisma.email_messages.count({ where: { from: contact.email } }),
        prisma.email_messages.count({ where: { to: { has: contact.email } } }),
        prisma.email_messages.count({ where: { cc: { has: contact.email } } }),
        prisma.email_messages.count({ where: { bcc: { has: contact.email } } })
      ]);
      
      const totalEmails = sentEmails + receivedEmails + ccEmails + bccEmails;
      const activeParticipations = sentEmails + receivedEmails;
      const passiveParticipations = ccEmails + bccEmails;
      
      if (totalEmails > 0) {
        const participationRate = (activeParticipations / totalEmails) * 100;
        const engagementScore = ((sentEmails * 1.0) + (receivedEmails * 0.8) + (ccEmails * 0.3) + (bccEmails * 0.1)) / totalEmails;
        
        console.log(`👤 ${contact.fullName} (${contact.email})`);
        console.log(`   Total Emails: ${totalEmails}`);
        console.log(`   Sent: ${sentEmails}, Received: ${receivedEmails}, CC: ${ccEmails}, BCC: ${bccEmails}`);
        console.log(`   Active Participation: ${activeParticipations} (${participationRate.toFixed(1)}%)`);
        console.log(`   Engagement Score: ${engagementScore.toFixed(2)}`);
        
        if (participationRate > 70) {
          console.log(`   🟢 HIGH ENGAGEMENT - Active participant`);
        } else if (participationRate > 30) {
          console.log(`   🟡 MEDIUM ENGAGEMENT - Mixed participation`);
        } else {
          console.log(`   🔴 LOW ENGAGEMENT - Mostly passive participant`);
        }
        console.log('');
      }
    }
    
    // 4. Summary statistics
    console.log('📈 ENGAGEMENT SUMMARY:');
    console.log('-'.repeat(30));
    
    const totalEmails = await prisma.email_messages.count();
    const emailsWithCC = await prisma.email_messages.count({
      where: { cc: { not: { equals: [] } } }
    });
    const emailsWithBCC = await prisma.email_messages.count({
      where: { bcc: { not: { equals: [] } } }
    });
    
    console.log(`   Total Emails: ${totalEmails}`);
    console.log(`   Emails with CC: ${emailsWithCC} (${((emailsWithCC / totalEmails) * 100).toFixed(1)}%)`);
    console.log(`   Emails with BCC: ${emailsWithBCC} (${((emailsWithBCC / totalEmails) * 100).toFixed(1)}%)`);
    
    // 5. Test API endpoint
    console.log('🌐 TESTING API ENDPOINT:');
    console.log('-'.repeat(30));
    
    try {
      const response = await fetch('http://localhost:3000/api/email/engagement?type=high-engagement&workspaceId=' + danoWorkspaceId + '&limit=5');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint working');
        console.log(`   High engagement contacts: ${data.data.count}`);
      } else {
        console.log('❌ API endpoint not responding');
      }
    } catch (error) {
      console.log('❌ API endpoint test failed (server may not be running)');
    }
    
    console.log('');
    console.log('🎉 EMAIL ENGAGEMENT ANALYSIS COMPLETED!');
    console.log('');
    console.log('✅ Key Findings:');
    console.log('   - Email data structure captures sender vs recipient vs CC/BCC clearly');
    console.log('   - Participation levels can be weighted for engagement analysis');
    console.log('   - Active participants (senders/recipients) have higher engagement scores');
    console.log('   - Passive participants (CC/BCC) have lower engagement scores');
    console.log('   - This data can be used to determine true engagement levels');
    
  } catch (error) {
    console.error('❌ Error testing email engagement:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailEngagement();
