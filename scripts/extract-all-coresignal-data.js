const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function extractAllCoreSignalData() {
  try {
    await prisma.$connect();
    console.log('🔍 EXTRACTING ALL CORESIGNAL DATA FROM RAWDATA');
    console.log('================================================');

    // Get count of people with rawData but no coresignalData
    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
        AND "customFields"->>'coresignalData' IS NULL
    `;

    const totalPeople = Number(totalCount[0].count);
    console.log(`📊 Total people with rawData but no coresignalData: ${totalPeople}`);

    if (totalPeople === 0) {
      console.log('🎉 All people already have CoreSignal data extracted!');
      return;
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 50;

    while (processedCount < totalPeople) {
      console.log(`\n🔄 Processing batch ${Math.floor(processedCount / batchSize) + 1}...`);

      // Get batch of people with rawData but no coresignalData
      const people = await prisma.$queryRaw`
        SELECT id, "fullName", "jobTitle", "customFields"
        FROM people 
        WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
          AND "customFields"->>'rawData' IS NOT NULL
          AND "customFields"->>'coresignalData' IS NULL
        ORDER BY "fullName"
        LIMIT ${batchSize}
      `;

      if (people.length === 0) {
        console.log('✅ No more people to process');
        break;
      }

      console.log(`📊 Processing ${people.length} people in this batch`);

      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        console.log(`\n🏢 [${processedCount + i + 1}/${totalPeople}] Processing: ${person.fullName}`);

        try {
          const customFields = person.customFields;
          const rawData = customFields.rawData;

          if (!rawData) {
            console.log('   ❌ No rawData found');
            errorCount++;
            continue;
          }

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

      processedCount += people.length;
      console.log(`\n📊 BATCH SUMMARY:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📈 Success rate: ${Math.round(successCount / processedCount * 100)}%`);
      console.log(`   📊 Progress: ${processedCount}/${totalPeople} (${Math.round((processedCount/totalPeople)*100)}%)`);

      // Add delay between batches
      if (processedCount < totalPeople) {
        console.log('\n⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n🎉 EXTRACTION COMPLETE!`);
    console.log('======================');
    console.log(`📊 Total processed: ${processedCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Final success rate: ${Math.round(successCount / processedCount * 100)}%`);

    return { success: true, processed: processedCount, successCount, errorCount };

  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

extractAllCoreSignalData();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function extractAllCoreSignalData() {
  try {
    await prisma.$connect();
    console.log('🔍 EXTRACTING ALL CORESIGNAL DATA FROM RAWDATA');
    console.log('================================================');

    // Get count of people with rawData but no coresignalData
    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
        AND "customFields"->>'coresignalData' IS NULL
    `;

    const totalPeople = Number(totalCount[0].count);
    console.log(`📊 Total people with rawData but no coresignalData: ${totalPeople}`);

    if (totalPeople === 0) {
      console.log('🎉 All people already have CoreSignal data extracted!');
      return;
    }

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 50;

    while (processedCount < totalPeople) {
      console.log(`\n🔄 Processing batch ${Math.floor(processedCount / batchSize) + 1}...`);

      // Get batch of people with rawData but no coresignalData
      const people = await prisma.$queryRaw`
        SELECT id, "fullName", "jobTitle", "customFields"
        FROM people 
        WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
          AND "customFields"->>'rawData' IS NOT NULL
          AND "customFields"->>'coresignalData' IS NULL
        ORDER BY "fullName"
        LIMIT ${batchSize}
      `;

      if (people.length === 0) {
        console.log('✅ No more people to process');
        break;
      }

      console.log(`📊 Processing ${people.length} people in this batch`);

      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        console.log(`\n🏢 [${processedCount + i + 1}/${totalPeople}] Processing: ${person.fullName}`);

        try {
          const customFields = person.customFields;
          const rawData = customFields.rawData;

          if (!rawData) {
            console.log('   ❌ No rawData found');
            errorCount++;
            continue;
          }

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

      processedCount += people.length;
      console.log(`\n📊 BATCH SUMMARY:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   📈 Success rate: ${Math.round(successCount / processedCount * 100)}%`);
      console.log(`   📊 Progress: ${processedCount}/${totalPeople} (${Math.round((processedCount/totalPeople)*100)}%)`);

      // Add delay between batches
      if (processedCount < totalPeople) {
        console.log('\n⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`\n🎉 EXTRACTION COMPLETE!`);
    console.log('======================');
    console.log(`📊 Total processed: ${processedCount}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Final success rate: ${Math.round(successCount / processedCount * 100)}%`);

    return { success: true, processed: processedCount, successCount, errorCount };

  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

extractAllCoreSignalData();


