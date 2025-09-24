const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function extractCoreSignalFromRawData(person) {
  try {
    const customFields = person.customFields;
    const rawData = customFields.rawData;

    if (!rawData) {
      return { success: false, reason: 'No rawData found' };
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

    return { success: true, fieldsExtracted: Object.keys(coresignalData).length };

  } catch (error) {
    return { success: false, reason: error.message };
  }
}

async function processBatch() {
  try {
    console.log('\n🚀 PROCESSING PEOPLE CORESIGNAL BATCH');
    console.log('=====================================');

    // Get people with rawData but no coresignalData
    const people = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
        AND "customFields"->>'coresignalData' IS NULL
      ORDER BY "fullName"
      LIMIT 50
    `;

    console.log(`📊 Found ${people.length} people to process`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data extracted!');
      return { success: true, completed: true };
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Processing: ${person.fullName}`);

      try {
        const result = await extractCoreSignalFromRawData(person);

        if (result.success) {
          console.log(`   ✅ Successfully extracted ${result.fieldsExtracted} fields`);
          successCount++;
        } else {
          console.log(`   ❌ Failed: ${result.reason}`);
          errorCount++;
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 BATCH SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);

    return { success: true, completed: false, processed: people.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
    return { success: false, error: error.message };
  }
}

async function batchExtractPeopleCoreSignal() {
  try {
    await prisma.$connect();
    console.log('🤖 BATCH PEOPLE CORESIGNAL EXTRACTION');
    console.log('=====================================');
    console.log('Processing people in batches of 50 until completion...\n');

    let batchNumber = 1;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    while (true) {
      console.log(`\n🔄 BATCH ${batchNumber}`);
      console.log('='.repeat(50));

      // Process batch
      const result = await processBatch();

      if (result.completed) {
        console.log('\n🎉 EXTRACTION COMPLETED!');
        break;
      }

      if (!result.success) {
        console.log(`❌ Batch ${batchNumber} failed: ${result.error}`);
        console.log('⏳ Waiting 30 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue;
      }

      // Update totals
      totalProcessed += result.processed;
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;

      console.log(`\n📈 PROGRESS UPDATE:`);
      console.log(`   Batch ${batchNumber} completed`);
      console.log(`   Total processed: ${totalProcessed}`);
      console.log(`   Total successful: ${totalSuccess}`);
      console.log(`   Total errors: ${totalErrors}`);

      batchNumber++;

      // Add delay between batches
      console.log('\n⏳ Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('\n🎉 FINAL SUMMARY:');
    console.log('=================');
    console.log(`Total batches processed: ${batchNumber - 1}`);
    console.log(`Total people processed: ${totalProcessed}`);
    console.log(`Total successful: ${totalSuccess}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Final success rate: ${Math.round((totalSuccess/totalProcessed)*100)}%`);

  } catch (error) {
    console.error('❌ BATCH EXTRACTION ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

batchExtractPeopleCoreSignal();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function extractCoreSignalFromRawData(person) {
  try {
    const customFields = person.customFields;
    const rawData = customFields.rawData;

    if (!rawData) {
      return { success: false, reason: 'No rawData found' };
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

    return { success: true, fieldsExtracted: Object.keys(coresignalData).length };

  } catch (error) {
    return { success: false, reason: error.message };
  }
}

async function processBatch() {
  try {
    console.log('\n🚀 PROCESSING PEOPLE CORESIGNAL BATCH');
    console.log('=====================================');

    // Get people with rawData but no coresignalData
    const people = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
        AND "customFields"->>'coresignalData' IS NULL
      ORDER BY "fullName"
      LIMIT 50
    `;

    console.log(`📊 Found ${people.length} people to process`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data extracted!');
      return { success: true, completed: true };
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Processing: ${person.fullName}`);

      try {
        const result = await extractCoreSignalFromRawData(person);

        if (result.success) {
          console.log(`   ✅ Successfully extracted ${result.fieldsExtracted} fields`);
          successCount++;
        } else {
          console.log(`   ❌ Failed: ${result.reason}`);
          errorCount++;
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 BATCH SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);

    return { success: true, completed: false, processed: people.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
    return { success: false, error: error.message };
  }
}

async function batchExtractPeopleCoreSignal() {
  try {
    await prisma.$connect();
    console.log('🤖 BATCH PEOPLE CORESIGNAL EXTRACTION');
    console.log('=====================================');
    console.log('Processing people in batches of 50 until completion...\n');

    let batchNumber = 1;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    while (true) {
      console.log(`\n🔄 BATCH ${batchNumber}`);
      console.log('='.repeat(50));

      // Process batch
      const result = await processBatch();

      if (result.completed) {
        console.log('\n🎉 EXTRACTION COMPLETED!');
        break;
      }

      if (!result.success) {
        console.log(`❌ Batch ${batchNumber} failed: ${result.error}`);
        console.log('⏳ Waiting 30 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue;
      }

      // Update totals
      totalProcessed += result.processed;
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;

      console.log(`\n📈 PROGRESS UPDATE:`);
      console.log(`   Batch ${batchNumber} completed`);
      console.log(`   Total processed: ${totalProcessed}`);
      console.log(`   Total successful: ${totalSuccess}`);
      console.log(`   Total errors: ${totalErrors}`);

      batchNumber++;

      // Add delay between batches
      console.log('\n⏳ Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('\n🎉 FINAL SUMMARY:');
    console.log('=================');
    console.log(`Total batches processed: ${batchNumber - 1}`);
    console.log(`Total people processed: ${totalProcessed}`);
    console.log(`Total successful: ${totalSuccess}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Final success rate: ${Math.round((totalSuccess/totalProcessed)*100)}%`);

  } catch (error) {
    console.error('❌ BATCH EXTRACTION ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

batchExtractPeopleCoreSignal();


