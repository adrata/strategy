#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function extractLushaEmails() {
  try {
    console.log('📧 Extracting usable Lusha email data...\n');

    // Get people with NULL emails who have Lusha data
    const peopleWithLushaData = await prisma.people.findMany({
      where: {
        email: null,
        customFields: {
          path: ['lushaData'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        customFields: true
      }
    });

    console.log(`📊 Found ${peopleWithLushaData.length} people with NULL emails and Lusha data\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const person of peopleWithLushaData) {
      console.log(`👤 Processing: ${person.fullName}`);
      
      if (person.customFields && person.customFields.lushaData) {
        const lushaData = person.customFields.lushaData;
        const lushaEmail = lushaData.email;
        
        if (lushaEmail) {
          // Check if the email looks valid (not test data or malformed)
          const isValidEmail = lushaEmail.includes('@') && 
                              !lushaEmail.includes('+1234567890') && 
                              !lushaEmail.includes('undefined') &&
                              !lushaEmail.includes('&') && // malformed email
                              lushaEmail.length > 5;
          
          if (isValidEmail) {
            // Update the person with the Lusha email
            await prisma.people.update({
              where: { id: person.id },
              data: {
                email: lushaEmail,
                updatedAt: new Date()
              }
            });

            console.log(`   ✅ Updated email: ${lushaEmail}`);
            updatedCount++;
          } else {
            console.log(`   ⚠️  Skipped invalid email: ${lushaEmail}`);
            skippedCount++;
          }
        } else {
          console.log(`   ❌ No email in Lusha data`);
          skippedCount++;
        }
      } else {
        console.log(`   ❌ No Lusha data found`);
        skippedCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total people processed: ${peopleWithLushaData.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Skipped (invalid/no email): ${skippedCount}`);

    // Verify the updates
    console.log(`\n🔍 Verification - checking updated emails:`);
    const updatedPeople = await prisma.people.findMany({
      where: {
        id: {
          in: peopleWithLushaData.map(p => p.id)
        }
      },
      select: {
        fullName: true,
        email: true
      },
      take: 10
    });

    updatedPeople.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.fullName}: ${person.email || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

extractLushaEmails();
