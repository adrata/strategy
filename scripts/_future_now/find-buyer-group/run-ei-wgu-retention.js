#!/usr/bin/env node

/**
 * E&I Cooperative Services - WGU Retention Product Buyer Group Discovery
 * 
 * Runs buyer group discovery for E&I targeting WGU with a retention-focused product
 * - Product: Student Retention Solution
 * - Deal Size: $500K-$1.4M (using $950K average)
 * - Target: Western Governors University (wgu.edu)
 * - Focus: Student retention, enrollment management, student success
 */

// Load .env.local first (from Vercel), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // .env as fallback
const { getPrismaClient, disconnectPrismaClient } = require('../../lib/prisma-client');
const { SmartBuyerGroupPipeline } = require('./index');
const { findEIWorkspace } = require('./find-ei-workspace');
const fs = require('fs');
const path = require('path');

class EIBuyerGroupRunner {
  constructor(options = {}) {
    // Use shared Prisma client to prevent connection pool exhaustion
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;
    
    // Configuration for WGU retention product
    this.config = {
      dealSize: 950000, // Midpoint of $500K-$1.4M range
      dealSizeRange: { min: 500000, max: 1400000 },
      productCategory: 'custom',
      productName: 'Student Retention Solution',
      customFiltering: {
        departments: {
          primary: [
            'student services',
            'student affairs',
            'academic affairs',
            'enrollment management',
            'enrollment',
            'retention',
            'student success',
            'student engagement',
            'financial aid', // Financial barriers are #1 dropout reason
            'counseling services', // Mental health critical for retention
            'registrar' // Administrative efficiency impacts retention
          ],
          secondary: [
            'institutional research',
            'analytics',
            'data',
            'research',
            'strategy',
            'planning',
            'operations',
            'student support',
            'assessment', // Evaluates retention initiatives
            'completion' // Related to retention outcomes
          ],
          exclude: [
            'facilities',
            'maintenance',
            'custodial',
            'security',
            'dining',
            'housing', // Unless retention-focused
            'av operations', // AV/technical operations (not academic operations)
            'audio visual',
            'it operations' // IT operations (not academic operations)
          ]
        },
        titles: {
          primary: [
            // VP/Executive Level
            'vp student',
            'vice president student',
            'vp academic',
            'vice president academic',
            'vp enrollment',
            'vice president enrollment',
            'chief student officer',
            'cso',
            'chief retention officer',
            'cro',
            'senior vice president',
            'svp',
            // Provost Level (Education-specific)
            'provost',
            'vice provost',
            'vice provost student success',
            'assistant provost',
            'associate provost',
            // Dean Level
            'executive dean',
            'dean of student success',
            'dean of student services',
            'dean of academic affairs',
            // Director Level - Retention Focused
            'director retention',
            'director student success',
            'director enrollment',
            'director enrollment management',
            'director student services',
            'director student affairs',
            'director academic advising',
            'director first-year experience',
            'director academic support services',
            'director student engagement',
            'director financial aid',
            'director counseling',
            'director counseling services',
            'head of retention',
            'head of student success',
            // Registrar and Assessment
            'registrar',
            'assessment coordinator',
            // Academic Operations
            'academic operations',
            'academic affairs'
          ],
          secondary: [
            // Director Level - Support Functions
            'director analytics',
            'director institutional research',
            'director academic services',
            'director student support',
            // Manager Level
            'manager retention',
            'manager student success',
            'manager academic advising',
            'manager student engagement',
            // Senior Director Level
            'senior director',
            'senior director student success',
            'senior director retention',
            // Associate VP Level
            'associate vice president',
            'avp student',
            'avp academic',
            // Dean Level - Associate
            'dean',
            'associate dean',
            'assistant dean',
            // Specialist Level
            'retention specialist',
            'student success specialist',
            // Assistant Director Level
            'assistant director retention',
            'assistant director student success',
            // Other Relevant Roles
            'student progress',
            'program development',
            'coordinator retention',
            'coordinator student success',
            'coordinator assessment'
          ],
          exclude: []
        }
      },
      buyerGroupSizing: {
        min: 8,  // Larger deal = larger buyer group
        max: 15,
        ideal: 12
      },
      rolePriorities: {
        decision: 10,      // Critical - need decision makers
        champion: 9,       // Very important - internal champions
        stakeholder: 8,    // Important - stakeholders across departments
        blocker: 7,        // Important - procurement/legal/finance
        introducer: 5      // Nice to have - introducers
      },
      usaOnly: true // WGU is US-based
    };
  }

  /**
   * Find or create E&I workspace using find-ei-workspace.js
   * @returns {Promise<string>} Workspace ID
   */
  async ensureWorkspace() {
    if (this.workspaceId) {
      return this.workspaceId;
    }

    console.log('🔍 Finding or creating E&I workspace...');
    try {
      // Use the findEIWorkspace function with our Prisma client instance
      // This ensures it doesn't disconnect our Prisma connection
      const workspaceId = await findEIWorkspace(this.prisma);
      this.workspaceId = workspaceId;
      return workspaceId;
    } catch (error) {
      console.error('❌ Error finding/creating workspace:', error.message);
      throw error;
    }
  }

  /**
   * Run buyer group discovery for WGU
   * @param {string} companyIdentifier - LinkedIn URL, website, or company name
   * @param {object} options - Additional options
   * @returns {Promise<object>} Discovery results
   */
  async run(companyIdentifier = 'wgu.edu', options = {}) {
    console.log('🚀 E&I Cooperative Services - WGU Retention Buyer Group Discovery');
    console.log('='.repeat(70));
    console.log(`📊 Target Company: ${companyIdentifier}`);
    console.log(`💰 Deal Size: $${this.config.dealSize.toLocaleString()} (range: $${this.config.dealSizeRange.min.toLocaleString()}-$${this.config.dealSizeRange.max.toLocaleString()})`);
    console.log(`🏷️  Product: ${this.config.productName}`);
    console.log(`📂 Category: ${this.config.productCategory}`);
    console.log(`🇺🇸 USA Only: ${this.config.usaOnly ? 'Yes' : 'No'}`);
    console.log('='.repeat(70));

    // Ensure workspace exists
    await this.ensureWorkspace();

    try {
      // Initialize pipeline - pass shared Prisma client to avoid connection issues
      const pipeline = new SmartBuyerGroupPipeline({
        prisma: this.prisma, // Share Prisma client to prevent connection race conditions
        workspaceId: this.workspaceId,
        mainSellerId: this.mainSellerId,
        dealSize: this.config.dealSize,
        productCategory: this.config.productCategory,
        productName: this.config.productName,
        customFiltering: this.config.customFiltering,
        usaOnly: this.config.usaOnly,
        buyerGroupSizing: this.config.buyerGroupSizing,
        rolePriorities: this.config.rolePriorities
      });

      // Find or create company in database
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
      // IMPORTANT: Preserve original identifier so Coresignal can use it for lookup
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
          // Preserve original identifier for Coresignal lookup
          originalIdentifier: companyIdentifier
        };
        console.log(`✅ Found existing company in database: ${dbCompany.name}`);
        console.log(`   ℹ️  Using original identifier (${companyIdentifier}) for Coresignal lookup`);
      } else {
        // Fallback: Create company object from identifier
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
      // Go up 3 levels from scripts/_future_now/find-buyer-group to project root
      const outputDir = path.join(__dirname, '../../..', 'src/app/(workshop)/private/ei/data');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = path.join(outputDir, 'wgu-buyer-group-retention.json');
      const outputData = {
        company: {
          name: result.intelligence?.companyName || company.name,
          website: result.intelligence?.website || company.website,
          linkedinUrl: result.intelligence?.linkedinUrl || company.linkedinUrl,
          industry: result.intelligence?.industry || 'Education',
          employeeCount: result.intelligence?.employeeCount || null,
          revenue: result.intelligence?.revenue || null
        },
        product: {
          name: this.config.productName,
          category: this.config.productCategory,
          dealSize: this.config.dealSize,
          dealSizeRange: this.config.dealSizeRange
        },
        buyerGroup: {
          totalMembers: result.buyerGroup.length,
          members: result.buyerGroup.map(member => {
            // Extract pain points from various possible locations
            let painPoints = [];
            if (member.painPoints && Array.isArray(member.painPoints)) {
              painPoints = member.painPoints;
            } else if (member.aiIntelligence?.painPoints && Array.isArray(member.aiIntelligence.painPoints)) {
              painPoints = member.aiIntelligence.painPoints;
            } else if (member.enrichedData?.painPoints && Array.isArray(member.enrichedData.painPoints)) {
              painPoints = member.enrichedData.painPoints;
            }
            
            return {
              name: member.name,
              title: member.title,
              department: member.department,
              role: member.buyerGroupRole || member.role,
              email: member.email,
              phone: member.phone,
              linkedin: member.linkedinUrl,
              influenceScore: member.influenceScore || member.scores?.influence || 0,
              confidence: member.confidence || 0,
              painPoints: painPoints,
              personalizedStrategy: member.personalizedStrategy || null,
              archetype: member.archetype || null
            };
          }),
          cohesionScore: result.cohesionScore || null,
          overallConfidence: result.overallConfidence || null
        },
        report: result.report || null,
        metadata: {
          generatedAt: new Date().toISOString(),
          pipelineVersion: '1.0',
          workspaceId: this.workspaceId
        }
      };

      fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
      console.log(`\n💾 Results saved to: ${outputFile}`);

      return result;

    } catch (error) {
      console.error('❌ Buyer group discovery failed:', error.message);
      console.error(error.stack);
      
      // Check for connection-related errors
      if (error.message && (
        error.message.includes('connection') || 
        error.message.includes('disconnect') ||
        error.message.includes('Prisma') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('P1001')
      )) {
        console.error('\n🔌 Connection error detected. This may be due to:');
        console.error('   - Database connection pool exhaustion');
        console.error('   - Premature disconnection');
        console.error('   - Network issues');
        console.error('\n💡 Try running the script again after a few seconds.');
      }
      
      throw error;
    }
    // Note: We don't disconnect the shared Prisma client here
    // It will be disconnected at script exit by the shared client's shutdown handlers
  }

  /**
   * Extract company name from identifier
   */
  extractCompanyName(identifier) {
    // Support both /company/ and /school/ LinkedIn URLs
    if (identifier.includes('linkedin.com/company/') || identifier.includes('linkedin.com/school/')) {
      const match = identifier.match(/linkedin\.com\/(?:company|school)\/([^\/\?]+)/);
      if (match) {
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    if (identifier.includes('.')) {
      return identifier.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0];
    }
    return identifier;
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new EIBuyerGroupRunner({
    workspaceId: process.env.EI_WORKSPACE_ID || null, // Will be auto-created if not provided
    mainSellerId: process.env.EI_MAIN_SELLER_ID || null
  });

  const companyIdentifier = process.argv[2] || 'wgu.edu';
  
  runner.run(companyIdentifier)
    .then(async result => {
      if (result) {
        console.log('\n✅ Discovery completed successfully!');
        // Disconnect shared client at script end
        await disconnectPrismaClient();
        process.exit(0);
      } else {
        console.log('\n⚠️  Discovery completed but no results generated.');
        await disconnectPrismaClient();
        process.exit(1);
      }
    })
    .catch(async error => {
      console.error('\n❌ Discovery failed:', error);
      await disconnectPrismaClient();
      process.exit(1);
    });
}

module.exports = { EIBuyerGroupRunner };

