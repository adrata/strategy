#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRealEmails() {
  try {
    // Get people with CoreSignal temp emails
    const people = await prisma.people.findMany({
      where: {
        email: {
          contains: '@coresignal.temp'
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        coresignalData: true
      },
      take: 10
    });

    console.log('🔍 Checking for real emails in CoreSignal data...\n');
    
    people.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Current Email: ${person.email}`);
      
      if (person.coresignalData && person.coresignalData.primary_professional_email) {
        console.log(`   ✅ Real Email Found: ${person.coresignalData.primary_professional_email}`);
      } else {
        console.log(`   ❌ No real email in CoreSignal data`);
      }
      
      if (person.coresignalData && person.coresignalData.professional_emails_collection) {
        console.log(`   📧 Professional Emails Collection: ${JSON.stringify(person.coresignalData.professional_emails_collection)}`);
      }
      
      console.log('   ---');
    });

    // Count how many have real emails
    const peopleWithRealEmails = people.filter(person => 
      person.coresignalData && person.coresignalData.primary_professional_email
    );
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total people checked: ${people.length}`);
    console.log(`   People with real emails in CoreSignal: ${peopleWithRealEmails.length}`);
    console.log(`   People missing real emails: ${people.length - peopleWithRealEmails.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealEmails();
