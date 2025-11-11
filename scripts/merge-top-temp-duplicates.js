/**
 * Merge clear duplicates in Top-Temp workspace
 * Only merges companies that are clearly the same entity
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

// Clear duplicates to merge - only companies that are definitely the same
const duplicatesToMerge = [
  {
    primary: 'Alabama Power Company', // Keep this one (has more people: 14)
    secondary: 'Alabama Power'
  },
  {
    primary: 'ELGi', // Keep this one (simpler name)
    secondary: 'El-Gi'
  },
  {
    primary: 'Expanse Electrical Co.', // Keep this one (more complete name)
    secondary: 'Expanse Electrical'
  },
  {
    primary: 'Pem-Tex, LLC', // Keep this one (has proper website)
    secondary: 'Pem-Tex LLC'
  },
  {
    primary: 'Pem-Tex, LLC', // Keep this one
    secondary: 'Pem-Tex,LLC'
  },
  {
    primary: 'Southern California Edison Company', // Keep this one (has more people: 71)
    secondary: 'Southern California Edison'
  },
  {
    primary: 'Omni Cable', // Keep this one (has proper website)
    secondary: 'OmniCable'
  },
  {
    primary: 'Chelan County Public Utility District No. 1', // Keep this one (has more people: 2)
    secondary: 'Chelan County Public Utility District No. 2'
  },
  {
    primary: 'Exelon Corporation', // Keep this one (has more people: 9)
    secondary: 'Exelon'
  },
  {
    primary: 'Georgia System Operations Corporation', // Keep this one (has more people: 3)
    secondary: 'Georgia System Operations Corp.'
  },
  {
    primary: 'Micronet Communications, Inc.', // Keep this one (more complete name)
    secondary: 'Micronet Communications'
  },
  {
    primary: 'Tucson Electric Power', // Keep this one (has website)
    secondary: 'Tucson Electric Power Co'
  },
  {
    primary: 'Wheatland Electric Cooperative, Inc.', // Keep this one (more complete name)
    secondary: 'Wheatland Electric Cooperative'
  }
];

function chooseBestCompany(company1, company2) {
  // Prefer company with more people
  if (company1.peopleCount > company2.peopleCount) return company1;
  if (company2.peopleCount > company1.peopleCount) return company2;
  
  // If same people count, prefer the one with more complete data
  const score1 = (company1.website ? 1 : 0) + (company1.linkedinUrl ? 1 : 0);
  const score2 = (company2.website ? 1 : 0) + (company2.linkedinUrl ? 1 : 0);
  if (score1 > score2) return company1;
  if (score2 > score1) return company2;
  
  // If still tied, prefer the older one (created first)
  return new Date(company1.createdAt) < new Date(company2.createdAt) ? company1 : company2;
}

async function mergeDuplicates() {
  try {
    console.log('🔄 Merging clear duplicates in Top-Temp workspace\n');
    console.log('='.repeat(60));
    console.log(`Processing ${duplicatesToMerge.length} duplicate pairs\n`);

    let merged = 0;
    let skipped = 0;
    let errors = 0;
    const mergeResults = [];

    for (const pair of duplicatesToMerge) {
      try {
        // Find both companies
        const primaryCompany = await prisma.companies.findFirst({
          where: {
            workspaceId: TOP_TEMP_WORKSPACE_ID,
            name: {
              equals: pair.primary,
              mode: 'insensitive'
            },
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

        const secondaryCompany = await prisma.companies.findFirst({
          where: {
            workspaceId: TOP_TEMP_WORKSPACE_ID,
            name: {
              equals: pair.secondary,
              mode: 'insensitive'
            },
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

        if (!primaryCompany) {
          console.log(`⚠️  Primary company not found: "${pair.primary}"`);
          skipped++;
          continue;
        }

        if (!secondaryCompany) {
          console.log(`⚠️  Secondary company not found: "${pair.secondary}"`);
          skipped++;
          continue;
        }

        // Verify they're actually different companies
        if (primaryCompany.id === secondaryCompany.id) {
          console.log(`⚠️  Same company: "${pair.primary}"`);
          skipped++;
          continue;
        }

        console.log(`\nMerging:`);
        console.log(`  Primary: "${primaryCompany.name}" (ID: ${primaryCompany.id}, People: ${primaryCompany._count.people})`);
        console.log(`  Secondary: "${secondaryCompany.name}" (ID: ${secondaryCompany.id}, People: ${secondaryCompany._count.people})`);

        // Merge data - take best from both
        const mergedData = {
          website: primaryCompany.website || secondaryCompany.website || null,
          linkedinUrl: primaryCompany.linkedinUrl || secondaryCompany.linkedinUrl || null,
          updatedAt: new Date()
        };

        // Update primary company with merged data
        await prisma.companies.update({
          where: { id: primaryCompany.id },
          data: mergedData
        });

        // Move people from secondary to primary
        if (secondaryCompany._count.people > 0) {
          await prisma.people.updateMany({
            where: {
              companyId: secondaryCompany.id,
              deletedAt: null
            },
            data: {
              companyId: primaryCompany.id,
              updatedAt: new Date()
            }
          });
          console.log(`  ✅ Moved ${secondaryCompany._count.people} people to primary company`);
        }

        // Soft delete secondary company
        await prisma.companies.update({
          where: { id: secondaryCompany.id },
          data: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        merged++;
        mergeResults.push({
          primary: primaryCompany.name,
          secondary: secondaryCompany.name,
          peopleMoved: secondaryCompany._count.people
        });

        console.log(`  ✅ Successfully merged and deleted secondary company`);

      } catch (error) {
        console.error(`  ❌ Error merging "${pair.primary}" and "${pair.secondary}":`, error.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MERGE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Pairs processed: ${duplicatesToMerge.length}`);
    console.log(`Successfully merged: ${merged}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));

    // Final count
    const finalCount = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      }
    });

    console.log(`\n📊 FINAL STATE:`);
    console.log(`   Total companies: ${finalCount}`);
    console.log(`   Companies removed: ${merged}`);
    console.log('='.repeat(60));
    console.log('✅ Merge complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  mergeDuplicates()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = mergeDuplicates;
