/**
 * Update companies with LinkedIn URLs and websites in Top-Temp workspace
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

// Companies to update
const companiesToUpdate = [
  { name: "Altamaha EMC", website: "https://altamahaemc.com", linkedin: "" },
  { name: "B&A telecom", website: "", linkedin: "" },
  { name: "Bell County Technology Services", website: "https://bellcounty.texas.gov", linkedin: "" },
  { name: "Big Horn Rural Electric Cooperative", website: "https://bighornrea.com", linkedin: "" },
  { name: "BirdComm Solutions", website: "https://birdcomm.net", linkedin: "" },
  { name: "Bottom -", website: "", linkedin: "" },
  { name: "Brazos Communications", website: "https://www.brazosnet.com", linkedin: "" },
  { name: "Brazos Wifi", website: "https://brazoswifi.com", linkedin: "https://www.linkedin.com/company/brazos-wifi" },
  { name: "Choctaw Telecommunications", website: "https://choctawtelecom.com", linkedin: "" },
  { name: "DAVIS CABLE TECHNOLOGIES", website: "", linkedin: "https://www.linkedin.com/company/davis-cable-technologies" },
  { name: "Ditch Witch of Central Texas", website: "https://ditchwitchctx.com", linkedin: "" },
  { name: "Dixie Electric Power Association", website: "https://www.dixieepa.com", linkedin: "" },
  { name: "EPC, LLC", website: "https://epcunderground.com", linkedin: "" },
  { name: "Excelsior Electric Membership Corporation", website: "https://excelsioremc.com", linkedin: "" },
  { name: "Four D construction", website: "https://fourdconstruction.com", linkedin: "" },
  { name: "G Force Fiber Optics", website: "https://gffs.us", linkedin: "" },
  { name: "Global Utility Infrastructure", website: "https://www.globalui.net", linkedin: "" },
  { name: "Global Utility Infrastructure & HDD, LLC", website: "https://www.globalui.net", linkedin: "" },
  { name: "Hunt Communications", website: "https://hunt-utilities.com", linkedin: "https://www.linkedin.com/company/hunt-utilities" },
  { name: "ITC", website: "https://industrytelco.com", linkedin: "" },
  { name: "Independent", website: "", linkedin: "" },
  { name: "JDTC Inc", website: "https://jdtcinc.com", linkedin: "" },
  { name: "Just Right Engineering", website: "https://just-right.co", linkedin: "" },
  { name: "Klaasmeyer Construction Company Inc", website: "https://klaasmeyer.com", linkedin: "" },
  { name: "MOGYVER COMMUNICATIONS", website: "", linkedin: "" },
  { name: "McDonald County Telephone", website: "https://olemac.net", linkedin: "" },
  { name: "Mid Plains Rural Telephone", website: "https://midplains.org", linkedin: "" },
  { name: "NONE", website: "", linkedin: "" },
  { name: "National Exchange Carrier Association (NECA)", website: "https://neca.org", linkedin: "" },
  { name: "Optical Construction & Design  (OC&D)", website: "https://splicejunkie.com", linkedin: "" },
  { name: "Optical Construction & Design Inc", website: "https://splicejunkie.com", linkedin: "" },
  { name: "Otero County Electric Cooperative", website: "https://www.ocec-inc.com", linkedin: "https://www.linkedin.com/company/otero-county-electric-cooperative-inc." },
  { name: "Pem-Tex, LLC", website: "https://pemtex.com", linkedin: "" },
  { name: "Pimms Groups USA Inc", website: "https://pimms.group", linkedin: "" },
  { name: "Polarity Networks LLC", website: "https://polaritynetworks.net", linkedin: "" },
  { name: "RR Ditching Service Inc", website: "", linkedin: "" },
  { name: "Resource Networks, Inc.", website: "", linkedin: "" },
  { name: "RnR Integration", website: "https://rnrintegration.com", linkedin: "" },
  { name: "SECO", website: "https://www.secoenergy.com", linkedin: "https://www.linkedin.com/company/sumter-electric-cooperative-inc-" },
  { name: "SRP Communications Engineering", website: "https://www.srpnet.com", linkedin: "" },
  { name: "Salina Spavinaw Telephone Co., Inc.", website: "https://sstelco.com", linkedin: "" },
  { name: "Sendera Construction", website: "https://aecoi.net", linkedin: "" },
  { name: "Skope Broadband & Communications LLC", website: "https://skopebroadband.com", linkedin: "" },
  { name: "Slash Pine Electric Membership", website: "https://slashpineemc.com", linkedin: "" },
  { name: "Start Fiber Optics Inc.", website: "", linkedin: "" },
  { name: "Stratis", website: "", linkedin: "https://www.linkedin.com/company/stratis-inc" },
  { name: "Swyft Connect", website: "https://swyftconnect.com", linkedin: "" },
  { name: "TSTCI", website: "https://www.txrba.com", linkedin: "" },
  { name: "Tallapoosa River Electric Cooperative", website: "https://trec.coop", linkedin: "https://www.linkedin.com/company/tallapoosa-river-electric-cooperative-inc" },
  { name: "The Light Connection - Prod Sol", website: "https://prod-solutions.com", linkedin: "" },
  { name: "WEBB GLOBAL TRANSFER, LLC", website: "https://webbgt.com", linkedin: "https://www.linkedin.com/company/webb-global-transfer-llc" },
  { name: "Zing Broadband/PGTelco", website: "https://pgtc.com", linkedin: "" },
  { name: "ZipLink Systems LLC", website: "https://ziplink.systems", linkedin: "" }
];

async function updateCompanies() {
  try {
    console.log('🔄 Updating companies with LinkedIn URLs and websites...\n');
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
    let notFound = 0;
    let errors = 0;
    let linkedinAdded = 0;
    let websiteAdded = 0;

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

          let websiteChanged = false;
          let linkedinChanged = false;

          // Update website if provided
          if (website && website.trim() !== '') {
            if (!company.website || company.website !== website) {
              updateData.website = website;
              websiteChanged = true;
            }
          } else if (website === '' && company.website) {
            updateData.website = null;
            websiteChanged = true;
          }

          // Update LinkedIn URL if provided
          if (linkedinUrl && linkedinUrl.trim() !== '') {
            if (!company.linkedinUrl || company.linkedinUrl !== linkedinUrl) {
              updateData.linkedinUrl = linkedinUrl;
              linkedinChanged = true;
            }
          } else if (linkedinUrl === '' && company.linkedinUrl) {
            updateData.linkedinUrl = null;
            linkedinChanged = true;
          }

          // Only update if there are changes
          if (Object.keys(updateData).length > 1) {
            await prisma.companies.update({
              where: { id: company.id },
              data: updateData
            });

            updated++;
            if (websiteChanged) websiteAdded++;
            if (linkedinChanged) linkedinAdded++;

            if (updated <= 20) {
              console.log(`   ✅ Updated: ${companyName}`);
              if (websiteChanged && website) console.log(`      Website: ${website}`);
              if (linkedinChanged && linkedinUrl) console.log(`      LinkedIn: ${linkedinUrl}`);
            }
          }
        } else {
          notFound++;
          if (notFound <= 10) {
            console.log(`   ⚠️  Not found: ${companyName}`);
          }
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${companyData.name}:`, error.message);
        errors++;
      }
    }

    if (updated > 20) console.log(`   ... and ${updated - 20} more updated`);
    if (notFound > 10) console.log(`   ... and ${notFound - 10} more not found`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Companies updated: ${updated}`);
    console.log(`LinkedIn URLs added/updated: ${linkedinAdded}`);
    console.log(`Websites added/updated: ${websiteAdded}`);
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

    const missingWebsiteOrLinkedIn = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        OR: [
          {
            OR: [
              { linkedinUrl: null },
              { linkedinUrl: '' }
            ]
          },
          {
            OR: [
              { website: null },
              { website: '' }
            ]
          }
        ]
      }
    });

    console.log(`\n📊 FINAL STATE:`);
    console.log(`   Total companies: ${totalCount}`);
    console.log(`   Companies with LinkedIn URLs: ${finalCount} (${((finalCount / totalCount) * 100).toFixed(1)}%)`);
    console.log(`   Companies missing website OR LinkedIn: ${missingWebsiteOrLinkedIn}`);
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

