/**
 * Add/Update LinkedIn URLs and websites for companies in Top-Temp workspace
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
  { name: "AVANGRID", website: "https://www.avangrid.com", linkedin: "https://www.linkedin.com/company/avangrid" },
  { name: "Aether Fiber Solutions", website: "https://aetherfiber.com", linkedin: "https://www.linkedin.com/company/aether-fiber-solutions" },
  { name: "Altamaha EMC", website: "https://altamahaemc.com", linkedin: "" },
  { name: "B&A telecom", website: "", linkedin: "" },
  { name: "Bell County Technology Services", website: "https://bellcounty.texas.gov", linkedin: "" },
  { name: "Big Horn Rural Electric Cooperative", website: "https://bighornrea.com", linkedin: "" },
  { name: "BirdComm Solutions", website: "https://birdcomm.net", linkedin: "" },
  { name: "Black Hills Energy", website: "https://www.blackhillsenergy.com", linkedin: "https://www.linkedin.com/company/black-hills-energy" },
  { name: "Brazos Communications", website: "https://www.brazosnet.com", linkedin: "" },
  { name: "Brazos Wifi", website: "https://brazoswifi.com", linkedin: "" },
  { name: "Choctaw Telecommunications", website: "https://choctawtelecom.com", linkedin: "" },
  { name: "City of Columbia", website: "https://www.como.gov", linkedin: "https://www.linkedin.com/company/city-of-columbia-missouri" },
  { name: "City of Mobile", website: "https://www.cityofmobile.org", linkedin: "https://www.linkedin.com/company/city-of-mobile-al" },
  { name: "DAVIS CABLE TECHNOLOGIES", website: "", linkedin: "" },
  { name: "Ditch Witch of Central Texas", website: "https://ditchwitchctx.com", linkedin: "" },
  { name: "Dixie Electric Power Association", website: "https://www.dixieepa.com", linkedin: "" },
  { name: "EPC, LLC", website: "https://epcunderground.com", linkedin: "" },
  { name: "El Dorado Irrigation District", website: "https://www.eid.org", linkedin: "https://www.linkedin.com/company/el-dorado-irrigation-district" },
  { name: "Excelsior Electric Membership Corporation", website: "https://excelsioremc.com", linkedin: "" },
  { name: "Four D construction", website: "https://fourdconstruction.com", linkedin: "" },
  { name: "G Force Fiber Optics", website: "https://gffs.us", linkedin: "" },
  { name: "Global Utility Infrastructure", website: "https://www.globalui.net", linkedin: "" },
  { name: "Global Utility Infrastructure & HDD, LLC", website: "https://www.globalui.net", linkedin: "" },
  { name: "Gunnison County Electric Association", website: "https://www.gcea.coop", linkedin: "https://www.linkedin.com/company/gunnison-county-electric-association" },
  { name: "Hunt Communications", website: "https://hunt-utilities.com", linkedin: "" },
  { name: "ITC", website: "https://industrytelco.com", linkedin: "" },
  { name: "Independent", website: "", linkedin: "" },
  { name: "JDTC Inc", website: "https://jdtcinc.com", linkedin: "" },
  { name: "Just Right Engineering", website: "https://just-right.co", linkedin: "" },
  { name: "Klaasmeyer Construction Company Inc", website: "https://klaasmeyer.com", linkedin: "" },
  { name: "MOGYVER COMMUNICATIONS", website: "", linkedin: "" },
  { name: "McDonald County Telephone", website: "https://olemac.net", linkedin: "" },
  { name: "Mid Plains Rural Telephone", website: "https://midplains.org", linkedin: "" },
  { name: "MidAmerican Energy Company", website: "https://www.midamericanenergy.com", linkedin: "https://www.linkedin.com/company/midamerican-energy" },
  { name: "Mountain Parks Electric Inc.", website: "https://www.mpei.com", linkedin: "https://www.linkedin.com/company/mountain-parks-electric-inc." },
  { name: "National Exchange Carrier Association (NECA)", website: "https://neca.org", linkedin: "" },
  { name: "Nokia of America Corporation", website: "https://www.nokia.com", linkedin: "https://www.linkedin.com/company/nokia" },
  { name: "Northern Natural Gas", website: "https://www.northernnaturalgas.com", linkedin: "https://www.linkedin.com/company/northern-natural-gas" },
  { name: "Optical Construction & Design  (OC&D)", website: "https://splicejunkie.com", linkedin: "" },
  { name: "Optical Construction & Design Inc", website: "https://splicejunkie.com", linkedin: "" },
  { name: "Otero County Electric Cooperative", website: "https://www.ocec-inc.com", linkedin: "" },
  { name: "Pecan Creek Construction", website: "https://pecancreekconstruction.com", linkedin: "https://www.linkedin.com/company/pecan-creek-construction" },
  { name: "Pem-Tex, LLC", website: "https://pemtex.com", linkedin: "" },
  { name: "Pimms Groups USA Inc", website: "https://pimms.group", linkedin: "" },
  { name: "Polarity Networks LLC", website: "https://polaritynetworks.net", linkedin: "" },
  { name: "RR Ditching Service Inc", website: "", linkedin: "" },
  { name: "Resource Networks, Inc.", website: "", linkedin: "" },
  { name: "RnR Integration", website: "", linkedin: "" },
  { name: "SECO", website: "https://www.secoenergy.com", linkedin: "" },
  { name: "SRP Communications Engineering", website: "https://www.srpnet.com", linkedin: "" },
  { name: "Salina Spavinaw Telephone Co., Inc.", website: "https://sstelco.com", linkedin: "" },
  { name: "Sendera Construction", website: "https://aecoi.net", linkedin: "" },
  { name: "Skope Broadband & Communications LLC", website: "https://skopebroadband.com", linkedin: "" },
  { name: "Slash Pine Electric Membership", website: "https://slashpineemc.com", linkedin: "" },
  { name: "Start Fiber Optics Inc.", website: "", linkedin: "" },
  { name: "Stratis", website: "", linkedin: "" },
  { name: "Swyft Connect", website: "https://swyftconnect.com", linkedin: "" },
  { name: "TSTCI", website: "https://www.txrba.com", linkedin: "" },
  { name: "Tallapoosa River Electric Cooperative", website: "https://trec.coop", linkedin: "" },
  { name: "The Light Connection - Prod Sol", website: "https://prod-solutions.com", linkedin: "" },
  { name: "Utility Technology Council", website: "https://utc.org", linkedin: "https://www.linkedin.com/company/utility-technology-council" },
  { name: "WEBB GLOBAL TRANSFER, LLC", website: "https://webbgt.com", linkedin: "" },
  { name: "White River Electric Association", website: "https://www.wrea.org", linkedin: "https://www.linkedin.com/company/white-river-electric-association-inc." },
  { name: "Yuba County Water Agency", website: "https://www.yubawater.org", linkedin: "https://www.linkedin.com/company/yubawater" },
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

          // Update website if provided
          if (website && website.trim() !== '') {
            updateData.website = website;
          } else if (website === '') {
            // Explicitly set to null if empty string
            updateData.website = null;
          }

          // Update LinkedIn URL if provided
          if (linkedinUrl && linkedinUrl.trim() !== '') {
            updateData.linkedinUrl = linkedinUrl;
          } else if (linkedinUrl === '') {
            // Explicitly set to null if empty string
            updateData.linkedinUrl = null;
          }

          await prisma.companies.update({
            where: { id: company.id },
            data: updateData
          });

          updated++;
          if (updated <= 20) {
            console.log(`   ✅ Updated: ${companyName}`);
            if (website && website.trim() !== '') console.log(`      Website: ${website}`);
            if (linkedinUrl && linkedinUrl.trim() !== '') console.log(`      LinkedIn: ${linkedinUrl}`);
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

