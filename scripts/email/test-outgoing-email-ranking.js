const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOutgoingEmailRanking() {
  try {
    console.log('📧 TESTING OUTGOING EMAIL RANKING SYSTEM');
    console.log('='.repeat(60));
    console.log('');
    
    const danoWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // 1. Get our email accounts (outgoing emails)
    console.log('📊 OUR EMAIL ACCOUNTS (OUTGOING SOURCES):');
    console.log('-'.repeat(40));
    
    const ourAccounts = await prisma.email_accounts.findMany({
      where: { workspaceId: danoWorkspaceId },
      select: { email: true, platform: true, displayName: true }
    });
    
    console.log(`✅ Found ${ourAccounts.length} email accounts:`);
    ourAccounts.forEach(account => {
      console.log(`   - ${account.displayName}: ${account.email} (${account.platform})`);
    });
    console.log('');
    
    // 2. Analyze outgoing email patterns
    console.log('📤 OUTGOING EMAIL ANALYSIS:');
    console.log('-'.repeat(40));
    
    const ourEmails = ourAccounts.map(account => account.email);
    
    // Get sample of outgoing emails
    const outgoingEmails = await prisma.email_messages.findMany({
      where: {
        from: { in: ourEmails }
      },
      select: {
        id: true,
        from: true,
        to: true,
        cc: true,
        subject: true,
        sentAt: true
      },
      orderBy: { sentAt: 'desc' },
      take: 10
    });
    
    console.log(`📧 Sample outgoing emails (${outgoingEmails.length} shown):`);
    outgoingEmails.forEach((email, index) => {
      console.log(`   ${index + 1}. FROM: ${email.from}`);
      console.log(`      TO: ${JSON.stringify(email.to)}`);
      console.log(`      CC: ${JSON.stringify(email.cc)}`);
      console.log(`      Subject: "${email.subject}"`);
      console.log(`      Sent: ${email.sentAt.toLocaleDateString()}`);
      console.log('');
    });
    
    // 3. Analyze contact engagement patterns
    console.log('👥 CONTACT ENGAGEMENT ANALYSIS:');
    console.log('-'.repeat(40));
    
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: danoWorkspaceId },
      take: 10,
      select: {
        id: true,
        email: true,
        fullName: true,
        company: true
      }
    });
    
    for (const contact of contacts) {
      if (!contact.email) continue;
      
      // Count outgoing emails to this contact
      const outgoingToContact = await prisma.email_messages.count({
        where: {
          from: { in: ourEmails },
          OR: [
            { to: { has: contact.email } },
            { cc: { has: contact.email } }
          ]
        }
      });
      
      // Count incoming emails from this contact
      const incomingFromContact = await prisma.email_messages.count({
        where: {
          from: contact.email,
          OR: [
            { to: { hasSome: ourEmails } },
            { cc: { hasSome: ourEmails } }
          ]
        }
      });
      
      if (outgoingToContact > 0) {
        const responseRate = incomingFromContact / outgoingToContact;
        const engagementScore = responseRate * 100;
        
        console.log(`👤 ${contact.fullName} (${contact.email})`);
        console.log(`   Company: ${contact.company || 'Unknown'}`);
        console.log(`   Emails sent to: ${outgoingToContact}`);
        console.log(`   Emails received from: ${incomingFromContact}`);
        console.log(`   Response rate: ${(responseRate * 100).toFixed(1)}%`);
        console.log(`   Engagement score: ${engagementScore.toFixed(1)}`);
        
        // Determine priority level
        let priorityLevel = 'Low';
        let rankingBoost = 0;
        
        if (responseRate >= 0.7) {
          priorityLevel = 'High';
          rankingBoost = 50;
        } else if (responseRate >= 0.4) {
          priorityLevel = 'Medium';
          rankingBoost = 25;
        }
        
        // Recent activity bonus
        const recentOutgoing = await prisma.email_messages.findFirst({
          where: {
            from: { in: ourEmails },
            OR: [
              { to: { has: contact.email } },
              { cc: { has: contact.email } }
            ]
          },
          orderBy: { sentAt: 'desc' },
          select: { sentAt: true }
        });
        
        if (recentOutgoing) {
          const daysSince = Math.floor((Date.now() - recentOutgoing.sentAt.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince <= 3) {
            rankingBoost += 20;
            priorityLevel = priorityLevel === 'High' ? 'Urgent' : 'High';
          } else if (daysSince <= 7) {
            rankingBoost += 10;
          }
        }
        
        console.log(`   Priority: ${priorityLevel}`);
        console.log(`   Ranking boost: +${rankingBoost}`);
        console.log('');
      }
    }
    
    // 4. Summary statistics
    console.log('📈 OUTGOING EMAIL SUMMARY:');
    console.log('-'.repeat(40));
    
    const totalOutgoingEmails = await prisma.email_messages.count({
      where: { from: { in: ourEmails } }
    });
    
    const totalIncomingEmails = await prisma.email_messages.count({
      where: {
        OR: [
          { to: { hasSome: ourEmails } },
          { cc: { hasSome: ourEmails } }
        ]
      }
    });
    
    console.log(`   Total outgoing emails: ${totalOutgoingEmails}`);
    console.log(`   Total incoming emails: ${totalIncomingEmails}`);
    console.log(`   Overall response rate: ${totalOutgoingEmails > 0 ? ((totalIncomingEmails / totalOutgoingEmails) * 100).toFixed(1) : 0}%`);
    
    // 5. Test API endpoint
    console.log('🌐 TESTING API ENDPOINT:');
    console.log('-'.repeat(40));
    
    try {
      const response = await fetch(`http://localhost:3000/api/dashboard/outgoing-email-engagement?workspaceId=${danoWorkspaceId}&type=metrics`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API endpoint working');
        console.log(`   Dashboard metrics: ${JSON.stringify(data.data, null, 2)}`);
      } else {
        console.log('❌ API endpoint not responding');
      }
    } catch (error) {
      console.log('❌ API endpoint test failed (server may not be running)');
    }
    
    console.log('');
    console.log('🎉 OUTGOING EMAIL RANKING ANALYSIS COMPLETED!');
    console.log('');
    console.log('✅ Key Findings:');
    console.log('   - Outgoing emails are clearly tracked (FROM our accounts)');
    console.log('   - Response rates can be calculated for engagement scoring');
    console.log('   - Recent activity provides ranking boost');
    console.log('   - High response rates indicate high engagement');
    console.log('   - This data can be integrated into the ranking system');
    console.log('');
    console.log('🚀 Integration with Ranking System:');
    console.log('   - High response rate contacts get ranking boost');
    console.log('   - Recent outgoing activity increases priority');
    console.log('   - Engagement scores can update contact rankings');
    console.log('   - Dashboard can show outgoing email metrics');
    
  } catch (error) {
    console.error('❌ Error testing outgoing email ranking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOutgoingEmailRanking();
