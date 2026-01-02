#!/usr/bin/env node

/**
 * eCore Services → Cisco Buyer Group Discovery
 *
 * Runs buyer group discovery for eCore Services selling B2B Data Enrichment
 * to Cisco Systems.
 *
 * COMPANY CONTEXT:
 * ================
 * eCore Services (ecoreservice.com):
 * - B2B data enrichment and contact database provider
 * - 200M+ contacts, 80M+ verified emails, 70M+ mobile numbers
 * - Services: Data enrichment, CRM cleansing, real-time job change tracking
 * - 95%+ data accuracy with daily automated refresh
 * - Women-owned, SOC 2 certified
 * - Brand colors: Burgundy (#BB1985), Coral (#DD5E4D), Orange (#F79421)
 *
 * Cisco Systems (cisco.com):
 * - Global technology leader - networking, security, collaboration
 * - 86,000+ employees worldwide
 * - Key marketing leadership includes Carrie Palin (CMO), Rebecca Stone (SVP Revenue Marketing)
 * - Large marketing and sales operations teams
 *
 * TARGET BUYER GROUP:
 * - Marketing Technology / MarTech teams
 * - Revenue Marketing / Demand Generation
 * - Sales Operations / RevOps
 * - Data & Analytics teams
 * - CRM Administration
 */

// Load environment variables from project root
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Clean API keys
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

class ECoreCiscoRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;

    // Configuration for eCore Services selling B2B Data to Cisco
    this.config = {
      // Product/Deal Configuration
      dealSize: 250000, // $250K enterprise data platform deal
      dealSizeRange: { min: 150000, max: 400000 },
      productCategory: 'sales', // B2B data is a sales/marketing tool
      productName: 'B2B Data Enrichment Platform',
      productDescription: 'Enterprise contact database with 200M+ contacts, 95%+ accuracy, real-time job change tracking, and CRM data cleansing',

      // Department Filtering - Who would evaluate/use eCore's platform
      customFiltering: {
        departments: {
          primary: [
            // Marketing - Primary buyers
            'marketing',
            'marketing operations',
            'revenue marketing',
            'demand generation',
            'demand gen',
            'growth marketing',
            'digital marketing',
            'marketing technology',
            'martech',
            'campaign marketing',
            'field marketing',
            'partner marketing',

            // Sales Operations - Primary buyers
            'sales operations',
            'sales ops',
            'revenue operations',
            'revops',
            'sales enablement',
            'sales strategy',
            'go-to-market',
            'gtm',

            // Data & Analytics
            'data',
            'analytics',
            'business intelligence',
            'data operations',
            'data management',
            'customer insights',
            'market research'
          ],
          secondary: [
            // Sales Leadership
            'sales',
            'sales development',
            'sdr',
            'bdr',
            'inside sales',
            'enterprise sales',

            // IT & Technology
            'information technology',
            'it',
            'crm',
            'salesforce',
            'systems',
            'business applications',

            // Finance (for ROI/procurement)
            'finance',
            'procurement',
            'vendor management'
          ],
          exclude: [
            // Not relevant to B2B data platform
            'hr',
            'human resources',
            'facilities',
            'real estate',
            'manufacturing',
            'supply chain',
            'logistics',
            'legal', // Unless procurement legal
            'customer support',
            'engineering' // Unless data engineering
          ]
        },
        titles: {
          primary: [
            // C-Level
            'cmo',
            'chief marketing officer',
            'cro',
            'chief revenue officer',
            'chief data officer',
            'cdo',

            // SVP/VP Level - Marketing
            'svp marketing',
            'vp marketing',
            'vp revenue marketing',
            'vp demand generation',
            'vp marketing operations',
            'vp digital marketing',
            'vp growth',
            'senior vice president marketing',
            'vice president marketing',
            'head of marketing',
            'head of demand gen',

            // SVP/VP Level - Sales Ops
            'svp sales operations',
            'vp sales operations',
            'vp revenue operations',
            'vp sales enablement',
            'vp go-to-market',
            'vice president sales operations',
            'head of sales operations',
            'head of revops',

            // SVP/VP Level - Data
            'vp data',
            'vp analytics',
            'vp business intelligence',
            'head of data',
            'head of analytics',

            // Director Level - Marketing
            'director marketing operations',
            'director demand generation',
            'director revenue marketing',
            'director digital marketing',
            'director marketing technology',
            'director martech',
            'director campaign',
            'senior director marketing',

            // Director Level - Sales Ops
            'director sales operations',
            'director revenue operations',
            'director sales enablement',
            'director go-to-market',
            'senior director sales operations',

            // Director Level - Data
            'director data',
            'director analytics',
            'director business intelligence',
            'director customer insights'
          ],
          secondary: [
            // Manager Level
            'senior manager marketing',
            'senior manager sales operations',
            'manager marketing operations',
            'manager demand generation',
            'manager sales operations',
            'marketing technology manager',
            'crm manager',
            'salesforce administrator',
            'marketing automation',
            'data manager',

            // Individual Contributors
            'marketing operations lead',
            'demand gen lead',
            'sales ops lead',
            'data analyst'
          ]
        }
      },

      // Buyer Group Sizing - $250K deal
      buyerGroupSizing: {
        min: 12,
        max: 18,
        ideal: 15
      },

      // Role Priorities
      rolePriorities: {
        decision: 10,      // CMO, VP Marketing, VP Sales Ops
        champion: 9,       // Directors of Marketing Ops, Demand Gen
        stakeholder: 8,    // Managers, analysts who use the data
        blocker: 6,        // IT Security, Procurement
        introducer: 5
      },

      // Location Filter
      usaOnly: false, // Cisco is global

      // Special Requirements
      specialRequirements: {
        alwaysInclude: [
          'marketing operations',
          'demand generation',
          'sales operations',
          'data'
        ],
        industrySpecific: 'B2B Data Enrichment for Enterprise Technology',
        companyContext: {
          seller: {
            name: 'eCore Services',
            website: 'https://ecoreservice.com',
            product: 'B2B Data Enrichment Platform',
            valueProposition: '200M+ contacts, 95%+ accuracy, real-time job change tracking, SOC 2 certified',
            keyFeatures: [
              '200M+ B2B contacts',
              '80M+ verified emails',
              '70M+ mobile numbers',
              '95%+ data accuracy',
              'Real-time job change alerts',
              'CRM data cleansing',
              'Daily automated refresh'
            ],
            brandColors: {
              primary: '#BB1985',
              secondary: '#DD5E4D',
              accent: '#F79421'
            }
          },
          buyer: {
            name: 'Cisco Systems',
            website: 'https://www.cisco.com',
            industry: 'Technology / Networking',
            employeeCount: 86000,
            keyLeadership: [
              { name: 'Carrie Palin', title: 'SVP & Chief Marketing Officer' },
              { name: 'Rebecca Stone', title: 'SVP Global Revenue Marketing' },
              { name: 'Chad Reese', title: 'Digital Marketing Platforms & Activation' },
              { name: 'Rune Olslund', title: 'Experience Strategy and Digital Studio' }
            ]
          }
        }
      }
    };
  }

  /**
   * Find or create workspace
   */
  async ensureWorkspace() {
    if (this.workspaceId) {
      return this.workspaceId;
    }

    console.log('🔍 Finding or creating workspace...');

    try {
      let workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'eCore', mode: 'insensitive' } },
            { name: { contains: 'e-Core', mode: 'insensitive' } }
          ]
        }
      });

      if (workspace) {
        console.log(`✅ Found existing workspace: ${workspace.name}`);
        this.workspaceId = workspace.id;
        return workspace.id;
      }

      // Create new workspace
      console.log('📝 Creating new workspace for eCore Services...');
      workspace = await this.prisma.workspaces.create({
        data: {
          name: 'eCore Services',
          slug: `ecore-${Date.now()}`,
          updatedAt: new Date(),
        }
      });

      console.log(`✅ Created workspace: ${workspace.name} (${workspace.id})`);
      this.workspaceId = workspace.id;
      return workspace.id;
    } catch (error) {
      console.error('❌ Error with workspace:', error.message);
      this.workspaceId = `temp_ecore_${Date.now()}`;
      console.log(`⚠️ Using temporary workspace ID: ${this.workspaceId}`);
      return this.workspaceId;
    }
  }

  /**
   * Run buyer group discovery for Cisco
   */
  async run(companyIdentifier = 'cisco.com', options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 eCORE SERVICES → CISCO BUYER GROUP DISCOVERY');
    console.log('='.repeat(80));
    console.log('\n📋 CONTEXT:');
    console.log('   Seller: eCore Services (B2B Data Enrichment Platform)');
    console.log('   Buyer:  Cisco Systems (Technology / Networking)');
    console.log(`\n💰 Deal Size: $${this.config.dealSize.toLocaleString()}`);
    console.log(`🏷️  Product: ${this.config.productName}`);
    console.log(`📂 Category: ${this.config.productCategory}`);
    console.log(`👥 Target Buyer Group Size: ${this.config.buyerGroupSizing.min}-${this.config.buyerGroupSizing.max}`);
    console.log(`🌍 Global: ${!this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('\n' + '='.repeat(80) + '\n');

    await this.ensureWorkspace();

    try {
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
        skipDatabase: options.skipDatabase || false,
        // Enable intelligent multi-query to get more than 100 results
        enableIntelligentSearch: true,
        maxPages: 10 // Search up to 10 pages (200 results)
      });

      // Prepare company object for Cisco
      const company = {
        name: 'Cisco Systems',
        linkedinUrl: 'https://www.linkedin.com/company/cisco',
        website: 'https://www.cisco.com',
        industry: 'Technology / Networking',
        employeeCount: 86000,
        mainSellerId: this.mainSellerId,
        originalIdentifier: companyIdentifier
      };

      console.log('\n🔍 Starting buyer group discovery pipeline...\n');
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      console.log('\n✅ Buyer Group Discovery Complete!');
      console.log(`👥 Found ${result.buyerGroup.length} buyer group members`);

      // Save results
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const outputFile = path.join(outputDir, `ecore-cisco-buyer-group-${timestamp}.json`);

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
        industry: result.intelligence?.industry || 'Technology',
        employeeCount: result.intelligence?.employeeCount || 86000
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
            painPoints: painPoints
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
    if (identifier.includes('linkedin.com/company/')) {
      const match = identifier.match(/linkedin\.com\/company\/([^\/\?]+)/);
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
  console.log('\n🚀 eCore Services → Cisco Buyer Group Discovery\n');

  const args = process.argv.slice(2);
  const companyIdentifier = args[0] || 'https://www.linkedin.com/company/cisco';
  const options = {
    skipDatabase: args.includes('--skip-database')
  };

  const runner = new ECoreCiscoRunner({
    workspaceId: process.env.ECORE_WORKSPACE_ID || null,
    mainSellerId: process.env.ECORE_SELLER_ID || null
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
module.exports = { ECoreCiscoRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
