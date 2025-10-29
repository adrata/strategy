#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTempEmails() {
  try {
    console.log('🧹 Cleaning up temp CoreSignal emails (setting to null)...\n');

    // Get people who still have temp CoreSignal emails
    const peopleWithTempEmails = await prisma.people.findMany({
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

    console.log(`📊 Found ${peopleWithTempEmails.length} people with temp emails`);

    let cleanedCount = 0;

    for (const person of peopleWithTempEmails) {
      console.log(`\n👤 Processing: ${person.fullName}`);
      console.log(`   Current Email: ${person.email}`);

      // Check if they have real email in CoreSignal data
      const hasRealEmail = person.coresignalData && person.coresignalData.primary_professional_email;
      
      if (hasRealEmail) {
        console.log(`   ⚠️  Has real email in CoreSignal - skipping (should have been updated already)`);
        continue;
      }

      // Set email to null since no real email exists
      await prisma.people.update({
        where: { id: person.id },
        data: {
          email: null,
          updatedAt: new Date()
        }
      });

      console.log(`   ✅ Set email to null (no real email available)`);
      cleanedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total people with temp emails: ${peopleWithTempEmails.length}`);
    console.log(`   Cleaned (set to null): ${cleanedCount}`);
    console.log(`   Skipped (had real emails): ${peopleWithTempEmails.length - cleanedCount}`);

    // Verify the cleanup
    console.log(`\n🔍 Verification - checking cleaned emails:`);
    const cleanedPeople = await prisma.people.findMany({
      where: {
        id: {
          in: peopleWithTempEmails.map(p => p.id)
        }
      },
      select: {
        fullName: true,
        email: true
      },
      take: 10
    });

    cleanedPeople.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.fullName}: ${person.email || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTempEmails();
