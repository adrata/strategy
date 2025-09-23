const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function mapCoreSignalToDatabase(coresignalData) {
  if (!coresignalData) return {};

  const updateData = {};

  // Map CoreSignal fields to database columns
  if (coresignalData.linkedin_url) {
    updateData.linkedinUrl = coresignalData.linkedin_url;
  }

  if (coresignalData.founded_year) {
    updateData.foundedYear = parseInt(coresignalData.founded_year) || null;
  }

  if (coresignalData.employee_count) {
    updateData.employeeCount = parseInt(coresignalData.employee_count) || null;
  }

  if (coresignalData.active_job_postings_count) {
    updateData.activeJobPostings = parseInt(coresignalData.active_job_postings_count) || null;
  }

  if (coresignalData.linkedin_followers_count) {
    updateData.linkedinFollowers = parseInt(coresignalData.linkedin_followers_count) || null;
  }

  if (coresignalData.naics_codes && Array.isArray(coresignalData.naics_codes)) {
    updateData.naicsCodes = coresignalData.naics_codes;
  }

  if (coresignalData.sic_codes && Array.isArray(coresignalData.sic_codes)) {
    updateData.sicCodes = coresignalData.sic_codes;
  }

  if (coresignalData.facebook_url) {
    updateData.facebookUrl = coresignalData.facebook_url;
  }

  if (coresignalData.twitter_url) {
    updateData.twitterUrl = coresignalData.twitter_url;
  }

  if (coresignalData.instagram_url) {
    updateData.instagramUrl = coresignalData.instagram_url;
  }

  if (coresignalData.youtube_url) {
    updateData.youtubeUrl = coresignalData.youtube_url;
  }

  if (coresignalData.github_url) {
    updateData.githubUrl = coresignalData.github_url;
  }

  if (coresignalData.technologies_used && Array.isArray(coresignalData.technologies_used)) {
    updateData.technologiesUsed = coresignalData.technologies_used.map(t => t.technology || t);
  }

  if (coresignalData.competitors && Array.isArray(coresignalData.competitors)) {
    updateData.competitors = coresignalData.competitors;
  }

  if (coresignalData.revenue_currency) {
    updateData.revenueCurrency = coresignalData.revenue_currency;
  }

  if (coresignalData.last_funding_amount) {
    updateData.lastFundingAmount = parseFloat(coresignalData.last_funding_amount) || null;
  }

  if (coresignalData.last_funding_date) {
    // Ensure it's a valid ISO-8601 DateTime
    const date = new Date(coresignalData.last_funding_date);
    if (!isNaN(date.getTime())) {
      updateData.lastFundingDate = date.toISOString();
    }
  }

  // Add description if available
  if (coresignalData.description) {
    updateData.description = coresignalData.description;
  }

  // Add size information
  if (coresignalData.size_range) {
    updateData.size = coresignalData.size_range;
  }

  return updateData;
}

async function moveDataToColumns() {
  console.log('🔄 MOVING DATA FROM CUSTOM FIELDS TO DATABASE COLUMNS');
  console.log('====================================================');

  try {
    // Get all companies with CoreSignal data in customFields
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });

    console.log(`📊 Found ${companies.length} companies with CoreSignal data`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      try {
        console.log(`\n${i + 1}. 🔄 Processing: ${company.name}`);
        
        const coresignalData = company.customFields?.coresignalData;
        if (!coresignalData) {
          console.log(`   ❌ No CoreSignal data found`);
          errorCount++;
          continue;
        }

        // Map CoreSignal data to database columns
        const updateData = mapCoreSignalToDatabase(coresignalData);
        
        if (Object.keys(updateData).length === 0) {
          console.log(`   ⚠️ No mappable data found`);
          continue;
        }

        // Update the company record with the mapped data
        await prisma.companies.update({
          where: { id: company.id },
          data: updateData
        });

        console.log(`   ✅ Success - Updated ${Object.keys(updateData).length} fields`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n🎉 DATA MIGRATION COMPLETED!');
    console.log('============================');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${companies.length}`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

moveDataToColumns();
