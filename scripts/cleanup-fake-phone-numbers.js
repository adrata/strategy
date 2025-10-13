#!/usr/bin/env node

/**
 * 🧹 CLEANUP FAKE PHONE NUMBERS FROM PRODUCTION
 * 
 * This script removes fake phone numbers (555 patterns) from production workspaces
 * while preserving them in demo workspaces. It identifies and cleans up:
 * - +1-555-XXXX patterns (malformed, missing area code)
 * - +1-555-XXX-XXXX patterns (standard fake format)
 * - 555-XXX-XXXX patterns
 * 
 * Usage: node scripts/cleanup-fake-phone-numbers.js [--dry-run]
 */

const { PrismaClient } = require('@prisma/client');

class FakePhoneCleanup {
  constructor() {
    this.dryRun = process.argv.includes('--dry-run');
    this.prisma = new PrismaClient();
    this.stats = {
      totalWorkspaces: 0,
      demoWorkspaces: 0,
      productionWorkspaces: 0,
      peopleUpdated: 0,
      companiesUpdated: 0,
      errors: []
    };
  }

  async run() {
    try {
      console.log('🧹 FAKE PHONE NUMBER CLEANUP');
      console.log('============================\n');
      
      if (this.dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be made\n');
      }

      await this.prisma.$connect();
      
      // Get all workspaces
      const workspaces = await this.prisma.workspaces.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, slug: true }
      });
      
      this.stats.totalWorkspaces = workspaces.length;
      console.log(`📊 Found ${workspaces.length} workspaces\n`);

      // Process each workspace
      for (const workspace of workspaces) {
        const isDemo = this.isDemoWorkspace(workspace);
        
        if (isDemo) {
          this.stats.demoWorkspaces++;
          console.log(`🎭 Demo workspace: ${workspace.name} (${workspace.slug}) - SKIPPING`);
        } else {
          this.stats.productionWorkspaces++;
          console.log(`🏭 Production workspace: ${workspace.name} (${workspace.slug}) - CLEANING`);
          await this.cleanupWorkspace(workspace);
        }
      }

      this.printSummary();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.stats.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  isDemoWorkspace(workspace) {
    return workspace.slug === 'demo' || 
           workspace.name?.toLowerCase().includes('demo') ||
           workspace.id === 'demo-workspace-2025';
  }

  async cleanupWorkspace(workspace) {
    try {
      console.log(`  🔍 Cleaning workspace: ${workspace.name}`);
      
      // Clean people
      const peopleUpdated = await this.cleanupTable('people', workspace.id);
      this.stats.peopleUpdated += peopleUpdated;
      
      // Clean companies
      const companiesUpdated = await this.cleanupTable('companies', workspace.id);
      this.stats.companiesUpdated += companiesUpdated;
      
      console.log(`  ✅ Updated: ${peopleUpdated} people, ${companiesUpdated} companies`);
      
    } catch (error) {
      console.error(`  ❌ Error cleaning workspace ${workspace.name}:`, error.message);
      this.stats.errors.push(`Workspace ${workspace.name}: ${error.message}`);
    }
  }

  async cleanupTable(tableName, workspaceId) {
    try {
      // Find records with fake phone numbers
      const fakePhonePatterns = [
        '+1-555-',  // Malformed pattern missing area code
        '+1-555-',  // Standard fake pattern
        '555-',     // Basic fake pattern
        '+1555'     // No dash pattern
      ];

      let totalUpdated = 0;

      for (const pattern of fakePhonePatterns) {
        // Use raw SQL to find records with fake phone patterns
        const nameColumn = tableName === 'people' ? 'fullName' : 'name';
        const query = `
          SELECT id, phone, "${nameColumn}" as name 
          FROM ${tableName} 
          WHERE "workspaceId" = $1 
            AND "deletedAt" IS NULL 
            AND phone LIKE $2
        `;
        
        const records = await this.prisma.$queryRawUnsafe(query, workspaceId, `%${pattern}%`);
        
        if (records.length > 0) {
          console.log(`    📞 Found ${records.length} ${tableName} with pattern "${pattern}"`);
          
          if (!this.dryRun) {
            // Update phone to null
            const updateQuery = `
              UPDATE ${tableName} 
              SET phone = NULL, "updatedAt" = NOW()
              WHERE "workspaceId" = $1 
                AND "deletedAt" IS NULL 
                AND phone LIKE $2
            `;
            
            const result = await this.prisma.$executeRawUnsafe(updateQuery, workspaceId, `%${pattern}%`);
            totalUpdated += result;
            
            console.log(`    ✅ Updated ${result} ${tableName} records`);
          } else {
            console.log(`    🔍 Would update ${records.length} ${tableName} records`);
            totalUpdated += records.length;
          }
        }
      }

      return totalUpdated;
      
    } catch (error) {
      console.error(`    ❌ Error cleaning table ${tableName}:`, error.message);
      this.stats.errors.push(`Table ${tableName}: ${error.message}`);
      return 0;
    }
  }

  printSummary() {
    console.log('\n📊 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`Total workspaces: ${this.stats.totalWorkspaces}`);
    console.log(`Demo workspaces (skipped): ${this.stats.demoWorkspaces}`);
    console.log(`Production workspaces (cleaned): ${this.stats.productionWorkspaces}`);
    console.log(`People updated: ${this.stats.peopleUpdated}`);
    console.log(`Companies updated: ${this.stats.companiesUpdated}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (this.dryRun) {
      console.log('\n🔍 This was a dry run. Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Cleanup completed successfully!');
    }
  }
}

// Run the cleanup
if (require.main === module) {
  const cleanup = new FakePhoneCleanup();
  cleanup.run().catch(console.error);
}

module.exports = FakePhoneCleanup;
