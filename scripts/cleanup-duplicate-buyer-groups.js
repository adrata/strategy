#!/usr/bin/env node

/**
 * 🧹 CLEANUP DUPLICATE BUYER GROUPS
 * 
 * Removes duplicate buyer groups, keeping the one with the most people
 */

const { PrismaClient } = require('@prisma/client');

class CleanupDuplicateBuyerGroups {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    this.results = {
      companiesProcessed: 0,
      duplicateGroupsRemoved: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🧹 CLEANING UP DUPLICATE BUYER GROUPS');
    console.log('====================================\n');

    try {
      await this.findAndRemoveDuplicates();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findAndRemoveDuplicates() {
    console.log('🔍 STEP 1: Finding duplicate buyer groups...');
    
    // Get all buyer groups with company info and people count
    const buyerGroups = await this.prisma.buyer_groups.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        name: true,
        companyId: true,
        company: {
          select: { name: true }
        },
        _count: {
          select: { people: true }
        }
      }
    });
    
    console.log(`📊 Found ${buyerGroups.length} total buyer groups`);
    
    // Group by company to find duplicates
    const companyGroups = {};
    buyerGroups.forEach(bg => {
      if (!companyGroups[bg.companyId]) {
        companyGroups[bg.companyId] = [];
      }
      companyGroups[bg.companyId].push(bg);
    });
    
    // Find companies with multiple buyer groups
    const companiesWithMultiple = Object.entries(companyGroups)
      .filter(([companyId, groups]) => groups.length > 1);
    
    console.log(`📊 Found ${companiesWithMultiple.length} companies with duplicate buyer groups`);
    console.log('');

    console.log('🔍 STEP 2: Removing duplicate buyer groups...');
    
    for (const [companyId, groups] of companiesWithMultiple) {
      try {
        console.log(`\n🏢 Processing ${groups[0].company.name}...`);
        console.log(`   Found ${groups.length} buyer groups:`);
        
        groups.forEach((group, i) => {
          console.log(`     ${i+1}. ${group.name} (${group._count.people} people)`);
        });
        
        // Sort by people count (descending) and creation date
        const sortedGroups = groups.sort((a, b) => {
          // First sort by people count
          if (b._count.people !== a._count.people) {
            return b._count.people - a._count.people;
          }
          // If same people count, keep the first created (lower ID)
          return a.id.localeCompare(b.id);
        });
        
        // Keep the first one (most people or oldest), remove the rest
        const keepGroup = sortedGroups[0];
        const removeGroups = sortedGroups.slice(1);
        
        console.log(`   ✅ Keeping: ${keepGroup.name} (${keepGroup._count.people} people)`);
        
        for (const removeGroup of removeGroups) {
          console.log(`   🗑️ Removing: ${removeGroup.name} (${removeGroup._count.people} people)`);
          
          // Remove the duplicate buyer group
          await this.prisma.buyer_groups.delete({
            where: { id: removeGroup.id }
          });
          
          this.results.duplicateGroupsRemoved++;
        }
        
        this.results.companiesProcessed++;
        
      } catch (error) {
        console.error(`   ❌ Failed to process ${groups[0].company.name}:`, error.message);
        this.results.errors.push(`Failed to process ${groups[0].company.name}: ${error.message}`);
      }
    }
  }

  async generateReport() {
    console.log('\n🎉 DUPLICATE BUYER GROUPS CLEANUP REPORT');
    console.log('========================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`🗑️ Duplicate buyer groups removed: ${this.results.duplicateGroupsRemoved}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Verify final count
    const finalCount = await this.prisma.buyer_groups.count({
      where: { workspaceId: this.workspaceId }
    });
    
    console.log('\n📊 Final verification:');
    console.log(`   Total buyer groups remaining: ${finalCount}`);
    console.log(`   Expected (1 per company): 476`);
    console.log(`   Status: ${finalCount === 476 ? '✅ PERFECT' : '⚠️ Still have issues'}`);

    console.log('\n🎯 Next steps:');
    console.log('   1. Run final audit to confirm 1:1 company to buyer group ratio');
    console.log('   2. Verify all buyer groups have proper people assignments');
    console.log('\n🚀 Duplicate buyer groups cleanup complete!');
  }
}

if (require.main === module) {
  const cleaner = new CleanupDuplicateBuyerGroups();
  cleaner.execute().catch(console.error);
}

module.exports = CleanupDuplicateBuyerGroups;
