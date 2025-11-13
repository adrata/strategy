/**
 * Backfill Titles from Enrichment Data
 * 
 * This script finds Person records that are missing titles but have enrichment data
 * in customFields, and extracts titles from that enrichment data.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import the title extraction utility (Node.js compatible version)
function extractTitleFromEnrichment(customFields) {
  if (!customFields) return null;

  // Try CoreSignal
  const coresignal = customFields.coresignalData || customFields.coresignal;
  if (coresignal) {
    if (coresignal.active_experience_title) return coresignal.active_experience_title;
    if (coresignal.job_title) return coresignal.job_title;
    if (coresignal.experience && Array.isArray(coresignal.experience)) {
      const currentRole = coresignal.experience.find(exp => 
        exp.active_experience === 1 || exp.is_current === true || !exp.end_date
      );
      if (currentRole?.position_title || currentRole?.title) {
        return currentRole.position_title || currentRole.title;
      }
      if (coresignal.experience.length > 0) {
        return coresignal.experience[0].position_title || coresignal.experience[0].title || null;
      }
    }
  }

  // Try Lusha
  const lusha = customFields.lusha || customFields.enrichedData;
  if (lusha) {
    if (lusha.currentTitle) return lusha.currentTitle;
    if (lusha.jobTitle) return lusha.jobTitle;
    if (lusha.current_position?.title) return lusha.current_position.title;
  }

  // Try PDL
  if (customFields.pdlData) {
    if (customFields.pdlData.job_title) return customFields.pdlData.job_title;
    if (customFields.pdlData.current_title) return customFields.pdlData.current_title;
  }

  return null;
}

async function backfillTitles(workspaceId) {
  console.log(`🔍 Starting title backfill for workspace: ${workspaceId}\n`);

  try {
    // Find all people missing titles but with enrichment data
    const peopleMissingTitles = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        OR: [
          { jobTitle: null },
          { jobTitle: '' }
        ],
        AND: [
          {
            customFields: {
              not: null
            }
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        customFields: true
      }
    });

    console.log(`📊 Found ${peopleMissingTitles.length} people missing titles with enrichment data\n`);

    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const person of peopleMissingTitles) {
      try {
        const extractedTitle = extractTitleFromEnrichment(person.customFields);

        if (!extractedTitle) {
          skipped++;
          continue;
        }

        // Update person with extracted title
        await prisma.people.update({
          where: { id: person.id },
          data: {
            jobTitle: person.jobTitle || extractedTitle,
            updatedAt: new Date()
          }
        });

        updated++;
        console.log(`✅ Updated ${person.fullName} (${person.email || 'no email'}): "${extractedTitle}"`);
      } catch (error) {
        errors.push({
          person: person.fullName,
          id: person.id,
          error: error.message
        });
        console.error(`❌ Error updating ${person.fullName}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped} (no title found in enrichment data)`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ Errors:`);
      errors.forEach(err => {
        console.log(`   - ${err.person} (${err.id}): ${err.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backfill
(async () => {
  const workspaceId = process.env.WORKSPACE_ID || process.argv[2];

  if (!workspaceId) {
    console.error('❌ Error: WORKSPACE_ID environment variable or workspace ID argument required');
    console.log('Usage: node backfill-titles-from-enrichment.js <workspaceId>');
    process.exit(1);
  }

  try {
    await backfillTitles(workspaceId);
    console.log('\n✅ Backfill completed successfully');
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    // Small delay to ensure Prisma disconnect completes before exit
    await new Promise(resolve => setTimeout(resolve, 100));
    process.exit(1);
  }
})();

