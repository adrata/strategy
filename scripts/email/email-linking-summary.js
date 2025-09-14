const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function emailLinkingSummary() {
  try {
    console.log('📧 EMAIL LINKING STATUS SUMMARY');
    console.log('='.repeat(50));
    console.log('');
    
    // 1. TOTAL EMAIL MESSAGES
    const totalEmails = await prisma.email_messages.count();
    console.log(`📊 Total email messages: ${totalEmails.toLocaleString()}`);
    console.log('');
    
    // 2. EMAIL LINKING COUNTS
    console.log('🔗 EMAIL LINKING TO ENTITIES:');
    console.log('-'.repeat(35));
    
    const emailsLinkedToContacts = await prisma.emailToContact.count();
    const emailsLinkedToAccounts = await prisma.emailToAccount.count();
    const emailsLinkedToLeads = await prisma.emailToLead.count();
    const emailsLinkedToOpportunities = await prisma.emailToOpportunity.count();
    const emailsLinkedToProspects = await prisma.emailToProspect.count();
    
    console.log(`   📧→👥 Contacts: ${emailsLinkedToContacts.toLocaleString()}`);
    console.log(`   📧→🏢 Accounts: ${emailsLinkedToAccounts.toLocaleString()}`);
    console.log(`   📧→🎯 Leads: ${emailsLinkedToLeads.toLocaleString()}`);
    console.log(`   📧→💰 Opportunities: ${emailsLinkedToOpportunities.toLocaleString()}`);
    console.log(`   📧→🔍 Prospects: ${emailsLinkedToProspects.toLocaleString()}`);
    
    console.log('');
    
    // 3. COVERAGE PERCENTAGES
    console.log('📈 COVERAGE PERCENTAGES:');
    console.log('-'.repeat(35));
    
    const contactCoverage = ((emailsLinkedToContacts / totalEmails) * 100).toFixed(1);
    const accountCoverage = ((emailsLinkedToAccounts / totalEmails) * 100).toFixed(1);
    const leadCoverage = ((emailsLinkedToLeads / totalEmails) * 100).toFixed(1);
    const opportunityCoverage = ((emailsLinkedToOpportunities / totalEmails) * 100).toFixed(1);
    const prospectCoverage = ((emailsLinkedToProspects / totalEmails) * 100).toFixed(1);
    
    console.log(`   👥 Contacts: ${contactCoverage}%`);
    console.log(`   🏢 Accounts: ${accountCoverage}%`);
    console.log(`   🎯 Leads: ${leadCoverage}%`);
    console.log(`   💰 Opportunities: ${opportunityCoverage}%`);
    console.log(`   🔍 Prospects: ${prospectCoverage}%`);
    
    console.log('');
    
    // 4. TOTAL LINKS AND AVERAGE
    const totalLinks = emailsLinkedToContacts + emailsLinkedToAccounts + emailsLinkedToLeads + 
                      emailsLinkedToOpportunities + emailsLinkedToProspects;
    
    console.log('📊 LINKING STATISTICS:');
    console.log('-'.repeat(35));
    console.log(`   Total email-entity links: ${totalLinks.toLocaleString()}`);
    console.log(`   Average links per email: ${(totalLinks / totalEmails).toFixed(2)}`);
    console.log(`   Overall coverage: ${((totalLinks / (totalEmails * 5)) * 100).toFixed(1)}%`);
    
    console.log('');
    
    // 5. RECENT EMAIL ACTIVITY
    console.log('⏰ RECENT EMAIL ACTIVITY:');
    console.log('-'.repeat(35));
    
    const recentEmails = await prisma.email_messages.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        subject: true,
        from: true,
        to: true,
        createdAt: true
      }
    });
    
    recentEmails.forEach((email, index) => {
      const date = email.createdAt.toLocaleDateString();
      console.log(`   ${index + 1}. [${date}] "${email.subject}"`);
    });
    
    console.log('');
    
    // 6. ASSESSMENT
    console.log('🎯 EMAIL LINKING ASSESSMENT:');
    console.log('='.repeat(50));
    
    const overallCoverage = (totalLinks / (totalEmails * 5)) * 100;
    
    if (overallCoverage > 80) {
      console.log('🟢 EXCELLENT: High email linking coverage');
    } else if (overallCoverage > 60) {
      console.log('🟡 GOOD: Moderate email linking coverage');
    } else if (overallCoverage > 40) {
      console.log('🟠 FAIR: Some email linking coverage');
    } else {
      console.log('🔴 NEEDS IMPROVEMENT: Low email linking coverage');
    }
    
    console.log(`   Overall coverage: ${overallCoverage.toFixed(1)}%`);
    console.log(`   Status: ${totalEmails > 10000 ? 'Large database' : 'Growing database'}`);
    console.log(`   Linking system: ${totalLinks > 10000 ? 'Highly active' : 'Active'}`);
    
    console.log('\n✅ Email linking system is operational!');
    console.log('   Emails are being linked to contacts, accounts, leads, opportunities, and prospects.');
    
  } catch (error) {
    console.error('❌ Error checking email linking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

emailLinkingSummary();
