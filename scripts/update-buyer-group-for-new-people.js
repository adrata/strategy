const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

// Company IDs that need buyer group intelligence update
const companyIds = ['01K46BZ9R2JSGVMR798833JY4N'];

// Buyer group role assignment logic
function determineBuyerGroupRole(title) {
  if (!title) return { role: 'Stakeholder', decisionPower: 30, influenceLevel: 'Low' };

  const normalizedTitle = title.toLowerCase();

  // Decision Makers - highest authority
  if (normalizedTitle.match(/ceo|president|cfo|cto|coo|owner|founder|principal|managing partner|vp finance|vp operations/i)) {
    return { role: 'Decision Maker', decisionPower: 100, influenceLevel: 'High' };
  }

  // Champions - influential advocates
  if (normalizedTitle.match(/director|senior vice president|svp|vice president|vp|manager|senior manager|lead|head of|chief/i)) {
    return { role: 'Champion', decisionPower: 80, influenceLevel: 'High' };
  }

  // Introducers - can facilitate connections
  if (normalizedTitle.match(/business development|sales|account manager|relationship manager|partner/i)) {
    return { role: 'Introducer', decisionPower: 60, influenceLevel: 'Medium' };
  }

  // Blockers - potential resistance
  if (normalizedTitle.match(/legal|compliance|risk|audit|security/i)) {
    return { role: 'Blocker', decisionPower: 70, influenceLevel: 'Medium' };
  }

  // Default to Stakeholder
  return { role: 'Stakeholder', decisionPower: 30, influenceLevel: 'Low' };
}

async function updateBuyerGroupIntelligence() {
  console.log('🎯 BUYER GROUP INTELLIGENCE UPDATE');
  console.log('=' .repeat(60));
  console.log(`Processing ${companyIds.length} companies with new people\n`);

  let companiesProcessed = 0;
  let peopleUpdated = 0;
  let buyerGroupsCreated = 0;
  let buyerGroupsUpdated = 0;

  for (const companyId of companyIds) {
    try {
      // Get company with its people
      const company = await prisma.companies.findUnique({
        where: { id: companyId },
        include: {
          people: {
            where: { deletedAt: null }
          }
        }
      });

      if (!company) {
        console.log(`⚠️  Company ${companyId} not found, skipping`);
        continue;
      }

      console.log(`\n🏢 ${company.name}`);
      console.log(`   People count: ${company.people.length}`);

      if (company.people.length === 0) {
        console.log(`   ⚠️  No people found, skipping buyer group`);
        continue;
      }

      // Create buyer group structure
      const buyerGroupData = {
        decisionMakers: [],
        champions: [],
        blockers: [],
        introducers: [],
        stakeholders: []
      };

      let totalDecisionPower = 0;
      let peopleWithRoles = 0;

      // Assign roles to people
      for (const person of company.people) {
        const { role, decisionPower, influenceLevel } = determineBuyerGroupRole(person.jobTitle);
        
        const personInfo = {
          id: person.id,
          name: person.fullName,
          title: person.jobTitle || 'Unknown',
          email: person.email,
          decisionPower: decisionPower,
          influenceLevel: influenceLevel
        };

        // Add to appropriate category
        switch (role) {
          case 'Decision Maker':
            buyerGroupData.decisionMakers.push(personInfo);
            break;
          case 'Champion':
            buyerGroupData.champions.push(personInfo);
            break;
          case 'Blocker':
            buyerGroupData.blockers.push(personInfo);
            break;
          case 'Introducer':
            buyerGroupData.introducers.push(personInfo);
            break;
          default:
            buyerGroupData.stakeholders.push(personInfo);
        }

        totalDecisionPower += decisionPower;
        peopleWithRoles++;

        // Update person with buyer group role
        await prisma.people.update({
          where: { id: person.id },
          data: {
            buyerGroupRole: role,
            decisionPower: decisionPower,
            influenceLevel: influenceLevel,
            updatedAt: new Date()
          }
        });

        peopleUpdated++;
        console.log(`   ✅ ${person.fullName}: ${role} (Decision Power: ${decisionPower})`);
      }

      // Calculate average decision power
      const avgDecisionPower = peopleWithRoles > 0 ? Math.round(totalDecisionPower / peopleWithRoles) : 0;

      // Determine overall buying readiness
      let buyingReadiness = 'Low';
      if (buyerGroupData.decisionMakers.length > 0 && buyerGroupData.champions.length > 0) {
        buyingReadiness = 'High';
      } else if (buyerGroupData.decisionMakers.length > 0 || buyerGroupData.champions.length > 0) {
        buyingReadiness = 'Medium';
      }

      // Check if buyer group already exists for this company
      const existingBuyerGroup = await prisma.BuyerGroups.findFirst({
        where: {
          workspaceId: WORKSPACE_ID,
          companyName: company.name
        }
      });

      const buyerGroupMetadata = {
        buyerGroupData: buyerGroupData,
        avgDecisionPower: avgDecisionPower,
        buyingReadiness: buyingReadiness,
        lastUpdated: new Date().toISOString()
      };

      if (existingBuyerGroup) {
        // Update existing buyer group
        await prisma.BuyerGroups.update({
          where: { id: existingBuyerGroup.id },
          data: {
            totalMembers: company.people.length,
            overallConfidence: avgDecisionPower,
            metadata: buyerGroupMetadata,
            updatedAt: new Date()
          }
        });
        
        // Delete existing members
        await prisma.BuyerGroupMembers.deleteMany({
          where: { buyerGroupId: existingBuyerGroup.id }
        });
        
        // Create new members
        for (const [category, members] of Object.entries(buyerGroupData)) {
          let roleName = 'stakeholder';
          if (category === 'decisionMakers') roleName = 'decision';
          else if (category === 'champions') roleName = 'champion';
          else if (category === 'blockers') roleName = 'blocker';
          else if (category === 'introducers') roleName = 'introducer';
          
          for (const member of members) {
            await prisma.BuyerGroupMembers.create({
              data: {
                id: `${existingBuyerGroup.id}_${member.id}`,
                buyerGroupId: existingBuyerGroup.id,
                name: member.name,
                title: member.title,
                role: roleName,
                email: member.email,
                confidence: member.decisionPower,
                influenceScore: member.decisionPower,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        }
        
        buyerGroupsUpdated++;
        console.log(`   🔄 Updated existing buyer group (Readiness: ${buyingReadiness})`);
      } else {
        // Create new buyer group
        const newBuyerGroup = await prisma.BuyerGroups.create({
          data: {
            id: `bg_${companyId}`,
            companyName: company.name,
            workspaceId: WORKSPACE_ID,
            website: company.website,
            industry: company.industry,
            companySize: company.size,
            totalMembers: company.people.length,
            overallConfidence: avgDecisionPower,
            cohesionScore: avgDecisionPower,
            metadata: buyerGroupMetadata,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Create buyer group members
        for (const [category, members] of Object.entries(buyerGroupData)) {
          let roleName = 'stakeholder';
          if (category === 'decisionMakers') roleName = 'decision';
          else if (category === 'champions') roleName = 'champion';
          else if (category === 'blockers') roleName = 'blocker';
          else if (category === 'introducers') roleName = 'introducer';
          
          for (const member of members) {
            await prisma.BuyerGroupMembers.create({
              data: {
                id: `${newBuyerGroup.id}_${member.id}`,
                buyerGroupId: newBuyerGroup.id,
                name: member.name,
                title: member.title,
                role: roleName,
                email: member.email,
                confidence: member.decisionPower,
                influenceScore: member.decisionPower,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        }
        
        buyerGroupsCreated++;
        console.log(`   ✨ Created new buyer group (Readiness: ${buyingReadiness})`);
      }

      companiesProcessed++;
    } catch (error) {
      console.error(`   ❌ Error processing company ${companyId}: ${error.message}`);
    }
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPDATE COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n🏢 COMPANIES:`);
  console.log(`   Processed: ${companiesProcessed}`);
  
  console.log(`\n👥 PEOPLE:`);
  console.log(`   Updated with buyer group roles: ${peopleUpdated}`);
  
  console.log(`\n🎯 BUYER GROUPS:`);
  console.log(`   Created: ${buyerGroupsCreated}`);
  console.log(`   Updated: ${buyerGroupsUpdated}`);

  await prisma.$disconnect();
}

updateBuyerGroupIntelligence().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});

