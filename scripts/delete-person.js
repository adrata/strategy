/**
 * Delete a person by ID
 * Usage: node scripts/delete-person.js <personId> [mode]
 * 
 * Examples:
 *   node scripts/delete-person.js 01K9QDKNYK00FPWPYRDT3CE8SX
 *   node scripts/delete-person.js 01K9QDKNYK00FPWPYRDT3CE8SX hard
 */

const { getPrismaClient } = require('./lib/prisma-client');

async function deletePerson(personId, mode = 'soft') {
  if (!personId) {
    console.error('❌ Person ID is required');
    console.error('Usage: node scripts/delete-person.js <personId> [mode]');
    process.exit(1);
  }

  const prisma = getPrismaClient();
  
  try {
    console.log(`🔍 Looking up person: ${personId}...`);
    
    // Check if person exists (including deleted ones for hard delete)
    const existingPerson = await prisma.people.findUnique({
      where: { 
        id: personId
      },
      include: {
        _count: {
          select: {
            actions: {
              where: {
                deletedAt: null
              }
            },
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          }
        }
      },
    });

    if (!existingPerson) {
      console.error(`❌ Person not found: ${personId}`);
      console.error('   The person does not exist in the database.');
      process.exit(1);
    }

    const isAlreadyDeleted = !!existingPerson.deletedAt;
    
    console.log(`✅ Found person: ${existingPerson.fullName || existingPerson.firstName || 'Unknown'}`);
    console.log(`   Workspace: ${existingPerson.workspace?.name || 'Unknown'}`);
    console.log(`   Actions: ${existingPerson._count.actions}`);
    if (isAlreadyDeleted) {
      console.log(`   Status: Already soft-deleted (${existingPerson.deletedAt})`);
      if (mode === 'soft') {
        console.log(`\n⚠️  Person is already soft-deleted. No action needed.`);
        return;
      }
    }

    // For hard delete, check if person has related data
    if (mode === 'hard' && existingPerson._count.actions > 0) {
      console.error(`❌ Cannot hard delete person with ${existingPerson._count.actions} associated actions.`);
      console.error('   Please remove or reassign them first, or use soft delete mode.');
      process.exit(1);
    }

    // Perform deletion
    if (mode === 'hard') {
      console.log(`🗑️  Hard deleting person (permanent removal)...`);
      await prisma.people.delete({
        where: { id: personId },
      });
      console.log(`✅ Person permanently deleted: ${personId}`);
    } else {
      console.log(`🗑️  Soft deleting person (setting deletedAt)...`);
      await prisma.people.update({
        where: { id: personId },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Person soft deleted: ${personId}`);
    }

    console.log(`\n✅ Success! Person ${mode === 'hard' ? 'permanently deleted' : 'deleted'} successfully.`);

  } catch (error) {
    console.error('❌ Error deleting person:');
    console.error('   Message:', error.message);
    
    if (error.code) {
      console.error('   Code:', error.code);
    }
    
    if (error.meta) {
      console.error('   Meta:', JSON.stringify(error.meta, null, 2));
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('   Stack:', error.stack);
    }
    
    process.exit(1);
  } finally {
    // Properly disconnect Prisma to avoid UV_HANDLE_CLOSING errors
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors if already disconnected
      if (!disconnectError.message?.includes('already been disconnected')) {
        console.warn('⚠️  Warning during disconnect:', disconnectError.message);
      }
    }
  }
}

// Get command line arguments
const personId = process.argv[2];
const mode = process.argv[3] || 'soft';

if (!personId) {
  console.error('❌ Person ID is required');
  console.error('Usage: node scripts/delete-person.js <personId> [mode]');
  console.error('   mode: "soft" (default) or "hard"');
  process.exit(1);
}

if (mode !== 'soft' && mode !== 'hard') {
  console.error('❌ Invalid mode. Must be "soft" or "hard"');
  process.exit(1);
}

// Run the deletion
deletePerson(personId, mode).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

