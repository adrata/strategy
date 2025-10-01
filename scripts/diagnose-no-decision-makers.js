const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseNoDecisionMakers() {
  console.log('🔍 DIAGNOSING COMPANIES WITH NO DECISION MAKERS');
  console.log('===============================================');
  console.log('Analyzing why 299 companies have buyer groups but no decision makers');
  console.log('');

  try {
    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Get companies with buyer groups but no decision makers
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      take: 10
    });

    for (const company of companies) {
      const buyerGroup = await prisma.buyer_groups.findFirst({
        where: {
          companyId: company.id,
          workspaceId: workspace.id
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          customFields: true
        }
      });

      if (buyerGroup) {
        const roleDistribution = buyerGroup.customFields?.roleDistribution;
        if (roleDistribution && roleDistribution.decisionMakers === 0) {
          console.log(`\n🏢 COMPANY: ${company.name}`);
          console.log('─'.repeat(60));
          console.log(`Buyer Group: ${buyerGroup.name}`);
          console.log(`Created: ${buyerGroup.createdAt.toISOString().split('T')[0]}`);
          console.log(`Role Distribution: ${JSON.stringify(roleDistribution, null, 2)}`);
          
          // Get all people for this company
          const people = await prisma.people.findMany({
            where: {
              companyId: company.id,
              workspaceId: workspace.id,
              deletedAt: null
            },
            select: {
              id: true,
              fullName: true,
              jobTitle: true,
              buyerGroupRole: true,
              createdAt: true,
              lastEnriched: true,
              customFields: true
            },
            orderBy: { createdAt: 'desc' }
          });

          console.log(`\n👥 PEOPLE IN COMPANY (${people.length} total):`);
          people.forEach((person, index) => {
            const coresignalData = person.customFields?.coresignal;
            const isDecisionMaker = coresignalData?.is_decision_maker === 1;
            const managementLevel = coresignalData?.active_experience_management_level;
            const title = person.jobTitle || coresignalData?.active_experience_title || 'Unknown';
            
            console.log(`   ${index + 1}. ${person.fullName}`);
            console.log(`      Title: ${title}`);
            console.log(`      Assigned Role: ${person.buyerGroupRole || 'None'}`);
            console.log(`      CoreSignal Decision Maker: ${isDecisionMaker ? 'YES' : 'NO'}`);
            console.log(`      Management Level: ${managementLevel || 'Unknown'}`);
            console.log(`      Created: ${person.createdAt.toISOString().split('T')[0]}`);
            console.log(`      Last Enriched: ${person.lastEnriched?.toISOString().split('T')[0] || 'Never'}`);
            
            // Check if this person SHOULD be a decision maker
            const shouldBeDecisionMaker = 
              isDecisionMaker || 
              title.toLowerCase().includes('head of') ||
              title.toLowerCase().includes('director') ||
              title.toLowerCase().includes('vp') ||
              title.toLowerCase().includes('chief') ||
              title.toLowerCase().includes('president') ||
              title.toLowerCase().includes('ceo');
            
            if (shouldBeDecisionMaker && person.buyerGroupRole !== 'Decision Maker') {
              console.log(`      🚨 MISASSIGNED: Should be Decision Maker but is ${person.buyerGroupRole || 'None'}!`);
            }
            console.log('');
          });

          // Check if there are any people who should be decision makers
          const potentialDecisionMakers = people.filter(person => {
            const coresignalData = person.customFields?.coresignal;
            const isDecisionMaker = coresignalData?.is_decision_maker === 1;
            const title = person.jobTitle || coresignalData?.active_experience_title || '';
            
            return isDecisionMaker || 
                   title.toLowerCase().includes('head of') ||
                   title.toLowerCase().includes('director') ||
                   title.toLowerCase().includes('vp') ||
                   title.toLowerCase().includes('chief') ||
                   title.toLowerCase().includes('president') ||
                   title.toLowerCase().includes('ceo');
          });

          if (potentialDecisionMakers.length > 0) {
            console.log(`🚨 FOUND ${potentialDecisionMakers.length} PEOPLE WHO SHOULD BE DECISION MAKERS:`);
            potentialDecisionMakers.forEach(person => {
              console.log(`   - ${person.fullName} (${person.jobTitle}) - Currently: ${person.buyerGroupRole || 'None'}`);
            });
          } else {
            console.log(`⚠️ NO OBVIOUS DECISION MAKERS FOUND - May need better search criteria`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseNoDecisionMakers().catch(console.error);
