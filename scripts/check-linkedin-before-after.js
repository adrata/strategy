/**
 * Check if companies we just updated already had LinkedIn URLs
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_SLUG = 'top-temp';

// Sample of companies we just updated (from the CSV files)
const companiesWeUpdated = [
  "5Bars Services",
  "ACRS Telecommunications Engineers",
  "ADCOMM Engineering, LLC",
  "AMC Optics",
  "AMSYS Group",
  "APPROVE",
  "Airway Technologies",
  "American Power Systems",
  "Ants-technology",
  "ArchComm"
];

async function checkLinkedInStatus() {
  try {
    console.log('🔍 Checking LinkedIn URL status for companies we just updated\n');
    console.log('='.repeat(60));

    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`Workspace: ${workspace.name}\n`);

    let hadLinkedInBefore = 0;
    let didNotHaveLinkedIn = 0;
    let notFound = 0;

    console.log('Checking sample companies:\n');

    for (const companyName of companiesWeUpdated) {
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId: workspace.id,
          name: {
            equals: companyName,
            mode: 'insensitive'
          },
          deletedAt: null
        },
        select: {
          name: true,
          linkedinUrl: true,
          updatedAt: true
        }
      });

      if (!company) {
        console.log(`❌ ${companyName}: NOT FOUND in workspace`);
        notFound++;
      } else {
        const hasLinkedIn = company.linkedinUrl && company.linkedinUrl.trim() !== '';
        if (hasLinkedIn) {
          console.log(`✅ ${companyName}: HAS LinkedIn URL`);
          console.log(`   ${company.linkedinUrl}`);
          hadLinkedInBefore++;
        } else {
          console.log(`⚠️  ${companyName}: NO LinkedIn URL`);
          didNotHaveLinkedIn++;
        }
        console.log(`   Last updated: ${company.updatedAt}`);
        console.log('');
      }
    }

    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Companies checked: ${companiesWeUpdated.length}`);
    console.log(`Already had LinkedIn: ${hadLinkedInBefore}`);
    console.log(`Did not have LinkedIn: ${didNotHaveLinkedIn}`);
    console.log(`Not found: ${notFound}`);
    console.log('='.repeat(60));

    // Also check overall stats
    const totalWithLinkedIn = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        linkedinUrl: {
          not: null
        }
      }
    });

    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    console.log(`\nOverall workspace stats:`);
    console.log(`Total companies: ${totalCompanies}`);
    console.log(`Companies with LinkedIn: ${totalWithLinkedIn} (${((totalWithLinkedIn/totalCompanies)*100).toFixed(1)}%)`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  checkLinkedInStatus()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = checkLinkedInStatus;

