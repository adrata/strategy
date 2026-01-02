const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditLinkedInExtraction() {
  const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  
  const noel = await prisma.users.findFirst({
    where: { email: { contains: 'noel', mode: 'insensitive' } }
  });

  console.log('🔍 AUDIT: LinkedIn URL Extraction from Coresignal\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all people with buyer group roles
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    select: {
      id: true,
      fullName: true,
      linkedinUrl: true,
      coresignalData: true
    }
  });

  console.log(`📊 Analyzing ${people.length} people in buyer groups...\n`);

  let stats = {
    withLinkedIn: 0,
    withoutLinkedIn: 0,
    withCoresignalData: 0,
    linkedInInCoresignal: 0,
    missingButInCoresignal: 0,
    examples: []
  };

  for (const person of people) {
    if (person.linkedinUrl) {
      stats.withLinkedIn++;
    } else {
      stats.withoutLinkedIn++;
      
      // Check if LinkedIn URL exists in Coresignal data
      if (person.coresignalData) {
        stats.withCoresignalData++;
        const coresignalLinkedIn = person.coresignalData?.linkedin_url || 
                                   person.coresignalData?.linkedinUrl ||
                                   person.coresignalData?.profile_url ||
                                   null;
        
        if (coresignalLinkedIn) {
          stats.linkedInInCoresignal++;
          stats.missingButInCoresignal++;
          
          if (stats.examples.length < 5) {
            stats.examples.push({
              name: person.fullName,
              coresignalLinkedIn: coresignalLinkedIn,
              coresignalDataKeys: Object.keys(person.coresignalData || {})
            });
          }
        }
      }
    }
  }

  console.log('📈 RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   ✅ People with LinkedIn URL: ${stats.withLinkedIn}/${people.length} (${((stats.withLinkedIn / people.length) * 100).toFixed(1)}%)`);
  console.log(`   ❌ People without LinkedIn URL: ${stats.withoutLinkedIn}/${people.length} (${((stats.withoutLinkedIn / people.length) * 100).toFixed(1)}%)`);
  console.log(`   📦 People with Coresignal data: ${stats.withCoresignalData}/${people.length}`);
  console.log(`   🔗 LinkedIn URLs found in Coresignal data: ${stats.linkedInInCoresignal}`);
  console.log(`   ⚠️  Missing LinkedIn URL but exists in Coresignal: ${stats.missingButInCoresignal}`);
  console.log('');

  if (stats.missingButInCoresignal > 0) {
    console.log('⚠️  ISSUE FOUND: LinkedIn URLs exist in Coresignal data but not saved to linkedinUrl field!\n');
    console.log('📋 Examples:');
    stats.examples.forEach((ex, idx) => {
      console.log(`\n   ${idx + 1}. ${ex.name}`);
      console.log(`      Coresignal has: ${ex.coresignalLinkedIn}`);
      console.log(`      But linkedinUrl field is: NULL`);
      console.log(`      Coresignal data keys: ${ex.coresignalDataKeys.slice(0, 10).join(', ')}...`);
    });
    console.log('\n   🔧 FIX NEEDED: Update saveBuyerGroupToDatabase to extract linkedin_url from fullProfile');
  } else {
    console.log('✅ VERIFICATION PASSED: All LinkedIn URLs are correctly extracted and saved!');
  }

  // Check the code flow
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CODE FLOW VERIFICATION:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('1. Preview Search (preview-search.js:500):');
  console.log('   ✅ Extracts: linkedinUrl: emp.linkedin_url || ""');
  console.log('');
  console.log('2. Full Profile Collection (index.js:906):');
  console.log('   ✅ Uses: employee_multi_source/collect/{id}');
  console.log('   ⚠️  NEEDS VERIFICATION: Does it extract linkedin_url from fullProfile?');
  console.log('');
  console.log('3. Database Save (index.js:2517):');
  console.log('   ✅ Saves: linkedinUrl: member.linkedinUrl');
  console.log('   ⚠️  POTENTIAL ISSUE: member.linkedinUrl might not be updated from fullProfile');
  console.log('');

  await prisma.$disconnect();
}

auditLinkedInExtraction().catch(console.error);
