/**
 * Check LinkedIn URL status in Top-Temp workspace
 * Shows breakdown of companies with/without LinkedIn URLs
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

async function checkLinkedInStatus() {
  try {
    console.log('📊 Checking LinkedIn URL status in Top-Temp workspace\n');
    console.log('='.repeat(60));

    // Get workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`Workspace: ${workspace.name} (${workspace.id})\n`);

    // Get all companies with details
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        name: true,
        website: true,
        linkedinUrl: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const total = allCompanies.length;
    const withLinkedIn = allCompanies.filter(c => c.linkedinUrl && c.linkedinUrl.trim() !== '');
    const withoutLinkedIn = allCompanies.filter(c => !c.linkedinUrl || c.linkedinUrl.trim() === '');

    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total companies: ${total}`);
    console.log(`Companies WITH LinkedIn URLs: ${withLinkedIn.length} (${((withLinkedIn.length / total) * 100).toFixed(1)}%)`);
    console.log(`Companies WITHOUT LinkedIn URLs: ${withoutLinkedIn.length} (${((withoutLinkedIn.length / total) * 100).toFixed(1)}%)`);
    console.log('='.repeat(60));

    // Check when LinkedIn URLs were added (recently updated)
    const recentlyUpdated = withLinkedIn.filter(c => {
      const updated = new Date(c.updatedAt);
      const now = new Date();
      const hoursAgo = (now - updated) / (1000 * 60 * 60);
      return hoursAgo < 24; // Updated in last 24 hours
    });

    console.log(`\n📅 Companies updated in last 24 hours: ${recentlyUpdated.length}`);
    console.log(`📅 Companies with LinkedIn URLs (older): ${withLinkedIn.length - recentlyUpdated.length}`);

    // Show breakdown by website status
    const withLinkedInAndWebsite = withLinkedIn.filter(c => c.website && c.website.trim() !== '');
    const withLinkedInNoWebsite = withLinkedIn.filter(c => !c.website || c.website.trim() === '');

    console.log(`\n🌐 Companies with LinkedIn URLs:`);
    console.log(`   - Also have website: ${withLinkedInAndWebsite.length}`);
    console.log(`   - No website: ${withLinkedInNoWebsite.length}`);

    // Show some examples of companies with LinkedIn URLs
    console.log(`\n📋 Sample companies WITH LinkedIn URLs (first 10):`);
    withLinkedIn.slice(0, 10).forEach((company, idx) => {
      const updated = new Date(company.updatedAt);
      const hoursAgo = ((new Date() - updated) / (1000 * 60 * 60)).toFixed(1);
      console.log(`  ${idx + 1}. ${company.name}`);
      console.log(`     LinkedIn: ${company.linkedinUrl}`);
      console.log(`     Updated: ${hoursAgo} hours ago`);
    });

    // Show some examples of companies without LinkedIn URLs
    console.log(`\n📋 Sample companies WITHOUT LinkedIn URLs (first 10):`);
    withoutLinkedIn.slice(0, 10).forEach((company, idx) => {
      const hasWebsite = company.website && company.website.trim() !== '';
      console.log(`  ${idx + 1}. ${company.name}${hasWebsite ? ` (has website: ${company.website})` : ' (no website)'}`);
    });

    console.log('\n✅ Check complete!\n');

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
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = checkLinkedInStatus;

