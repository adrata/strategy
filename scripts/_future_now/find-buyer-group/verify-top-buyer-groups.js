#!/usr/bin/env node

/**
 * Verify TOP Buyer Groups - Quality Check
 * 
 * Verifies that buyer groups have:
 * 1. Real data (full profiles, LinkedIn URLs, real emails)
 * 2. Appropriate sizes for company size
 * 3. Proper tagging (in_buyer_group/out_of_buyer_group)
 * 4. No duplicates
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TOPBuyerGroupVerifier {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
  }

  async run() {
    console.log('🔍 TOP Buyer Groups - Quality Verification');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Get all companies with buyer groups
      const companies = await this.prisma.companies.findMany({
        where: {
          workspaceId: this.workspaceId,
          deletedAt: null
        },
        include: {
          people: {
            where: {
              deletedAt: null,
              isBuyerGroupMember: true
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              workEmail: true,
              personalEmail: true,
              linkedinUrl: true,
              buyerGroupRole: true,
              tags: true,
              coresignalData: true,
              isBuyerGroupMember: true,
              buyerGroupStatus: true
            }
          },
          _count: {
            select: {
              people: {
                where: {
                  deletedAt: null
                }
              }
            }
          }
        }
      });

      console.log(`📊 Found ${companies.length} companies\n`);

      // Analyze buyer groups
      const stats = {
        totalCompanies: companies.length,
        companiesWithBuyerGroups: 0,
        totalBuyerGroupMembers: 0,
        membersWithRealEmails: 0,
        membersWithLinkedIn: 0,
        membersWithFullProfiles: 0,
        membersWithTags: 0,
        duplicatePeople: 0,
        incompleteBuyerGroups: 0
      };

      const issues = [];

      for (const company of companies) {
        const buyerGroupMembers = company.people;
        const totalPeople = company._count.people;

        if (buyerGroupMembers.length > 0) {
          stats.companiesWithBuyerGroups++;
          stats.totalBuyerGroupMembers += buyerGroupMembers.length;

          // Check for real emails
          const withRealEmails = buyerGroupMembers.filter(p => {
            const email = p.email || p.workEmail || p.personalEmail;
            return email && !email.includes('@coresignal.temp') && email.includes('@');
          });
          stats.membersWithRealEmails += withRealEmails.length;

          // Check for LinkedIn
          const withLinkedIn = buyerGroupMembers.filter(p => p.linkedinUrl);
          stats.membersWithLinkedIn += withLinkedIn.length;

          // Check for full profiles
          const withFullProfiles = buyerGroupMembers.filter(p => 
            p.coresignalData && typeof p.coresignalData === 'object'
          );
          stats.membersWithFullProfiles += withFullProfiles.length;

          // Check for tags
          const withTags = buyerGroupMembers.filter(p => 
            p.tags && Array.isArray(p.tags) && p.tags.includes('in_buyer_group')
          );
          stats.membersWithTags += withTags.length;

          // Check for duplicates (same email or LinkedIn)
          const emailSet = new Set();
          const linkedInSet = new Set();
          for (const person of buyerGroupMembers) {
            const email = (person.email || person.workEmail || person.personalEmail)?.toLowerCase();
            if (email) {
              if (emailSet.has(email)) {
                stats.duplicatePeople++;
                issues.push({
                  type: 'duplicate_email',
                  company: company.name,
                  email: email
                });
              }
              emailSet.add(email);
            }

            if (person.linkedinUrl) {
              if (linkedInSet.has(person.linkedinUrl)) {
                stats.duplicatePeople++;
                issues.push({
                  type: 'duplicate_linkedin',
                  company: company.name,
                  linkedin: person.linkedinUrl
                });
              }
              linkedInSet.add(person.linkedinUrl);
            }
          }

          // Check if buyer group is complete
          const employeeCount = company.employeeCount || totalPeople;
          let expectedMin = 1;
          if (employeeCount > 100) expectedMin = 6;
          else if (employeeCount > 50) expectedMin = 4;
          else if (employeeCount > 10) expectedMin = 3;
          else expectedMin = 1;

          if (buyerGroupMembers.length < expectedMin && employeeCount > 10) {
            stats.incompleteBuyerGroups++;
            issues.push({
              type: 'incomplete',
              company: company.name,
              current: buyerGroupMembers.length,
              expected: expectedMin,
              employeeCount
            });
          }
        }
      }

      // Print summary
      console.log('📊 VERIFICATION RESULTS');
      console.log('='.repeat(70));
      console.log(`\n✅ Companies with buyer groups: ${stats.companiesWithBuyerGroups}/${stats.totalCompanies}`);
      console.log(`👥 Total buyer group members: ${stats.totalBuyerGroupMembers}`);
      console.log(`📧 Members with real emails: ${stats.membersWithRealEmails} (${stats.totalBuyerGroupMembers > 0 ? Math.round((stats.membersWithRealEmails / stats.totalBuyerGroupMembers) * 100) : 0}%)`);
      console.log(`🔗 Members with LinkedIn: ${stats.membersWithLinkedIn} (${stats.totalBuyerGroupMembers > 0 ? Math.round((stats.membersWithLinkedIn / stats.totalBuyerGroupMembers) * 100) : 0}%)`);
      console.log(`📋 Members with full profiles: ${stats.membersWithFullProfiles} (${stats.totalBuyerGroupMembers > 0 ? Math.round((stats.membersWithFullProfiles / stats.totalBuyerGroupMembers) * 100) : 0}%)`);
      console.log(`🏷️  Members with tags: ${stats.membersWithTags} (${stats.totalBuyerGroupMembers > 0 ? Math.round((stats.membersWithTags / stats.totalBuyerGroupMembers) * 100) : 0}%)`);

      if (stats.duplicatePeople > 0) {
        console.log(`\n⚠️  Duplicates found: ${stats.duplicatePeople}`);
      } else {
        console.log(`\n✅ No duplicates found`);
      }

      if (stats.incompleteBuyerGroups > 0) {
        console.log(`\n⚠️  Incomplete buyer groups: ${stats.incompleteBuyerGroups}`);
      } else {
        console.log(`\n✅ All buyer groups are appropriately sized`);
      }

      if (issues.length > 0) {
        console.log(`\n⚠️  Issues Found: ${issues.length}`);
        console.log('\nSample issues:');
        issues.slice(0, 10).forEach((issue, i) => {
          console.log(`   ${i + 1}. ${issue.type}: ${issue.company}`);
          if (issue.expected) {
            console.log(`      Current: ${issue.current}, Expected: ${issue.expected}`);
          }
        });
      }

      // Quality score
      const qualityScore = this.calculateQualityScore(stats);
      console.log(`\n📊 Overall Quality Score: ${qualityScore}/100`);

      if (qualityScore >= 80) {
        console.log('✅ Quality is excellent!');
      } else if (qualityScore >= 60) {
        console.log('⚠️  Quality is good but could be improved');
      } else {
        console.log('❌ Quality needs improvement');
      }

      console.log('\n✅ Verification complete!\n');

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  calculateQualityScore(stats) {
    if (stats.totalBuyerGroupMembers === 0) return 0;

    let score = 0;

    // Real emails (30 points)
    const emailRate = stats.membersWithRealEmails / stats.totalBuyerGroupMembers;
    score += emailRate * 30;

    // LinkedIn URLs (20 points)
    const linkedInRate = stats.membersWithLinkedIn / stats.totalBuyerGroupMembers;
    score += linkedInRate * 20;

    // Full profiles (30 points)
    const profileRate = stats.membersWithFullProfiles / stats.totalBuyerGroupMembers;
    score += profileRate * 30;

    // Tags (10 points)
    const tagRate = stats.membersWithTags / stats.totalBuyerGroupMembers;
    score += tagRate * 10;

    // No duplicates (10 points)
    if (stats.duplicatePeople === 0) {
      score += 10;
    } else {
      score += Math.max(0, 10 - (stats.duplicatePeople * 2));
    }

    return Math.round(score);
  }
}

// Run if called directly
if (require.main === module) {
  const verifier = new TOPBuyerGroupVerifier();
  verifier.run().catch(console.error);
}

module.exports = { TOPBuyerGroupVerifier };

