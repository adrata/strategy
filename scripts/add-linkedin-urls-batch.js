/**
 * Add LinkedIn URLs and update websites for companies in Top-Temp workspace
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

// Companies to update with LinkedIn URLs and websites
const companiesToUpdate = [
  { name: "Actelant", website: "https://www.actalentservices.com/en", linkedin: "https://www.linkedin.com/company/actalentservices" },
  { name: "Coleman County Telephone Coop. Inc.", website: "https://www.cctelco.org", linkedin: "https://www.linkedin.com/showcase/coleman-county-telephone-cooperative-inc/" },
  { name: "El-Gi", website: "https://www.elgi.com/us", linkedin: "https://www.linkedin.com/company/elginorthamerica" },
  { name: "FTI Belman", website: "https://ftibelman.com", linkedin: "https://www.linkedin.com/company/field-telecomms-inc" },
  { name: "Florida Power Corporation", website: "https://www.fpl.com", linkedin: "https://www.linkedin.com/company/fpl" },
  { name: "GAC Enterprises | Central", website: "https://www.gacenterprisesllc.com", linkedin: "https://www.linkedin.com/company/gac-enterprises-llc" },
  { name: "GAC Enterprises, LLC", website: "https://www.gacenterprisesllc.com", linkedin: "https://www.linkedin.com/company/gac-enterprises-llc" },
  { name: "GCP Technologies LLC", website: "https://www.gcptech.com", linkedin: "https://www.linkedin.com/company/gcp-technologies-llc" },
  { name: "Hamilton Industries", website: "https://hamiltonindustries.com", linkedin: "https://www.linkedin.com/company/hamilton-industries-llc" },
  { name: "Heritage Broadband, LLC", website: "https://www.heritagebroadband.com", linkedin: "https://www.linkedin.com/company/heritage-broadband-llc" },
  { name: "Hilliary", website: "https://hilliary.com", linkedin: "https://www.linkedin.com/company/hilliary" },
  { name: "Hyperion Solutions Group", website: "https://hyperionsolutionsgroup.com", linkedin: "https://www.linkedin.com/company/hyperion-solutions-group-llc" },
  { name: "IPS", website: "https://www.ips.us", linkedin: "https://www.linkedin.com/company/ips" },
  { name: "Industry Telephone Company", website: "https://www.industrytelco.com", linkedin: "https://www.linkedin.com/company/industry-telephone-company" },
  { name: "Innovative Network Services", website: "https://www.ins-osp.com", linkedin: "https://www.linkedin.com/company/ins-osp-llc" },
  { name: "JTH Agencies", website: "https://www.jthagencies.com", linkedin: "https://www.linkedin.com/company/jth-agencies-llc" },
  { name: "Micronet Communications", website: "https://www.micronetcom.com", linkedin: "https://www.linkedin.com/company/micronet-communications-inc-" },
  { name: "Mid America Computer Corp (MACC)", website: "https://maccnet.com", linkedin: "https://www.linkedin.com/company/macc" },
  { name: "PSEG-LI", website: "https://www.psegliny.com", linkedin: "https://www.linkedin.com/company/psegli" },
  { name: "Schweitzer Engineering Laboratories Inc. (SEL)", website: "https://selinc.com", linkedin: "https://www.linkedin.com/company/sel" },
  { name: "Texas Lone Star Network - TLSN", website: "https://www.tlsn.us", linkedin: "https://www.linkedin.com/company/texas-lone-star-network-llc" },
  { name: "Wheatland Electric Cooperative", website: "https://www.weci.net", linkedin: "https://www.linkedin.com/company/wheatland-electric-cooperative-inc." }
];

async function updateCompanies() {
  try {
    console.log('🔄 Adding LinkedIn URLs and updating websites...\n');
    console.log('='.repeat(60));

    // Get workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    console.log(`📊 Processing ${companiesToUpdate.length} companies...\n`);

    let updated = 0;
    let created = 0;
    let notFound = 0;
    let errors = 0;

    for (const companyData of companiesToUpdate) {
      try {
        const { name: companyName, website, linkedin: linkedinUrl } = companyData;

        // Find company in database
        const company = await prisma.companies.findFirst({
          where: {
            workspaceId: workspace.id,
            name: {
              equals: companyName,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        if (company) {
          // Update existing company
          const updateData = {
            updatedAt: new Date()
          };

          if (website) {
            updateData.website = website;
          }

          if (linkedinUrl) {
            updateData.linkedinUrl = linkedinUrl;
          }

          await prisma.companies.update({
            where: { id: company.id },
            data: updateData
          });

          updated++;
          console.log(`   ✅ Updated: ${companyName}`);
          console.log(`      Website: ${website}`);
          console.log(`      LinkedIn: ${linkedinUrl}`);
        } else {
          // Company not found - might need to create it or check for similar names
          notFound++;
          console.log(`   ⚠️  Not found: ${companyName}`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${companyData.name}:`, error.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Companies updated: ${updated}`);
    console.log(`Companies created: ${created}`);
    console.log(`Companies not found: ${notFound}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));

    // Final count
    const finalCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        linkedinUrl: {
          not: null
        }
      }
    });

    const totalCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    console.log(`\n📊 FINAL STATE:`);
    console.log(`   Total companies: ${totalCount}`);
    console.log(`   Companies with LinkedIn URLs: ${finalCount} (${((finalCount / totalCount) * 100).toFixed(1)}%)`);
    console.log(`   Companies without LinkedIn URLs: ${totalCount - finalCount} (${(((totalCount - finalCount) / totalCount) * 100).toFixed(1)}%)`);
    console.log('='.repeat(60));
    console.log('✅ Update complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  updateCompanies()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = updateCompanies;

