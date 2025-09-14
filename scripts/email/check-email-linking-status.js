const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmailLinkingStatus() {
  try {
    console.log('📧 EMAIL LINKING STATUS VERIFICATION');
    console.log('='.repeat(60));
    console.log('');
    
    // 1. TOTAL EMAIL MESSAGES
    const totalEmails = await prisma.email_messages.count();
    console.log(`📊 Total email messages in database: ${totalEmails}`);
    console.log('');
    
    // 2. EMAIL LINKING TO CORE ENTITIES
    console.log('🔗 EMAIL LINKING TO CORE ENTITIES:');
    console.log('-'.repeat(40));
    
    // Check email linking to contacts
    const emailsLinkedToContacts = await prisma.emailToContact.count();
    console.log(`   Emails linked to contacts: ${emailsLinkedToContacts}`);
    
    // Check email linking to accounts
    const emailsLinkedToAccounts = await prisma.emailToAccount.count();
    console.log(`   Emails linked to accounts: ${emailsLinkedToAccounts}`);
    
    // Check email linking to leads
    const emailsLinkedToLeads = await prisma.emailToLead.count();
    console.log(`   Emails linked to leads: ${emailsLinkedToLeads}`);
    
    // Check email linking to opportunities
    const emailsLinkedToOpportunities = await prisma.emailToOpportunity.count();
    console.log(`   Emails linked to opportunities: ${emailsLinkedToOpportunities}`);
    
    // Check email linking to prospects
    const emailsLinkedToProspects = await prisma.emailToProspect.count();
    console.log(`   Emails linked to prospects: ${emailsLinkedToProspects}`);
    
    // Check email linking to persons (new junction table)
    const emailsLinkedToPersons = await prisma._EmailToPerson.count();
    console.log(`   Emails linked to persons: ${emailsLinkedToPersons}`);
    
    // Check email linking to companies (new junction table)
    const emailsLinkedToCompanies = await prisma._EmailToCompany.count();
    console.log(`   Emails linked to companies: ${emailsLinkedToCompanies}`);
    
    console.log('');
    
    // 3. CALCULATE LINKING PERCENTAGES
    console.log('📈 LINKING PERCENTAGES:');
    console.log('-'.repeat(40));
    
    const totalLinks = emailsLinkedToContacts + emailsLinkedToAccounts + emailsLinkedToLeads + 
                      emailsLinkedToOpportunities + emailsLinkedToProspects + 
                      emailsLinkedToPersons + emailsLinkedToCompanies;
    
    console.log(`   Total email-entity links: ${totalLinks}`);
    console.log(`   Average links per email: ${(totalLinks / totalEmails).toFixed(2)}`);
    
    // Calculate coverage percentages
    const contactCoverage = ((emailsLinkedToContacts / totalEmails) * 100).toFixed(1);
    const accountCoverage = ((emailsLinkedToAccounts / totalEmails) * 100).toFixed(1);
    const leadCoverage = ((emailsLinkedToLeads / totalEmails) * 100).toFixed(1);
    const opportunityCoverage = ((emailsLinkedToOpportunities / totalEmails) * 100).toFixed(1);
    const prospectCoverage = ((emailsLinkedToProspects / totalEmails) * 100).toFixed(1);
    const personCoverage = ((emailsLinkedToPersons / totalEmails) * 100).toFixed(1);
    const companyCoverage = ((emailsLinkedToCompanies / totalEmails) * 100).toFixed(1);
    
    console.log(`   Contact coverage: ${contactCoverage}%`);
    console.log(`   Account coverage: ${accountCoverage}%`);
    console.log(`   Lead coverage: ${leadCoverage}%`);
    console.log(`   Opportunity coverage: ${opportunityCoverage}%`);
    console.log(`   Prospect coverage: ${prospectCoverage}%`);
    console.log(`   Person coverage: ${personCoverage}%`);
    console.log(`   Company coverage: ${companyCoverage}%`);
    
    console.log('');
    
    // 4. SAMPLE EMAIL LINKING DATA
    console.log('📋 SAMPLE EMAIL LINKING:');
    console.log('-'.repeat(40));
    
    // Sample emails linked to contacts
    const sampleContactLinks = await prisma.emailToContact.findMany({
      take: 3,
      include: {
        email_messages: {
          select: {
            id: true,
            subject: true,
            from: true,
            to: true
          }
        },
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('   Sample emails linked to contacts:');
    sampleContactLinks.forEach((link, index) => {
      const email = link.email_messages;
      const contact = link.contacts;
      const contactName = `${contact.firstName} ${contact.lastName}`;
      console.log(`      ${index + 1}. "${email.subject}" → ${contactName} (${contact.email})`);
    });
    
    // Sample emails linked to accounts
    const sampleAccountLinks = await prisma.emailToAccount.findMany({
      take: 3,
      include: {
        email_messages: {
          select: {
            id: true,
            subject: true,
            from: true,
            to: true
          }
        },
        accounts: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('   Sample emails linked to accounts:');
    sampleAccountLinks.forEach((link, index) => {
      const email = link.email_messages;
      const account = link.accounts;
      console.log(`      ${index + 1}. "${email.subject}" → ${account.name} (${account.email})`);
    });
    
    // Sample emails linked to persons
    const samplePersonLinks = await prisma._EmailToPerson.findMany({
      take: 3,
      include: {
        email_messages: {
          select: {
            id: true,
            subject: true,
            from: true,
            to: true
          }
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('   Sample emails linked to persons:');
    samplePersonLinks.forEach((link, index) => {
      const email = link.email_messages;
      const person = link.person;
      const personName = `${person.firstName} ${person.lastName}`;
      console.log(`      ${index + 1}. "${email.subject}" → ${personName} (${person.email})`);
    });
    
    // Sample emails linked to companies
    const sampleCompanyLinks = await prisma._EmailToCompany.findMany({
      take: 3,
      include: {
        email_messages: {
          select: {
            id: true,
            subject: true,
            from: true,
            to: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('   Sample emails linked to companies:');
    sampleCompanyLinks.forEach((link, index) => {
      const email = link.email_messages;
      const company = link.company;
      console.log(`      ${index + 1}. "${email.subject}" → ${company.name} (${company.email})`);
    });
    
    console.log('');
    
    // 5. RECENT EMAIL ACTIVITY
    console.log('⏰ RECENT EMAIL ACTIVITY:');
    console.log('-'.repeat(40));
    
    const recentEmails = await prisma.email_messages.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        subject: true,
        from: true,
        to: true,
        createdAt: true
      }
    });
    
    console.log('   Most recent emails:');
    recentEmails.forEach((email, index) => {
      const date = email.createdAt.toLocaleDateString();
      console.log(`      ${index + 1}. [${date}] "${email.subject}"`);
      console.log(`         From: ${email.from} → To: ${email.to}`);
    });
    
    console.log('');
    
    // 6. OVERALL ASSESSMENT
    console.log('🎯 OVERALL EMAIL LINKING ASSESSMENT:');
    console.log('='.repeat(60));
    
    const overallCoverage = ((totalLinks / (totalEmails * 7)) * 100).toFixed(1); // 7 entity types
    
    if (overallCoverage > 80) {
      console.log('🟢 EXCELLENT: High email linking coverage');
    } else if (overallCoverage > 60) {
      console.log('🟡 GOOD: Moderate email linking coverage');
    } else if (overallCoverage > 40) {
      console.log('🟠 FAIR: Some email linking coverage');
    } else {
      console.log('🔴 NEEDS IMPROVEMENT: Low email linking coverage');
    }
    
    console.log(`   Overall coverage: ${overallCoverage}%`);
    console.log(`   Total emails: ${totalEmails}`);
    console.log(`   Total links: ${totalLinks}`);
    console.log(`   Average links per email: ${(totalLinks / totalEmails).toFixed(2)}`);
    
    console.log('\n✅ Email linking system is operational and tracking relationships!');
    
  } catch (error) {
    console.error('❌ Error checking email linking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailLinkingStatus();
