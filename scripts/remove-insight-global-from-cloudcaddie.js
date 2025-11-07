#!/usr/bin/env node

/**
 * 🗑️ REMOVE INSIGHT GLOBAL FROM CLOUDCADDIE
 * 
 * Removes Insight Global company and all associated people from the CloudCaddie workspace
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeInsightGlobal() {
  try {
    console.log('🗑️  REMOVING INSIGHT GLOBAL FROM CLOUDCADDIE');
    console.log('===========================================\n');
    
    await prisma.$connect();
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } },
          { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Find Insight Global company in the workspace
    const insightGlobalCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        name: { contains: 'Insight Global', mode: 'insensitive' },
        deletedAt: null
      },
      include: {
        people: {
          where: { deletedAt: null }
        }
      }
    });
    
    if (insightGlobalCompanies.length === 0) {
      console.log('ℹ️  No Insight Global companies found in CloudCaddie workspace');
      return;
    }
    
    console.log(`📋 Found ${insightGlobalCompanies.length} Insight Global company(ies):\n`);
    
    let totalPeopleCount = 0;
    
    for (const company of insightGlobalCompanies) {
      console.log(`   🏢 ${company.name}`);
      console.log(`      ID: ${company.id}`);
      console.log(`      Website: ${company.website || 'N/A'}`);
      console.log(`      People: ${company.people.length}`);
      totalPeopleCount += company.people.length;
    }
    
    console.log(`\n📊 Total people to remove: ${totalPeopleCount}\n`);
    
    // Confirm deletion
    console.log('⚠️  This will permanently delete:');
    console.log(`   - ${insightGlobalCompanies.length} company record(s)`);
    console.log(`   - ${totalPeopleCount} associated people\n`);
    
    // Use transaction for data integrity
    const result = await prisma.$transaction(async (tx) => {
      let deletedPeople = 0;
      let deletedCompanies = 0;
      
      for (const company of insightGlobalCompanies) {
        console.log(`\n🗑️  Processing: ${company.name}...`);
        
        // Delete all associated people first
        if (company.people.length > 0) {
          console.log(`   📧 Deleting ${company.people.length} people...`);
          
          const peopleDeleted = await tx.people.deleteMany({
            where: {
              companyId: company.id,
              deletedAt: null
            }
          });
          
          deletedPeople += peopleDeleted.count;
          console.log(`   ✅ Deleted ${peopleDeleted.count} people`);
        }
        
        // Delete the company
        console.log(`   🏢 Deleting company...`);
        await tx.companies.delete({
          where: { id: company.id }
        });
        
        deletedCompanies++;
        console.log(`   ✅ Deleted company: ${company.name}`);
      }
      
      return { deletedPeople, deletedCompanies };
    });
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Companies deleted: ${result.deletedCompanies}`);
    console.log(`✅ People deleted: ${result.deletedPeople}`);
    console.log('\n🎉 Insight Global successfully removed from CloudCaddie workspace!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\n💡 The operation was rolled back - no data was deleted.');
  } finally {
    await prisma.$disconnect();
  }
}

removeInsightGlobal();

