const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzePhoneSources() {
  try {
    console.log('🔍 Analyzing phone number sources for accounts...\n');

    // Get accounts missing phone numbers
    const accountsMissingPhone = await prisma.accounts.findMany({
      where: {
        OR: [
          { phone: null },
          { phone: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        phone: true,
        email: true,
        industry: true,
        _count: {
          select: {
            contacts: true
          }
        }
      }
    });

    console.log(`📊 Total accounts missing phone: ${accountsMissingPhone.length}`);

    // Analyze contact phone availability
    let accountsWithContactPhones = 0;
    let accountsWithWorkPhones = 0;
    let accountsWithMobilePhones = 0;
    let accountsWithDirectDial = 0;
    let accountsWithNoContacts = 0;
    let accountsWithContactsButNoPhones = 0;

    // Sample analysis of first 100 accounts
    const sampleSize = Math.min(100, accountsMissingPhone.length);
    const sampleAccounts = accountsMissingPhone.slice(0, sampleSize);

    for (const account of sampleAccounts) {
      if (account._count.contacts === 0) {
        accountsWithNoContacts++;
        continue;
      }

      // Get contacts for this account
      const contacts = await prisma.contacts.findMany({
        where: { accountId: account.id },
        select: {
          phone: true,
          workPhone: true,
          mobilePhone: true,
          directDialPhone: true,
          phone1: true,
          phone2: true
        }
      });

      let hasAnyPhone = false;
      let hasWorkPhone = false;
      let hasMobilePhone = false;
      let hasDirectDial = false;

      contacts.forEach(contact => {
        const phones = [
          contact.phone,
          contact.workPhone,
          contact.mobilePhone,
          contact.phone1,
          contact.phone2,
          contact.directDialPhone
        ].filter(Boolean);

        if (phones.length > 0) {
          hasAnyPhone = true;
        }
        if (contact.workPhone) hasWorkPhone = true;
        if (contact.mobilePhone) hasMobilePhone = true;
        if (contact.directDialPhone) hasDirectDial = true;
      });

      if (hasAnyPhone) {
        accountsWithContactPhones++;
        if (hasWorkPhone) accountsWithWorkPhones++;
        if (hasMobilePhone) accountsWithMobilePhones++;
        if (hasDirectDial) accountsWithDirectDial++;
      } else {
        accountsWithContactsButNoPhones++;
      }
    }

    console.log('\n📱 Phone availability analysis (sample of 100 accounts):');
    console.log(`  • Accounts with no contacts: ${accountsWithNoContacts}`);
    console.log(`  • Accounts with contacts but no phones: ${accountsWithContactsButNoPhones}`);
    console.log(`  • Accounts with contact phones: ${accountsWithContactPhones}`);
    console.log(`  • Accounts with work phones: ${accountsWithWorkPhones}`);
    console.log(`  • Accounts with mobile phones: ${accountsWithMobilePhones}`);
    console.log(`  • Accounts with direct dial: ${accountsWithDirectDial}`);

    // Check for patterns in industries
    console.log('\n🏭 Industry analysis for accounts missing phones:');
    const industryStats = {};
    accountsMissingPhone.forEach(account => {
      const industry = account.industry || 'Unknown';
      industryStats[industry] = (industryStats[industry] || 0) + 1;
    });

    const topIndustries = Object.entries(industryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    topIndustries.forEach(([industry, count]) => {
      console.log(`  • ${industry}: ${count} accounts`);
    });

    // Check for accounts with website but no phone
    const accountsWithWebsiteNoPhone = accountsMissingPhone.filter(acc => acc.website);
    console.log(`\n🌐 Accounts with website but no phone: ${accountsWithWebsiteNoPhone.length}`);

    // Sample of accounts that could benefit from phone enrichment
    console.log('\n📋 Sample accounts that need phone enrichment:');
    const sampleForEnrichment = accountsMissingPhone
      .filter(acc => acc.website && acc.website.includes('http'))
      .slice(0, 10);

    sampleForEnrichment.forEach(account => {
      console.log(`  • ${account.name} (${account.industry || 'N/A'})`);
      console.log(`    Website: ${account.website}`);
      console.log(`    Contacts: ${account._count.contacts}`);
    });

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzePhoneSources();
