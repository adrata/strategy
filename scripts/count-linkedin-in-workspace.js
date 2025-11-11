/**
 * Count companies with LinkedIn URLs in Top-Temp workspace
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

async function countLinkedInUrls() {
  try {
    console.log('📊 Counting companies with LinkedIn URLs in Top-Temp workspace\n');
    console.log('='.repeat(60));

    // Get workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`Workspace: ${workspace.name} (${workspace.id})\n`);

    // Count total companies
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    // Count companies with LinkedIn URLs
    const companiesWithLinkedIn = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        linkedinUrl: {
          not: null
        }
      }
    });

    // Count companies without LinkedIn URLs
    const companiesWithoutLinkedIn = totalCompanies - companiesWithLinkedIn;

    // Get percentage
    const percentage = totalCompanies > 0 
      ? ((companiesWithLinkedIn / totalCompanies) * 100).toFixed(1)
      : 0;

    console.log('='.repeat(60));
    console.log('📊 RESULTS');
    console.log('='.repeat(60));
    console.log(`Total companies: ${totalCompanies}`);
    console.log(`Companies WITH LinkedIn URLs: ${companiesWithLinkedIn} (${percentage}%)`);
    console.log(`Companies WITHOUT LinkedIn URLs: ${companiesWithoutLinkedIn} (${(100 - percentage).toFixed(1)}%)`);
    console.log('='.repeat(60));

    // Show some examples
    if (companiesWithLinkedIn > 0) {
      const sampleWithLinkedIn = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          linkedinUrl: {
            not: null
          }
        },
        select: {
          name: true,
          linkedinUrl: true
        },
        take: 5,
        orderBy: {
          name: 'asc'
        }
      });

      console.log('\n📋 Sample companies WITH LinkedIn URLs:');
      sampleWithLinkedIn.forEach((company, idx) => {
        console.log(`  ${idx + 1}. ${company.name}`);
        console.log(`     ${company.linkedinUrl}`);
      });
    }

    if (companiesWithoutLinkedIn > 0) {
      const sampleWithoutLinkedIn = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          linkedinUrl: null
        },
        select: {
          name: true
        },
        take: 5,
        orderBy: {
          name: 'asc'
        }
      });

      console.log('\n📋 Sample companies WITHOUT LinkedIn URLs:');
      sampleWithoutLinkedIn.forEach((company, idx) => {
        console.log(`  ${idx + 1}. ${company.name}`);
      });
    }

    console.log('\n✅ Count complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  countLinkedInUrls()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = countLinkedInUrls;

