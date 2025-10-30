#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deduplicateLeads() {
  try {
    console.log('🧹 DEDUPLICATING LEADS - REMOVING DUPLICATE PERSON RECORDS');
    console.log('==========================================================\n');

    // Get all workspaces to process
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });

    console.log(`📊 Found ${workspaces.length} active workspaces\n`);

    for (const workspace of workspaces) {
      console.log(`🏢 WORKSPACE: ${workspace.name} (${workspace.id})`);
      console.log('='.repeat(50));

      // Find all duplicate groups (same name, email, workspace)
      const duplicateGroups = await prisma.people.groupBy({
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

      console.log(`🔍 Found ${duplicateGroups.length} groups of duplicate person records`);

      if (duplicateGroups.length === 0) {
        console.log('✅ No duplicates found in this workspace\n');
        continue;
      }

      let totalDuplicatesRemoved = 0;
      let totalGroupsProcessed = 0;

      for (const group of duplicateGroups) {
        console.log(`\n👤 Processing group: "${group.fullName}" (${group.email || 'no email'})`);
        
        // Get all duplicate records for this group
        const duplicates = await prisma.people.findMany({
          where: {
            workspaceId: workspace.id,
            deletedAt: null,
            fullName: group.fullName,
            email: group.email,
            status: 'LEAD'
          },
          orderBy: { createdAt: 'asc' }, // Keep the oldest record
          select: {
            id: true,
            fullName: true,
            email: true,
            companyId: true,
            createdAt: true,
            updatedAt: true,
            // Include all fields that might have data
            firstName: true,
            lastName: true,
            jobTitle: true,
            phone: true,
            linkedinUrl: true,
            notes: true,
            customFields: true,
            mainSellerId: true,
            priority: true,
            source: true,
            tags: true
          }
        });

        if (duplicates.length <= 1) {
          console.log('   ⚠️  Only one record found, skipping');
          continue;
        }

        console.log(`   📊 Found ${duplicates.length} duplicate records`);

        // Keep the first (oldest) record and merge data from others
        const keepRecord = duplicates[0];
        const removeRecords = duplicates.slice(1);

        console.log(`   ✅ Keeping record: ${keepRecord.id} (created: ${keepRecord.createdAt.toISOString()})`);

        // Merge data from duplicate records into the kept record
        let hasUpdates = false;
        const updateData = {};

        for (const duplicate of removeRecords) {
          console.log(`   🔄 Merging data from: ${duplicate.id} (created: ${duplicate.createdAt.toISOString()})`);

          // Merge fields that might have better data in duplicates
          if (!keepRecord.jobTitle && duplicate.jobTitle) {
            updateData.jobTitle = duplicate.jobTitle;
            hasUpdates = true;
          }
          if (!keepRecord.phone && duplicate.phone) {
            updateData.phone = duplicate.phone;
            hasUpdates = true;
          }
          if (!keepRecord.linkedinUrl && duplicate.linkedinUrl) {
            updateData.linkedinUrl = duplicate.linkedinUrl;
            hasUpdates = true;
          }
          if (!keepRecord.notes && duplicate.notes) {
            updateData.notes = duplicate.notes;
            hasUpdates = true;
          }
          if (!keepRecord.customFields && duplicate.customFields) {
            updateData.customFields = duplicate.customFields;
            hasUpdates = true;
          }
          if (!keepRecord.mainSellerId && duplicate.mainSellerId) {
            updateData.mainSellerId = duplicate.mainSellerId;
            hasUpdates = true;
          }
          if (!keepRecord.priority && duplicate.priority) {
            updateData.priority = duplicate.priority;
            hasUpdates = true;
          }
          if (!keepRecord.source && duplicate.source) {
            updateData.source = duplicate.source;
            hasUpdates = true;
          }
          if (duplicate.tags && duplicate.tags.length > 0) {
            const existingTags = keepRecord.tags || [];
            const newTags = duplicate.tags.filter(tag => !existingTags.includes(tag));
            if (newTags.length > 0) {
              updateData.tags = [...existingTags, ...newTags];
              hasUpdates = true;
            }
          }
        }

        // Update the kept record with merged data
        if (hasUpdates) {
          updateData.updatedAt = new Date();
          await prisma.people.update({
            where: { id: keepRecord.id },
            data: updateData
          });
          console.log('   ✅ Merged additional data into kept record');
        }

        // Soft delete all duplicate records (set deletedAt)
        const duplicateIds = removeRecords.map(r => r.id);
        await prisma.people.updateMany({
          where: { id: { in: duplicateIds } },
          data: { 
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`   🗑️  Soft deleted ${duplicateIds.length} duplicate records`);
        totalDuplicatesRemoved += duplicateIds.length;
        totalGroupsProcessed++;
      }

      console.log(`\n📊 SUMMARY FOR ${workspace.name}:`);
      console.log(`   Groups processed: ${totalGroupsProcessed}`);
      console.log(`   Duplicates removed: ${totalDuplicatesRemoved}`);
      console.log(`   Records kept: ${totalGroupsProcessed}`);

      // Verify the cleanup
      const remainingDuplicates = await prisma.people.groupBy({
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

      console.log(`   Remaining duplicates: ${remainingDuplicates.length}`);

      if (remainingDuplicates.length > 0) {
        console.log('   ⚠️  Some duplicates still remain - this may be due to different email addresses');
      } else {
        console.log('   ✅ All duplicates successfully removed');
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // Final summary across all workspaces
    console.log('📋 FINAL SUMMARY ACROSS ALL WORKSPACES:');
    console.log('=======================================');
    
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

    // Check for any remaining duplicates
    const remainingDuplicates = await prisma.people.groupBy({
      by: ['fullName', 'email', 'workspaceId'],
      where: {
        deletedAt: null,
        status: 'LEAD'
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    });

    console.log(`Remaining duplicates across all workspaces: ${remainingDuplicates.length}`);

    if (remainingDuplicates.length === 0) {
      console.log('\n🎉 SUCCESS: All duplicate leads have been removed!');
    } else {
      console.log('\n⚠️  Some duplicates may still remain due to different email addresses or other variations');
    }

  } catch (error) {
    console.error('❌ Error during deduplication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add confirmation prompt
console.log('⚠️  WARNING: This script will soft-delete duplicate person records.');
console.log('   Duplicate records will be marked as deleted (deletedAt set) but not permanently removed.');
console.log('   The oldest record in each duplicate group will be kept and enhanced with data from duplicates.');
console.log('   This action cannot be easily undone.\n');

// For safety, require manual confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Do you want to proceed with deduplication? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    deduplicateLeads();
  } else {
    console.log('❌ Deduplication cancelled.');
    process.exit(0);
  }
  rl.close();
});
