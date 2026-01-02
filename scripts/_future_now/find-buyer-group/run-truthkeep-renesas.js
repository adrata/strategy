#!/usr/bin/env node

/**
 * TruthKeep.ai → Renesas Buyer Group Discovery
 *
 * Runs buyer group discovery for TruthKeep.ai selling AI intelligence platform
 * to Renesas Electronics Corporation.
 *
 * COMPANY CONTEXT:
 * ================
 * TruthKeep.ai (truthkeep.ai):
 * - AI intelligence platform for semiconductor industry
 * - Unifies scattered signals across forums, CRM systems, and support data
 * - Provides real-time intelligence for faster decision-making
 * - Aggregates data from multiple sources for semiconductor teams
 *
 * Renesas Electronics Corporation (renesas.com):
 * - Major global semiconductor manufacturer
 * - Products: MCUs, analog components, power management, SoCs
 * - Focus areas: IoT, Industrial automation, robotics, HMI
 * - Global presence with operations worldwide
 * - Focus on secure, ultra-low-power performance for IoT
 *
 * INTERVIEW QUESTIONS ANSWERED:
 * =============================
 * 1. What does your company sell?
 *    AI-powered intelligence platform that unifies customer signals from forums,
 *    CRM, and support data to provide real-time insights for semiconductor companies
 *
 * 2. What industries do you typically sell to?
 *    Semiconductor Manufacturing, Electronics, Technology Hardware
 *
 * 3. What is your typical deal size?
 *    $300K-$600K (enterprise AI platform for global semiconductor company) - using $450K midpoint
 *
 * 4. Who typically makes the buying decision?
 *    VP/Director level, Product Management, Customer Support, IT/Technology leaders
 *
 * 5. Which departments are most involved in evaluating your solution?
 *    Product Management, Customer Support, Quality Assurance, Technical Support,
 *    IT/Data Analytics, Marketing (Customer Insights), Sales Operations
 *
 * 6. How complex is your typical sales cycle?
 *    Long (6-9 months) - enterprise AI platform with data integration requirements
 *
 * 7. Critical roles always involved?
 *    Product Management, Customer Support Leadership, Data Analytics,
 *    IT/Systems Integration, Quality Management
 *
 * 8. USA-only?
 *    No - Renesas is global (Japan HQ, worldwide operations)
 */

// Load environment variables from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Clean API keys (remove trailing \n characters that break authentication)
const cleanEnvKeys = () => {
  const keysToClean = [
    'CORESIGNAL_API_KEY',
    'ZEROBOUNCE_API_KEY',
    'MYEMAILVERIFIER_API_KEY',
    'PROSPEO_API_KEY',
    'PERPLEXITY_API_KEY',
    'PEOPLE_DATA_LABS_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ];

  keysToClean.forEach(key => {
    if (process.env[key]) {
      process.env[key] = process.env[key].replace(/\\n/g, '').replace(/\n/g, '').trim();
    }
  });
};
cleanEnvKeys();

const { getPrismaClient, disconnectPrismaClient } = require('../../lib/prisma-client');
const { SmartBuyerGroupPipeline } = require('./index');
const fs = require('fs');

class TruthKeepRenesasRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;

    // Configuration for TruthKeep.ai selling AI intelligence to Renesas
    this.config = {
      // Product/Deal Configuration
      dealSize: 450000, // $450K enterprise AI platform deal
      dealSizeRange: { min: 300000, max: 600000 },
      productCategory: 'custom',
      productName: 'AI Intelligence Platform for Semiconductors',
      productDescription: 'Unifies scattered signals across forums, CRM systems, and support data to provide real-time intelligence',

      // Department Filtering - Who would evaluate/use TruthKeep's platform
      customFiltering: {
        departments: {
          primary: [
            // Product Management - Core users who need customer intelligence
            'product management',
            'product development',
            'product strategy',
            'product operations',
            'product marketing',

            // Customer Support - Data source and beneficiary
            'customer support',
            'technical support',
            'customer success',
            'customer experience',
            'support operations',
            'field application engineering',
            'fae',

            // Quality & Reliability - Need intelligence on product issues
            'quality',
            'quality assurance',
            'quality management',
            'reliability',
            'reliability engineering',

            // Data & Analytics - Will integrate and use the platform
            'data analytics',
            'business intelligence',
            'data science',
            'analytics',
            'insights',
            'customer insights'
          ],
          secondary: [
            // IT & Technology - Platform integration
            'information technology',
            'it',
            'technology',
            'systems',
            'data engineering',
            'software engineering',
            'digital transformation',

            // Sales & Marketing - Benefit from customer intelligence
            'sales',
            'sales operations',
            'marketing',
            'market intelligence',
            'competitive intelligence',

            // R&D - Use customer feedback for product development
            'research and development',
            'r&d',
            'engineering',
            'development',

            // Operations
            'operations',
            'business operations',
            'strategy',

            // Procurement/Finance
            'finance',
            'procurement',
            'vendor management'
          ],
          exclude: [
            // Not relevant to AI intelligence platform
            'hr',
            'human resources',
            'facilities',
            'real estate',
            'physical security',
            'legal' // Unless specifically mentioned
          ]
        },
        titles: {
          primary: [
            // C-Level
            'cto',
            'chief technology officer',
            'cio',
            'chief information officer',
            'cpo',
            'chief product officer',
            'chief data officer',
            'cdo',
            'chief quality officer',

            // VP Level - Product
            'vp product',
            'vp product management',
            'vice president product',
            'svp product',
            'senior vice president product',
            'head of product',

            // VP Level - Support/Customer
            'vp customer support',
            'vp technical support',
            'vp customer success',
            'vice president support',
            'svp customer',
            'head of support',
            'head of customer',

            // VP Level - Quality
            'vp quality',
            'vice president quality',
            'head of quality',

            // VP Level - Data/Analytics
            'vp analytics',
            'vp data',
            'vice president analytics',
            'head of data',
            'head of analytics',

            // VP Level - Technology
            'vp technology',
            'vp it',
            'vice president technology',
            'vice president it',

            // Director Level - Product
            'director product management',
            'director product',
            'senior director product',

            // Director Level - Support
            'director customer support',
            'director technical support',
            'director field applications',
            'director customer success',

            // Director Level - Quality
            'director quality',
            'director reliability',

            // Director Level - Analytics/Data
            'director analytics',
            'director data',
            'director business intelligence',

            // Director Level - Technology
            'director it',
            'director technology',
            'director systems'
          ],
          secondary: [
            // Senior Manager Level
            'senior manager product',
            'senior manager support',
            'senior manager quality',
            'senior manager analytics',

            // Manager Level
            'manager product',
            'manager support',
            'manager quality',
            'manager analytics',
            'product manager',
            'senior product manager',

            // Lead/Principal
            'lead',
            'principal',
            'staff',
            'senior staff',

            // Specialist roles
            'product marketing manager',
            'technical support manager',
            'customer insights',
            'data analyst',
            'business analyst'
          ]
        }
      },

      // Buyer Group Sizing - $450K deal = substantial enterprise group
      buyerGroupSizing: {
        min: 10,
        max: 16,
        ideal: 13
      },

      // Role Priorities for enterprise technology deal
      rolePriorities: {
        decision: 10,      // Critical - need decision makers (VPs, Directors)
        champion: 9,       // Very important - product/support leaders who see the pain
        stakeholder: 8,    // Important - cross-functional stakeholders
        blocker: 6,        // Important - IT security, procurement
        introducer: 5      // Nice to have
      },

      // Location Filter
      usaOnly: false, // Renesas is global (Japan HQ, worldwide operations)

      // Special Requirements
      specialRequirements: {
        alwaysInclude: [
          'product management',
          'customer support',
          'quality',
          'data analytics'
        ],
        industrySpecific: 'Semiconductor Manufacturing - AI Intelligence Platform',
        companyContext: {
          seller: {
            name: 'TruthKeep.ai',
            website: 'https://truthkeep.ai',
            product: 'AI Intelligence Platform for Semiconductors',
            valueProposition: 'Unifies scattered signals across forums, CRM, and support data for real-time intelligence'
          },
          buyer: {
            name: 'Renesas Electronics Corporation',
            website: 'https://www.renesas.com',
            industry: 'Semiconductor Manufacturing',
            products: 'MCUs, Analog Components, Power Management, SoCs',
            focusAreas: ['IoT', 'Industrial Automation', 'Robotics', 'HMI']
          }
        }
      }
    };
  }

  /**
   * Find or create workspace for this buyer group discovery
   * @returns {Promise<string>} Workspace ID
   */
  async ensureWorkspace() {
    if (this.workspaceId) {
      return this.workspaceId;
    }

    console.log('🔍 Finding or creating workspace...');

    try {
      // Try to find existing workspace by name
      let workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'TruthKeep', mode: 'insensitive' } },
            { name: { contains: 'Truth Keep', mode: 'insensitive' } }
          ]
        }
      });

      if (workspace) {
        console.log(`✅ Found existing workspace: ${workspace.name}`);
        this.workspaceId = workspace.id;
        return workspace.id;
      }

      // Create new workspace if needed
      console.log('📝 Creating new workspace for TruthKeep.ai...');
      workspace = await this.prisma.workspaces.create({
        data: {
          name: 'TruthKeep.ai',
          slug: `truthkeep-${Date.now()}`,
          updatedAt: new Date(),
        }
      });

      console.log(`✅ Created workspace: ${workspace.name} (${workspace.id})`);
      this.workspaceId = workspace.id;
      return workspace.id;
    } catch (error) {
      console.error('❌ Error with workspace:', error.message);
      // Generate a temporary workspace ID if database fails
      this.workspaceId = `temp_truthkeep_${Date.now()}`;
      console.log(`⚠️ Using temporary workspace ID: ${this.workspaceId}`);
      return this.workspaceId;
    }
  }

  /**
   * Run buyer group discovery for Renesas
   * @param {string} companyIdentifier - LinkedIn URL, website, or company name for Renesas
   * @param {object} options - Additional options
   * @returns {Promise<object>} Discovery results
   */
  async run(companyIdentifier = 'renesas.com', options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 TRUTHKEEP.AI → RENESAS BUYER GROUP DISCOVERY');
    console.log('='.repeat(80));
    console.log('\n📋 CONTEXT:');
    console.log('   Seller: TruthKeep.ai (AI Intelligence Platform for Semiconductors)');
    console.log('   Buyer:  Renesas Electronics (Semiconductor Manufacturing)');
    console.log(`\n💰 Deal Size: $${this.config.dealSize.toLocaleString()} (range: $${this.config.dealSizeRange.min.toLocaleString()}-$${this.config.dealSizeRange.max.toLocaleString()})`);
    console.log(`🏷️  Product: ${this.config.productName}`);
    console.log(`📂 Category: ${this.config.productCategory}`);
    console.log(`👥 Target Buyer Group Size: ${this.config.buyerGroupSizing.min}-${this.config.buyerGroupSizing.max} (ideal: ${this.config.buyerGroupSizing.ideal})`);
    console.log(`🌍 Global: ${!this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('\n' + '='.repeat(80) + '\n');

    // Ensure workspace exists
    await this.ensureWorkspace();

    try {
      // Initialize pipeline with TruthKeep configuration
      const pipeline = new SmartBuyerGroupPipeline({
        prisma: this.prisma,
        workspaceId: this.workspaceId,
        mainSellerId: this.mainSellerId,
        dealSize: this.config.dealSize,
        productCategory: this.config.productCategory,
        productName: this.config.productName,
        customFiltering: this.config.customFiltering,
        usaOnly: this.config.usaOnly,
        buyerGroupSizing: this.config.buyerGroupSizing,
        rolePriorities: this.config.rolePriorities,
        skipDatabase: options.skipDatabase || false
      });

      // Find company in database or create company object
      let dbCompany = null;
      if (companyIdentifier.includes('linkedin.com')) {
        dbCompany = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            linkedinUrl: companyIdentifier
          }
        });
      } else if (companyIdentifier.includes('http') || companyIdentifier.includes('.')) {
        const domain = companyIdentifier.replace(/^https?:\/\//, '').replace(/\/$/, '');
        dbCompany = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            OR: [
              { website: { contains: domain } },
              { domain: domain }
            ]
          }
        });
      } else {
        dbCompany = await this.prisma.companies.findFirst({
          where: {
            workspaceId: this.workspaceId,
            name: { contains: companyIdentifier, mode: 'insensitive' }
          }
        });
      }

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
          mainSellerId: this.mainSellerId,
          originalIdentifier: companyIdentifier
        };
        console.log(`✅ Found existing company in database: ${dbCompany.name}`);
      } else {
        // Create company object from identifier
        company = {
          name: this.extractCompanyName(companyIdentifier),
          linkedinUrl: companyIdentifier.includes('linkedin.com') ? companyIdentifier : null,
          website: companyIdentifier.includes('http') && !companyIdentifier.includes('linkedin.com')
            ? companyIdentifier
            : (companyIdentifier.includes('.') ? `https://${companyIdentifier}` : null),
          mainSellerId: this.mainSellerId,
          originalIdentifier: companyIdentifier
        };
        console.log(`⚠️  Company not found in database, using identifier: ${companyIdentifier}`);
      }

      // Run the discovery pipeline
      console.log('\n🔍 Starting buyer group discovery pipeline...\n');
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      console.log('\n✅ Buyer Group Discovery Complete!');
      console.log(`👥 Found ${result.buyerGroup.length} buyer group members`);

      // Save results to JSON file
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const outputFile = path.join(outputDir, `truthkeep-renesas-buyer-group-${timestamp}.json`);

      const outputData = this.formatOutputData(result, company);
      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`\n💾 Results saved to: ${outputFile}`);

      return result;

    } catch (error) {
      console.error('❌ Buyer group discovery failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Format output data for JSON export
   */
  formatOutputData(result, company) {
    return {
      context: {
        seller: this.config.specialRequirements.companyContext.seller,
        buyer: this.config.specialRequirements.companyContext.buyer,
        discoveredAt: new Date().toISOString()
      },
      company: {
        name: result.intelligence?.companyName || company.name,
        website: result.intelligence?.website || company.website,
        linkedinUrl: result.intelligence?.linkedinUrl || company.linkedinUrl,
        industry: result.intelligence?.industry || 'Semiconductor Manufacturing',
        employeeCount: result.intelligence?.employeeCount || null,
        revenue: result.intelligence?.revenue || null
      },
      product: {
        name: this.config.productName,
        description: this.config.productDescription,
        category: this.config.productCategory,
        dealSize: this.config.dealSize,
        dealSizeRange: this.config.dealSizeRange
      },
      buyerGroup: {
        totalMembers: result.buyerGroup.length,
        members: result.buyerGroup.map(member => {
          let painPoints = [];
          if (member.painPoints && Array.isArray(member.painPoints)) {
            painPoints = member.painPoints;
          } else if (member.aiIntelligence?.painPoints && Array.isArray(member.aiIntelligence.painPoints)) {
            painPoints = member.aiIntelligence.painPoints;
          }

          return {
            name: member.name,
            title: member.title,
            department: member.department,
            role: member.buyerGroupRole || member.role,
            roleConfidence: member.roleConfidence || member.confidence || 0,
            roleReasoning: member.roleReasoning || null,
            email: member.email,
            phone: member.phone,
            linkedin: member.linkedinUrl,
            influenceScore: member.influenceScore || member.scores?.influence || 0,
            painPoints: painPoints,
            personalizedStrategy: member.personalizedStrategy || null
          };
        }),
        cohesionScore: result.cohesion?.score || null,
        coverage: result.coverage || null
      },
      report: result.report || null,
      costs: result.costs || null,
      metadata: {
        generatedAt: new Date().toISOString(),
        pipelineVersion: '1.0',
        workspaceId: this.workspaceId
      }
    };
  }

  /**
   * Extract company name from identifier
   */
  extractCompanyName(identifier) {
    if (identifier.includes('linkedin.com/company/') || identifier.includes('linkedin.com/school/')) {
      const match = identifier.match(/linkedin\.com\/(?:company|school)\/([^\/\?]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    if (identifier.includes('.')) {
      const domain = identifier.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    return identifier;
  }
}

// CLI Interface
async function main() {
  console.log('\n🚀 TruthKeep.ai → Renesas Buyer Group Discovery\n');

  const args = process.argv.slice(2);
  const companyIdentifier = args[0] || 'renesas.com';
  const options = {
    skipDatabase: args.includes('--skip-database')
  };

  const runner = new TruthKeepRenesasRunner({
    workspaceId: process.env.TRUTHKEEP_WORKSPACE_ID || null,
    mainSellerId: process.env.TRUTHKEEP_SELLER_ID || null
  });

  try {
    const result = await runner.run(companyIdentifier, options);

    if (result) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ DISCOVERY COMPLETED SUCCESSFULLY');
      console.log('='.repeat(80));
      console.log(`\n👥 Buyer Group: ${result.buyerGroup.length} members`);
      console.log(`💰 Cost: $${(result.costs?.total || 0).toFixed(2)}`);
      console.log('\n📁 Output files saved to: scripts/_future_now/find-buyer-group/output/');

      await disconnectPrismaClient();
      process.exit(0);
    } else {
      console.log('\n⚠️  Discovery completed but no results generated.');
      await disconnectPrismaClient();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Discovery failed:', error.message);
    await disconnectPrismaClient();
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { TruthKeepRenesasRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
