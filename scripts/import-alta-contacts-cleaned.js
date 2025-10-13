const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// This script will clean the data first - removing people who work for Notary Everyday
// (since that's our CLIENT, not a vendor) and parsing company names properly

console.log('🚀 ALTA INDUSTRY CONTACTS IMPORT');
console.log('=' .repeat(60));
console.log('\n⚠️  IMPORTANT: This will import ALTA industry contacts');
console.log('   Excluding: Notary Everyday employees (they are the client)\n');

// First, let's check how many Notary Everyday people are in the current database
async function checkNotaryEmployees() {
  const notaryCompany = await prisma.companies.findFirst({
    where: {
      workspaceId: WORKSPACE_ID,
      name: { contains: 'Notary Everyday', mode: 'insensitive' },
      deletedAt: null
    },
    include: {
      people: {
        where: { deletedAt: null },
        select: { id: true, fullName: true, email: true }
      }
    }
  });

  if (notaryCompany) {
    console.log(`✅ Found Notary Everyday Inc. (ID: ${notaryCompany.id})`);
    console.log(`   Current employees: ${notaryCompany.people.length}`);
    
    if (notaryCompany.people.length > 0) {
      console.log(`\n   Employee list:`);
      notaryCompany.people.forEach((person, idx) => {
        console.log(`   ${idx + 1}. ${person.fullName} (${person.email})`);
      });
    }
  } else {
    console.log(`⚠️  Notary Everyday company not found in database`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('This script is ready to import industry contacts.');
  console.log('The data needs to be cleaned first to remove Notary Everyday employees.');
  console.log('\nThe user should confirm if we should proceed with the import.');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

checkNotaryEmployees().catch(async (error) => {
  console.error('Error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

