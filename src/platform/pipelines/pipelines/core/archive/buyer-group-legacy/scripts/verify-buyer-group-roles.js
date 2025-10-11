#!/usr/bin/env node

/**
 * 🔍 VERIFY BUYER GROUP ROLES
 * 
 * This script verifies if each person has a buyer group role
 * and analyzes the buyer group structure.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function verifyBuyerGroupRoles() {
  console.log('🔍 VERIFYING BUYER GROUP ROLES');
  console.log('==============================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all people
    const allPeople = await prisma.people.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        companyId: true,
        buyerGroupRole: true
      }
    });

    // Get all buyer groups
    const allBuyerGroups = await prisma.buyer_groups.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        status: true,
        _count: {
          select: {
            people: true
          }
        }
      }
    });

    // Get buyer group to person relationships
    const buyerGroupRelations = await prisma.buyerGroupToPerson.findMany({
      where: {
        buyerGroup: {
          workspaceId: TOP_WORKSPACE_ID
        }
      },
      select: {
        personId: true,
        buyerGroupId: true,
        role: true,
        influence: true,
        isPrimary: true,
        notes: true
      }
    });

    console.log('📊 BUYER GROUP OVERVIEW:');
    console.log(`   Total People: ${allPeople.length.toLocaleString()}`);
    console.log(`   Total Buyer Groups: ${allBuyerGroups.length.toLocaleString()}`);
    console.log(`   Buyer Group Relationships: ${buyerGroupRelations.length.toLocaleString()}\n`);

    // Analyze people with buyer group roles
    const peopleWithBuyerGroupRole = allPeople.filter(p => p.buyerGroupRole);
    const peopleWithoutBuyerGroupRole = allPeople.filter(p => !p.buyerGroupRole);

    console.log('👥 PEOPLE BUYER GROUP ROLE ANALYSIS:');
    console.log(`   People with buyerGroupRole field: ${peopleWithBuyerGroupRole.length.toLocaleString()}`);
    console.log(`   People without buyerGroupRole field: ${peopleWithoutBuyerGroupRole.length.toLocaleString()}\n`);

    // Analyze buyer group relationships
    const peopleInBuyerGroups = new Set(buyerGroupRelations.map(r => r.personId));
    const peopleNotInBuyerGroups = allPeople.filter(p => !peopleInBuyerGroups.has(p.id));

    console.log('🔗 BUYER GROUP RELATIONSHIP ANALYSIS:');
    console.log(`   People in buyer groups: ${peopleInBuyerGroups.size.toLocaleString()}`);
    console.log(`   People NOT in buyer groups: ${peopleNotInBuyerGroups.length.toLocaleString()}\n`);

    // Analyze roles in buyer groups
    const roleDistribution = {};
    const influenceDistribution = {};
    let primaryCount = 0;

    buyerGroupRelations.forEach(rel => {
      const role = rel.role || 'No Role';
      const influence = rel.influence || 'No Influence';
      
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      influenceDistribution[influence] = (influenceDistribution[influence] || 0) + 1;
      
      if (rel.isPrimary) primaryCount++;
    });

    console.log('📊 BUYER GROUP ROLE DISTRIBUTION:');
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`   ${role}: ${count.toLocaleString()}`);
    });
    console.log('');

    console.log('📊 INFLUENCE DISTRIBUTION:');
    Object.entries(influenceDistribution).forEach(([influence, count]) => {
      console.log(`   ${influence}: ${count.toLocaleString()}`);
    });
    console.log('');

    console.log(`📊 PRIMARY CONTACTS: ${primaryCount.toLocaleString()}\n`);

    // Analyze buyer groups
    console.log('🏢 BUYER GROUPS ANALYSIS:');
    const activeBuyerGroups = allBuyerGroups.filter(bg => bg.status === 'active');
    const inactiveBuyerGroups = allBuyerGroups.filter(bg => bg.status !== 'active');
    
    console.log(`   Active buyer groups: ${activeBuyerGroups.length.toLocaleString()}`);
    console.log(`   Inactive buyer groups: ${inactiveBuyerGroups.length.toLocaleString()}\n`);

    // Show buyer groups with most people
    const topBuyerGroups = allBuyerGroups
      .sort((a, b) => b._count.people - a._count.people)
      .slice(0, 10);

    console.log('📈 TOP 10 BUYER GROUPS BY PEOPLE COUNT:');
    topBuyerGroups.forEach((bg, index) => {
      console.log(`   ${index + 1}. ${bg.name}: ${bg._count.people} people (${bg.status})`);
    });
    console.log('');

    // Show examples of people without buyer group roles
    if (peopleWithoutBuyerGroupRole.length > 0) {
      console.log('📋 EXAMPLES OF PEOPLE WITHOUT BUYER GROUP ROLES:');
      peopleWithoutBuyerGroupRole.slice(0, 10).forEach(person => {
        console.log(`   - ${person.fullName} (${person.email})`);
      });
      console.log('');
    }

    // Show examples of people not in buyer groups
    if (peopleNotInBuyerGroups.length > 0) {
      console.log('📋 EXAMPLES OF PEOPLE NOT IN BUYER GROUPS:');
      peopleNotInBuyerGroups.slice(0, 10).forEach(person => {
        console.log(`   - ${person.fullName} (${person.email})`);
      });
      console.log('');
    }

    // Final analysis
    console.log('🎯 BUYER GROUP COVERAGE ANALYSIS:');
    console.log('=================================\n');
    
    const coverageByRoleField = (peopleWithBuyerGroupRole.length / allPeople.length) * 100;
    const coverageByRelationship = (peopleInBuyerGroups.size / allPeople.length) * 100;
    
    console.log(`📊 COVERAGE STATISTICS:`);
    console.log(`   People with buyerGroupRole field: ${coverageByRoleField.toFixed(1)}%`);
    console.log(`   People in buyer group relationships: ${coverageByRelationship.toFixed(1)}%\n`);

    if (coverageByRoleField === 100 && coverageByRelationship === 100) {
      console.log('✅ SUCCESS: All people have buyer group roles!\n');
    } else if (coverageByRoleField >= 90 && coverageByRelationship >= 90) {
      console.log('✅ GOOD: Most people have buyer group roles\n');
    } else if (coverageByRoleField >= 50 && coverageByRelationship >= 50) {
      console.log('⚠️  PARTIAL: Some people have buyer group roles\n');
    } else {
      console.log('❌ LOW: Few people have buyer group roles\n');
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (peopleWithoutBuyerGroupRole.length > 0) {
      console.log(`   1. 🔧 ASSIGN ROLES: Set buyerGroupRole for ${peopleWithoutBuyerGroupRole.length} people`);
    }
    if (peopleNotInBuyerGroups.length > 0) {
      console.log(`   2. 🔗 CREATE RELATIONSHIPS: Add ${peopleNotInBuyerGroups.length} people to buyer groups`);
    }
    if (allBuyerGroups.length === 0) {
      console.log('   3. 🏢 CREATE BUYER GROUPS: No buyer groups exist - create them for companies');
    }
    console.log('   4. 📊 IMPLEMENT WORKFLOWS: Automate buyer group role assignment');
    console.log('   5. 🎯 DEFINE ROLES: Establish standard buyer group roles (Decision Maker, Influencer, etc.)\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyBuyerGroupRoles().catch(console.error);
