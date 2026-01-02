#!/usr/bin/env node

/**
 * ITC Systems Buyer Group Discovery for Adrata
 * 
 * Runs buyer group discovery for ITC Systems with Adrata-specific configuration:
 * - Excludes Product Managers (they build product, don't buy sales tools)
 * - Excludes Account Executives (they're peers, not buyers)
 * - Focuses on Sales Operations, Revenue Operations, Sales Leadership
 * - Uses best practices from Adrata ICP
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ITC_COMPANY_ID = '01K9PWYMPMTBGRPAD9DDW34Z47';

// Adrata ICP Configuration - Sales Intelligence Platform
const ADRATA_CONFIG = {
  productCategory: 'sales',
  productName: 'Adrata - Sales Intelligence Platform',
  dealSize: 50000,
  
  // Department targeting for sales intelligence
  departmentFiltering: {
    primaryDepartments: ['sales', 'revenue operations', 'sales operations', 'go-to-market'],
    secondaryDepartments: ['marketing', 'business development', 'strategy'],
    excludedDepartments: ['engineering', 'product', 'hr', 'legal', 'accounting', 'support', 'customer success']
  },
  
  // Title targeting - CRITICAL: Exclude PMs and AEs
  titleFiltering: {
    primaryTitles: [
      'chief revenue officer', 'cro',
      'vp sales', 'vice president sales', 'vp of sales',
      'vp revenue operations', 'vp revops',
      'head of sales', 'head of revenue',
      'director sales operations', 'director sales ops',
      'director revenue operations', 'director revops',
      'sales operations manager', 'sales ops manager',
      'revenue operations manager', 'revops manager'
    ],
    secondaryTitles: [
      'chief commercial officer',
      'head of sales operations',
      'head of revenue operations',
      'sales enablement', 'revenue enablement',
      'sales strategy', 'gtm strategy',
      'business development director'
    ],
    // EXCLUDED TITLES - These roles don't buy sales intelligence tools
    excludedTitles: [
      'product manager', 'product management', 'pm',
      'account executive', 'ae',
      'account manager', 'am',
      'customer success', 'csm',
      'engineer', 'developer', 'software',
      'support', 'service',
      'hr', 'human resources', 'recruiter', 'recruiting',
      'legal', 'counsel', 'attorney',
      'finance', 'accounting', 'controller',
      'marketing manager', 'content', 'social media',
      'sdr', 'bdr', 'sales development' // They're users, not buyers
    ],
    seniorityRequirements: 'director' // Director+ for $50K deals
  },
  
  // Buyer group sizing - Focus on key decision makers
  buyerGroupSizing: {
    economic_buyer: 1,
    champion: 2,
    influencer: 2,
    technical_evaluator: 1,
    end_user: 0 // Skip end users - they don't make buying decisions
  },
  
  // Role priorities
  rolePriorities: {
    economic_buyer: ['cro', 'vp sales', 'chief revenue officer', 'head of sales'],
    champion: ['director sales operations', 'director revops', 'head of sales ops'],
    influencer: ['sales enablement', 'revenue operations manager'],
    technical_evaluator: ['sales operations manager', 'revops manager']
  },
  
  usaOnly: false
};

class ITCSystemsBuyerGroupRunner {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async run() {
    console.log('🚀 ITC SYSTEMS - BUYER GROUP DISCOVERY FOR ADRATA');
    console.log('='.repeat(70));
    console.log(`Product: ${ADRATA_CONFIG.productName}`);
    console.log(`Deal Size: $${ADRATA_CONFIG.dealSize.toLocaleString()}`);
    console.log(`Company ID: ${ITC_COMPANY_ID}`);
    console.log('');
    console.log('🚫 EXCLUDED TITLES:');
    console.log('   - Product Managers (build product, don\'t buy sales tools)');
    console.log('   - Account Executives (peers, not buyers)');
    console.log('   - SDRs/BDRs (end users, not decision makers)');
    console.log('   - Customer Success (different buying center)');
    console.log('');
    console.log('✅ TARGET TITLES:');
    console.log('   - CRO, VP Sales, Head of Sales');
    console.log('   - Director/Head of Sales Operations');
    console.log('   - Director/Head of Revenue Operations');
    console.log('   - Sales Operations Managers');
    console.log('='.repeat(70));

    try {
      // Get ITC Systems company data
      const company = await this.prisma.companies.findUnique({
        where: { id: ITC_COMPANY_ID },
        include: {
          mainSeller: true
        }
      });

      if (!company) {
        console.error('❌ ITC Systems not found!');
        return;
      }

      console.log(`\n📊 Company: ${company.name}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
      console.log(`   Industry: ${company.industry || 'N/A'}`);
      console.log(`   Main Seller: ${company.mainSeller?.name || 'Unassigned'}`);

      // Run buyer group discovery with Adrata config
      console.log('\n🔍 Running buyer group discovery...\n');
      
      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: ADRATA_WORKSPACE_ID,
        dealSize: ADRATA_CONFIG.dealSize,
        productCategory: ADRATA_CONFIG.productCategory,
        productName: ADRATA_CONFIG.productName,
        usaOnly: ADRATA_CONFIG.usaOnly,
        prisma: this.prisma,
        skipDatabase: false,
        // CRITICAL: Pass custom filtering to exclude PMs and AEs
        customFiltering: {
          departments: ADRATA_CONFIG.departmentFiltering,
          titles: {
            primary: ADRATA_CONFIG.titleFiltering.primaryTitles,
            secondary: ADRATA_CONFIG.titleFiltering.secondaryTitles,
            exclude: ADRATA_CONFIG.titleFiltering.excludedTitles
          },
          bestClosingTitle: 'director sales operations',
          alwaysInclude: ['cro', 'vp sales', 'head of sales']
        },
        buyerGroupSize: ADRATA_CONFIG.buyerGroupSizing,
        rolePriorities: ADRATA_CONFIG.rolePriorities
      });

      const companyData = {
        id: company.id,
        name: company.name,
        linkedinUrl: company.linkedinUrl,
        website: company.website,
        industry: company.industry,
        employeeCount: company.employeeCount
      };

      const result = await pipeline.run(companyData);

      if (result && result.buyerGroup && result.buyerGroup.length > 0) {
        console.log('\n' + '='.repeat(70));
        console.log('✅ BUYER GROUP DISCOVERED!');
        console.log('='.repeat(70));

        // Filter out any PMs or AEs that might have slipped through
        const filteredBuyerGroup = result.buyerGroup.filter(member => {
          const title = (member.title || member.jobTitle || '').toLowerCase();
          const excludePatterns = [
            'product manager', 'product management',
            'account executive', 'account manager',
            'customer success', 'support',
            'engineer', 'developer', 'sdr', 'bdr'
          ];
          return !excludePatterns.some(pattern => title.includes(pattern));
        });

        console.log(`\n📊 Total Members: ${filteredBuyerGroup.length}`);
        console.log('');

        for (const member of filteredBuyerGroup) {
          const email = member.email || member.fullProfile?.email || 'No email';
          const hasRealEmail = email && !email.includes('@coresignal.temp') && email.includes('@');
          
          console.log(`👤 ${member.name || member.fullName}`);
          console.log(`   Title: ${member.title || member.jobTitle || 'N/A'}`);
          console.log(`   Role: ${member.role || 'N/A'}`);
          console.log(`   Email: ${hasRealEmail ? '✅ ' + email : '❌ Not found'}`);
          console.log(`   Phone: ${member.phone || member.fullProfile?.phone || 'Not found'}`);
          console.log(`   LinkedIn: ${member.linkedinUrl || member.linkedin || 'N/A'}`);
          console.log('');
        }

        // Count real emails
        const realEmails = filteredBuyerGroup.filter(m => {
          const email = m.email || m.fullProfile?.email || '';
          return email && !email.includes('@coresignal.temp') && email.includes('@');
        });

        console.log('='.repeat(70));
        console.log(`📧 Real Emails Found: ${realEmails.length}/${filteredBuyerGroup.length}`);
        console.log('='.repeat(70));

        // Save to database
        console.log('\n💾 Saving to database...');
        await this.saveBuyerGroupToDatabase(company, filteredBuyerGroup, result);

        console.log('\n🎉 BUYER GROUP DISCOVERY COMPLETE!');
        console.log(`\n🔗 Company URL for Dan: https://app.adrata.com/companies/${ITC_COMPANY_ID}`);

      } else {
        console.log('\n❌ No buyer group members found');
        console.log('   This could mean:');
        console.log('   - Company is too small');
        console.log('   - LinkedIn data not available');
        console.log('   - No matching roles found');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async saveBuyerGroupToDatabase(company, buyerGroup, result) {
    try {
      // Create or update BuyerGroups record
      const existingGroup = await this.prisma.buyerGroups.findFirst({
        where: { companyId: company.id }
      });

      const buyerGroupData = {
        companyName: company.name,
        website: company.website,
        industry: company.industry,
        workspaceId: ADRATA_WORKSPACE_ID,
        companyId: company.id,
        totalMembers: buyerGroup.length,
        status: 'active',
        enrichmentLevel: 'full',
        updatedAt: new Date()
      };

      let buyerGroupId;
      if (existingGroup) {
        await this.prisma.buyerGroups.update({
          where: { id: existingGroup.id },
          data: buyerGroupData
        });
        buyerGroupId = existingGroup.id;
        console.log(`   Updated existing buyer group: ${existingGroup.id}`);
      } else {
        const newGroup = await this.prisma.buyerGroups.create({
          data: {
            id: `bg_${company.id}`,
            ...buyerGroupData,
            createdAt: new Date()
          }
        });
        buyerGroupId = newGroup.id;
        console.log(`   Created new buyer group: ${newGroup.id}`);
      }

      // Create or update people records
      for (const member of buyerGroup) {
        const personData = {
          workspaceId: ADRATA_WORKSPACE_ID,
          companyId: company.id,
          firstName: (member.name || '').split(' ')[0] || 'Unknown',
          lastName: (member.name || '').split(' ').slice(1).join(' ') || 'Unknown',
          fullName: member.name || 'Unknown',
          jobTitle: member.title || member.jobTitle,
          email: member.email || member.fullProfile?.email,
          phone: member.phone || member.fullProfile?.phone,
          linkedinUrl: member.linkedinUrl || member.linkedin,
          mainSellerId: DAN_USER_ID,
          isBuyerGroupMember: true,
          buyerGroupRole: member.role,
          buyerGroupStatus: 'active',
          dataQualityScore: 0.7,
          dataLastVerified: new Date()
        };

        // Check if person already exists
        const existingPerson = await this.prisma.people.findFirst({
          where: {
            workspaceId: ADRATA_WORKSPACE_ID,
            companyId: company.id,
            OR: [
              { email: personData.email },
              { linkedinUrl: personData.linkedinUrl },
              { fullName: personData.fullName }
            ].filter(Boolean)
          }
        });

        if (existingPerson) {
          await this.prisma.people.update({
            where: { id: existingPerson.id },
            data: {
              isBuyerGroupMember: true,
              buyerGroupRole: member.role,
              buyerGroupStatus: 'active',
              mainSellerId: DAN_USER_ID,
              ...(personData.email && { email: personData.email }),
              ...(personData.phone && { phone: personData.phone }),
              ...(personData.linkedinUrl && { linkedinUrl: personData.linkedinUrl })
            }
          });
          console.log(`   Updated: ${personData.fullName}`);
        } else {
          await this.prisma.people.create({
            data: personData
          });
          console.log(`   Created: ${personData.fullName}`);
        }
      }

      console.log(`\n✅ Saved ${buyerGroup.length} buyer group members to database`);

    } catch (error) {
      console.error('❌ Error saving to database:', error.message);
    }
  }
}

// Run
const runner = new ITCSystemsBuyerGroupRunner();
runner.run().catch(console.error);

module.exports = { ITCSystemsBuyerGroupRunner };
