const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRemainingDuplicates() {
  console.log('🔧 FIXING REMAINING DUPLICATE CONTACTS');
  console.log('======================================\n');

  try {
    // Get people with multiple contacts
    const peopleWithMultiple = await prisma.person.findMany({
      where: {
        contacts: {
          some: {}
        }
      },
      include: {
        contacts: {
          select: {
            id: true,
            fullName: true,
            email: true,
            workEmail: true,
            jobTitle: true,
            accountId: true,
            workspaceId: true,
            createdAt: true,
            updatedAt: true,
            firstName: true,
            lastName: true,
            department: true,
            phone: true,
            mobilePhone: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    const peopleWithMultipleContacts = peopleWithMultiple.filter(p => p.contacts.length > 1);
    
    console.log(`Found ${peopleWithMultipleContacts.length} people with multiple contacts`);
    console.log('Analyzing and fixing each case...\n');
    
    let totalDuplicatesFixed = 0;
    let totalContactsRemoved = 0;
    
    for (const person of peopleWithMultipleContacts) {
      const contacts = person.contacts;
      
      console.log(`👤 ${person.fullName} (${person.email})`);
      console.log(`   Has ${contacts.length} contacts`);
      
      // Find the "best" contact to keep (most complete data)
      let bestContact = contacts[0];
      let bestScore = 0;
      
      for (const contact of contacts) {
        let score = 0;
        if (contact.jobTitle) score += 2;
        if (contact.phone) score += 1;
        if (contact.mobilePhone) score += 1;
        if (contact.department) score += 1;
        if (contact.fullName && contact.fullName.trim()) score += 1;
        
        if (score > bestScore) {
          bestScore = score;
          bestContact = contact;
        }
      }
      
      console.log(`   Keeping contact: ${bestContact.id} (score: ${bestScore})`);
      console.log(`   Job Title: ${bestContact.jobTitle || 'None'}`);
      console.log(`   Phone: ${bestContact.phone || 'None'}`);
      
      // Delete all other contacts
      const contactsToDelete = contacts.filter(c => c.id !== bestContact.id);
      
      for (const contactToDelete of contactsToDelete) {
        console.log(`   Deleting: ${contactToDelete.id} (${contactToDelete.jobTitle || 'No title'})`);
        await prisma.contacts.delete({ where: { id: contactToDelete.id } });
        totalContactsRemoved++;
      }
      
      totalDuplicatesFixed++;
      console.log(`   ✅ Fixed ${contactsToDelete.length} duplicates\n`);
    }
    
    console.log('✅ REMAINING DUPLICATE FIX COMPLETE!');
    console.log('====================================');
    console.log(`  People processed: ${totalDuplicatesFixed}`);
    console.log(`  Duplicate contacts removed: ${totalContactsRemoved}`);
    
    // Verify final results
    console.log('\n📋 VERIFYING FINAL RESULTS...');
    
    const finalPersonStats = await prisma.person.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        contacts: {
          select: { id: true }
        }
      }
    });
    
    const finalContactCounts = finalPersonStats.map(p => p.contacts.length);
    const finalOneContact = finalContactCounts.filter(count => count === 1).length;
    const finalMultipleContacts = finalContactCounts.filter(count => count > 1).length;
    const finalNoContacts = finalContactCounts.filter(count => count === 0).length;
    
    console.log(`  People with exactly 1 contact: ${finalOneContact}/${finalPersonStats.length} (${((finalOneContact/finalPersonStats.length)*100).toFixed(1)}%)`);
    console.log(`  People with multiple contacts: ${finalMultipleContacts}/${finalPersonStats.length} (${((finalMultipleContacts/finalPersonStats.length)*100).toFixed(1)}%)`);
    console.log(`  People with no contacts: ${finalNoContacts}/${finalPersonStats.length} (${((finalNoContacts/finalPersonStats.length)*100).toFixed(1)}%)`);
    
    if (finalMultipleContacts === 0) {
      console.log('\n🎉 PERFECT! All people now have exactly 1 contact!');
    } else {
      console.log(`\n⚠️  ${finalMultipleContacts} people still have multiple contacts - manual review needed`);
    }
    
  } catch (error) {
    console.error('❌ Error during remaining duplicate fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixRemainingDuplicates().catch(console.error);
