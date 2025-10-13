#!/usr/bin/env node

/**
 * Optimized Buyer Group Membership & Role Audit and Fix Script
 * 
 * This script audits and fixes buyer group membership and role assignments
 * with progress reporting and batch processing for better performance.
 */

const { PrismaClient } = require('@prisma/client');

class OptimizedBuyerGroupAuditFix {
  constructor() {
    this.prisma = new PrismaClient();
    this.batchSize = 100; // Process in batches
    this.auditResults = {
      totalPeople: 0,
      peopleWithRoles: 0,
      peopleWithoutRoles: 0,
      peopleWithMembership: 0,
      peopleWithoutMembership: 0,
      inconsistencies: [],
      roleDistribution: {},
      workspaceStats: {},
      fixes: []
    };
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🔍 Starting Optimized Buyer Group Membership & Role Audit...\n');
    
    try {
      // Step 1: Run comprehensive audit
      await this.runAudit();
      
      // Step 2: Generate audit report
      this.generateAuditReport();
      
      // Step 3: Apply fixes in batches
      await this.applyFixesInBatches();
      
      // Step 4: Verify fixes
      await this.verifyFixes();
      
      console.log('\n✅ Buyer Group Audit and Fix completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during audit and fix:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Run comprehensive audit of all people records
   */
  async runAudit() {
    console.log('📊 Running comprehensive audit...');
    
    // Get total count first
    const totalCount = await this.prisma.people.count({
      where: { deletedAt: null }
    });
    
    console.log(`   Found ${totalCount} people across all workspaces`);
    this.auditResults.totalPeople = totalCount;
    
    // Process in batches to avoid memory issues
    let processed = 0;
    let offset = 0;
    
    while (offset < totalCount) {
      const batch = await this.prisma.people.findMany({
        where: { deletedAt: null },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              workspaceId: true
            }
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        skip: offset,
        take: this.batchSize,
        orderBy: [
          { workspaceId: 'asc' },
          { companyId: 'asc' },
          { fullName: 'asc' }
        ]
      });

      // Audit each person in this batch
      for (const person of batch) {
        await this.auditPerson(person);
      }
      
      processed += batch.length;
      offset += this.batchSize;
      
      // Show progress
      const progress = ((processed / totalCount) * 100).toFixed(1);
      console.log(`   Processed ${processed}/${totalCount} people (${progress}%)`);
    }

    // Calculate workspace statistics
    await this.calculateWorkspaceStats();
  }

  /**
   * Audit individual person record
   */
  async auditPerson(person) {
    const hasRole = !!person.buyerGroupRole;
    const hasMembership = !!person.isBuyerGroupMember;
    const isValidRole = this.isValidBuyerGroupRole(person.buyerGroupRole);
    
    // Update counters
    if (hasRole) this.auditResults.peopleWithRoles++;
    else this.auditResults.peopleWithoutRoles++;
    
    if (hasMembership) this.auditResults.peopleWithMembership++;
    else this.auditResults.peopleWithoutMembership++;
    
    // Track role distribution
    const role = person.buyerGroupRole || 'No Role';
    this.auditResults.roleDistribution[role] = (this.auditResults.roleDistribution[role] || 0) + 1;
    
    // Check for inconsistencies
    const inconsistencies = [];
    
    if (hasRole && !hasMembership) {
      inconsistencies.push('Has role but not marked as buyer group member');
    }
    
    if (!hasRole) {
      inconsistencies.push('Missing buyer group role');
    }
    
    if (hasRole && !isValidRole) {
      inconsistencies.push(`Invalid role: ${person.buyerGroupRole}`);
    }
    
    if (inconsistencies.length > 0) {
      this.auditResults.inconsistencies.push({
        personId: person.id,
        name: person.fullName,
        company: person.company?.name || 'No Company',
        workspace: person.workspace?.name || 'Unknown',
        currentRole: person.buyerGroupRole,
        isBuyerGroupMember: person.isBuyerGroupMember,
        jobTitle: person.jobTitle,
        inconsistencies,
        suggestedRole: this.suggestRoleFromJobTitle(person.jobTitle)
      });
    }
  }

  /**
   * Check if buyer group role is valid
   */
  isValidBuyerGroupRole(role) {
    if (!role) return false;
    const validRoles = ['Decision Maker', 'Champion', 'Stakeholder', 'Blocker', 'Introducer'];
    return validRoles.includes(role);
  }

  /**
   * Suggest role based on job title using existing logic
   */
  suggestRoleFromJobTitle(jobTitle) {
    if (!jobTitle) return 'Stakeholder';
    
    const title = jobTitle.toLowerCase();
    
    // Decision Makers - C-level, VPs, Directors
    if (title.includes('ceo') || title.includes('president') || 
        title.includes('chief') || title.includes('vp') || 
        title.includes('vice president') || title.includes('director') ||
        title.includes('general manager') || title.includes('manager')) {
      return 'Decision Maker';
    }
    
    // Champions - Technical leaders, project managers
    if (title.includes('engineer') || title.includes('technical') ||
        title.includes('project manager') || title.includes('supervisor') ||
        title.includes('lead') || title.includes('senior')) {
      return 'Champion';
    }
    
    // Blockers - Legal, compliance, security, low-level roles
    if (title.includes('legal') || title.includes('compliance') ||
        title.includes('security') || title.includes('audit') ||
        title.includes('assistant') || title.includes('clerk') ||
        title.includes('receptionist') || title.includes('intern')) {
      return 'Blocker';
    }
    
    // Introducers - Business development, marketing, sales
    if (title.includes('business development') || title.includes('marketing') ||
        title.includes('sales') || title.includes('partnership') ||
        title.includes('outreach') || title.includes('communications')) {
      return 'Introducer';
    }
    
    // Default to Stakeholder for everyone else
    return 'Stakeholder';
  }

  /**
   * Calculate workspace statistics
   */
  async calculateWorkspaceStats() {
    console.log('   Calculating workspace statistics...');
    
    const workspaceStats = await this.prisma.people.groupBy({
      by: ['workspaceId'],
      where: { deletedAt: null },
      _count: {
        id: true
      }
    });
    
    for (const stat of workspaceStats) {
      const workspace = await this.prisma.workspaces.findUnique({
        where: { id: stat.workspaceId },
        select: { name: true }
      });
      
      const roleStats = await this.prisma.people.groupBy({
        by: ['buyerGroupRole'],
        where: { 
          workspaceId: stat.workspaceId,
          deletedAt: null 
        },
        _count: { id: true }
      });
      
      const membershipStats = await this.prisma.people.groupBy({
        by: ['isBuyerGroupMember'],
        where: { 
          workspaceId: stat.workspaceId,
          deletedAt: null 
        },
        _count: { id: true }
      });
      
      this.auditResults.workspaceStats[stat.workspaceId] = {
        workspaceId: stat.workspaceId,
        workspaceName: workspace?.name || 'Unknown',
        totalPeople: stat._count.id,
        roleDistribution: Object.fromEntries(
          roleStats.map(r => [r.buyerGroupRole || 'No Role', r._count.id])
        ),
        membershipStats: Object.fromEntries(
          membershipStats.map(m => [m.isBuyerGroupMember ? 'Yes' : 'No', m._count.id])
        )
      };
    }
  }

  /**
   * Generate comprehensive audit report
   */
  generateAuditReport() {
    console.log('\n📋 AUDIT REPORT');
    console.log('='.repeat(80));
    
    // Overall statistics
    console.log('\n📊 OVERALL STATISTICS:');
    console.log(`   Total People: ${this.auditResults.totalPeople}`);
    console.log(`   People with Roles: ${this.auditResults.peopleWithRoles} (${((this.auditResults.peopleWithRoles / this.auditResults.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   People without Roles: ${this.auditResults.peopleWithoutRoles} (${((this.auditResults.peopleWithoutRoles / this.auditResults.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   People with Membership: ${this.auditResults.peopleWithMembership} (${((this.auditResults.peopleWithMembership / this.auditResults.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   People without Membership: ${this.auditResults.peopleWithoutMembership} (${((this.auditResults.peopleWithoutMembership / this.auditResults.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   Inconsistencies Found: ${this.auditResults.inconsistencies.length}`);
    
    // Role distribution
    console.log('\n🎭 ROLE DISTRIBUTION:');
    Object.entries(this.auditResults.roleDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([role, count]) => {
        const percentage = ((count / this.auditResults.totalPeople) * 100).toFixed(1);
        console.log(`   ${role}: ${count} (${percentage}%)`);
      });
    
    // Workspace breakdown
    console.log('\n🏢 WORKSPACE BREAKDOWN:');
    Object.entries(this.auditResults.workspaceStats).forEach(([workspaceId, stats]) => {
      console.log(`\n   ${stats.workspaceName} (${workspaceId}):`);
      console.log(`     Total People: ${stats.totalPeople}`);
      
      const withRoles = Object.entries(stats.roleDistribution)
        .filter(([role]) => role !== 'No Role')
        .reduce((sum, [, count]) => sum + count, 0);
      console.log(`     With Roles: ${withRoles} (${((withRoles / stats.totalPeople) * 100).toFixed(1)}%)`);
      
      const withMembership = stats.membershipStats.Yes || 0;
      console.log(`     With Membership: ${withMembership} (${((withMembership / stats.totalPeople) * 100).toFixed(1)}%)`);
      
      const topRoles = Object.entries(stats.roleDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      console.log(`     Top Roles: ${topRoles.map(([role, count]) => `${role} (${count})`).join(', ')}`);
    });
    
    // Sample inconsistencies
    if (this.auditResults.inconsistencies.length > 0) {
      console.log('\n⚠️  SAMPLE INCONSISTENCIES:');
      this.auditResults.inconsistencies.slice(0, 10).forEach((inconsistency, index) => {
        console.log(`\n   ${index + 1}. ${inconsistency.name} (${inconsistency.company})`);
        console.log(`      Current Role: ${inconsistency.currentRole || 'None'}`);
        console.log(`      Buyer Group Member: ${inconsistency.isBuyerGroupMember}`);
        console.log(`      Job Title: ${inconsistency.jobTitle || 'None'}`);
        console.log(`      Issues: ${inconsistency.inconsistencies.join(', ')}`);
        console.log(`      Suggested Role: ${inconsistency.suggestedRole}`);
      });
      
      if (this.auditResults.inconsistencies.length > 10) {
        console.log(`\n   ... and ${this.auditResults.inconsistencies.length - 10} more inconsistencies`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Apply fixes in batches with progress reporting
   */
  async applyFixesInBatches() {
    console.log('\n🔧 Applying fixes in batches...');
    
    const totalFixes = this.auditResults.inconsistencies.length;
    let fixedCount = 0;
    let errorCount = 0;
    
    // Process in batches
    for (let i = 0; i < totalFixes; i += this.batchSize) {
      const batch = this.auditResults.inconsistencies.slice(i, i + this.batchSize);
      
      console.log(`   Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(totalFixes / this.batchSize)} (${batch.length} records)...`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (inconsistency) => {
        try {
          const fix = await this.fixPersonRecord(inconsistency);
          if (fix) {
            this.auditResults.fixes.push(fix);
            return { success: true, fix };
          }
          return { success: true, fix: null };
        } catch (error) {
          console.error(`   ❌ Error fixing ${inconsistency.name}:`, error.message);
          return { success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Count results
      const batchFixed = batchResults.filter(r => r.success && r.fix).length;
      const batchErrors = batchResults.filter(r => !r.success).length;
      
      fixedCount += batchFixed;
      errorCount += batchErrors;
      
      const progress = (((i + batch.length) / totalFixes) * 100).toFixed(1);
      console.log(`   ✅ Batch completed: ${batchFixed} fixed, ${batchErrors} errors (${progress}% total progress)`);
    }
    
    console.log(`\n   📊 FINAL RESULTS:`);
    console.log(`   ✅ Total Fixed: ${fixedCount} records`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Total Errors: ${errorCount}`);
    }
  }

  /**
   * Fix individual person record
   */
  async fixPersonRecord(inconsistency) {
    const { personId, currentRole, isBuyerGroupMember, jobTitle, suggestedRole } = inconsistency;
    
    // Determine the correct role and membership status
    let newRole = currentRole;
    let newMembership = isBuyerGroupMember;
    
    // Rule 1: If no role, assign suggested role
    if (!currentRole) {
      newRole = suggestedRole;
      newMembership = true;
    }
    
    // Rule 2: If has role but not marked as member, fix membership
    if (currentRole && !isBuyerGroupMember) {
      newMembership = true;
    }
    
    // Rule 3: If invalid role, fix it
    if (currentRole && !this.isValidBuyerGroupRole(currentRole)) {
      newRole = suggestedRole;
      newMembership = true;
    }
    
    // Only update if changes are needed
    if (newRole !== currentRole || newMembership !== isBuyerGroupMember) {
      await this.prisma.people.update({
        where: { id: personId },
        data: {
          buyerGroupRole: newRole,
          isBuyerGroupMember: newMembership,
          updatedAt: new Date()
        }
      });
      
      return {
        personId,
        name: inconsistency.name,
        company: inconsistency.company,
        oldRole: currentRole,
        newRole,
        oldMembership: isBuyerGroupMember,
        newMembership,
        reason: this.getFixReason(currentRole, isBuyerGroupMember, newRole, newMembership)
      };
    }
    
    return null;
  }

  /**
   * Get human-readable reason for fix
   */
  getFixReason(oldRole, oldMembership, newRole, newMembership) {
    const reasons = [];
    
    if (oldRole !== newRole) {
      reasons.push(`Role changed from "${oldRole || 'None'}" to "${newRole}"`);
    }
    
    if (oldMembership !== newMembership) {
      reasons.push(`Membership changed from ${oldMembership} to ${newMembership}`);
    }
    
    return reasons.join(', ');
  }

  /**
   * Verify fixes were applied correctly
   */
  async verifyFixes() {
    console.log('\n✅ Verifying fixes...');
    
    // Re-audit a sample of fixed records
    const sampleSize = Math.min(50, this.auditResults.fixes.length);
    const sampleFixes = this.auditResults.fixes.slice(0, sampleSize);
    
    let verifiedCount = 0;
    let errorCount = 0;
    
    for (const fix of sampleFixes) {
      try {
        const person = await this.prisma.people.findUnique({
          where: { id: fix.personId },
          select: {
            id: true,
            fullName: true,
            buyerGroupRole: true,
            isBuyerGroupMember: true
          }
        });
        
        if (person && 
            person.buyerGroupRole === fix.newRole && 
            person.isBuyerGroupMember === fix.newMembership) {
          verifiedCount++;
        } else {
          console.error(`   ❌ Verification failed for ${fix.name}: expected role="${fix.newRole}", membership=${fix.newMembership}, got role="${person?.buyerGroupRole}", membership=${person?.isBuyerGroupMember}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error verifying ${fix.name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`   ✅ Verified ${verifiedCount}/${sampleSize} fixes`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} verification errors`);
    }
    
    // Show summary of fixes
    if (this.auditResults.fixes.length > 0) {
      console.log('\n📋 FIX SUMMARY:');
      const roleChanges = this.auditResults.fixes.filter(f => f.oldRole !== f.newRole).length;
      const membershipChanges = this.auditResults.fixes.filter(f => f.oldMembership !== f.newMembership).length;
      
      console.log(`   Total Records Fixed: ${this.auditResults.fixes.length}`);
      console.log(`   Role Changes: ${roleChanges}`);
      console.log(`   Membership Changes: ${membershipChanges}`);
      
      // Show role distribution after fixes
      const newRoleDistribution = {};
      this.auditResults.fixes.forEach(fix => {
        newRoleDistribution[fix.newRole] = (newRoleDistribution[fix.newRole] || 0) + 1;
      });
      
      console.log('\n   New Role Assignments:');
      Object.entries(newRoleDistribution)
        .sort(([,a], [,b]) => b - a)
        .forEach(([role, count]) => {
          console.log(`     ${role}: ${count}`);
        });
    }
  }
}

// Run the audit and fix
if (require.main === module) {
  const auditFix = new OptimizedBuyerGroupAuditFix();
  auditFix.run().catch(console.error);
}

module.exports = OptimizedBuyerGroupAuditFix;
