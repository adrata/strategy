const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDataQuality1to1() {
  console.log('🔧 FIXING DATA QUALITY ISSUES - ACHIEVING 1-TO-1 RELATIONSHIPS');
  console.log('================================================================\n');

  try {
    // Step 1: Identify and remove fake/placeholder person records
    console.log('📋 STEP 1: Removing fake/placeholder person records...');
    
    const fakePersonPatterns = [
      'SUBSCRIBED',
      'United States',
      'https://',
      'OR',
      'Phoenix AZ'
    ];
    
    const fakePersons = await prisma.person.findMany({
      where: {
        OR: [
          { fullName: { in: fakePersonPatterns } },
          { fullName: { startsWith: 'https://' } },
          { fullName: { startsWith: 'United States' } },
          { fullName: '' }
        ]
      },
      include: {
        contacts: true
      }
    });
    
    console.log(`  Found ${fakePersons.length} fake/placeholder person records`);
    
    // Move contacts from fake persons to unlinked state
    for (const fakePerson of fakePersons) {
      if (fakePerson.contacts.length > 0) {
        await prisma.contacts.updateMany({
          where: { personId: fakePerson.id },
          data: { personId: null }
        });
        console.log(`  Unlinked ${fakePerson.contacts.length} contacts from fake person: ${fakePerson.fullName}`);
      }
    }
    
    // Delete fake person records
    const deleteResult = await prisma.person.deleteMany({
      where: {
        OR: [
          { fullName: { in: fakePersonPatterns } },
          { fullName: { startsWith: 'https://' } },
          { fullName: { startsWith: 'United States' } },
          { fullName: '' }
        ]
      }
    });
    
    console.log(`  ✅ Deleted ${deleteResult.count} fake person records\n`);

    // Step 2: Merge duplicate person records
    console.log('📋 STEP 2: Merging duplicate person records...');
    
    // Find persons with same email
    const emailGroups = await prisma.person.groupBy({
      by: ['email'],
      where: {
        email: { not: null }
      },
      _count: { id: true }
    });
    
    const duplicateEmails = emailGroups.filter(group => group._count.id > 1);
    console.log(`  Found ${duplicateEmails.length} email groups with duplicates`);
    
    for (const emailGroup of duplicateEmails) {
      const persons = await prisma.person.findMany({
        where: { email: emailGroup.email },
        include: { contacts: true },
        orderBy: { createdAt: 'asc' } // Keep the oldest one
      });
      
      if (persons.length > 1) {
        const keepPerson = persons[0]; // Keep the first (oldest) person
        const mergePersons = persons.slice(1); // Merge the rest
        
        for (const mergePerson of mergePersons) {
          // Move contacts to the person we're keeping
          if (mergePerson.contacts.length > 0) {
            await prisma.contacts.updateMany({
              where: { personId: mergePerson.id },
              data: { personId: keepPerson.id }
            });
            console.log(`  Merged ${mergePerson.contacts.length} contacts from ${mergePerson.fullName} to ${keepPerson.fullName}`);
          }
          
          // Delete the duplicate person
          await prisma.person.delete({ where: { id: mergePerson.id } });
        }
      }
    }
    
    // Find persons with same fullName (but no email)
    const nameGroups = await prisma.person.groupBy({
      by: ['fullName'],
      where: {
        email: null,
        fullName: { not: null, not: '' }
      },
      _count: { id: true }
    });
    
    const duplicateNames = nameGroups.filter(group => group._count.id > 1);
    console.log(`  Found ${duplicateNames.length} name groups with duplicates`);
    
    for (const nameGroup of duplicateNames) {
      const persons = await prisma.person.findMany({
        where: { fullName: nameGroup.fullName, email: null },
        include: { contacts: true },
        orderBy: { createdAt: 'asc' }
      });
      
      if (persons.length > 1) {
        const keepPerson = persons[0];
        const mergePersons = persons.slice(1);
        
        for (const mergePerson of mergePersons) {
          if (mergePerson.contacts.length > 0) {
            await prisma.contacts.updateMany({
              where: { personId: mergePerson.id },
              data: { personId: keepPerson.id }
            });
            console.log(`  Merged ${mergePerson.contacts.length} contacts from ${mergePerson.fullName} to ${keepPerson.fullName}`);
          }
          
          await prisma.person.delete({ where: { id: mergePerson.id } });
        }
      }
    }
    
    console.log('  ✅ Completed duplicate person merging\n');

    // Step 3: Create proper person records for unlinked contacts
    console.log('📋 STEP 3: Creating proper person records for unlinked contacts...');
    
    const unlinkedContacts = await prisma.contacts.findMany({
      where: { personId: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        firstName: true,
        lastName: true,
        phone: true,
        mobilePhone: true,
        linkedinUrl: true,
        jobTitle: true,
        department: true
      }
    });
    
    console.log(`  Found ${unlinkedContacts.length} unlinked contacts`);
    
    let createdPersons = 0;
    let skippedContacts = 0;
    
    for (const contact of unlinkedContacts) {
      // Skip contacts without any identifying information
      if (!contact.fullName && !contact.email && !contact.workEmail && !contact.firstName && !contact.lastName) {
        skippedContacts++;
        continue;
      }
      
      // Determine the best email to use
      const email = contact.email || contact.workEmail;
      
      // Determine the best name to use
      let fullName = contact.fullName;
      if (!fullName && (contact.firstName || contact.lastName)) {
        fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
      }
      
      if (!fullName) {
        skippedContacts++;
        continue;
      }
      
      // Check if a person with this email already exists
      let existingPerson = null;
      if (email) {
        existingPerson = await prisma.person.findFirst({
          where: { email: email }
        });
      }
      
      // Check if a person with this name already exists (if no email)
      if (!existingPerson && !email) {
        existingPerson = await prisma.person.findFirst({
          where: { fullName: fullName, email: null }
        });
      }
      
      if (existingPerson) {
        // Link contact to existing person
        await prisma.contacts.update({
          where: { id: contact.id },
          data: { personId: existingPerson.id }
        });
        console.log(`  Linked contact ${contact.fullName} to existing person ${existingPerson.fullName}`);
      } else {
        // Create new person record
        const newPerson = await prisma.person.create({
          data: {
            fullName: fullName,
            email: email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone || contact.mobilePhone,
            linkedinUrl: contact.linkedinUrl,
            title: contact.jobTitle,
            department: contact.department
          }
        });
        
        // Link contact to new person
        await prisma.contacts.update({
          where: { id: contact.id },
          data: { personId: newPerson.id }
        });
        
        createdPersons++;
        console.log(`  Created new person: ${fullName} (${email || 'no email'})`);
      }
    }
    
    console.log(`  ✅ Created ${createdPersons} new person records`);
    console.log(`  ⚠️  Skipped ${skippedContacts} contacts without identifying information\n`);

    // Step 4: Verify 1-to-1 relationships
    console.log('📋 STEP 4: Verifying 1-to-1 relationships...');
    
    const personStats = await prisma.person.findMany({
      select: {
        _count: { contacts: true }
      }
    });
    
    const contactCounts = personStats.map(p => p._count.contacts);
    const oneContact = contactCounts.filter(count => count === 1).length;
    const multipleContacts = contactCounts.filter(count => count > 1).length;
    const noContacts = contactCounts.filter(count => count === 0).length;
    
    console.log(`  People with exactly 1 contact: ${oneContact}/${contactCounts.length} (${((oneContact/contactCounts.length)*100).toFixed(1)}%)`);
    console.log(`  People with multiple contacts: ${multipleContacts}/${contactCounts.length} (${((multipleContacts/contactCounts.length)*100).toFixed(1)}%)`);
    console.log(`  People with no contacts: ${noContacts}/${contactCounts.length} (${((noContacts/contactCounts.length)*100).toFixed(1)}%)`);
    
    // Check for any remaining unlinked contacts
    const remainingUnlinked = await prisma.contacts.count({
      where: { personId: null }
    });
    
    console.log(`  Remaining unlinked contacts: ${remainingUnlinked}`);
    
    if (multipleContacts > 0) {
      console.log('\n  ⚠️  WARNING: Some people still have multiple contacts. This may indicate:');
      console.log('     - Same person in different companies/roles');
      console.log('     - Data quality issues that need manual review');
    }
    
    if (remainingUnlinked > 0) {
      console.log('\n  ⚠️  WARNING: Some contacts remain unlinked. These may need manual review.');
    }
    
    console.log('\n🎯 DATA QUALITY FIX COMPLETE!');
    console.log('==============================');
    console.log('✅ Removed fake/placeholder person records');
    console.log('✅ Merged duplicate person records');
    console.log('✅ Created proper person records for unlinked contacts');
    console.log('✅ Achieved near 1-to-1 person-contact relationships');
    
  } catch (error) {
    console.error('❌ Error during data quality fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDataQuality1to1().catch(console.error);
