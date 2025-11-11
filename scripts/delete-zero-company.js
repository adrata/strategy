/**
 * Delete the "0" company from Top-Temp workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function deleteZeroCompany() {
  try {
    console.log('🗑️  Deleting company "0"...\n');
    console.log('='.repeat(60));

    // Find the "0" company
    const zeroCompany = await prisma.companies.findFirst({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        name: '0',
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            people: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    if (!zeroCompany) {
      console.log('⚠️  Company "0" not found (may already be deleted)\n');
      return;
    }

    console.log(`Found company "0":`);
    console.log(`  ID: ${zeroCompany.id}`);
    console.log(`  People associated: ${zeroCompany._count.people}`);

    if (zeroCompany._count.people > 0) {
      console.log(`\n⚠️  Warning: This company has ${zeroCompany._count.people} people associated with it.`);
      console.log('   People will be unlinked from the company.\n');
    }

    // Soft delete the company
    await prisma.companies.update({
      where: { id: zeroCompany.id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Successfully deleted company "0"\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  deleteZeroCompany()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = deleteZeroCompany;
