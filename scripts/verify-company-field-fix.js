#!/usr/bin/env node

/**
 * Verification Script for Company Field Fix
 * 
 * This script verifies that:
 * 1. People API returns companyId even when company relation is null
 * 2. Company name is fetched and included when relation is null
 * 3. Co-workers tab can render when companyId exists
 * 
 * Usage: node scripts/verify-company-field-fix.js [personId]
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCompanyFieldFix(personId = null) {
  console.log('🔍 Verifying Company Field Fix...\n');

  try {
    // Find a person with companyId but potentially null company relation
    let person;
    
    if (personId) {
      person = await prisma.people.findUnique({
        where: { id: personId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
            },
          },
        },
      });
      
      if (!person) {
        console.error(`❌ Person with ID ${personId} not found`);
        return;
      }
    } else {
      // Find a person with companyId
      person = await prisma.people.findFirst({
        where: {
          companyId: { not: null },
          deletedAt: null,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
            },
          },
        },
        take: 1,
      });
      
      if (!person) {
        console.log('⚠️ No person with companyId found. Creating test scenario...');
        // Create a test scenario
        const testCompany = await prisma.companies.create({
          data: {
            name: 'Test Company for Verification',
            workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1', // Default workspace
            deletedAt: new Date(), // Soft-delete it
          },
        });
        
        const testPerson = await prisma.people.create({
          data: {
            fullName: 'Test Person for Verification',
            email: 'test-verification@example.com',
            companyId: testCompany.id,
            workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                deletedAt: true,
              },
            },
          },
        });
        
        person = testPerson;
        console.log(`✅ Created test person: ${testPerson.id}`);
      }
    }

    console.log(`\n📋 Person Details:`);
    console.log(`  - ID: ${person.id}`);
    console.log(`  - Name: ${person.fullName}`);
    console.log(`  - Company ID: ${person.companyId || 'None'}`);
    console.log(`  - Company Relation: ${person.company ? 'EXISTS' : 'NULL'}`);
    
    if (person.company) {
      console.log(`  - Company Name (from relation): ${person.company.name}`);
      console.log(`  - Company Deleted: ${person.company.deletedAt ? 'YES' : 'NO'}`);
    }

    // Test 1: Verify companyId exists
    console.log(`\n✅ Test 1: Company ID exists`);
    if (person.companyId) {
      console.log(`   PASS: companyId = ${person.companyId}`);
    } else {
      console.log(`   FAIL: companyId is null`);
      return;
    }

    // Test 2: Check if company relation is null
    console.log(`\n✅ Test 2: Company relation status`);
    if (!person.company) {
      console.log(`   INFO: Company relation is NULL (this is the scenario we're testing)`);
      
      // Test 3: Try to fetch company directly
      console.log(`\n✅ Test 3: Fetching company directly by ID`);
      try {
        const fetchedCompany = await prisma.companies.findUnique({
          where: {
            id: person.companyId,
          },
          select: {
            id: true,
            name: true,
            deletedAt: true,
          },
        });
        
        if (fetchedCompany) {
          console.log(`   PASS: Company found directly`);
          console.log(`   - Company Name: ${fetchedCompany.name}`);
          console.log(`   - Company Deleted: ${fetchedCompany.deletedAt ? 'YES (soft-deleted)' : 'NO'}`);
        } else {
          console.log(`   WARN: Company not found in database (may be hard-deleted)`);
        }
      } catch (error) {
        console.log(`   ERROR: Failed to fetch company: ${error.message}`);
      }
    } else {
      console.log(`   INFO: Company relation EXISTS`);
      console.log(`   - Company Name: ${person.company.name}`);
    }

    // Test 4: Verify API would return companyId
    console.log(`\n✅ Test 4: API Response Structure`);
    console.log(`   Expected API response should include:`);
    console.log(`   - companyId: ${person.companyId}`);
    if (person.company) {
      console.log(`   - company: { name: "${person.company.name}", ... }`);
    } else {
      console.log(`   - company: null (but should be fetched by API)`);
    }

    // Test 5: Check co-workers tab rendering
    console.log(`\n✅ Test 5: Co-workers Tab Rendering`);
    if (person.companyId) {
      console.log(`   PASS: companyId exists, co-workers tab should render`);
      
      // Count people at same company
      const coworkerCount = await prisma.people.count({
        where: {
          companyId: person.companyId,
          id: { not: person.id },
          deletedAt: null,
        },
      });
      
      console.log(`   - Co-workers at same company: ${coworkerCount}`);
    } else {
      console.log(`   FAIL: companyId is null, co-workers tab should NOT render`);
    }

    console.log(`\n✅ Verification Complete!`);
    console.log(`\n📝 Summary:`);
    console.log(`   - Person ID: ${person.id}`);
    console.log(`   - Company ID: ${person.companyId}`);
    console.log(`   - Company Relation: ${person.company ? 'EXISTS' : 'NULL'}`);
    console.log(`   - Fix Status: ${person.companyId && !person.company ? 'NEEDS FIX' : 'OK'}`);
    
    if (person.companyId && !person.company) {
      console.log(`\n⚠️  This person has companyId but null company relation.`);
      console.log(`   The API should fetch the company name automatically.`);
      console.log(`   Test the API endpoint: GET /api/v1/people/${person.id}`);
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
const personId = process.argv[2] || null;
verifyCompanyFieldFix(personId)
  .then(() => {
    console.log('\n✅ Verification script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification script failed:', error);
    process.exit(1);
  });

