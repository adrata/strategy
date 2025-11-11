#!/usr/bin/env node

/**
 * Top-Temp Buyer Group Discovery
 * 
 * Runs buyer group discovery for top-temp workspace (migration from TOP)
 * with the same service configuration as TOP:
 * - Product: Communications Engineering Services
 * - Deal Size: $200K-$500K (using $300K average)
 * - Industries: Electric Utilities, Broadband Deployment
 * - Departments: Engineering, IT, Operations, Technology
 * 
 * After discovery, tags existing people as "in_buyer_group" or "out_of_buyer_group"
 * and ensures companies and people get proper mainSellerId assignments.
 */

// Load .env.local first (from Vercel), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // .env as fallback
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');
const { extractDomain, createUniqueId } = require('./utils');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

// Seller ID mapping
const SELLER_IDS = {
  'Victoria Leland': '01K9QD2DETS5YD3Y8MMF40RBQ1',
  'Justin Bedard': '01K9QD2DY0QNCXQG0FSM8CWDYP',
  'Judy Wigginton': '01K9QD2E6RKVPNBDFBDGTXMN0Q',
  'Hilary Tristan': '01K9QD2EFMCXASV0C4Z6KE0DFC'
};

class TopTempBuyerGroupRunner {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_TEMP_WORKSPACE_ID;
    this.mainSellerId = options.mainSellerId || null; // Can be set per company
    
    // Same configuration as TOP (top-temp is migration from TOP)
    this.config = {
      dealSize: 300000, // $300K average (range: $150K-$500K+)
      dealSizeRange: { min: 150000, max: 500000 }, // Flexible range for expensive deals
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
      usaOnly: true // Focus on US utilities
    };
  }

  /**
   * Run buyer group discovery for a target company
   * @param {string} companyIdentifier - LinkedIn URL, website, or company name
   * @param {object} options - Additional options
   * @returns {Promise<object>} Discovery results
   */
  async run(companyIdentifier, options = {}) {
    console.log('🚀 Top-Temp - Buyer Group Discovery');
    console.log('='.repeat(60));
    console.log(`📊 Target Company: ${companyIdentifier}`);
    console.log(`💰 Deal Size: $${this.config.dealSize.toLocaleString()}`);
    console.log(`🏷️  Product: ${this.config.productName}`);
    console.log(`📂 Category: ${this.config.productCategory}`);
    console.log(`🇺🇸 USA Only: ${this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('='.repeat(60));
    console.log('');

    try {
      // Get company from workspace to determine mainSellerId
      let dbCompany = null;
      let companyMainSellerId = this.mainSellerId;
      
      try {
        // Get company from workspace to determine mainSellerId
        dbCompany = await this.prisma.companies.findFirst({
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
          // Use company's mainSellerId if available, otherwise use provided one
          companyMainSellerId = dbCompany.mainSellerId || companyMainSellerId;
          console.log(`   📊 Using workspace data: industry=${dbCompany.industry || 'N/A'}, employees=${dbCompany.employeeCount || 'N/A'}`);
          if (companyMainSellerId) {
            console.log(`   👤 Using mainSellerId: ${companyMainSellerId}`);
          }
        }
      } catch (error) {
        // If it's just a Prisma client validation warning about coreCompanyId, ignore it
        // The query should still work - this is a known Prisma client schema sync issue
        if (error.message && error.message.includes('coreCompanyId')) {
          console.log(`⚠️  Prisma client schema warning (non-blocking): ${error.message.substring(0, 100)}...`);
          // Try to continue - the company lookup will happen in the pipeline
        } else {
          console.log(`⚠️  Could not fetch workspace company: ${error.message}`);
        }
      }

      // Initialize pipeline with top-temp configuration
      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: this.workspaceId,
        mainSellerId: companyMainSellerId, // Pass mainSellerId for people AND companies
        dealSize: this.config.dealSize,
        productCategory: this.config.productCategory,
        customFiltering: this.config.customFiltering,
        buyerGroupSize: this.config.buyerGroupSizing,
        rolePriorities: this.config.rolePriorities,
        usaOnly: this.config.usaOnly,
        prisma: this.prisma,
        skipDatabase: options.skipDatabase || false
      });

      // Prepare company object for pipeline
      let company = null;
      if (dbCompany) {
        company = {
          id: dbCompany.id,
          name: dbCompany.name,
          linkedinUrl: dbCompany.linkedinUrl,
          website: dbCompany.website,
          industry: dbCompany.industry,
          employeeCount: dbCompany.employeeCount,
          revenue: dbCompany.revenue,
          mainSellerId: companyMainSellerId
        };
      } else {
        // Fallback: Create company object from identifier
        company = {
          name: this.extractCompanyName(companyIdentifier),
          linkedinUrl: companyIdentifier.includes('linkedin.com') ? companyIdentifier : null,
          website: companyIdentifier.includes('http') && !companyIdentifier.includes('linkedin.com') 
            ? companyIdentifier 
            : null,
          mainSellerId: companyMainSellerId
        };
      }

      // Run the discovery pipeline
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      console.log('\n✅ Buyer Group Discovery Complete!');
      console.log(`👥 Found ${result.buyerGroup.length} buyer group members`);

      // Tag existing people and create missing ones
      if (!options.skipDatabase) {
        await this.tagExistingPeople(result.buyerGroup, result.intelligence, companyMainSellerId);
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
   * Tag existing people as in or out of buyer group, and create missing people
   * @param {Array} buyerGroup - Discovered buyer group members
   * @param {object} intelligence - Company intelligence
   * @param {string} mainSellerId - Main seller ID to use for new people
   */
  async tagExistingPeople(buyerGroup, intelligence, mainSellerId) {
    console.log('\n🏷️  Tagging existing people and creating missing ones...');

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
      const buyerGroupMembers = new Map(); // Store full member data for creating missing people

      buyerGroup.forEach(member => {
        // Extract email from member
        const email = member.email || 
                     (member.fullProfile?.emails?.[0]?.email) ||
                     (member.fullProfile?.email);
        
        if (email && !email.includes('@coresignal.temp')) {
          buyerGroupEmails.add(email.toLowerCase());
          buyerGroupMembers.set(email.toLowerCase(), member);
        }

        // Extract LinkedIn URL
        const linkedin = member.linkedinUrl || 
                        (member.fullProfile?.linkedin_url) ||
                        (member.fullProfile?.linkedin);
        
        if (linkedin) {
          buyerGroupLinkedIn.add(linkedin.toLowerCase());
          buyerGroupMembers.set(linkedin.toLowerCase(), member);
        }

        // Normalize name for matching
        if (member.name) {
          const normalizedName = this.normalizeName(member.name);
          buyerGroupNames.add(normalizedName);
          buyerGroupMembers.set(normalizedName, member);
        }
      });

      console.log(`   Buyer group has ${buyerGroupEmails.size} emails, ${buyerGroupLinkedIn.size} LinkedIn URLs`);

      // Tag each existing person
      let inBuyerGroup = 0;
      let outOfBuyerGroup = 0;
      let alreadyTagged = 0;
      let created = 0;

      for (const person of existingPeople) {
        const currentTags = person.tags || [];
        const hasInTag = currentTags.includes('in_buyer_group');
        const hasOutTag = currentTags.includes('out_of_buyer_group');

        // Check if person is in buyer group
        let isInBuyerGroup = false;
        let matchedMember = null;

        // Match by email
        const personEmails = [
          person.email,
          person.workEmail,
          person.personalEmail
        ].filter(Boolean).map(e => e.toLowerCase());

        for (const email of personEmails) {
          if (buyerGroupEmails.has(email)) {
            isInBuyerGroup = true;
            matchedMember = buyerGroupMembers.get(email);
            break;
          }
        }

        // Match by LinkedIn URL
        if (!isInBuyerGroup && person.linkedinUrl) {
          const linkedinLower = person.linkedinUrl.toLowerCase();
          if (buyerGroupLinkedIn.has(linkedinLower)) {
            isInBuyerGroup = true;
            matchedMember = buyerGroupMembers.get(linkedinLower);
          }
        }

        // Match by name (fuzzy match as fallback)
        if (!isInBuyerGroup && person.fullName) {
          const normalizedName = this.normalizeName(person.fullName);
          if (buyerGroupNames.has(normalizedName)) {
            isInBuyerGroup = true;
            matchedMember = buyerGroupMembers.get(normalizedName);
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
            if (matchedMember && matchedMember.buyerGroupRole) {
              updateData.buyerGroupRole = matchedMember.buyerGroupRole;
            }
            
            // Enrich with data from matched member if available
            if (matchedMember) {
              // Extract and update email
              const memberEmail = matchedMember.email || 
                                (matchedMember.fullProfile?.emails?.[0]?.email) ||
                                (matchedMember.fullProfile?.email);
              if (memberEmail && !memberEmail.includes('@coresignal.temp')) {
                updateData.email = memberEmail;
                updateData.emailVerified = matchedMember.emailVerified || false;
                updateData.emailConfidence = matchedMember.emailConfidence || 0;
              }
              
              // Extract and update phone
              const memberPhone = matchedMember.phone ||
                                (matchedMember.fullProfile?.phoneNumbers?.[0]?.number) ||
                                (matchedMember.mobilePhone || matchedMember.workPhone);
              if (memberPhone) {
                updateData.phone = memberPhone;
                updateData.mobilePhone = matchedMember.mobilePhone || null;
                updateData.workPhone = matchedMember.workPhone || null;
                updateData.phoneVerified = matchedMember.phoneVerified || false;
                updateData.phoneConfidence = matchedMember.phoneConfidence || 0;
              }
              
              // Update LinkedIn if missing
              if (!person.linkedinUrl && matchedMember.linkedinUrl) {
                updateData.linkedinUrl = matchedMember.linkedinUrl;
              }
              
              // Save Coresignal data
              if (matchedMember.fullProfile) {
                updateData.coresignalData = matchedMember.fullProfile;
              }
              
              // Save enriched data
              if (matchedMember.emailVerificationDetails || matchedMember.phoneVerificationDetails) {
                const existingEnriched = person.enrichedData && typeof person.enrichedData === 'object' 
                  ? person.enrichedData 
                  : {};
                updateData.enrichedData = {
                  ...existingEnriched,
                  emailVerificationDetails: matchedMember.emailVerificationDetails || [],
                  emailSource: matchedMember.emailSource || 'unverified',
                  phoneVerificationDetails: matchedMember.phoneVerificationDetails || [],
                  phoneSource: matchedMember.phoneSource || 'unverified',
                  phoneType: matchedMember.phoneType || 'unknown',
                  phoneMetadata: matchedMember.phoneMetadata || {}
                };
              }
              
              // Update job title if missing or if member has better data
              if (matchedMember.title && (!person.jobTitle || !person.title)) {
                updateData.jobTitle = matchedMember.title;
                updateData.title = matchedMember.title;
              }
              
              updateData.buyerGroupOptimized = true;
              updateData.lastEnriched = new Date();
            }
            
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

      // Create missing people who are in buyer group but don't exist
      const existingEmails = new Set(existingPeople.map(p => p.email?.toLowerCase()).filter(Boolean));
      const existingLinkedIns = new Set(existingPeople.map(p => p.linkedinUrl?.toLowerCase()).filter(Boolean));
      const existingNames = new Set(existingPeople.map(p => this.normalizeName(p.fullName || '')).filter(Boolean));

      for (const member of buyerGroup) {
        const email = (member.email || 
                      (member.fullProfile?.emails?.[0]?.email) ||
                      (member.fullProfile?.email))?.toLowerCase();
        const linkedin = (member.linkedinUrl || 
                         (member.fullProfile?.linkedin_url) ||
                         (member.fullProfile?.linkedin))?.toLowerCase();
        const normalizedName = member.name ? this.normalizeName(member.name) : null;

        // Check if person already exists
        const exists = (email && existingEmails.has(email)) ||
                      (linkedin && existingLinkedIns.has(linkedin)) ||
                      (normalizedName && existingNames.has(normalizedName));

        if (!exists && (email || linkedin || member.name)) {
          // Create new person record with ALL enriched data
          const nameParts = (member.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Extract phone data
          const phone = member.phone ||
                       (member.fullProfile?.phoneNumbers?.[0]?.number) ||
                       (member.mobilePhone || member.workPhone);

          try {
            await this.prisma.people.create({
              data: {
                workspaceId: this.workspaceId,
                companyId: company.id,
                mainSellerId: mainSellerId || company.mainSellerId,
                firstName: firstName,
                lastName: lastName,
                fullName: member.name,
                jobTitle: member.title || null,
                title: member.title || null,
                department: member.department || null,
                // Email data with verification
                email: email && !email.includes('@coresignal.temp') ? email : null,
                emailVerified: member.emailVerified || false,
                emailConfidence: member.emailConfidence || 0,
                // Phone data
                phone: phone || null,
                mobilePhone: member.mobilePhone || null,
                workPhone: member.workPhone || null,
                phoneVerified: member.phoneVerified || false,
                phoneConfidence: member.phoneConfidence || 0,
                // LinkedIn
                linkedinUrl: linkedin || null,
                // Buyer group data
                isBuyerGroupMember: true,
                buyerGroupRole: member.buyerGroupRole || null,
                buyerGroupStatus: 'in_buyer_group',
                tags: ['in_buyer_group'],
                buyerGroupOptimized: true,
                // Coresignal data
                coresignalData: member.fullProfile || null,
                // Enriched data with verification details
                enrichedData: {
                  emailVerificationDetails: member.emailVerificationDetails || [],
                  emailSource: member.emailSource || 'unverified',
                  phoneVerificationDetails: member.phoneVerificationDetails || [],
                  phoneSource: member.phoneSource || 'unverified',
                  phoneType: member.phoneType || 'unknown',
                  phoneMetadata: member.phoneMetadata || {}
                },
                // Timestamps
                lastEnriched: new Date(),
                dataLastVerified: new Date()
              }
            });
            created++;
            console.log(`   ✅ Created missing person: ${member.name}${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}`);
          } catch (error) {
            console.log(`   ⚠️  Failed to create person ${member.name}: ${error.message}`);
          }
        }
      }

      console.log(`✅ Tagging complete:`);
      console.log(`   - In buyer group: ${inBuyerGroup} people`);
      console.log(`   - Out of buyer group: ${outOfBuyerGroup} people`);
      console.log(`   - Already tagged: ${alreadyTagged} people`);
      console.log(`   - Created missing: ${created} people`);

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
      // Try by LinkedIn URL first (most reliable identifier)
      if (intelligence.linkedinUrl) {
        const linkedinId = intelligence.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
        if (linkedinId) {
          const company = await this.prisma.companies.findFirst({
            where: {
              workspaceId: this.workspaceId,
              linkedinUrl: { contains: linkedinId }
            }
          });
          if (company) {
            console.log(`   ✅ Found company by LinkedIn URL: ${company.name}`);
            return company;
          }
        }
      }

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
        if (company) {
          console.log(`   ✅ Found company by website: ${company.name}`);
          return company;
        }
      }

      // Try by name
      if (intelligence.companyName) {
        const company = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            name: { contains: intelligence.companyName, mode: 'insensitive' }
          }
        });
        if (company) {
          console.log(`   ✅ Found company by name: ${company.name}`);
          return company;
        }
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
    console.log('  node run-top-temp-buyer-group.js <company-identifier> [options]');
    console.log('\nExamples:');
    console.log('  node run-top-temp-buyer-group.js "https://www.linkedin.com/company/pacific-gas-and-electric"');
    console.log('  node run-top-temp-buyer-group.js "https://www.pge.com"');
    console.log('  node run-top-temp-buyer-group.js "Pacific Gas and Electric"');
    console.log('\nOptions:');
    console.log('  --skip-database    Skip saving to database (for testing)');
    console.log('  --seller-id <id>   Override mainSellerId for this run');
    process.exit(1);
  }

  const companyIdentifier = args[0];
  const sellerIdIndex = args.indexOf('--seller-id');
  const mainSellerId = sellerIdIndex >= 0 && args[sellerIdIndex + 1] ? args[sellerIdIndex + 1] : null;
  
  const options = {
    skipDatabase: args.includes('--skip-database'),
    mainSellerId: mainSellerId
  };

  try {
    const runner = new TopTempBuyerGroupRunner(options);
    await runner.run(companyIdentifier, options);
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { TopTempBuyerGroupRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

