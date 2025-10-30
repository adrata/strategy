#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseDuplicateLeads() {
  try {
    console.log('🔍 DIAGNOSING DUPLICATE LEADS ISSUE');
    console.log('=====================================\n');

    // Get all workspaces to check
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });

    console.log(`📊 Found ${workspaces.length} active workspaces\n`);

    for (const workspace of workspaces) {
      console.log(`🏢 WORKSPACE: ${workspace.name} (${workspace.id})`);
      console.log('='.repeat(50));

      // Step 1: Count people with LEAD status
      const peopleWithLeadStatus = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          status: 'LEAD'
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          companyId: true,
          status: true,
          createdAt: true
        }
      });

      console.log(`👥 People with LEAD status: ${peopleWithLeadStatus.length}`);

      // Step 2: Count companies with 0 people and LEAD status
      const companiesWithNoPeople = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          people: { none: {} }, // Companies with 0 people
          OR: [
            { status: 'LEAD' },
            { status: null } // Include companies without status set
          ]
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true
        }
      });

      console.log(`🏢 Companies with 0 people (LEAD or null status): ${companiesWithNoPeople.length}`);

      // Step 3: Count companies with people and LEAD status (these should NOT appear in leads)
      const companiesWithPeople = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          people: { some: {} }, // Companies with at least 1 person
          OR: [
            { status: 'LEAD' },
            { status: null }
          ]
        },
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: { people: true }
          }
        }
      });

      console.log(`🏢 Companies with people (LEAD or null status): ${companiesWithPeople.length}`);
      if (companiesWithPeople.length > 0) {
        console.log('   ⚠️  These companies should NOT appear in leads (they have people)');
        companiesWithPeople.forEach(company => {
          console.log(`      - ${company.name} (${company._count.people} people)`);
        });
      }

      // Step 4: Check for duplicate person records (same name, email, workspace)
      console.log('\n🔍 CHECKING FOR DUPLICATE PERSON RECORDS:');
      const duplicatePeople = await prisma.people.groupBy({
        by: ['fullName', 'email', 'workspaceId'],
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          status: 'LEAD'
        },
        _count: { id: true },
        having: {
          id: { _count: { gt: 1 } }
        }
      });

      if (duplicatePeople.length > 0) {
        console.log(`❌ Found ${duplicatePeople.length} groups of duplicate person records:`);
        for (const group of duplicatePeople) {
          console.log(`   - Name: "${group.fullName}", Email: "${group.email || 'null'}" (${group._count.id} duplicates)`);
          
          // Get the actual duplicate records
          const duplicates = await prisma.people.findMany({
            where: {
              workspaceId: workspace.id,
              deletedAt: null,
              fullName: group.fullName,
              email: group.email
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              companyId: true,
              createdAt: true
            }
          });
          
          duplicates.forEach((dup, index) => {
            console.log(`     ${index + 1}. ID: ${dup.id}, Company: ${dup.companyId || 'null'}, Created: ${dup.createdAt.toISOString()}`);
          });
        }
      } else {
        console.log('✅ No duplicate person records found');
      }

      // Step 5: Check for companies that might be appearing in both queries
      console.log('\n🔍 CHECKING FOR OVERLAP BETWEEN PEOPLE AND COMPANIES:');
      
      // Get all company IDs that have people with LEAD status
      const companyIdsWithLeadPeople = new Set(
        peopleWithLeadStatus
          .filter(person => person.companyId)
          .map(person => person.companyId)
      );

      // Check if any companies with 0 people have the same ID as companies with people
      const overlappingCompanies = companiesWithNoPeople.filter(company => 
        companyIdsWithLeadPeople.has(company.id)
      );

      if (overlappingCompanies.length > 0) {
        console.log(`❌ Found ${overlappingCompanies.length} companies that appear in both queries:`);
        overlappingCompanies.forEach(company => {
          console.log(`   - ${company.name} (ID: ${company.id})`);
        });
      } else {
        console.log('✅ No overlapping companies found');
      }

      // Step 6: Simulate the API response to see what would be returned
      console.log('\n📊 SIMULATED API RESPONSE:');
      const totalLeads = peopleWithLeadStatus.length + companiesWithNoPeople.length;
      console.log(`   Total leads that would be returned: ${totalLeads}`);
      console.log(`   - Person records: ${peopleWithLeadStatus.length}`);
      console.log(`   - Company records: ${companiesWithNoPeople.length}`);

      // Step 7: Check for potential visual duplicates (same name appearing twice)
      const allNames = [
        ...peopleWithLeadStatus.map(p => p.fullName),
        ...companiesWithNoPeople.map(c => c.name)
      ];
      
      const nameCounts = {};
      allNames.forEach(name => {
        nameCounts[name] = (nameCounts[name] || 0) + 1;
      });

      const duplicateNames = Object.entries(nameCounts).filter(([name, count]) => count > 1);
      
      if (duplicateNames.length > 0) {
        console.log(`\n❌ Found ${duplicateNames.length} names that appear multiple times:`);
        duplicateNames.forEach(([name, count]) => {
          console.log(`   - "${name}" appears ${count} times`);
        });
      } else {
        console.log('\n✅ No duplicate names found in the combined result');
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Summary across all workspaces
    console.log('📋 SUMMARY ACROSS ALL WORKSPACES:');
    console.log('=================================');
    
    const totalPeopleLeads = await prisma.people.count({
      where: {
        deletedAt: null,
        status: 'LEAD'
      }
    });

    const totalCompanyLeads = await prisma.companies.count({
      where: {
        deletedAt: null,
        people: { none: {} },
        OR: [
          { status: 'LEAD' },
          { status: null }
        ]
      }
    });

    console.log(`Total people with LEAD status: ${totalPeopleLeads}`);
    console.log(`Total companies with 0 people (LEAD/null): ${totalCompanyLeads}`);
    console.log(`Total leads that would be returned: ${totalPeopleLeads + totalCompanyLeads}`);

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDuplicateLeads();
