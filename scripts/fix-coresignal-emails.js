#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCoreSignalEmails() {
  try {
    console.log('🔧 Fixing CoreSignal email addresses...\n');

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
      }
    });

    console.log(`📊 Found ${people.length} people with temp CoreSignal emails`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const person of people) {
      console.log(`\n👤 Processing: ${person.fullName}`);
      console.log(`   Current Email: ${person.email}`);

      if (person.coresignalData && person.coresignalData.primary_professional_email) {
        const realEmail = person.coresignalData.primary_professional_email;
        console.log(`   ✅ Found real email: ${realEmail}`);

        // Update the person with the real email
        await prisma.people.update({
          where: { id: person.id },
          data: {
            email: realEmail,
            updatedAt: new Date()
          }
        });

        console.log(`   ✅ Updated email to: ${realEmail}`);
        updatedCount++;
      } else {
        console.log(`   ⚠️  No real email found in CoreSignal data - keeping temp email`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total people processed: ${people.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Skipped (no real email): ${skippedCount}`);

    // Verify the fix
    console.log(`\n🔍 Verification - checking updated emails:`);
    const updatedPeople = await prisma.people.findMany({
      where: {
        id: {
          in: people.map(p => p.id)
        }
      },
      select: {
        fullName: true,
        email: true
      },
      take: 10
    });

    updatedPeople.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.fullName}: ${person.email}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCoreSignalEmails();
