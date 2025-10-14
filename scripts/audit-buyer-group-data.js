#!/usr/bin/env node

/**
 * Buyer Group Data Audit Script
 * 
 * This script audits the current state of buyer group data in the database
 * to understand why the Buyer Groups tab is not showing data.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function auditBuyerGroupData() {
  console.log('🔍 Starting Buyer Group Data Audit...\n');
  
  try {
    // 1. Get total people count by workspace
    console.log('📊 1. Total People by Workspace:');
    const peopleByWorkspace = await prisma.people.groupBy({
      by: ['workspaceId'],
      where: {
        deletedAt: null
      },
      _count: { id: true }
    });
    
    console.log(peopleByWorkspace.map(w => `  Workspace ${w.workspaceId}: ${w._count.id} people`).join('\n'));
    
    // 2. Get people with buyerGroupRole set
    console.log('\n📊 2. People with buyerGroupRole set:');
    const peopleWithRoles = await prisma.people.findMany({
      where: {
        buyerGroupRole: { not: null },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        buyerGroupRole: true,
        buyerGroupStatus: true,
        isBuyerGroupMember: true,
        workspaceId: true,
        companyId: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 20 // Sample first 20
    });
    
    console.log(`  Found ${peopleWithRoles.length} people with buyerGroupRole set`);
    if (peopleWithRoles.length > 0) {
      console.log('  Sample records:');
      peopleWithRoles.forEach(person => {
        console.log(`    - ${person.fullName} (${person.jobTitle}) - Role: ${person.buyerGroupRole}, Status: ${person.buyerGroupStatus}, Member: ${person.isBuyerGroupMember}, Company: ${person.company?.name || 'N/A'}`);
      });
    }
    
    // 3. Get distribution of buyer group roles
    console.log('\n📊 3. Distribution of buyer group roles:');
    const roleDistribution = await prisma.people.groupBy({
      by: ['buyerGroupRole'],
      where: {
        buyerGroupRole: { not: null },
        deletedAt: null
      },
      _count: { id: true }
    });
    
    console.log(roleDistribution.map(r => `  ${r.buyerGroupRole || 'NULL'}: ${r._count.id} people`).join('\n'));
    
    // 4. Get people with buyerGroupStatus in customFields
    console.log('\n📊 4. People with buyerGroupStatus in customFields:');
    const peopleWithStatus = await prisma.people.findMany({
      where: {
        customFields: {
          path: ['buyerGroupStatus'],
          not: null
        },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        customFields: true,
        workspaceId: true
      },
      take: 10
    });
    
    console.log(`  Found ${peopleWithStatus.length} people with buyerGroupStatus in customFields`);
    if (peopleWithStatus.length > 0) {
      console.log('  Sample customFields:');
      peopleWithStatus.forEach(person => {
        const customFields = person.customFields || {};
        console.log(`    - ${person.fullName}: ${JSON.stringify(customFields.buyerGroupStatus)}`);
      });
    }
    
    // 5. Get people with isBuyerGroupMember = true
    console.log('\n📊 5. People with isBuyerGroupMember = true:');
    const buyerGroupMembers = await prisma.people.findMany({
      where: {
        isBuyerGroupMember: true,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        buyerGroupRole: true,
        buyerGroupStatus: true,
        workspaceId: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 10
    });
    
    console.log(`  Found ${buyerGroupMembers.length} people with isBuyerGroupMember = true`);
    if (buyerGroupMembers.length > 0) {
      console.log('  Sample records:');
      buyerGroupMembers.forEach(person => {
        console.log(`    - ${person.fullName} (${person.jobTitle}) - Role: ${person.buyerGroupRole}, Status: ${person.buyerGroupStatus}, Company: ${person.company?.name || 'N/A'}`);
      });
    }
    
    // 6. Get sample companies with their people
    console.log('\n📊 6. Sample companies and their people:');
    const companiesWithPeople = await prisma.companies.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        people: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true,
            buyerGroupStatus: true,
            isBuyerGroupMember: true
          },
          take: 5
        }
      },
      take: 5
    });
    
    companiesWithPeople.forEach(company => {
      console.log(`  Company: ${company.name} (${company.id})`);
      console.log(`    Total people: ${company.people.length}`);
      const withRoles = company.people.filter(p => p.buyerGroupRole);
      const withStatus = company.people.filter(p => p.buyerGroupStatus);
      const members = company.people.filter(p => p.isBuyerGroupMember);
      console.log(`    With buyerGroupRole: ${withRoles.length}`);
      console.log(`    With buyerGroupStatus: ${withStatus.length}`);
      console.log(`    With isBuyerGroupMember: ${members.length}`);
      if (withRoles.length > 0) {
        console.log(`    Sample roles: ${withRoles.map(p => `${p.fullName} (${p.buyerGroupRole})`).join(', ')}`);
      }
    });
    
    // 7. Check for recent enrichment data
    console.log('\n📊 7. Recent enrichment data:');
    const recentEnrichment = await prisma.people.findMany({
      where: {
        createdAt: {
          gte: new Date('2024-10-01T00:00:00.000Z') // Check last few months
        },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        buyerGroupRole: true,
        buyerGroupStatus: true,
        isBuyerGroupMember: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`  Found ${recentEnrichment.length} people created since Oct 2024`);
    if (recentEnrichment.length > 0) {
      console.log('  Recent records:');
      recentEnrichment.forEach(person => {
        console.log(`    - ${person.fullName} (${person.createdAt.toISOString().split('T')[0]}) - Role: ${person.buyerGroupRole}, Status: ${person.buyerGroupStatus}, Member: ${person.isBuyerGroupMember}`);
      });
    }
    
    // Generate summary report
    const auditReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPeopleByWorkspace: peopleByWorkspace,
        peopleWithBuyerGroupRole: peopleWithRoles.length,
        peopleWithBuyerGroupStatus: peopleWithStatus.length,
        peopleWithIsBuyerGroupMember: buyerGroupMembers.length,
        roleDistribution: roleDistribution,
        sampleCompanies: companiesWithPeople.map(c => ({
          id: c.id,
          name: c.name,
          totalPeople: c.people.length,
          withRoles: c.people.filter(p => p.buyerGroupRole).length,
          withStatus: c.people.filter(p => p.buyerGroupStatus).length,
          withMember: c.people.filter(p => p.isBuyerGroupMember).length
        })),
        recentEnrichment: recentEnrichment.length
      },
      detailedData: {
        peopleWithRoles: peopleWithRoles,
        peopleWithStatus: peopleWithStatus,
        buyerGroupMembers: buyerGroupMembers,
        companiesWithPeople: companiesWithPeople,
        recentEnrichment: recentEnrichment
      }
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'buyer-group-data-audit.json');
    fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
    console.log(`\n✅ Audit report saved to: ${reportPath}`);
    
    // Print summary
    console.log('\n📋 AUDIT SUMMARY:');
    console.log(`  Total people with buyerGroupRole: ${peopleWithRoles.length}`);
    console.log(`  Total people with buyerGroupStatus: ${peopleWithStatus.length}`);
    console.log(`  Total people with isBuyerGroupMember: ${buyerGroupMembers.length}`);
    console.log(`  Recent enrichment records: ${recentEnrichment.length}`);
    
    if (peopleWithRoles.length === 0 && peopleWithStatus.length === 0 && buyerGroupMembers.length === 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED: No buyer group data found in database!');
      console.log('   This explains why the Buyer Groups tab shows no data.');
      console.log('   Next steps:');
      console.log('   1. Check if buyer group enrichment has been run');
      console.log('   2. Verify the enrichment process is populating these fields');
      console.log('   3. Consider running buyer group enrichment for existing data');
    } else {
      console.log('\n✅ Buyer group data exists in database');
      console.log('   The issue may be in the API filtering or tab component');
    }
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditBuyerGroupData()
    .then(() => {
      console.log('\n🎉 Audit completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Audit failed:', error);
      process.exit(1);
    });
}

module.exports = { auditBuyerGroupData };
