const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');
require('dotenv').config();

const prisma = new PrismaClient();

class TargetedBuyerGroupFixes {
  constructor() {
    this.results = {
      fixes: {
        noPeopleFixed: 0,
        noDecisionMakersFixed: 0,
        suspiciousSizesFlagged: 0
      }
    };
  }

  async executeTargetedFixes() {
    console.log('🎯 TARGETED BUYER GROUP FIXES');
    console.log('=============================');
    console.log('Fixing specific issues without API calls:');
    console.log('1. Companies with no people (135 companies)');
    console.log('2. Companies with no decision makers (146 companies)');
    console.log('3. Flagging suspicious company sizes (36 companies)');
    console.log('');

    try {
      // Step 1: Fix companies with no people by promoting existing people
      await this.fixCompaniesWithNoPeople();
      
      // Step 2: Fix companies with no decision makers by promoting existing people
      await this.fixCompaniesWithNoDecisionMakers();
      
      // Step 3: Flag suspicious company sizes for manual review
      await this.flagSuspiciousCompanySizes();
      
      // Step 4: Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Targeted fixes failed:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async fixCompaniesWithNoPeople() {
    console.log('🔍 FIXING COMPANIES WITH NO PEOPLE');
    console.log('===================================');
    console.log('Promoting existing people to buyer groups');
    console.log('');

    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Find companies with buyer groups but no people
    const companiesWithNoPeople = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true,
        buyerGroups: {
          where: { workspaceId: workspace.id },
          select: { id: true, customFields: true }
        },
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true,
            customFields: true
          }
        }
      }
    });

    const actuallyNoPeople = [];
    for (const company of companiesWithNoPeople) {
      const buyerGroup = company.buyerGroups[0];
      if (buyerGroup) {
        const roleDistribution = buyerGroup.customFields?.roleDistribution;
        if (roleDistribution) {
          const totalPeople = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
          if (totalPeople === 0 && company.people.length > 0) {
            actuallyNoPeople.push(company);
          }
        }
      }
    }

    console.log(`Found ${actuallyNoPeople.length} companies with no people in buyer groups but have people in database`);
    console.log('');

    let fixedCount = 0;
    let failedCount = 0;

    for (const company of actuallyNoPeople) {
      console.log(`🏢 Fixing no people: ${company.name}`);
      console.log(`   People in database: ${company.people.length}`);
      
      try {
        // Assign roles to existing people
        const peopleWithRoles = company.people.map(person => ({
          ...person,
          role: this.determineRoleFromTitle(person.jobTitle, person.customFields)
        }));

        // Update people with buyer group roles
        for (const person of peopleWithRoles) {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              buyerGroupRole: person.role,
              updatedAt: new Date(),
              customFields: {
                ...person.customFields,
                buyerGroupDiscovery: {
                  ...person.customFields?.buyerGroupDiscovery,
                  role: person.role,
                  confidence: 0.8,
                  reasoning: 'Promoted from existing people - No people in buyer group fix',
                  promotionDate: new Date().toISOString()
                }
              }
            }
          });
        }

        // Update buyer group role distribution
        await this.updateBuyerGroupRoleDistribution(company.id, workspace.id);
        
        fixedCount++;
        console.log(`   ✅ Assigned roles to ${peopleWithRoles.length} people`);
      } catch (error) {
        console.log(`   ❌ Error fixing ${company.name}: ${error.message}`);
        failedCount++;
      }
      console.log('');
    }

    this.results.fixes.noPeopleFixed = fixedCount;
    console.log(`✅ No people fixes complete: ${fixedCount} fixed, ${failedCount} failed`);
    console.log('');
  }

  async fixCompaniesWithNoDecisionMakers() {
    console.log('🔍 FIXING COMPANIES WITH NO DECISION MAKERS');
    console.log('===========================================');
    console.log('Promoting suitable people to decision makers');
    console.log('');

    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    // Find companies with buyer groups but no decision makers
    const companiesWithNoDMs = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true,
            customFields: true
          }
        }
      }
    });

    const actuallyNoDMs = [];
    for (const company of companiesWithNoDMs) {
      const decisionMakers = company.people.filter(p => p.buyerGroupRole === 'Decision Maker');
      if (decisionMakers.length === 0 && company.people.length > 0) {
        actuallyNoDMs.push(company);
      }
    }

    console.log(`Found ${actuallyNoDMs.length} companies with no decision makers`);
    console.log('');

    let fixedCount = 0;
    let failedCount = 0;

    for (const company of actuallyNoDMs) {
      console.log(`🏢 Fixing no decision makers: ${company.name}`);
      
      try {
        // Find people who should be decision makers
        const potentialDMs = company.people.filter(person => {
          const title = (person.jobTitle || '').toLowerCase();
          const isCoreSignalDM = person.customFields?.is_decision_maker === 1;
          
          return isCoreSignalDM ||
                 title.includes('ceo') || title.includes('chief') || title.includes('president') ||
                 title.includes('vp') || title.includes('vice president') ||
                 title.includes('director') || title.includes('head of') ||
                 title.includes('svp') || title.includes('senior vice president');
        });

        if (potentialDMs.length > 0) {
          // Promote the best candidate to Decision Maker
          const bestDM = potentialDMs.sort((a, b) => {
            const aScore = this.calculateDecisionMakerScore(a);
            const bScore = this.calculateDecisionMakerScore(b);
            return bScore - aScore;
          })[0];

          // Update person's role
          await prisma.people.update({
            where: { id: bestDM.id },
            data: {
              buyerGroupRole: 'Decision Maker',
              updatedAt: new Date(),
              customFields: {
                ...bestDM.customFields,
                buyerGroupDiscovery: {
                  ...bestDM.customFields?.buyerGroupDiscovery,
                  role: 'Decision Maker',
                  confidence: 0.9,
                  reasoning: 'Promoted to Decision Maker - Enhanced role assignment logic',
                  promotionDate: new Date().toISOString()
                }
              }
            }
          });

          // Update buyer group role distribution
          await this.updateBuyerGroupRoleDistribution(company.id, workspace.id);
          
          fixedCount++;
          console.log(`   ✅ Promoted ${bestDM.fullName} to Decision Maker`);
        } else {
          console.log(`   ❌ No suitable decision maker candidates found for ${company.name}`);
          failedCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error fixing ${company.name}: ${error.message}`);
        failedCount++;
      }
      console.log('');
    }

    this.results.fixes.noDecisionMakersFixed = fixedCount;
    console.log(`✅ No decision makers fixes complete: ${fixedCount} fixed, ${failedCount} failed`);
    console.log('');
  }

  async flagSuspiciousCompanySizes() {
    console.log('🚨 FLAGGING SUSPICIOUS COMPANY SIZES');
    console.log('===================================');
    console.log('Identifying companies with suspicious employee counts');
    console.log('');

    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP Engineering Plus' }
    });

    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });

    const suspiciousCompanies = [];
    for (const company of allCompanies) {
      const coresignalData = company.customFields?.coresignalData;
      const companySize = coresignalData?.employees_count;
      const companyName = company.name.toLowerCase();
      
      const isMajorUtility = companyName.includes('power') || 
                            companyName.includes('electric') || 
                            companyName.includes('utility') ||
                            companyName.includes('energy') ||
                            companyName.includes('hydro') ||
                            companyName.includes('grid');
      
      if (isMajorUtility && companySize <= 10) {
        suspiciousCompanies.push({
          ...company,
          currentSize: companySize,
          currentId: coresignalData.id
        });
      }
    }

    console.log(`Found ${suspiciousCompanies.length} companies with suspicious sizes:`);
    console.log('');

    for (const company of suspiciousCompanies) {
      console.log(`🚨 ${company.name}: ${company.currentSize} employees (ID: ${company.currentId})`);
      
      // Flag in database for manual review
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: {
            ...company.customFields,
            suspiciousSize: {
              flagged: true,
              currentSize: company.currentSize,
              currentId: company.currentId,
              reason: 'Major utility with suspiciously low employee count',
              flaggedDate: new Date().toISOString(),
              needsManualReview: true
            }
          },
          updatedAt: new Date()
        }
      });
    }

    this.results.fixes.suspiciousSizesFlagged = suspiciousCompanies.length;
    console.log(`✅ Flagged ${suspiciousCompanies.length} companies for manual review`);
    console.log('');
  }

  determineRoleFromTitle(jobTitle, customFields) {
    if (!jobTitle) return 'Stakeholder';
    
    const title = jobTitle.toLowerCase();
    const isCoreSignalDM = customFields?.is_decision_maker === 1;
    
    // Decision Maker detection
    if (isCoreSignalDM || 
        title.includes('ceo') || title.includes('chief') || title.includes('president') ||
        title.includes('vp') || title.includes('vice president') ||
        title.includes('director') || title.includes('head of') ||
        title.includes('svp') || title.includes('senior vice president')) {
      return 'Decision Maker';
    }
    
    // Champion detection
    if (title.includes('senior') || title.includes('principal') || title.includes('lead') ||
        title.includes('engineer') || title.includes('specialist') || title.includes('architect')) {
      return 'Champion';
    }
    
    // Blocker detection
    if (title.includes('legal') || title.includes('compliance') || title.includes('procurement') ||
        title.includes('finance') || title.includes('security') || title.includes('risk')) {
      return 'Blocker';
    }
    
    // Introducer detection
    if (title.includes('assistant') || title.includes('coordinator') || title.includes('administrative')) {
      return 'Introducer';
    }
    
    // Default to stakeholder
    return 'Stakeholder';
  }

  calculateDecisionMakerScore(person) {
    let score = 0;
    
    const title = (person.jobTitle || '').toLowerCase();
    const isCoreSignalDM = person.customFields?.is_decision_maker === 1;
    
    if (isCoreSignalDM) score += 100;
    if (title.includes('ceo')) score += 90;
    if (title.includes('chief')) score += 85;
    if (title.includes('president')) score += 80;
    if (title.includes('vp')) score += 70;
    if (title.includes('director')) score += 60;
    
    return score;
  }

  async updateBuyerGroupRoleDistribution(companyId, workspaceId) {
    const buyerGroup = await prisma.buyer_groups.findFirst({
      where: { companyId: companyId, workspaceId: workspaceId }
    });

    if (buyerGroup) {
      const people = await prisma.people.findMany({
        where: { companyId: companyId, workspaceId: workspaceId, deletedAt: null },
        select: { buyerGroupRole: true }
      });

      const roleDistribution = {
        decisionMakers: people.filter(p => p.buyerGroupRole === 'Decision Maker').length,
        champions: people.filter(p => p.buyerGroupRole === 'Champion').length,
        stakeholders: people.filter(p => p.buyerGroupRole === 'Stakeholder').length,
        blockers: people.filter(p => p.buyerGroupRole === 'Blocker').length,
        introducers: people.filter(p => p.buyerGroupRole === 'Introducer').length
      };

      await prisma.buyer_groups.update({
        where: { id: buyerGroup.id },
        data: {
          customFields: {
            ...buyerGroup.customFields,
            roleDistribution: roleDistribution
          },
          updatedAt: new Date()
        }
      });
    }
  }

  generateReport() {
    console.log('📊 TARGETED FIX REPORT');
    console.log('======================');
    console.log('');
    
    console.log('🔧 FIXES APPLIED:');
    console.log(`   Companies with no people fixed: ${this.results.fixes.noPeopleFixed}`);
    console.log(`   Companies with no decision makers fixed: ${this.results.fixes.noDecisionMakersFixed}`);
    console.log(`   Suspicious sizes flagged: ${this.results.fixes.suspiciousSizesFlagged}`);
    console.log('');
    
    const totalFixes = Object.values(this.results.fixes).reduce((sum, count) => sum + count, 0);
    console.log(`🎯 TOTAL FIXES APPLIED: ${totalFixes}`);
    console.log('');
    
    console.log('✅ TARGETED BUYER GROUP FIXES COMPLETE!');
    console.log('Issues addressed without API calls - using existing data.');
  }
}

// Main execution
async function main() {
  const fix = new TargetedBuyerGroupFixes();
  await fix.executeTargetedFixes();
}

main().catch(console.error);
