const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function extractCoreSignalFromRawData() {
  try {
    await prisma.$connect();
    console.log('🔍 EXTRACTING CORESIGNAL DATA FROM RAWDATA');
    console.log('============================================');

    // Get people with rawData but no coresignalData
    const peopleWithRawData = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
        AND "customFields"->>'coresignalData' IS NULL
      ORDER BY "fullName"
      LIMIT 10
    `;

    console.log(`📊 Found ${peopleWithRawData.length} people with rawData but no coresignalData`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < peopleWithRawData.length; i++) {
      const person = peopleWithRawData[i];
      console.log(`\n🏢 [${i + 1}/${peopleWithRawData.length}] Processing: ${person.fullName}`);

      try {
        const customFields = person.customFields;
        const rawData = customFields.rawData;

        if (!rawData) {
          console.log('   ❌ No rawData found');
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found rawData with ${Object.keys(rawData).length} keys`);

        // Extract CoreSignal data from rawData
        const coresignalData = {
          id: rawData.id,
          name: rawData.full_name || rawData.name,
          email: rawData.email,
          phone: rawData.phone,
          linkedin_url: rawData.linkedin_url,
          twitter_url: rawData.twitter_url,
          facebook_url: rawData.facebook_url,
          instagram_url: rawData.instagram_url,
          youtube_url: rawData.youtube_url,
          github_url: rawData.github_url,
          job_title: rawData.job_title,
          department: rawData.department,
          seniority: rawData.seniority,
          location: rawData.location,
          headline: rawData.headline,
          summary: rawData.summary,
          skills: rawData.skills,
          interests: rawData.interests,
          education: rawData.education,
          experience: rawData.experience,
          followers_count: rawData.followers_count,
          connections_count: rawData.connections_count,
          posts_count: rawData.posts_count,
          profile_picture_url: rawData.profile_picture_url,
          cover_photo_url: rawData.cover_photo_url,
          verified: rawData.verified,
          last_active: rawData.last_active,
          created_at: rawData.created_at,
          updated_at: rawData.updated_at,
          company_name: rawData.company_name,
          company_website: rawData.company_website,
          company_linkedin_url: rawData.company_linkedin_url
        };

        // Remove undefined values
        Object.keys(coresignalData).forEach(key => {
          if (coresignalData[key] === undefined) {
            delete coresignalData[key];
          }
        });

        console.log(`   ✅ Extracted CoreSignal data with ${Object.keys(coresignalData).length} fields`);

        // Update customFields with coresignalData
        const updatedCustomFields = {
          ...customFields,
          coresignalData: coresignalData,
          coresignalId: rawData.id,
          enrichmentSource: 'CoreSignal (extracted from rawData)',
          lastEnrichedAt: new Date().toISOString(),
          totalFields: Object.keys(coresignalData).length
        };

        // Update the person record
        await prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: updatedCustomFields,
            lastEnriched: new Date(),
            enrichmentSources: ['coresignal'],
            updatedAt: new Date()
          }
        });

        console.log(`   ✅ Successfully extracted CoreSignal data for ${person.fullName}`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 EXTRACTION SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / peopleWithRawData.length * 100)}%`);

    return { success: true, processed: peopleWithRawData.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

extractCoreSignalFromRawData();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function extractCoreSignalFromRawData() {
  try {
    await prisma.$connect();
    console.log('🔍 EXTRACTING CORESIGNAL DATA FROM RAWDATA');
    console.log('============================================');

    // Get people with rawData but no coresignalData
    const peopleWithRawData = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
        AND "customFields"->>'coresignalData' IS NULL
      ORDER BY "fullName"
      LIMIT 10
    `;

    console.log(`📊 Found ${peopleWithRawData.length} people with rawData but no coresignalData`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < peopleWithRawData.length; i++) {
      const person = peopleWithRawData[i];
      console.log(`\n🏢 [${i + 1}/${peopleWithRawData.length}] Processing: ${person.fullName}`);

      try {
        const customFields = person.customFields;
        const rawData = customFields.rawData;

        if (!rawData) {
          console.log('   ❌ No rawData found');
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found rawData with ${Object.keys(rawData).length} keys`);

        // Extract CoreSignal data from rawData
        const coresignalData = {
          id: rawData.id,
          name: rawData.full_name || rawData.name,
          email: rawData.email,
          phone: rawData.phone,
          linkedin_url: rawData.linkedin_url,
          twitter_url: rawData.twitter_url,
          facebook_url: rawData.facebook_url,
          instagram_url: rawData.instagram_url,
          youtube_url: rawData.youtube_url,
          github_url: rawData.github_url,
          job_title: rawData.job_title,
          department: rawData.department,
          seniority: rawData.seniority,
          location: rawData.location,
          headline: rawData.headline,
          summary: rawData.summary,
          skills: rawData.skills,
          interests: rawData.interests,
          education: rawData.education,
          experience: rawData.experience,
          followers_count: rawData.followers_count,
          connections_count: rawData.connections_count,
          posts_count: rawData.posts_count,
          profile_picture_url: rawData.profile_picture_url,
          cover_photo_url: rawData.cover_photo_url,
          verified: rawData.verified,
          last_active: rawData.last_active,
          created_at: rawData.created_at,
          updated_at: rawData.updated_at,
          company_name: rawData.company_name,
          company_website: rawData.company_website,
          company_linkedin_url: rawData.company_linkedin_url
        };

        // Remove undefined values
        Object.keys(coresignalData).forEach(key => {
          if (coresignalData[key] === undefined) {
            delete coresignalData[key];
          }
        });

        console.log(`   ✅ Extracted CoreSignal data with ${Object.keys(coresignalData).length} fields`);

        // Update customFields with coresignalData
        const updatedCustomFields = {
          ...customFields,
          coresignalData: coresignalData,
          coresignalId: rawData.id,
          enrichmentSource: 'CoreSignal (extracted from rawData)',
          lastEnrichedAt: new Date().toISOString(),
          totalFields: Object.keys(coresignalData).length
        };

        // Update the person record
        await prisma.people.update({
          where: { id: person.id },
          data: {
            customFields: updatedCustomFields,
            lastEnriched: new Date(),
            enrichmentSources: ['coresignal'],
            updatedAt: new Date()
          }
        });

        console.log(`   ✅ Successfully extracted CoreSignal data for ${person.fullName}`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 EXTRACTION SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / peopleWithRawData.length * 100)}%`);

    return { success: true, processed: peopleWithRawData.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

extractCoreSignalFromRawData();


