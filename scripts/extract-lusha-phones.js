#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function extractLushaPhones() {
  try {
    console.log('📞 Extracting Lusha phone data...\n');

    // Get people with NULL emails who have Lusha data and mobile phones
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
        phone: true,
        mobilePhone: true,
        workPhone: true,
        customFields: true
      }
    });

    console.log(`📊 Found ${peopleWithLushaData.length} people with NULL emails and Lusha data\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const person of peopleWithLushaData) {
      console.log(`👤 Processing: ${person.fullName}`);
      console.log(`   Current Phone: ${person.phone || 'NULL'}`);
      console.log(`   Current Mobile: ${person.mobilePhone || 'NULL'}`);
      console.log(`   Current Work Phone: ${person.workPhone || 'NULL'}`);
      
      if (person.customFields && person.customFields.lushaData) {
        const lushaData = person.customFields.lushaData;
        const lushaPhone = lushaData.phone;
        const lushaMobile = lushaData.mobile;
        
        console.log(`   Lusha Phone: ${lushaPhone || 'N/A'}`);
        console.log(`   Lusha Mobile: ${lushaMobile || 'N/A'}`);
        
        // Check if we should update phone data
        const hasValidLushaPhone = lushaPhone && 
                                  !lushaPhone.includes('+1234567890') && 
                                  lushaPhone.length > 5;
        
        const hasValidLushaMobile = lushaMobile && 
                                   !lushaMobile.includes('+1234567890') && 
                                   lushaMobile.length > 5;
        
        let updateData = {};
        
        if (hasValidLushaPhone && !person.phone) {
          updateData.phone = lushaPhone;
          console.log(`   ✅ Will update phone: ${lushaPhone}`);
        }
        
        if (hasValidLushaMobile && !person.mobilePhone) {
          updateData.mobilePhone = lushaMobile;
          console.log(`   ✅ Will update mobile: ${lushaMobile}`);
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          
          await prisma.people.update({
            where: { id: person.id },
            data: updateData
          });

          console.log(`   ✅ Updated phone data`);
          updatedCount++;
        } else {
          console.log(`   ⚠️  No valid phone data to update`);
          skippedCount++;
        }
      } else {
        console.log(`   ❌ No Lusha data found`);
        skippedCount++;
      }
      
      console.log('   ---');
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total people processed: ${peopleWithLushaData.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Skipped (no valid data): ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

extractLushaPhones();
