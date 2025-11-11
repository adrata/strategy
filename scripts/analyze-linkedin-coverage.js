/**
 * Analyze LinkedIn URL coverage in Top-Temp workspace
 * Check if companies that should have LinkedIn URLs are missing them
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

async function analyzeLinkedInCoverage() {
  try {
    console.log('📊 Analyzing LinkedIn URL coverage in Top-Temp workspace\n');
    console.log('='.repeat(60));

    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    // Get all companies
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        name: true,
        website: true,
        linkedinUrl: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const total = allCompanies.length;
    const withLinkedIn = allCompanies.filter(c => c.linkedinUrl && c.linkedinUrl.trim() !== '').length;
    const withoutLinkedIn = total - withLinkedIn;
    const withWebsite = allCompanies.filter(c => c.website && c.website.trim() !== '').length;
    const withWebsiteButNoLinkedIn = allCompanies.filter(c => 
      c.website && c.website.trim() !== '' && (!c.linkedinUrl || c.linkedinUrl.trim() === '')
    ).length;

    console.log('='.repeat(60));
    console.log('📊 COVERAGE ANALYSIS');
    console.log('='.repeat(60));
    console.log(`Total companies: ${total}`);
    console.log(`Companies WITH LinkedIn URLs: ${withLinkedIn} (${((withLinkedIn/total)*100).toFixed(1)}%)`);
    console.log(`Companies WITHOUT LinkedIn URLs: ${withoutLinkedIn} (${((withoutLinkedIn/total)*100).toFixed(1)}%)`);
    console.log(`\nCompanies with website: ${withWebsite}`);
    console.log(`Companies with website BUT NO LinkedIn: ${withWebsiteButNoLinkedIn}`);
    console.log('='.repeat(60));

    // Show some companies without LinkedIn that have websites
    if (withWebsiteButNoLinkedIn > 0) {
      const sampleMissing = allCompanies
        .filter(c => c.website && c.website.trim() !== '' && (!c.linkedinUrl || c.linkedinUrl.trim() === ''))
        .slice(0, 10);

      console.log('\n📋 Sample companies with website but NO LinkedIn URL:');
      sampleMissing.forEach((company, idx) => {
        console.log(`  ${idx + 1}. ${company.name}`);
        console.log(`     Website: ${company.website}`);
      });
    }

    // Check when LinkedIn URLs were last updated
    const recentlyUpdated = allCompanies
      .filter(c => c.linkedinUrl && c.linkedinUrl.trim() !== '')
      .filter(c => {
        const updated = new Date(c.updatedAt);
        const today = new Date();
        return updated.toDateString() === today.toDateString();
      });

    console.log(`\n📅 Companies updated TODAY: ${recentlyUpdated.length}`);
    if (recentlyUpdated.length > 0) {
      console.log('   (These were likely updated by our script)');
    }

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  analyzeLinkedInCoverage()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = analyzeLinkedInCoverage;

