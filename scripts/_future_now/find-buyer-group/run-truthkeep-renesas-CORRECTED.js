#!/usr/bin/env node

/**
 * TruthKeep.ai → Renesas Buyer Group Discovery (CORRECTED)
 *
 * CORRECTIONS APPLIED:
 * ====================
 * 1. ✅ Fixed deal size: $450K → $40K/year (11x correction)
 * 2. ✅ Fixed buyer group sizing: 10-16 → 3-5 members
 * 3. ✅ Semiconductor-specific keywords (not generic SaaS terms)
 * 4. ✅ Manager-level targeting (not VP/Director)
 * 5. ✅ Focused on ONE product line (MCU division)
 *
 * RESEARCH INSIGHTS:
 * ==================
 * Success Pattern from Cardinal Gray → USAA:
 * - Used industry-specific keywords ('auto lending', 'lien management')
 * - Keywords matched USAA's actual department structure
 * - Result: 15 members, Grade B, 61% cohesion
 *
 * Success Pattern from HRAcuity → Google:
 * - Used HR-specific keywords ('employee relations', 'people operations')
 * - Keywords matched Google's terminology
 * - Result: 14 members, 64% cohesion
 *
 * Applying same pattern to TruthKeep → Renesas:
 * - Use semiconductor-specific keywords ('product line manager', 'application engineer', 'fae')
 * - Match Renesas's actual job titles and department structure
 * - Expected: 3-5 members, Grade B+, 55%+ cohesion
 *
 * COMPANY CONTEXT:
 * ================
 * TruthKeep.ai (truthkeep.ai):
 * - AI intelligence platform for semiconductor industry
 * - Unifies scattered signals across forums, CRM systems, and support data
 * - Provides real-time intelligence for faster decision-making
 * - **ACTUAL PRICING: $40K/year** (mid-market SaaS, not enterprise)
 *
 * Renesas Electronics Corporation (renesas.com):
 * - Major global semiconductor manufacturer
 * - Products: MCUs, analog components, power management, SoCs
 * - Focus areas: IoT, Industrial automation, robotics, HMI
 * - Target: MCU Product Management team
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

class TruthKeepRenesasCorrectedRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;

    // CORRECTED Configuration for TruthKeep.ai selling AI intelligence to Renesas
    this.config = {
      // Product/Deal Configuration - CORRECTED
      dealSize: 40000, // $40K/year (was $450K - 11x correction!)
      dealSizeRange: { min: 30000, max: 50000 },
      productCategory: 'custom',
      productName: 'AI Intelligence Platform for Semiconductors',
      productDescription: 'Unifies scattered signals across forums, CRM systems, and support data to provide real-time intelligence',

      // Department Filtering - SEMICONDUCTOR-SPECIFIC KEYWORDS
      // Pattern: Mirror Cardinal Gray's success with industry-specific terminology
      customFiltering: {
        departments: {
          primary: [
            // Product Management - SEMICONDUCTOR-SPECIFIC
            // (Not generic 'product management', but how Renesas actually titles these roles)
            'product line manager',
            'product line management',
            'product marketing manager',
            'technical product manager',
            'segment manager',
            'product planning',
            'product strategy manager',

            // Application Engineering - SEMICONDUCTOR CUSTOMER SUPPORT
            // (Not generic 'customer support', but semiconductor-specific FAE roles)
            'application engineer',
            'field application engineer',
            'fae',
            'technical application engineer',
            'customer application engineer',
            'application engineering manager',
            'field applications manager',

            // Quality - SEMICONDUCTOR-SPECIFIC
            // (Not generic 'quality', but semiconductor quality/reliability engineering)
            'quality engineer',
            'reliability engineer',
            'test engineer',
            'validation engineer',
            'quality assurance engineer',
            'quality manager'
          ],
          secondary: [
            // IT & Technology - Platform integration
            'information technology',
            'it manager',
            'technology manager',
            'systems manager',
            'it security',
            'information security',

            // Data & Analytics - Will use the platform
            'data analytics',
            'business intelligence',
            'analytics manager',
            'data manager'
          ],
          exclude: [
            // Explicitly exclude sales (this is what went wrong in original run)
            'sales',
            'account manager',
            'business development',
            'sales director',
            'sales manager',
            'account executive',

            // Not relevant to AI intelligence platform
            'hr',
            'human resources',
            'facilities',
            'real estate',
            'physical security',
            'legal',
            'marketing' // Unless specifically product marketing
          ]
        },
        titles: {
          primary: [
            // Manager Level - ECONOMIC BUYERS FOR $40K DEALS
            // (Not VPs/Directors - they're for $450K+ deals)
            'senior product manager',
            'product manager',
            'senior manager',
            'engineering manager',
            'manager',
            'product line manager',
            'product marketing manager',
            'technical product manager',

            // Senior IC roles - can influence $40K decisions
            'principal engineer',
            'staff engineer',
            'senior engineer',
            'lead engineer',
            'senior application engineer',
            'principal application engineer',

            // Senior Manager - can still be economic buyer for $40K
            'senior manager product',
            'senior manager engineering',
            'senior manager quality'
          ],
          secondary: [
            // Director Level - INFLUENCERS ONLY (not decision makers for $40K)
            'director product',
            'director engineering',
            'director quality',
            'director application engineering',
            'senior director product',
            'senior director engineering',

            // Mid-level roles - champions/stakeholders
            'manager product',
            'manager engineering',
            'manager quality',
            'manager application engineering'
          ]
        },

        // Additional Filters
        keywords: {
          include: [
            // MCU Product Line - Focus on ONE product line
            'mcu',
            'microcontroller',
            'embedded',
            'iot',
            'industrial'
          ],
          exclude: [
            // Exclude non-technical or sales-focused roles
            'intern',
            'student',
            'coop',
            'co-op',
            'sales',
            'account',
            'business development'
          ]
        }
      },

      // Buyer Group Sizing - CORRECTED FOR $40K DEAL
      // Pattern: $40K = 3-5 stakeholders, not 10-16
      buyerGroupSizing: {
        min: 3,    // Economic buyer + Champion + Technical reviewer
        max: 5,    // Add influencer + additional champion
        ideal: 4   // Sweet spot for $40K mid-market SaaS deal
      },

      // Role Priorities - adjusted for mid-market deal
      rolePriorities: {
        champion: 10,      // Critical - manager who sees the pain daily
        decision: 9,       // Very important - but at Manager level, not VP
        stakeholder: 8,    // Important - will use the platform
        blocker: 6,        // Important - IT security
        introducer: 5      // Nice to have
      },

      // Location Filter
      usaOnly: false, // Renesas is global (Japan HQ, worldwide operations)

      // Special Requirements
      specialRequirements: {
        alwaysInclude: [
          'product line manager',
          'application engineer',
          'quality engineer'
        ],
        focusProductLine: 'MCU',
        industrySpecific: 'Semiconductor Manufacturing - AI Intelligence Platform ($40K/year)',
        companyContext: {
          seller: {
            name: 'TruthKeep.ai',
            website: 'https://truthkeep.ai',
            product: 'AI Intelligence Platform for Semiconductors',
            pricing: '$40K/year',
            valueProposition: 'Unifies scattered signals across forums, CRM, and support data for real-time intelligence'
          },
          buyer: {
            name: 'Renesas Electronics Corporation',
            website: 'https://www.renesas.com',
            industry: 'Semiconductor Manufacturing',
            products: 'MCUs, Analog Components, Power Management, SoCs',
            focusAreas: ['IoT', 'Industrial Automation', 'Robotics', 'HMI'],
            targetDivision: 'MCU Product Line'
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
      this.workspaceId = `temp_truthkeep_corrected_${Date.now()}`;
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
    console.log('🎯 TRUTHKEEP.AI → RENESAS BUYER GROUP DISCOVERY (CORRECTED)');
    console.log('='.repeat(80));
    console.log('\n📋 CORRECTIONS APPLIED:');
    console.log('   ✅ Deal size: $450K → $40K/year (11x correction)');
    console.log('   ✅ Buyer group sizing: 10-16 → 3-5 members');
    console.log('   ✅ Keywords: Generic → Semiconductor-specific');
    console.log('   ✅ Seniority: VP/Director → Manager-level');
    console.log('   ✅ Focus: Multi-department → MCU Product Line');
    console.log('\n📋 CONTEXT:');
    console.log('   Seller: TruthKeep.ai (AI Intelligence Platform)');
    console.log('   Buyer:  Renesas Electronics (Semiconductor - MCU Division)');
    console.log(`\n💰 Deal Size: $${this.config.dealSize.toLocaleString()}/year (range: $${this.config.dealSizeRange.min.toLocaleString()}-$${this.config.dealSizeRange.max.toLocaleString()})`);
    console.log(`🏷️  Product: ${this.config.productName}`);
    console.log(`📂 Category: ${this.config.productCategory}`);
    console.log(`👥 Target Buyer Group Size: ${this.config.buyerGroupSizing.min}-${this.config.buyerGroupSizing.max} (ideal: ${this.config.buyerGroupSizing.ideal})`);
    console.log(`🎯 Target Division: MCU Product Line`);
    console.log(`🌍 Global: ${!this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('\n' + '='.repeat(80) + '\n');

    // Ensure workspace exists
    await this.ensureWorkspace();

    try {
      // Initialize pipeline with CORRECTED TruthKeep configuration
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
      console.log('\n🔍 Starting CORRECTED buyer group discovery pipeline...\n');
      const result = await pipeline.run(company);

      if (!result || !result.buyerGroup) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      console.log('\n✅ Buyer Group Discovery Complete!');
      console.log(`👥 Found ${result.buyerGroup.length} buyer group members`);

      // Validate results against success criteria
      console.log('\n📊 VALIDATION AGAINST SUCCESS CRITERIA:');
      const validation = this.validateResults(result);
      validation.forEach(check => {
        console.log(`   ${check.passed ? '✅' : '❌'} ${check.message}`);
      });

      // Save results to JSON file
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const outputFile = path.join(outputDir, `truthkeep-renesas-buyer-group-CORRECTED-${timestamp}.json`);

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
   * Validate results against success criteria from plan
   */
  validateResults(result) {
    const checks = [];
    const buyerGroup = result.buyerGroup || [];

    // Check 1: 3-5 members total
    const memberCount = buyerGroup.length;
    checks.push({
      passed: memberCount >= 3 && memberCount <= 5,
      message: `Buyer group has ${memberCount} members (target: 3-5)`
    });

    // Check 2: 70%+ from primary configured departments
    const primaryDepts = ['product', 'application', 'quality', 'engineer'];
    const primaryCount = buyerGroup.filter(m => {
      const dept = (m.department || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      return primaryDepts.some(d => dept.includes(d) || title.includes(d));
    }).length;
    const primaryPercent = memberCount > 0 ? Math.round((primaryCount / memberCount) * 100) : 0;
    checks.push({
      passed: primaryPercent >= 70,
      message: `${primaryPercent}% from primary departments (target: 70%+)`
    });

    // Check 3: Manager or Senior Manager level (not VP/C-Suite)
    const wrongSeniority = buyerGroup.filter(m => {
      const title = (m.title || '').toLowerCase();
      return title.includes('vp') || title.includes('vice president') ||
             title.includes('ceo') || title.includes('cto') || title.includes('cio');
    });
    checks.push({
      passed: wrongSeniority.length === 0,
      message: `No VP/C-Suite (found ${wrongSeniority.length}, target: 0)`
    });

    // Check 4: Quality Grade B or higher
    const qualityGrade = result.report?.qualityGrade || result.qualityGrade || 'Unknown';
    checks.push({
      passed: ['A', 'B'].includes(qualityGrade),
      message: `Quality Grade: ${qualityGrade} (target: B or higher)`
    });

    // Check 5: Cohesion Score 55% or higher
    const cohesionScore = result.cohesion?.score || 0;
    checks.push({
      passed: cohesionScore >= 55,
      message: `Cohesion Score: ${cohesionScore}% (target: 55%+)`
    });

    // Check 6: NO Sales people
    const salesPeople = buyerGroup.filter(m => {
      const dept = (m.department || '').toLowerCase();
      const title = (m.title || '').toLowerCase();
      return dept.includes('sales') || title.includes('sales') ||
             title.includes('account') || title.includes('business development');
    });
    checks.push({
      passed: salesPeople.length === 0,
      message: `No Sales people (found ${salesPeople.length}, target: 0)`
    });

    return checks;
  }

  /**
   * Format output data for JSON export
   */
  formatOutputData(result, company) {
    return {
      context: {
        corrected: true,
        corrections: {
          dealSize: { old: '$450K', new: '$40K/year', factor: '11x' },
          buyerGroupSizing: { old: '10-16', new: '3-5' },
          keywords: { old: 'Generic SaaS', new: 'Semiconductor-specific' },
          seniority: { old: 'VP/Director', new: 'Manager-level' },
          focus: { old: 'Multi-department', new: 'MCU Product Line' }
        },
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
            painPoints: painPoints,
            personalizedStrategy: member.personalizedStrategy || null
          };
        }),
        cohesionScore: result.cohesion?.score || null,
        coverage: result.coverage || null,
        qualityGrade: result.report?.qualityGrade || result.qualityGrade || null
      },
      validation: this.validateResults(result),
      report: result.report || null,
      costs: result.costs || null,
      metadata: {
        generatedAt: new Date().toISOString(),
        pipelineVersion: '1.0-corrected',
        workspaceId: this.workspaceId,
        configVersion: 'corrected-2025-12-17'
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
  console.log('\n🚀 TruthKeep.ai → Renesas Buyer Group Discovery (CORRECTED)\n');

  const args = process.argv.slice(2);
  const companyIdentifier = args[0] || 'renesas.com';
  const options = {
    skipDatabase: args.includes('--skip-database')
  };

  const runner = new TruthKeepRenesasCorrectedRunner({
    workspaceId: process.env.TRUTHKEEP_WORKSPACE_ID || null,
    mainSellerId: process.env.TRUTHKEEP_SELLER_ID || null
  });

  try {
    const result = await runner.run(companyIdentifier, options);

    if (result) {
      console.log('\n' + '='.repeat(80));
      console.log('✅ CORRECTED DISCOVERY COMPLETED SUCCESSFULLY');
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
module.exports = { TruthKeepRenesasCorrectedRunner };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
