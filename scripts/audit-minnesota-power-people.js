#!/usr/bin/env node

/**
 * Audit Script: Minnesota Power People Linkage
 * 
 * This script investigates why the People and Buyer Group tabs aren't showing
 * associated records for Minnesota Power company.
 * 
 * It checks:
 * - Company record and ID
 * - All people records that should be associated
 * - companyId linkage status
 * - Workspace consistency
 * - Status and relationship fields
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditMinnesotaPowerPeople() {
  console.log('\n🔍 Starting Minnesota Power People Audit...\n');
  
  try {
    // Step 1: Find Minnesota Power company record
    console.log('📋 STEP 1: Finding Minnesota Power company record...');
    
    const companies = await prisma.companies.findMany({
      where: {
        name: {
          contains: 'Minnesota Power',
          mode: 'insensitive'
        },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        workspaceId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        mainSellerId: true
      }
    });
    
    console.log(`\nFound ${companies.length} company record(s):`);
    companies.forEach((company, idx) => {
      console.log(`\n  [${idx + 1}] Company:`);
      console.log(`      ID: ${company.id}`);
      console.log(`      Name: ${company.name}`);
      console.log(`      Website: ${company.website || 'N/A'}`);
      console.log(`      Workspace: ${company.workspaceId}`);
      console.log(`      Status: ${company.status || 'N/A'}`);
      console.log(`      Main Seller: ${company.mainSellerId || 'N/A'}`);
      console.log(`      Created: ${company.createdAt}`);
    });
    
    if (companies.length === 0) {
      console.log('\n❌ No Minnesota Power company found!');
      return;
    }
    
    // Use the first matching company (or all if multiple)
    for (const company of companies) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`\n🏢 AUDITING: ${company.name} (${company.id})`);
      console.log(`${'='.repeat(80)}\n`);
      
      // Step 2: Find all people with this companyId
      console.log('📋 STEP 2: Finding people linked by companyId...');
      
      const peopleByCompanyId = await prisma.people.findMany({
        where: {
          companyId: company.id,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTitle: true,
          status: true,
          workspaceId: true,
          companyId: true,
          currentCompany: true,
          mainSellerId: true,
          buyerGroupRole: true,
          isBuyerGroupMember: true,
          relationshipType: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      console.log(`\nFound ${peopleByCompanyId.length} people with companyId = ${company.id}:`);
      peopleByCompanyId.forEach((person, idx) => {
        console.log(`\n  [${idx + 1}] Person:`);
        console.log(`      ID: ${person.id}`);
        console.log(`      Name: ${person.fullName || `${person.firstName} ${person.lastName}`}`);
        console.log(`      Email: ${person.email || 'N/A'}`);
        console.log(`      Job Title: ${person.jobTitle || 'N/A'}`);
        console.log(`      Status: ${person.status || 'N/A'}`);
        console.log(`      Workspace: ${person.workspaceId}`);
        console.log(`      CompanyId: ${person.companyId || 'NULL'}`);
        console.log(`      CurrentCompany: ${person.currentCompany || 'N/A'}`);
        console.log(`      Main Seller: ${person.mainSellerId || 'N/A'}`);
        console.log(`      Buyer Group Role: ${person.buyerGroupRole || 'NULL'}`);
        console.log(`      Is Buyer Group Member: ${person.isBuyerGroupMember || false}`);
        console.log(`      Relationship Type: ${person.relationshipType || 'N/A'}`);
        console.log(`      Workspace Match: ${person.workspaceId === company.workspaceId ? '✅' : '❌'}`);
      });
      
      // Step 3: Find people by company name (currentCompany field)
      console.log('\n📋 STEP 3: Finding people linked by company name...');
      
      const peopleByCompanyName = await prisma.people.findMany({
        where: {
          OR: [
            {
              currentCompany: {
                contains: 'Minnesota Power',
                mode: 'insensitive'
              }
            },
            {
              currentCompany: {
                equals: company.name,
                mode: 'insensitive'
              }
            }
          ],
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTitle: true,
          status: true,
          workspaceId: true,
          companyId: true,
          currentCompany: true,
          mainSellerId: true,
          buyerGroupRole: true,
          isBuyerGroupMember: true,
          createdAt: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      // Filter out people already found by companyId
      const peopleByNameOnly = peopleByCompanyName.filter(
        p => !peopleByCompanyId.find(existing => existing.id === p.id)
      );
      
      console.log(`\nFound ${peopleByNameOnly.length} additional people with currentCompany matching but NO companyId:`);
      peopleByNameOnly.forEach((person, idx) => {
        console.log(`\n  [${idx + 1}] Person (NEEDS LINKING):`);
        console.log(`      ID: ${person.id}`);
        console.log(`      Name: ${person.fullName || `${person.firstName} ${person.lastName}`}`);
        console.log(`      Email: ${person.email || 'N/A'}`);
        console.log(`      Job Title: ${person.jobTitle || 'N/A'}`);
        console.log(`      Status: ${person.status || 'N/A'}`);
        console.log(`      Workspace: ${person.workspaceId}`);
        console.log(`      CompanyId: ${person.companyId || 'NULL ⚠️'}`);
        console.log(`      CurrentCompany: ${person.currentCompany || 'N/A'}`);
        console.log(`      Main Seller: ${person.mainSellerId || 'N/A'}`);
        console.log(`      Buyer Group Role: ${person.buyerGroupRole || 'NULL'}`);
        console.log(`      Workspace Match: ${person.workspaceId === company.workspaceId ? '✅' : '❌'}`);
      });
      
      // Step 4: Find people by email domain
      let peopleByEmailOnly = [];
      if (company.website) {
        console.log('\n📋 STEP 4: Finding people by email domain...');
        
        // Extract domain from website
        let domain = company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        
        const peopleByEmail = await prisma.people.findMany({
          where: {
            OR: [
              {
                email: {
                  contains: `@${domain}`,
                  mode: 'insensitive'
                }
              },
              {
                workEmail: {
                  contains: `@${domain}`,
                  mode: 'insensitive'
                }
              }
            ],
            deletedAt: null
          },
          select: {
            id: true,
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            workEmail: true,
            jobTitle: true,
            status: true,
            workspaceId: true,
            companyId: true,
            currentCompany: true,
            mainSellerId: true,
            buyerGroupRole: true
          }
        });
        
        // Filter out people already found
        const allFoundIds = [...peopleByCompanyId, ...peopleByNameOnly].map(p => p.id);
        peopleByEmailOnly = peopleByEmail.filter(p => !allFoundIds.includes(p.id));
        
        console.log(`\nFound ${peopleByEmailOnly.length} additional people with email domain @${domain}:`);
        peopleByEmailOnly.forEach((person, idx) => {
          console.log(`\n  [${idx + 1}] Person (NEEDS LINKING):`);
          console.log(`      ID: ${person.id}`);
          console.log(`      Name: ${person.fullName || `${person.firstName} ${person.lastName}`}`);
          console.log(`      Email: ${person.email || person.workEmail || 'N/A'}`);
          console.log(`      Job Title: ${person.jobTitle || 'N/A'}`);
          console.log(`      Status: ${person.status || 'N/A'}`);
          console.log(`      Workspace: ${person.workspaceId}`);
          console.log(`      CompanyId: ${person.companyId || 'NULL ⚠️'}`);
          console.log(`      CurrentCompany: ${person.currentCompany || 'N/A'}`);
          console.log(`      Workspace Match: ${person.workspaceId === company.workspaceId ? '✅' : '❌'}`);
        });
      }
      
      // Step 5: Summary and recommendations
      console.log('\n📊 SUMMARY:');
      console.log('━'.repeat(80));
      
      const totalPeople = peopleByCompanyId.length + peopleByNameOnly.length + peopleByEmailOnly.length;
      const properlyLinked = peopleByCompanyId.length;
      const needsLinking = totalPeople - properlyLinked;
      
      console.log(`\n✅ Properly Linked (have companyId): ${properlyLinked}`);
      console.log(`⚠️  Need Linking (missing companyId): ${needsLinking}`);
      console.log(`📊 Total Associated People: ${totalPeople}`);
      
      // Breakdown by status
      const allPeople = [...peopleByCompanyId, ...peopleByNameOnly, ...peopleByEmailOnly];
      
      const statusBreakdown = allPeople.reduce((acc, person) => {
        const status = person.status || 'NO_STATUS';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Status Breakdown:');
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      
      // Buyer group members
      const buyerGroupMembers = allPeople.filter(p => 
        p.buyerGroupRole || p.isBuyerGroupMember
      );
      
      console.log(`\n👥 Buyer Group Members: ${buyerGroupMembers.length}`);
      if (buyerGroupMembers.length > 0) {
        buyerGroupMembers.forEach(member => {
          console.log(`   - ${member.fullName || `${member.firstName} ${member.lastName}`} (${member.buyerGroupRole || 'member'})`);
        });
      }
      
      // Recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('━'.repeat(80));
      
      if (needsLinking > 0) {
        console.log('\n⚠️  ACTION REQUIRED: Run fix-people-company-linkage.js to link unlinked people');
        console.log(`   This will update ${needsLinking} people records to set companyId = ${company.id}`);
      }
      
      if (properlyLinked === 0) {
        console.log('\n❌ CRITICAL: No people are properly linked to this company!');
        console.log('   The People and Buyer Group tabs will show "No records found"');
      }
      
      if (properlyLinked > 0 && needsLinking === 0) {
        console.log('\n✅ All people are properly linked!');
        console.log('   If tabs still show no data, check:');
        console.log('   1. Frontend is passing correct companyId');
        console.log('   2. Workspace IDs match');
        console.log('   3. API queries are filtering correctly');
      }
      
      // Workspace mismatches
      const workspaceMismatches = allPeople.filter(p => p.workspaceId !== company.workspaceId);
      if (workspaceMismatches.length > 0) {
        console.log(`\n⚠️  WARNING: ${workspaceMismatches.length} people have different workspace IDs:`);
        workspaceMismatches.forEach(person => {
          console.log(`   - ${person.fullName} (workspace: ${person.workspaceId})`);
        });
      }
    }
    
    console.log('\n✅ Audit complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditMinnesotaPowerPeople()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

