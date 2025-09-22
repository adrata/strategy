const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicatePeople() {
  try {
    console.log('🧹 Cleaning up duplicate people records...');
    
    // Find all people in the TOP workspace
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1'
      },
      select: {
        id: true,
        fullName: true,
        companyId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`📊 Found ${allPeople.length} total people records`);
    
    // Group by fullName and companyId
    const groupedPeople = {};
    allPeople.forEach(person => {
      const key = `${person.fullName}-${person.companyId}`;
      if (!groupedPeople[key]) {
        groupedPeople[key] = [];
      }
      groupedPeople[key].push(person);
    });
    
    // Find duplicates
    const duplicates = Object.entries(groupedPeople).filter(([key, people]) => people.length > 1);
    
    console.log(`🔍 Found ${duplicates.length} groups with duplicates:`);
    
    for (const [key, people] of duplicates) {
      console.log(`\n👥 ${key}:`);
      people.forEach(person => {
        console.log(`  - ${person.id} (created: ${person.createdAt}, updated: ${person.updatedAt})`);
      });
      
      // Keep the most recently updated record, delete the others
      const sortedPeople = people.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const keepPerson = sortedPeople[0];
      const deletePeople = sortedPeople.slice(1);
      
      console.log(`  ✅ Keeping: ${keepPerson.id} (most recent)`);
      
      for (const deletePerson of deletePeople) {
        console.log(`  🗑️  Deleting: ${deletePerson.id}`);
        await prisma.people.delete({
          where: { id: deletePerson.id }
        });
      }
    }
    
    console.log('\n✅ Duplicate cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicatePeople();
