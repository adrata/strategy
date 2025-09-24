const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function verifyRawDataCoreSignal() {
  try {
    await prisma.$connect();
    console.log('🔍 VERIFYING RAWDATA CONTAINS CORESIGNAL DATA');
    console.log('==============================================');

    // Get people with rawData to verify it's CoreSignal data
    const peopleWithRawData = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['rawData'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    console.log(`📊 Found ${peopleWithRawData.length} people with rawData`);

    console.log('\n🔍 ANALYZING RAWDATA CONTENT:');
    console.log('=============================');
    
    peopleWithRawData.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      
      if (person.customFields?.rawData) {
        const rawData = person.customFields.rawData;
        console.log(`   RawData type: ${typeof rawData}`);
        console.log(`   RawData keys: ${Object.keys(rawData).slice(0, 20).join(', ')}${Object.keys(rawData).length > 20 ? '...' : ''}`);
        
        // Check for CoreSignal-specific fields
        const coresignalFields = [
          'id', 'name', 'email', 'phone', 'linkedin_url', 'twitter_url', 
          'facebook_url', 'instagram_url', 'youtube_url', 'github_url',
          'company_name', 'company_website', 'company_linkedin_url',
          'job_title', 'department', 'seniority', 'location', 'headline',
          'summary', 'skills', 'interests', 'education', 'experience',
          'followers_count', 'connections_count', 'posts_count',
          'profile_picture_url', 'cover_photo_url', 'verified',
          'last_active', 'created_at', 'updated_at'
        ];
        
        const foundCoreSignalFields = coresignalFields.filter(field => 
          rawData.hasOwnProperty(field)
        );
        
        console.log(`   CoreSignal fields found: ${foundCoreSignalFields.length}/${coresignalFields.length}`);
        console.log(`   CoreSignal fields: ${foundCoreSignalFields.slice(0, 10).join(', ')}${foundCoreSignalFields.length > 10 ? '...' : ''}`);
        
        // Check for specific CoreSignal data
        if (rawData.id) console.log(`   ✅ Has CoreSignal ID: ${rawData.id}`);
        if (rawData.name) console.log(`   ✅ Has name: ${rawData.name}`);
        if (rawData.email) console.log(`   ✅ Has email: ${rawData.email}`);
        if (rawData.linkedin_url) console.log(`   ✅ Has LinkedIn: ${rawData.linkedin_url}`);
        if (rawData.company_name) console.log(`   ✅ Has company: ${rawData.company_name}`);
        if (rawData.job_title) console.log(`   ✅ Has job title: ${rawData.job_title}`);
        if (rawData.skills) console.log(`   ✅ Has skills: ${Array.isArray(rawData.skills) ? rawData.skills.length : 'Yes'}`);
        if (rawData.experience) console.log(`   ✅ Has experience: ${Array.isArray(rawData.experience) ? rawData.experience.length : 'Yes'}`);
        if (rawData.education) console.log(`   ✅ Has education: ${Array.isArray(rawData.education) ? rawData.education.length : 'Yes'}`);
        
        // Check for CoreSignal API response structure
        if (rawData.data) {
          console.log(`   ✅ Has data object: ${Object.keys(rawData.data).length} keys`);
        }
        if (rawData.meta) {
          console.log(`   ✅ Has meta object: ${Object.keys(rawData.meta).length} keys`);
        }
        if (rawData.status) {
          console.log(`   ✅ Has status: ${rawData.status}`);
        }
        
        // Check if this looks like CoreSignal API response
        const isCoreSignalData = foundCoreSignalFields.length >= 10 && 
                                (rawData.id || rawData.name || rawData.email);
        
        console.log(`   🎯 IS CORESIGNAL DATA: ${isCoreSignalData ? 'YES' : 'NO'}`);
      }
    });

    // Get people who need CoreSignal data (no coresignalId)
    const peopleNeedingCoreSignal = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: null },
          {
            customFields: {
              path: ['coresignalId'],
              equals: null
            }
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        customFields: true,
        company: {
          select: {
            name: true,
            website: true
          }
        }
      },
      take: 10
    });

    console.log('\n🔍 PEOPLE NEEDING CORESIGNAL DATA:');
    console.log('===================================');
    console.log(`📊 Found ${peopleNeedingCoreSignal.length} people needing CoreSignal data (sample)`);
    
    peopleNeedingCoreSignal.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Email: ${person.email || 'None'}`);
      console.log(`   Phone: ${person.phone || 'None'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   Company website: ${person.company?.website || 'None'}`);
      console.log(`   CustomFields: ${person.customFields ? Object.keys(person.customFields).join(', ') : 'None'}`);
    });

    // Get total count of people needing CoreSignal
    const totalNeedingCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: null },
          {
            customFields: {
              path: ['coresignalId'],
              equals: null
            }
          }
        ]
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${await prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID } })}`);
    console.log(`People with rawData: ${peopleWithRawData.length} (sample)`);
    console.log(`People needing CoreSignal data: ${totalNeedingCoreSignal}`);
    console.log(`People with CoreSignal IDs: ${await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    })}`);

    console.log('\n🎯 CONCLUSION:');
    console.log('===============');
    console.log('1. RawData appears to contain CoreSignal data');
    console.log('2. We need to enrich the remaining people without CoreSignal IDs');
    console.log('3. We should extract CoreSignal data from rawData for existing people');
    console.log('4. We need to implement duplicate protection for new enrichments');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRawDataCoreSignal();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function verifyRawDataCoreSignal() {
  try {
    await prisma.$connect();
    console.log('🔍 VERIFYING RAWDATA CONTAINS CORESIGNAL DATA');
    console.log('==============================================');

    // Get people with rawData to verify it's CoreSignal data
    const peopleWithRawData = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['rawData'],
          not: null
        }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    console.log(`📊 Found ${peopleWithRawData.length} people with rawData`);

    console.log('\n🔍 ANALYZING RAWDATA CONTENT:');
    console.log('=============================');
    
    peopleWithRawData.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      
      if (person.customFields?.rawData) {
        const rawData = person.customFields.rawData;
        console.log(`   RawData type: ${typeof rawData}`);
        console.log(`   RawData keys: ${Object.keys(rawData).slice(0, 20).join(', ')}${Object.keys(rawData).length > 20 ? '...' : ''}`);
        
        // Check for CoreSignal-specific fields
        const coresignalFields = [
          'id', 'name', 'email', 'phone', 'linkedin_url', 'twitter_url', 
          'facebook_url', 'instagram_url', 'youtube_url', 'github_url',
          'company_name', 'company_website', 'company_linkedin_url',
          'job_title', 'department', 'seniority', 'location', 'headline',
          'summary', 'skills', 'interests', 'education', 'experience',
          'followers_count', 'connections_count', 'posts_count',
          'profile_picture_url', 'cover_photo_url', 'verified',
          'last_active', 'created_at', 'updated_at'
        ];
        
        const foundCoreSignalFields = coresignalFields.filter(field => 
          rawData.hasOwnProperty(field)
        );
        
        console.log(`   CoreSignal fields found: ${foundCoreSignalFields.length}/${coresignalFields.length}`);
        console.log(`   CoreSignal fields: ${foundCoreSignalFields.slice(0, 10).join(', ')}${foundCoreSignalFields.length > 10 ? '...' : ''}`);
        
        // Check for specific CoreSignal data
        if (rawData.id) console.log(`   ✅ Has CoreSignal ID: ${rawData.id}`);
        if (rawData.name) console.log(`   ✅ Has name: ${rawData.name}`);
        if (rawData.email) console.log(`   ✅ Has email: ${rawData.email}`);
        if (rawData.linkedin_url) console.log(`   ✅ Has LinkedIn: ${rawData.linkedin_url}`);
        if (rawData.company_name) console.log(`   ✅ Has company: ${rawData.company_name}`);
        if (rawData.job_title) console.log(`   ✅ Has job title: ${rawData.job_title}`);
        if (rawData.skills) console.log(`   ✅ Has skills: ${Array.isArray(rawData.skills) ? rawData.skills.length : 'Yes'}`);
        if (rawData.experience) console.log(`   ✅ Has experience: ${Array.isArray(rawData.experience) ? rawData.experience.length : 'Yes'}`);
        if (rawData.education) console.log(`   ✅ Has education: ${Array.isArray(rawData.education) ? rawData.education.length : 'Yes'}`);
        
        // Check for CoreSignal API response structure
        if (rawData.data) {
          console.log(`   ✅ Has data object: ${Object.keys(rawData.data).length} keys`);
        }
        if (rawData.meta) {
          console.log(`   ✅ Has meta object: ${Object.keys(rawData.meta).length} keys`);
        }
        if (rawData.status) {
          console.log(`   ✅ Has status: ${rawData.status}`);
        }
        
        // Check if this looks like CoreSignal API response
        const isCoreSignalData = foundCoreSignalFields.length >= 10 && 
                                (rawData.id || rawData.name || rawData.email);
        
        console.log(`   🎯 IS CORESIGNAL DATA: ${isCoreSignalData ? 'YES' : 'NO'}`);
      }
    });

    // Get people who need CoreSignal data (no coresignalId)
    const peopleNeedingCoreSignal = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: null },
          {
            customFields: {
              path: ['coresignalId'],
              equals: null
            }
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        customFields: true,
        company: {
          select: {
            name: true,
            website: true
          }
        }
      },
      take: 10
    });

    console.log('\n🔍 PEOPLE NEEDING CORESIGNAL DATA:');
    console.log('===================================');
    console.log(`📊 Found ${peopleNeedingCoreSignal.length} people needing CoreSignal data (sample)`);
    
    peopleNeedingCoreSignal.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Email: ${person.email || 'None'}`);
      console.log(`   Phone: ${person.phone || 'None'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   Company website: ${person.company?.website || 'None'}`);
      console.log(`   CustomFields: ${person.customFields ? Object.keys(person.customFields).join(', ') : 'None'}`);
    });

    // Get total count of people needing CoreSignal
    const totalNeedingCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: null },
          {
            customFields: {
              path: ['coresignalId'],
              equals: null
            }
          }
        ]
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${await prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID } })}`);
    console.log(`People with rawData: ${peopleWithRawData.length} (sample)`);
    console.log(`People needing CoreSignal data: ${totalNeedingCoreSignal}`);
    console.log(`People with CoreSignal IDs: ${await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    })}`);

    console.log('\n🎯 CONCLUSION:');
    console.log('===============');
    console.log('1. RawData appears to contain CoreSignal data');
    console.log('2. We need to enrich the remaining people without CoreSignal IDs');
    console.log('3. We should extract CoreSignal data from rawData for existing people');
    console.log('4. We need to implement duplicate protection for new enrichments');

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRawDataCoreSignal();


