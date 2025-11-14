#!/usr/bin/env node

/**
 * Direct API Test Script for Minnesota Power
 * 
 * This script directly tests the People and Buyer Groups APIs to verify
 * they return data for Minnesota Power company.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MINNESOTA_POWER_ID = '01K9QD382T5FKBSF0AS72RAFAT';
const MINNESOTA_POWER_WORKSPACE = '01K9QAP09FHT6EAP1B4G2KP3D2';
const MAIN_SELLER_ID = '01K9QD2DETS5YD3Y8MMF40RBQ1';

async function testPeopleAPI() {
  console.log('\n🧪 TEST 1: People API Direct Query');
  console.log('='.repeat(80));
  
  try {
    // Simulate what the API does
    const where = {
      workspaceId: MINNESOTA_POWER_WORKSPACE,
      deletedAt: null,
      companyId: MINNESOTA_POWER_ID,
      OR: [
        { mainSellerId: MAIN_SELLER_ID },
        { mainSellerId: null }
      ]
    };
    
    console.log('\nQuery WHERE clause:', JSON.stringify(where, null, 2));
    
    const people = await prisma.people.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        status: true,
        companyId: true,
        workspaceId: true,
        mainSellerId: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 200
    });
    
    const totalCount = await prisma.people.count({ where });
    
    console.log(`\n✅ Query executed successfully`);
    console.log(`📊 Found ${people.length} people (total: ${totalCount})`);
    
    if (people.length > 0) {
      console.log('\n📋 People found:');
      people.forEach((person, idx) => {
        console.log(`\n  [${idx + 1}] ${person.fullName}`);
        console.log(`      Status: ${person.status}`);
        console.log(`      Email: ${person.email || 'N/A'}`);
        console.log(`      Job: ${person.jobTitle || 'N/A'}`);
        console.log(`      CompanyId: ${person.companyId}`);
        console.log(`      WorkspaceId: ${person.workspaceId}`);
        console.log(`      MainSeller: ${person.mainSellerId || 'NULL'}`);
      });
    } else {
      console.log('\n❌ NO PEOPLE FOUND!');
      console.log('\nThis means the API query would return empty results.');
      console.log('Possible reasons:');
      console.log('  1. Workspace filter is excluding records');
      console.log('  2. MainSeller filter is excluding records');
      console.log('  3. CompanyId is incorrect');
    }
    
    return { success: true, count: people.length, people };
    
  } catch (error) {
    console.error('\n❌ Error testing People API:', error);
    return { success: false, error: error.message };
  }
}

async function testBuyerGroupsAPI() {
  console.log('\n\n🧪 TEST 2: Buyer Groups API Direct Query');
  console.log('='.repeat(80));
  
  try {
    // Simulate what the fast buyer groups API does
    const where = {
      AND: [
        {
          companyId: MINNESOTA_POWER_ID
        },
        {
          workspaceId: MINNESOTA_POWER_WORKSPACE,
          deletedAt: null
        },
        {
          OR: [
            { buyerGroupRole: { not: null } },
            { isBuyerGroupMember: true },
            {
              customFields: {
                path: ['buyerGroupStatus'],
                equals: 'in'
              }
            }
          ]
        }
      ]
    };
    
    console.log('\nQuery WHERE clause:', JSON.stringify(where, null, 2));
    
    const people = await prisma.people.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        status: true,
        companyId: true,
        workspaceId: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        customFields: true
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });
    
    console.log(`\n✅ Query executed successfully`);
    console.log(`📊 Found ${people.length} buyer group members`);
    
    if (people.length > 0) {
      console.log('\n📋 Buyer group members found:');
      people.forEach((person, idx) => {
        console.log(`\n  [${idx + 1}] ${person.fullName}`);
        console.log(`      Status: ${person.status}`);
        console.log(`      Email: ${person.email || 'N/A'}`);
        console.log(`      Job: ${person.jobTitle || 'N/A'}`);
        console.log(`      Buyer Group Role: ${person.buyerGroupRole || 'NULL'}`);
        console.log(`      Is Member: ${person.isBuyerGroupMember || false}`);
        console.log(`      CompanyId: ${person.companyId}`);
        console.log(`      WorkspaceId: ${person.workspaceId}`);
      });
    } else {
      console.log('\n❌ NO BUYER GROUP MEMBERS FOUND!');
      console.log('\nThis means no people have buyer group roles assigned.');
    }
    
    return { success: true, count: people.length, people };
    
  } catch (error) {
    console.error('\n❌ Error testing Buyer Groups API:', error);
    return { success: false, error: error.message };
  }
}

async function testWithDifferentFilters() {
  console.log('\n\n🧪 TEST 3: Testing Without Filters');
  console.log('='.repeat(80));
  
  try {
    // Test 1: Just companyId, no workspace or seller filter
    console.log('\n📋 Test 3a: CompanyId only (no workspace/seller filter)');
    const peopleByCompanyOnly = await prisma.people.findMany({
      where: {
        companyId: MINNESOTA_POWER_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        workspaceId: true,
        mainSellerId: true
      }
    });
    console.log(`   Found ${peopleByCompanyOnly.length} people`);
    
    // Test 2: CompanyId + workspace
    console.log('\n📋 Test 3b: CompanyId + Workspace (no seller filter)');
    const peopleByCompanyAndWorkspace = await prisma.people.findMany({
      where: {
        companyId: MINNESOTA_POWER_ID,
        workspaceId: MINNESOTA_POWER_WORKSPACE,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        mainSellerId: true
      }
    });
    console.log(`   Found ${peopleByCompanyAndWorkspace.length} people`);
    
    // Show breakdown by seller
    const sellerBreakdown = peopleByCompanyAndWorkspace.reduce((acc, p) => {
      const seller = p.mainSellerId || 'NULL';
      acc[seller] = (acc[seller] || 0) + 1;
      return acc;
    }, {});
    console.log('\n   Breakdown by mainSellerId:');
    Object.entries(sellerBreakdown).forEach(([seller, count]) => {
      console.log(`      ${seller}: ${count} people`);
    });
    
    // Test 3: With seller filter
    console.log('\n📋 Test 3c: CompanyId + Workspace + Seller Filter');
    const peopleWithSellerFilter = await prisma.people.findMany({
      where: {
        companyId: MINNESOTA_POWER_ID,
        workspaceId: MINNESOTA_POWER_WORKSPACE,
        deletedAt: null,
        OR: [
          { mainSellerId: MAIN_SELLER_ID },
          { mainSellerId: null }
        ]
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        mainSellerId: true
      }
    });
    console.log(`   Found ${peopleWithSellerFilter.length} people`);
    
    return {
      success: true,
      companyOnly: peopleByCompanyOnly.length,
      companyAndWorkspace: peopleByCompanyAndWorkspace.length,
      withSellerFilter: peopleWithSellerFilter.length
    };
    
  } catch (error) {
    console.error('\n❌ Error testing filters:', error);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Comprehensive API Tests');
  console.log('🎯 Target: Minnesota Power (01K9QD382T5FKBSF0AS72RAFAT)');
  console.log('🏢 Workspace: 01K9QAP09FHT6EAP1B4G2KP3D2');
  console.log('👤 Main Seller: 01K9QD2DETS5YD3Y8MMF40RBQ1\n');
  
  try {
    const peopleResult = await testPeopleAPI();
    const buyerGroupsResult = await testBuyerGroupsAPI();
    const filtersResult = await testWithDifferentFilters();
    
    console.log('\n\n📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ People API: ${peopleResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   Records returned: ${peopleResult.count || 0}`);
    
    console.log(`\n✅ Buyer Groups API: ${buyerGroupsResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   Records returned: ${buyerGroupsResult.count || 0}`);
    
    console.log(`\n✅ Filter Tests: ${filtersResult.success ? 'PASSED' : 'FAILED'}`);
    console.log(`   CompanyId only: ${filtersResult.companyOnly || 0} people`);
    console.log(`   + Workspace: ${filtersResult.companyAndWorkspace || 0} people`);
    console.log(`   + Seller filter: ${filtersResult.withSellerFilter || 0} people`);
    
    console.log('\n\n💡 ANALYSIS');
    console.log('='.repeat(80));
    
    if (peopleResult.count === 0) {
      console.log('\n❌ ISSUE IDENTIFIED: People API query returns 0 results');
      console.log('\n   This explains why the People tab shows no data.');
      console.log('\n   The filters in the API are excluding all records.');
      console.log('   Check:');
      console.log('   1. Is the mainSellerId filter too restrictive?');
      console.log('   2. Is the workspace ID correct?');
      console.log('   3. Are people assigned to a different seller?');
    } else {
      console.log('\n✅ People API query works correctly');
      console.log(`   Returns ${peopleResult.count} people as expected`);
      console.log('\n   If frontend shows no data, the issue is:');
      console.log('   1. Frontend not passing correct companyId');
      console.log('   2. Auth context using wrong workspace');
      console.log('   3. Response being filtered client-side');
    }
    
    if (buyerGroupsResult.count === 0) {
      console.log('\n⚠️  Buyer Groups API returns 0 results');
      console.log('   This is expected if no people have buyer group roles assigned.');
    } else {
      console.log(`\n✅ Buyer Groups API returns ${buyerGroupsResult.count} members`);
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error running tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
runAllTests()
  .then(() => {
    console.log('✅ All tests completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

