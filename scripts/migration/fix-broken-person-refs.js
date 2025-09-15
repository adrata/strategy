const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBrokenPersonRefs() {
  console.log('🔧 FIXING BROKEN PERSON REFERENCES');
  console.log('===================================');
  console.log('Fixing actions with invalid personId references...\n');

  let stats = {
    brokenRefsFound: 0,
    refsFixed: 0,
    refsCleared: 0,
    errors: 0
  };

  try {
    // STEP 1: Find actions with broken person references
    console.log('🔄 STEP 1: Finding actions with broken person references...');
    
    const brokenRefs = await prisma.$queryRaw`
      SELECT 
        a.id,
        a.type,
        a.subject,
        a."personId",
        a."companyId",
        a."createdAt"
      FROM actions a
      LEFT JOIN people p ON a."personId" = p.id
      WHERE a."personId" IS NOT NULL AND p.id IS NULL
      ORDER BY a."createdAt" DESC
    `;
    
    stats.brokenRefsFound = brokenRefs.length;
    console.log(`Found ${brokenRefs.length} actions with broken person references`);
    
    if (brokenRefs.length === 0) {
      console.log('✅ No broken person references found!');
      return;
    }

    // STEP 2: Analyze broken references
    console.log('\n🔄 STEP 2: Analyzing broken references...');
    
    console.log('Actions with broken person references:');
    brokenRefs.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.type}: "${action.subject}" (personId: ${action.personId})`);
    });

    // STEP 3: Fix broken references
    console.log('\n🔄 STEP 3: Fixing broken references...');
    
    for (const action of brokenRefs) {
      try {
        // Try to find a person by name in the action subject
        let personFound = null;
        
        if (action.subject) {
          // Extract potential person name from subject
          const subjectWords = action.subject.split(' ');
          
          // Try to find person by first name or full name
          for (let i = 0; i < subjectWords.length; i++) {
            const searchTerm = subjectWords[i];
            if (searchTerm.length > 2) { // Skip short words
              const people = await prisma.people.findMany({
                where: {
                  OR: [
                    { firstName: { contains: searchTerm, mode: 'insensitive' } },
                    { lastName: { contains: searchTerm, mode: 'insensitive' } },
                    { fullName: { contains: searchTerm, mode: 'insensitive' } }
                  ]
                },
                take: 1
              });
              
              if (people.length > 0) {
                personFound = people[0];
                break;
              }
            }
          }
        }
        
        if (personFound) {
          // Update with correct personId
          await prisma.actions.update({
            where: { id: action.id },
            data: { personId: personFound.id }
          });
          console.log(`  ✅ Fixed action "${action.subject}" - linked to person "${personFound.fullName}"`);
          stats.refsFixed++;
        } else {
          // Clear the broken personId reference
          await prisma.actions.update({
            where: { id: action.id },
            data: { personId: null }
          });
          console.log(`  🧹 Cleared broken personId for action: "${action.subject}"`);
          stats.refsCleared++;
        }
        
      } catch (error) {
        console.error(`  ❌ Failed to fix action ${action.id}:`, error.message);
        stats.errors++;
      }
    }

    // STEP 4: Summary
    console.log('\n📋 BROKEN PERSON REFERENCES FIX SUMMARY');
    console.log('========================================');
    console.log(`Broken references found: ${stats.brokenRefsFound}`);
    console.log(`References fixed (linked to correct person): ${stats.refsFixed}`);
    console.log(`References cleared (personId set to null): ${stats.refsCleared}`);
    console.log(`Errors encountered: ${stats.errors}`);
    
    if (stats.errors === 0) {
      console.log('\n🎉 Broken person references fix completed successfully!');
    } else {
      console.log('\n⚠️  Fix completed with some errors.');
    }

    // STEP 5: Verify fix
    console.log('\n🔍 VERIFICATION:');
    
    const remainingBrokenRefs = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM actions a
      LEFT JOIN people p ON a."personId" = p.id
      WHERE a."personId" IS NOT NULL AND p.id IS NULL
    `;
    
    console.log(`Remaining broken person references: ${remainingBrokenRefs[0].count}`);
    
    if (remainingBrokenRefs[0].count === 0) {
      console.log('✅ All broken person references have been resolved!');
    } else {
      console.log(`⚠️  ${remainingBrokenRefs[0].count} broken person references still remain`);
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixBrokenPersonRefs()
  .then(() => {
    console.log('\n✅ Broken person references fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });

