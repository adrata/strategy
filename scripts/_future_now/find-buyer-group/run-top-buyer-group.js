#!/usr/bin/env node

/**
 * TOP Engineers Plus - Buyer Group Discovery
 * 
 * Runs buyer group discovery for TOP's target companies (Electric Utilities)
 * with their specific service configuration:
 * - Product: Communications Engineering Services
 * - Deal Size: $200K-$500K (using $300K average)
 * - Industries: Electric Utilities, Broadband Deployment
 * - Departments: Engineering, IT, Operations, Technology
 * 
 * After discovery, tags existing people as "in_buyer_group" or "out_of_buyer_group"
 * and ensures no duplicates are created.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');
const { extractDomain, createUniqueId } = require('./utils');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TOPBuyerGroupRunner {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
    this.mainSellerId = options.mainSellerId || null; // 🏆 FIX: Store mainSellerId for assigning people
    
    // TOP-specific configuration
    this.config = {
      dealSize: 300000, // $300K average (range: $200K-$500K)
      productCategory: 'engineering-services',
      productName: 'Communications Engineering Services',
      customFiltering: {
        departments: {
          primary: [
            'engineering',
            'it',
            'information technology',
            'operations',
            'technology',
            'communications',
            'telecommunications',
            'infrastructure',
            'network',
            'systems'
          ],
          secondary: [
            'strategy',
            'planning',
            'project management',
            'construction',
            'fiber',
            'outside plant',
            'distribution automation'
          ],
          exclude: [
            'customer success',
            'hr',
            'human resources',
            'sales',
            'marketing',
            'finance',
            'accounting'
          ]
        },
        titles: {
          primary: [
            'cto',
            'chief technology officer',
            'vp engineering',
            'vice president engineering',
            'director engineering',
            'director it',
            'director technology',
            'director operations',
            'director communications',
            'director infrastructure',
            'head of engineering',
            'head of it',
            'head of technology',
            'head of operations',
            'head of communications',
            'chief engineer',
            'engineering manager',
            'it manager',
            'technology manager',
            'operations manager',
            'communications manager',
            'network manager',
            'fiber manager',
            'outside plant manager',
            'distribution automation manager'
          ],
          secondary: [
            'senior engineer',
            'principal engineer',
            'lead engineer',
            'project manager',
            'program manager',
            'senior manager',
            'manager',
            'supervisor',
            'coordinator'
          ]
        }
      },
      buyerGroupSizing: {
        min: 6,
        max: 12,
        ideal: 9
      },
      rolePriorities: {
        decision: 10,      // Critical - need decision makers
        champion: 9,       // Very important - internal champions
        stakeholder: 7,    // Important - stakeholders
        blocker: 6,       // Important - procurement/legal
        introducer: 5     // Nice to have - introducers
      },
      usaOnly: true // TOP focuses on US utilities
    };
  }

  /**
   * Run buyer group discovery for a target company
   * @param {string} companyIdentifier - LinkedIn URL, website, or company name
   * @param {object} options - Additional options
   * @returns {Promise<object>} Discovery results
   */
  async run(companyIdentifier, options = {}) {
    console.log('🚀 TOP Engineers Plus - Buyer Group Discovery');
    console.log('='.repeat(60));
    console.log(`📊 Target Company: ${companyIdentifier}`);
    console.log(`💰 Deal Size: $${this.config.dealSize.toLocaleString()}`);
    console.log(`🏷️  Product: ${this.config.productName}`);
    console.log(`📂 Category: ${this.config.productCategory}`);
    console.log(`🇺🇸 USA Only: ${this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('='.repeat(60));
    console.log('');

    try {
      // Initialize pipeline with TOP configuration
      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: this.workspaceId,
        mainSellerId: this.mainSellerId, // 🏆 FIX: Pass mainSellerId so people appear in counts
        dealSize: this.config.dealSize,
        productCategory: this.config.productCategory,
        customFiltering: this.config.customFiltering,
        buyerGroupSize: this.config.buyerGroupSizing,
        rolePriorities: this.config.rolePriorities,
        usaOnly: this.config.usaOnly,
        prisma: this.prisma,
        skipDatabase: options.skipDatabase || false
      });

      // ENHANCED: Try to get workspace-specific company data first
      let company = null;
      try {
        const dbCompany = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            OR: [
              companyIdentifier.includes('linkedin.com') 
                ? { linkedinUrl: { contains: companyIdentifier } } 
                : undefined,
              companyIdentifier.includes('http') && !companyIdentifier.includes('linkedin.com')
                ? { website: { contains: companyIdentifier } }
                : undefined,
              { name: { contains: this.extractCompanyName(companyIdentifier), mode: 'insensitive' } }
            ].filter(Boolean)
          }
        });
        
        if (dbCompany) {
          console.log(`✅ Found workspace-specific company: ${dbCompany.name}`);
          company = {
            id: dbCompany.id,
            name: dbCompany.name,
            linkedinUrl: dbCompany.linkedinUrl,
            website: dbCompany.website,
            industry: dbCompany.industry, // TOP workspace-specific industry
            employeeCount: dbCompany.employeeCount, // TOP workspace-specific data
            revenue: dbCompany.revenue,
            // This ensures the pipeline uses TOP's workspace company data as context
          };
          console.log(`   📊 Using TOP workspace data: industry=${dbCompany.industry || 'N/A'}, employees=${dbCompany.employeeCount || 'N/A'}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not fetch workspace company: ${error.message}`);
      }
      
      // Fallback: Create company object from identifier if not found in workspace
      if (!company) {
        company = {
          name: this.extractCompanyName(companyIdentifier),
          linkedinUrl: companyIdentifier.includes('linkedin.com') ? companyIdentifier : null,
          website: companyIdentifier.includes('http') && !companyIdentifier.includes('linkedin.com') 
            ? companyIdentifier 
            : null
        };
      }

      // Run the discovery pipeline with workspace-specific company data
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      console.log('\n✅ Buyer Group Discovery Complete!');
      console.log(`👥 Found ${result.buyerGroup.length} buyer group members`);

      // Tag existing people
      if (!options.skipDatabase) {
        await this.tagExistingPeople(result.buyerGroup, result.intelligence);
      }

      return result;

    } catch (error) {
      console.error('❌ Buyer group discovery failed:', error.message);
      console.error(error.stack);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Tag existing people as in or out of buyer group
   * @param {Array} buyerGroup - Discovered buyer group members
   * @param {object} intelligence - Company intelligence
   */
  async tagExistingPeople(buyerGroup, intelligence) {
    console.log('\n🏷️  Tagging existing people...');

    try {
      // Get company ID
      const company = await this.findCompany(intelligence);
      if (!company) {
        console.log('⚠️  Company not found, skipping tagging');
        return;
      }

      // Get all existing people for this company
      const existingPeople = await this.prisma.people.findMany({
        where: {
          workspaceId: this.workspaceId,
          companyId: company.id,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          linkedinUrl: true,
          tags: true
        }
      });

      console.log(`   Found ${existingPeople.length} existing people in database`);

      // Create matching sets for buyer group members
      const buyerGroupEmails = new Set();
      const buyerGroupLinkedIn = new Set();
      const buyerGroupNames = new Set();

      buyerGroup.forEach(member => {
        // Extract email from member
        const email = member.email || 
                     (member.fullProfile?.emails?.[0]?.email) ||
                     (member.fullProfile?.email);
        
        if (email && !email.includes('@coresignal.temp')) {
          buyerGroupEmails.add(email.toLowerCase());
        }

        // Extract LinkedIn URL
        const linkedin = member.linkedinUrl || 
                        (member.fullProfile?.linkedin_url) ||
                        (member.fullProfile?.linkedin);
        
        if (linkedin) {
          buyerGroupLinkedIn.add(linkedin.toLowerCase());
        }

        // Normalize name for matching
        if (member.name) {
          buyerGroupNames.add(this.normalizeName(member.name));
        }
      });

      console.log(`   Buyer group has ${buyerGroupEmails.size} emails, ${buyerGroupLinkedIn.size} LinkedIn URLs`);

      // Tag each existing person
      let inBuyerGroup = 0;
      let outOfBuyerGroup = 0;
      let alreadyTagged = 0;

      for (const person of existingPeople) {
        const currentTags = person.tags || [];
        const hasInTag = currentTags.includes('in_buyer_group');
        const hasOutTag = currentTags.includes('out_of_buyer_group');

        // Check if person is in buyer group
        let isInBuyerGroup = false;

        // Match by email
        const personEmails = [
          person.email,
          person.workEmail,
          person.personalEmail
        ].filter(Boolean).map(e => e.toLowerCase());

        for (const email of personEmails) {
          if (buyerGroupEmails.has(email)) {
            isInBuyerGroup = true;
            break;
          }
        }

        // Match by LinkedIn URL
        if (!isInBuyerGroup && person.linkedinUrl) {
          if (buyerGroupLinkedIn.has(person.linkedinUrl.toLowerCase())) {
            isInBuyerGroup = true;
          }
        }

        // Match by name (fuzzy match as fallback)
        if (!isInBuyerGroup && person.fullName) {
          const normalizedName = this.normalizeName(person.fullName);
          if (buyerGroupNames.has(normalizedName)) {
            isInBuyerGroup = true;
          }
        }

        // Update tags and buyer group status
        let newTags = [...currentTags];
        let needsUpdate = false;
        const updateData = {};

        if (isInBuyerGroup) {
          if (!hasInTag) {
            // Remove out tag if present
            newTags = newTags.filter(t => t !== 'out_of_buyer_group');
            newTags.push('in_buyer_group');
            updateData.tags = newTags;
            updateData.isBuyerGroupMember = true;
            updateData.buyerGroupStatus = 'in_buyer_group';
            needsUpdate = true;
            inBuyerGroup++;
          } else {
            alreadyTagged++;
          }
        } else {
          if (!hasOutTag) {
            // Remove in tag if present
            newTags = newTags.filter(t => t !== 'in_buyer_group');
            newTags.push('out_of_buyer_group');
            updateData.tags = newTags;
            updateData.isBuyerGroupMember = false;
            updateData.buyerGroupStatus = 'out_of_buyer_group';
            needsUpdate = true;
            outOfBuyerGroup++;
          } else {
            alreadyTagged++;
          }
        }

        if (needsUpdate) {
          await this.prisma.people.update({
            where: { id: person.id },
            data: updateData
          });
        }
      }

      console.log(`✅ Tagging complete:`);
      console.log(`   - In buyer group: ${inBuyerGroup} people`);
      console.log(`   - Out of buyer group: ${outOfBuyerGroup} people`);
      console.log(`   - Already tagged: ${alreadyTagged} people`);

    } catch (error) {
      console.error('❌ Failed to tag existing people:', error.message);
      throw error;
    }
  }

  /**
   * Find company by intelligence data
   * @param {object} intelligence - Company intelligence
   * @returns {Promise<object|null>} Company record
   */
  async findCompany(intelligence) {
    try {
      // Try by website domain
      if (intelligence.website) {
        const domain = extractDomain(intelligence.website);
        const company = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            OR: [
              { website: { contains: domain } },
              { domain: domain }
            ]
          }
        });
        if (company) return company;
      }

      // Try by name
      if (intelligence.companyName) {
        const company = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            name: { contains: intelligence.companyName, mode: 'insensitive' }
          }
        });
        if (company) return company;
      }

      return null;
    } catch (error) {
      console.error('Error finding company:', error.message);
      return null;
    }
  }

  /**
   * Normalize name for matching
   * @param {string} name - Full name
   * @returns {string} Normalized name
   */
  normalizeName(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '');
  }

  /**
   * Extract company name from identifier
   * @param {string} identifier - LinkedIn URL, website, or company name
   * @returns {string} Company name
   */
  extractCompanyName(identifier) {
    if (identifier.includes('linkedin.com/company/')) {
      const match = identifier.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    return identifier;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Error: Company identifier is required');
    console.log('\nUsage:');
    console.log('  node run-top-buyer-group.js <company-identifier> [options]');
    console.log('\nExamples:');
    console.log('  node run-top-buyer-group.js "https://www.linkedin.com/company/pacific-gas-and-electric"');
    console.log('  node run-top-buyer-group.js "https://www.pge.com"');
    console.log('  node run-top-buyer-group.js "Pacific Gas and Electric"');
    console.log('\nOptions:');
    console.log('  --skip-database    Skip saving to database (for testing)');
    process.exit(1);
  }

  const companyIdentifier = args[0];
  const options = {
    skipDatabase: args.includes('--skip-database')
  };

  try {
    const runner = new TOPBuyerGroupRunner();
    await runner.run(companyIdentifier, options);
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { TOPBuyerGroupRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

