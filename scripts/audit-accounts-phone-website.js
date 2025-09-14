const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditAccounts() {
  try {
    console.log('🔍 Auditing accounts for missing website and phone information...\n');

    // Get total count
    const totalAccounts = await prisma.accounts.count();
    console.log(`📊 Total accounts: ${totalAccounts}`);

    // Count accounts missing website
    const missingWebsite = await prisma.accounts.count({
      where: {
        OR: [
          { website: null },
          { website: '' }
        ]
      }
    });

    // Count accounts missing phone
    const missingPhone = await prisma.accounts.count({
      where: {
        OR: [
          { phone: null },
          { phone: '' }
        ]
      }
    });

    // Count accounts missing both
    const missingBoth = await prisma.accounts.count({
      where: {
        AND: [
          {
            OR: [
              { website: null },
              { website: '' }
            ]
          },
          {
            OR: [
              { phone: null },
              { phone: '' }
            ]
          }
        ]
      }
    });

    console.log(`🌐 Accounts missing website: ${missingWebsite} (${((missingWebsite / totalAccounts) * 100).toFixed(1)}%)`);
    console.log(`📞 Accounts missing phone: ${missingPhone} (${((missingPhone / totalAccounts) * 100).toFixed(1)}%)`);
    console.log(`❌ Accounts missing both: ${missingBoth} (${((missingBoth / totalAccounts) * 100).toFixed(1)}%)`);

    // Get sample accounts missing phone
    console.log('\n📋 Sample accounts missing phone:');
    const sampleMissingPhone = await prisma.accounts.findMany({
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
        createdAt: true
      },
      take: 10
    });

    sampleMissingPhone.forEach(account => {
      console.log(`  • ${account.name} (${account.industry || 'N/A'}) - Website: ${account.website || 'Missing'}`);
    });

    // Check if contacts have phone numbers that could be used for accounts
    console.log('\n🔍 Checking if contacts have phone numbers that could populate accounts...');
    
    const accountsWithContacts = await prisma.accounts.findMany({
      where: {
        OR: [
          { phone: null },
          { phone: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        phone: true,
        contacts: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            workPhone: true,
            mobilePhone: true,
            phone1: true,
            phone2: true,
            directDialPhone: true
          }
        }
      },
      take: 5
    });

    console.log('\n📱 Sample accounts with contact phone numbers:');
    accountsWithContacts.forEach(account => {
      console.log(`\n  Account: ${account.name}`);
      if (account.contacts.length === 0) {
        console.log('    No contacts found');
      } else {
        account.contacts.forEach(contact => {
          const phones = [
            contact.phone,
            contact.workPhone,
            contact.mobilePhone,
            contact.phone1,
            contact.phone2,
            contact.directDialPhone
          ].filter(Boolean);
          
          console.log(`    Contact: ${contact.fullName} - Phones: ${phones.length > 0 ? phones.join(', ') : 'None'}`);
        });
      }
    });

    // Check for accounts with website but no phone
    console.log('\n🌐 Accounts with website but no phone:');
    const websiteNoPhone = await prisma.accounts.count({
      where: {
        AND: [
          {
            website: {
              not: null
            }
          },
          {
            website: {
              not: ''
            }
          },
          {
            OR: [
              { phone: null },
              { phone: '' }
            ]
          }
        ]
      }
    });
    console.log(`  Count: ${websiteNoPhone}`);

    // Check for accounts with phone but no website
    console.log('\n📞 Accounts with phone but no website:');
    const phoneNoWebsite = await prisma.accounts.count({
      where: {
        AND: [
          {
            phone: {
              not: null
            }
          },
          {
            phone: {
              not: ''
            }
          },
          {
            OR: [
              { website: null },
              { website: '' }
            ]
          }
        ]
      }
    });
    console.log(`  Count: ${phoneNoWebsite}`);

    console.log('\n✅ Audit complete!');

  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditAccounts();
