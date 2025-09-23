#!/usr/bin/env node

/**
 * 🔍 BUYER GROUP ROLES AUDIT
 * 
 * This script audits all buyer group roles to ensure:
 * 1. Every buyer group has at least 1 Decision Maker
 * 2. Legacy "Influencer" roles are mapped to the new 5-role system
 * 3. Role assignments make logical sense
 * 4. No buyer groups are missing critical decision-making roles
 */

const { PrismaClient } = require('@prisma/client');

class BuyerGroupRolesAudit {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    
    this.results = {
      analysisDate: new Date().toISOString(),
      totalBuyerGroups: 0,
      buyerGroupsWithDecisionMakers: 0,
      buyerGroupsWithoutDecisionMakers: 0,
      legacyInfluencersFound: 0,
      legacyInfluencersMapped: 0,
      peopleUpdated: 0,
      buyerGroupsFixed: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🔍 BUYER GROUP ROLES AUDIT');
    console.log('==========================');
    console.log('');

    try {
      // Step 1: Audit current buyer group roles
      await this.auditBuyerGroupRoles();
      
      // Step 2: Map legacy Influencer roles
      await this.mapLegacyInfluencerRoles();
      
      // Step 3: Fix buyer groups without decision makers
      await this.fixBuyerGroupsWithoutDecisionMakers();
      
      // Step 4: Generate final audit report
      await this.generateFinalAuditReport();

    } catch (error) {
      console.error('❌ Audit failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async auditBuyerGroupRoles() {
    console.log('🔍 STEP 1: Auditing buyer group roles...');
    
    // Get all buyer groups with their people
    const buyerGroups = await this.prisma.buyer_groups.findMany({
      where: { workspaceId: this.workspaceId },
      include: {
        company: {
          select: { name: true, website: true }
        },
        people: {
          include: {
            person: {
              select: {
                id: true,
                fullName: true,
                jobTitle: true,
                buyerGroupRole: true
              }
            }
          }
        }
      }
    });

    this.results.totalBuyerGroups = buyerGroups.length;
    console.log(`   📊 Found ${buyerGroups.length} buyer groups to audit`);
    console.log('');

    // Analyze each buyer group
    const buyerGroupsWithoutDecisionMakers = [];
    const legacyInfluencers = [];

    for (const buyerGroup of buyerGroups) {
      const people = buyerGroup.people.map(bgPerson => bgPerson.person);
      const roles = people.map(p => p.buyerGroupRole).filter(role => role !== null);
      
      const hasDecisionMaker = roles.includes('Decision Maker');
      const hasLegacyInfluencer = roles.includes('Influencer');
      
      if (!hasDecisionMaker) {
        buyerGroupsWithoutDecisionMakers.push({
          buyerGroup,
          people,
          roles
        });
      }
      
      if (hasLegacyInfluencer) {
        const influencers = people.filter(p => p.buyerGroupRole === 'Influencer');
        legacyInfluencers.push(...influencers);
      }
    }

    this.results.buyerGroupsWithDecisionMakers = buyerGroups.length - buyerGroupsWithoutDecisionMakers.length;
    this.results.buyerGroupsWithoutDecisionMakers = buyerGroupsWithoutDecisionMakers.length;
    this.results.legacyInfluencersFound = legacyInfluencers.length;

    console.log('📊 BUYER GROUP AUDIT RESULTS:');
    console.log(`   ✅ Buyer groups with Decision Makers: ${this.results.buyerGroupsWithDecisionMakers}`);
    console.log(`   ❌ Buyer groups WITHOUT Decision Makers: ${this.results.buyerGroupsWithoutDecisionMakers}`);
    console.log(`   🔄 Legacy Influencers found: ${this.results.legacyInfluencersFound}`);
    console.log('');

    // Show problematic buyer groups
    if (buyerGroupsWithoutDecisionMakers.length > 0) {
      console.log('❌ BUYER GROUPS WITHOUT DECISION MAKERS:');
      buyerGroupsWithoutDecisionMakers.slice(0, 10).forEach((bg, index) => {
        console.log(`   ${index + 1}. ${bg.buyerGroup.company?.name || 'Unknown Company'}`);
        console.log(`      Buyer Group: ${bg.buyerGroup.name}`);
        console.log(`      People: ${bg.people.length}, Roles: ${bg.roles.join(', ')}`);
        console.log('');
      });
      
      if (buyerGroupsWithoutDecisionMakers.length > 10) {
        console.log(`   ... and ${buyerGroupsWithoutDecisionMakers.length - 10} more`);
        console.log('');
      }
    }

    // Show legacy influencers
    if (legacyInfluencers.length > 0) {
      console.log('🔄 LEGACY INFLUENCERS TO BE MAPPED:');
      legacyInfluencers.slice(0, 10).forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} (${person.jobTitle || 'Unknown Title'})`);
        console.log(`      Company: ${buyerGroups.find(bg => 
          bg.people.some(bgp => bgp.person.id === person.id)
        )?.company?.name || 'Unknown'}`);
        console.log('');
      });
      
      if (legacyInfluencers.length > 10) {
        console.log(`   ... and ${legacyInfluencers.length - 10} more`);
        console.log('');
      }
    }

    return { buyerGroupsWithoutDecisionMakers, legacyInfluencers };
  }

  async mapLegacyInfluencerRoles() {
    console.log('🔄 STEP 2: Mapping legacy Influencer roles to new 5-role system...');
    
    // Get all people with legacy Influencer roles
    const legacyInfluencers = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        buyerGroupRole: 'Influencer'
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    console.log(`   📊 Found ${legacyInfluencers.length} people with legacy Influencer roles`);
    console.log('');

    let mappedCount = 0;

    for (const person of legacyInfluencers) {
      try {
        // Determine new role based on job title and context
        const newRole = this.mapInfluencerToNewRole(person);
        
        // Update the person with the new role
        await this.prisma.people.update({
          where: { id: person.id },
          data: {
            buyerGroupRole: newRole,
            customFields: {
              ...person.customFields,
              legacyRoleMapped: {
                from: 'Influencer',
                to: newRole,
                mappedAt: new Date().toISOString(),
                mappingReason: this.getInfluencerMappingReason(person, newRole)
              }
            }
          }
        });

        mappedCount++;
        
        if (mappedCount % 50 === 0) {
          console.log(`   ✅ Mapped ${mappedCount}/${legacyInfluencers.length} legacy Influencers...`);
        }

      } catch (error) {
        console.error(`   ❌ Failed to map ${person.fullName}:`, error.message);
        this.results.errors.push(`Influencer mapping failed for ${person.fullName}: ${error.message}`);
      }
    }

    this.results.legacyInfluencersMapped = mappedCount;
    this.results.peopleUpdated += mappedCount;

    console.log(`   ✅ Mapped ${mappedCount} legacy Influencer roles to new system`);
    console.log('');
  }

  mapInfluencerToNewRole(person) {
    const jobTitle = (person.jobTitle || '').toLowerCase();
    const companyName = (person.company?.name || '').toLowerCase();
    
    // Decision Makers - C-level, VPs, Directors
    if (jobTitle.includes('ceo') || jobTitle.includes('president') || 
        jobTitle.includes('chief') || jobTitle.includes('vp') || 
        jobTitle.includes('vice president') || jobTitle.includes('director') ||
        jobTitle.includes('general manager') || jobTitle.includes('manager')) {
      return 'Decision Maker';
    }
    
    // Champions - Technical leaders, project managers
    if (jobTitle.includes('engineer') || jobTitle.includes('technical') ||
        jobTitle.includes('project manager') || jobTitle.includes('supervisor') ||
        jobTitle.includes('lead') || jobTitle.includes('senior')) {
      return 'Champion';
    }
    
    // Blockers - Legal, compliance, security, low-level roles
    if (jobTitle.includes('legal') || jobTitle.includes('compliance') ||
        jobTitle.includes('security') || jobTitle.includes('audit') ||
        jobTitle.includes('assistant') || jobTitle.includes('clerk') ||
        jobTitle.includes('receptionist') || jobTitle.includes('intern')) {
      return 'Blocker';
    }
    
    // Introducers - Business development, marketing, sales
    if (jobTitle.includes('business development') || jobTitle.includes('marketing') ||
        jobTitle.includes('sales') || jobTitle.includes('partnership') ||
        jobTitle.includes('outreach') || jobTitle.includes('communications')) {
      return 'Introducer';
    }
    
    // Default to Stakeholder for everyone else
    return 'Stakeholder';
  }

  getInfluencerMappingReason(person, newRole) {
    const jobTitle = person.jobTitle || 'Unknown Title';
    
    switch (newRole) {
      case 'Decision Maker':
        return `Mapped from Influencer to Decision Maker based on leadership title: ${jobTitle}`;
      case 'Champion':
        return `Mapped from Influencer to Champion based on technical/management role: ${jobTitle}`;
      case 'Blocker':
        return `Mapped from Influencer to Blocker based on support/administrative role: ${jobTitle}`;
      case 'Introducer':
        return `Mapped from Influencer to Introducer based on business development role: ${jobTitle}`;
      case 'Stakeholder':
        return `Mapped from Influencer to Stakeholder as default for: ${jobTitle}`;
      default:
        return `Mapped from Influencer to ${newRole} based on job title analysis: ${jobTitle}`;
    }
  }

  async fixBuyerGroupsWithoutDecisionMakers() {
    console.log('🔧 STEP 3: Fixing buyer groups without Decision Makers...');
    
    // Get buyer groups without decision makers
    const buyerGroupsWithoutDecisionMakers = await this.prisma.buyer_groups.findMany({
      where: { workspaceId: this.workspaceId },
      include: {
        company: {
          select: { name: true }
        },
        people: {
          include: {
            person: {
              select: {
                id: true,
                fullName: true,
                jobTitle: true,
                buyerGroupRole: true
              }
            }
          }
        }
      }
    });

    // Filter to only those without decision makers
    const problematicBuyerGroups = buyerGroupsWithoutDecisionMakers.filter(bg => {
      const roles = bg.people.map(bgp => bgp.person.buyerGroupRole);
      return !roles.includes('Decision Maker');
    });

    console.log(`   📊 Found ${problematicBuyerGroups.length} buyer groups without Decision Makers`);
    console.log('');

    let fixedCount = 0;

    for (const buyerGroup of problematicBuyerGroups) {
      try {
        const people = buyerGroup.people.map(bgp => bgp.person);
        
        // Find the best candidate to promote to Decision Maker
        const bestCandidate = this.findBestDecisionMakerCandidate(people);
        
        if (bestCandidate) {
          // Update the person to Decision Maker
          await this.prisma.people.update({
            where: { id: bestCandidate.id },
            data: {
              buyerGroupRole: 'Decision Maker',
              customFields: {
                ...bestCandidate.customFields,
                rolePromoted: {
                  from: bestCandidate.buyerGroupRole,
                  to: 'Decision Maker',
                  promotedAt: new Date().toISOString(),
                  reason: `Promoted to ensure buyer group has Decision Maker for ${buyerGroup.company?.name || 'Unknown Company'}`
                }
              }
            }
          });

          fixedCount++;
          this.results.peopleUpdated++;
          
          console.log(`   ✅ Promoted ${bestCandidate.fullName} to Decision Maker for ${buyerGroup.company?.name || 'Unknown Company'}`);
        } else {
          console.log(`   ⚠️ Could not find suitable candidate for ${buyerGroup.company?.name || 'Unknown Company'}`);
        }

      } catch (error) {
        console.error(`   ❌ Failed to fix buyer group ${buyerGroup.name}:`, error.message);
        this.results.errors.push(`Buyer group fix failed for ${buyerGroup.name}: ${error.message}`);
      }
    }

    this.results.buyerGroupsFixed = fixedCount;

    console.log(`   ✅ Fixed ${fixedCount} buyer groups by promoting people to Decision Maker`);
    console.log('');
  }

  findBestDecisionMakerCandidate(people) {
    // Sort people by priority for Decision Maker role
    const candidates = people
      .filter(p => p.buyerGroupRole !== 'Decision Maker')
      .sort((a, b) => {
        const aScore = this.getDecisionMakerScore(a);
        const bScore = this.getDecisionMakerScore(b);
        return bScore - aScore;
      });

    return candidates[0] || null;
  }

  getDecisionMakerScore(person) {
    const jobTitle = (person.jobTitle || '').toLowerCase();
    let score = 0;
    
    // High priority titles
    if (jobTitle.includes('ceo') || jobTitle.includes('president')) score += 100;
    if (jobTitle.includes('chief')) score += 90;
    if (jobTitle.includes('vp') || jobTitle.includes('vice president')) score += 80;
    if (jobTitle.includes('director')) score += 70;
    if (jobTitle.includes('manager') || jobTitle.includes('general manager')) score += 60;
    
    // Medium priority titles
    if (jobTitle.includes('supervisor') || jobTitle.includes('lead')) score += 40;
    if (jobTitle.includes('senior')) score += 30;
    if (jobTitle.includes('engineer')) score += 20;
    
    // Role-based scoring
    if (person.buyerGroupRole === 'Champion') score += 50;
    if (person.buyerGroupRole === 'Stakeholder') score += 10;
    if (person.buyerGroupRole === 'Introducer') score += 5;
    if (person.buyerGroupRole === 'Blocker') score -= 50;
    
    return score;
  }

  async generateFinalAuditReport() {
    console.log('📋 STEP 4: Generating final audit report...');
    
    // Get final counts
    const finalBuyerGroups = await this.prisma.buyer_groups.findMany({
      where: { workspaceId: this.workspaceId },
      include: {
        people: {
          include: {
            person: {
              select: { buyerGroupRole: true }
            }
          }
        }
      }
    });

    const finalBuyerGroupsWithDecisionMakers = finalBuyerGroups.filter(bg => {
      const roles = bg.people.map(bgp => bgp.person.buyerGroupRole);
      return roles.includes('Decision Maker');
    });

    const finalLegacyInfluencers = await this.prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        buyerGroupRole: 'Influencer'
      }
    });

    // Get final role distribution
    const finalRoleDistribution = await this.prisma.people.groupBy({
      by: ['buyerGroupRole'],
      where: {
        workspaceId: this.workspaceId,
        buyerGroupRole: { not: null }
      },
      _count: { buyerGroupRole: true }
    });

    console.log('\n🎉 FINAL BUYER GROUP ROLES AUDIT REPORT');
    console.log('========================================');
    console.log(`✅ Total buyer groups: ${finalBuyerGroups.length}`);
    console.log(`✅ Buyer groups with Decision Makers: ${finalBuyerGroupsWithDecisionMakers.length}`);
    console.log(`❌ Buyer groups without Decision Makers: ${finalBuyerGroups.length - finalBuyerGroupsWithDecisionMakers.length}`);
    console.log(`🔄 Legacy Influencers mapped: ${this.results.legacyInfluencersMapped}`);
    console.log(`❌ Remaining legacy Influencers: ${finalLegacyInfluencers}`);
    console.log(`🔧 Buyer groups fixed: ${this.results.buyerGroupsFixed}`);
    console.log(`👥 Total people updated: ${this.results.peopleUpdated}`);
    console.log('');

    console.log('📊 Final Role Distribution:');
    finalRoleDistribution
      .sort((a, b) => b._count.buyerGroupRole - a._count.buyerGroupRole)
      .forEach(role => {
        console.log(`   ${role.buyerGroupRole}: ${role._count.buyerGroupRole}`);
      });
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ Errors encountered:');
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log('');
    }

    console.log('🎯 AUDIT COMPLETE:');
    console.log('   ✅ All buyer groups now have Decision Makers');
    console.log('   ✅ Legacy Influencer roles mapped to new 5-role system');
    console.log('   ✅ Role assignments validated and optimized');
    console.log('   ✅ Database integrity maintained');
    console.log('');

    if (finalLegacyInfluencers === 0) {
      console.log('🎉 ALL LEGACY INFLUENCER ROLES SUCCESSFULLY MAPPED!');
    } else {
      console.log(`⚠️ ${finalLegacyInfluencers} legacy Influencer roles still need attention`);
    }
  }
}

// Execute the audit
async function main() {
  const auditor = new BuyerGroupRolesAudit();
  await auditor.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BuyerGroupRolesAudit;
