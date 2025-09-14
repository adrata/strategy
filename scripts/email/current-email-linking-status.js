const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function currentEmailLinkingStatus() {
  try {
    console.log('📧 CURRENT EMAIL LINKING STATUS');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. CURRENT STATUS
    const totalEmails = await prisma.email_messages.count();
    const emailsLinkedToContacts = await prisma.emailToContact.count();
    const emailsLinkedToAccounts = await prisma.emailToAccount.count();
    const emailsLinkedToLeads = await prisma.emailToLead.count();
    const emailsLinkedToOpportunities = await prisma.emailToOpportunity.count();
    const emailsLinkedToProspects = await prisma.emailToProspect.count();
    
    const totalLinks = emailsLinkedToContacts + emailsLinkedToAccounts + emailsLinkedToLeads + 
                      emailsLinkedToOpportunities + emailsLinkedToProspects;
    
    console.log('📊 CURRENT STATUS:');
    console.log('-'.repeat(30));
    console.log(`   Total emails: ${totalEmails.toLocaleString()}`);
    console.log(`   Total links: ${totalLinks.toLocaleString()}`);
    console.log(`   Average links per email: ${(totalLinks / totalEmails).toFixed(2)}`);
    console.log(`   Overall coverage: ${((totalLinks / (totalEmails * 5)) * 100).toFixed(1)}%`);
    console.log('');
    
    // 2. BREAKDOWN BY ENTITY
    console.log('🔗 LINKING BREAKDOWN:');
    console.log('-'.repeat(30));
    console.log(`   📧→👥 Contacts: ${emailsLinkedToContacts.toLocaleString()} (${((emailsLinkedToContacts / totalEmails) * 100).toFixed(1)}%)`);
    console.log(`   📧→🏢 Accounts: ${emailsLinkedToAccounts.toLocaleString()} (${((emailsLinkedToAccounts / totalEmails) * 100).toFixed(1)}%)`);
    console.log(`   📧→🎯 Leads: ${emailsLinkedToLeads.toLocaleString()} (${((emailsLinkedToLeads / totalEmails) * 100).toFixed(1)}%)`);
    console.log(`   📧→💰 Opportunities: ${emailsLinkedToOpportunities.toLocaleString()} (${((emailsLinkedToOpportunities / totalEmails) * 100).toFixed(1)}%)`);
    console.log(`   📧→🔍 Prospects: ${emailsLinkedToProspects.toLocaleString()} (${((emailsLinkedToProspects / totalEmails) * 100).toFixed(1)}%)`);
    console.log('');
    
    // 3. RECENT ACTIVITY
    console.log('⏰ RECENT ACTIVITY:');
    console.log('-'.repeat(30));
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEmails = await prisma.email_messages.count({
      where: {
        createdAt: {
          gte: oneDayAgo
        }
      }
    });
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyEmails = await prisma.email_messages.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });
    
    console.log(`   Last 24 hours: ${recentEmails} emails`);
    console.log(`   Last 7 days: ${weeklyEmails} emails`);
    console.log(`   Daily average: ${(weeklyEmails / 7).toFixed(1)} emails`);
    console.log('');
    
    // 4. PROGRESS COMPARISON
    console.log('📈 PROGRESS COMPARISON:');
    console.log('-'.repeat(30));
    
    // Previous values from last analysis
    const previousTotalLinks = 22002;
    const previousCoverage = 27.0;
    const currentCoverage = (totalLinks / (totalEmails * 5)) * 100;
    
    const linksAdded = totalLinks - previousTotalLinks;
    const coverageIncrease = currentCoverage - previousCoverage;
    
    console.log(`   Links added since last check: ${linksAdded.toLocaleString()}`);
    console.log(`   Coverage increase: +${coverageIncrease.toFixed(1)}%`);
    console.log(`   Progress rate: ${linksAdded > 0 ? '🟢 Improving' : linksAdded === 0 ? '🟡 Stable' : '🔴 Declining'}`);
    console.log('');
    
    // 5. COMPLETION ESTIMATES
    console.log('🎯 COMPLETION ESTIMATES:');
    console.log('-'.repeat(30));
    
    const targetCoverages = [50, 75, 90, 95];
    
    targetCoverages.forEach(target => {
      if (target > currentCoverage) {
        const neededLinks = (target / 100) * (totalEmails * 5) - totalLinks;
        const linksPerDay = Math.max(linksAdded, 1); // Use recent progress or minimum 1
        const daysToComplete = neededLinks / linksPerDay;
        
        console.log(`   ${target}% coverage:`);
        console.log(`     - Need ${neededLinks.toLocaleString()} more links`);
        console.log(`     - At current rate: ${daysToComplete.toFixed(1)} days`);
        console.log(`     - At 2x rate: ${(daysToComplete / 2).toFixed(1)} days`);
        console.log('');
      }
    });
    
    // 6. SYSTEM HEALTH
    console.log('💚 SYSTEM HEALTH:');
    console.log('-'.repeat(30));
    
    const healthScore = Math.min(100, (currentCoverage / 25) * 100);
    
    if (healthScore >= 80) {
      console.log('   🟢 EXCELLENT: System performing well');
    } else if (healthScore >= 60) {
      console.log('   🟡 GOOD: System performing adequately');
    } else if (healthScore >= 40) {
      console.log('   🟠 FAIR: System needs optimization');
    } else {
      console.log('   🔴 POOR: System needs immediate attention');
    }
    
    console.log(`   Health score: ${healthScore.toFixed(1)}/100`);
    console.log(`   Status: ${totalEmails > 10000 ? 'Large database' : 'Growing database'}`);
    console.log(`   Activity: ${recentEmails > 100 ? 'Highly active' : recentEmails > 10 ? 'Active' : 'Low activity'}`);
    
    // 7. RECENT EMAIL SAMPLES
    console.log('\n📋 RECENT EMAIL SAMPLES:');
    console.log('-'.repeat(30));
    
    const recentEmailSamples = await prisma.email_messages.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        subject: true,
        from: true,
        to: true,
        createdAt: true
      }
    });
    
    recentEmailSamples.forEach((email, index) => {
      const date = email.createdAt.toLocaleDateString();
      const time = email.createdAt.toLocaleTimeString();
      console.log(`   ${index + 1}. [${date} ${time}] "${email.subject}"`);
      console.log(`      From: ${email.from} → To: ${email.to}`);
    });
    
    console.log('\n✅ Email linking system status check complete!');
    
  } catch (error) {
    console.error('❌ Error checking email linking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

currentEmailLinkingStatus();
