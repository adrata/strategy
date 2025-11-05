#!/usr/bin/env node

/**
 * Smart Buyer Group Discovery Pipeline
 * 
 * Production-ready buyer group discovery using company size-based role distribution
 * Organized into clean modules for maintainability and scalability
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Import the main pipeline orchestrator
const { SmartBuyerGroupPipeline } = require('./index');
const { BuyerGroupInterview } = require('./interview-config');
const { AIConfigGenerator } = require('./ai-config-generator');
const { ConfigStorage } = require('./config-storage');

class ProductionBuyerGroupPipeline {
  constructor(options = {}) {
    this.prisma = options.prisma || new PrismaClient();
    this.options = options;
    this.dealSize = options.dealSize || 100000;
    this.targetCompany = options.linkedinUrl;
    this.maxPages = options.maxPages || 5;
    this.startTime = Date.now();
    this.configStorage = new ConfigStorage();
    this.personalizedConfig = null;
  }

  async run() {
    console.log('🚀 Production Buyer Group Discovery Pipeline');
    console.log(`📊 Target: ${this.targetCompany}`);
    console.log('─'.repeat(60));
    
    try {
      // Load or create personalized configuration
      let config = null;
      if (!this.options.skipInterview) {
        config = await this.loadOrCreateConfig();
      } else if (this.options.workspaceId) {
        // Try to load saved config even with skip-interview flag
        config = await this.configStorage.loadConfigFromDatabase(
          this.options.workspaceId,
          this.prisma
        );
      }

      // Merge config with existing options
      const pipelineOptions = {
        ...this.options,
        linkedinUrl: this.targetCompany,
        maxPages: this.maxPages,
        prisma: this.prisma
      };

      // Apply personalized configuration if available
      if (config) {
        this.personalizedConfig = config;
        pipelineOptions.dealSize = config.dealSizeRange || this.dealSize;
        pipelineOptions.productCategory = config.productCategory || 'sales';
        pipelineOptions.productName = config.productName;
        pipelineOptions.customFiltering = {
          departments: {
            primary: config.departmentFiltering?.primaryDepartments || [],
            secondary: config.departmentFiltering?.secondaryDepartments || [],
            exclude: config.departmentFiltering?.excludedDepartments || []
          },
          titles: {
            primary: config.titleFiltering?.primaryTitles || [],
            secondary: config.titleFiltering?.secondaryTitles || []
          }
        };
        pipelineOptions.buyerGroupSize = config.buyerGroupSizing;
        pipelineOptions.rolePriorities = config.rolePriorities;
        pipelineOptions.usaOnly = config.usaOnly || false; // Add USA-only filter from config
        
        console.log(`💰 Deal Size: $${pipelineOptions.dealSize.toLocaleString()}`);
        console.log(`🏷️  Product: ${pipelineOptions.productName || 'N/A'}`);
        console.log(`📊 Category: ${pipelineOptions.productCategory}`);
        if (pipelineOptions.usaOnly) {
          console.log(`🇺🇸 Location Filter: USA-only enabled`);
        }
      } else {
        console.log(`💰 Deal Size: $${this.dealSize.toLocaleString()}`);
        console.log(`📄 Max Pages: ${this.maxPages}`);
        // Allow usaOnly from command line even without config
        if (this.options.usaOnly) {
          pipelineOptions.usaOnly = true;
          console.log(`🇺🇸 Location Filter: USA-only enabled`);
        }
      }
      
      // Initialize the smart pipeline with personalized config
      const pipeline = new SmartBuyerGroupPipeline(pipelineOptions);

      // Execute the 8-stage pipeline
      // Create company object from target company identifier
      const company = {
        name: this.extractCompanyName(this.targetCompany),
        linkedinUrl: this.targetCompany.includes('linkedin.com') ? this.targetCompany : null,
        website: this.targetCompany.includes('http') && !this.targetCompany.includes('linkedin.com') ? this.targetCompany : null
      };
      const result = await pipeline.run(company);
      
      if (!result) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      // Display results
      this.displayResults(result);
      
      // Save to database
      await this.saveToDatabase(result);
      
      console.log('✅ Pipeline completed successfully!');
      return result;
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  /**
   * Run personalization interview and generate config
   * @returns {Promise<object>} Generated configuration
   */
  async runPersonalization() {
    const interview = new BuyerGroupInterview();
    const responses = await interview.run();

    const generator = new AIConfigGenerator();
    const config = await generator.generateConfig(responses);

    // Save to database if workspace ID provided
    if (this.options.workspaceId && !this.options.exportJson) {
      await this.configStorage.saveConfigToDatabase(
        this.options.workspaceId,
        config,
        this.prisma
      );
    }

    // Export to JSON if requested (for TOP)
    if (this.options.exportJson) {
      const outputPath = this.options.jsonOutput || null;
      await this.configStorage.exportConfigToJSON(
        this.options.workspaceId,
        config,
        outputPath
      );
    }

    return config;
  }

  /**
   * Load saved config or create new one via interview
   * @returns {Promise<object|null>} Configuration or null
   */
  async loadOrCreateConfig() {
    if (!this.options.workspaceId) {
      // No workspace ID, just run interview and return config
      return await this.runPersonalization();
    }

    // Check for saved config
    const hasConfig = await this.configStorage.hasSavedConfig(
      this.options.workspaceId,
      this.prisma
    );

    if (hasConfig) {
      const savedConfig = await this.configStorage.loadConfigFromDatabase(
        this.options.workspaceId,
        this.prisma
      );

      if (savedConfig) {
        console.log('✅ Using saved buyer group configuration\n');
        return savedConfig;
      }
    }

    // No saved config, run interview
    console.log('📋 No saved configuration found. Starting personalization interview...\n');
    return await this.runPersonalization();
  }

  displayResults(result) {
    console.log('\n📊 Pipeline Results:');
    console.log('─'.repeat(40));
    
    if (result.companyIntelligence) {
      console.log(`🏢 Company: ${result.companyIntelligence.name || 'Unknown'}`);
      console.log(`👥 Employees: ${result.companyIntelligence.employees || 'Unknown'}`);
      console.log(`💰 Revenue: $${(result.companyIntelligence.revenue || 0).toLocaleString()}`);
      console.log(`🏷️  Tier: ${result.companyIntelligence.tier || 'Unknown'}`);
    }
    
    console.log(`📋 Total Employees Found: ${result.previewEmployees?.length || 0}`);
    console.log(`🎯 Buyer Group Size: ${result.buyerGroup?.length || 0}`);
    console.log(`💵 Total Cost: $${(result.costs?.total || 0).toFixed(2)}`);
    
    if (result.buyerGroup && result.buyerGroup.length > 0) {
      console.log('\n🎯 Buyer Group Members:');
      console.log('─'.repeat(40));
      
      const roleEmojis = {
        decision: '🏛️',
        champion: '🚀', 
        stakeholder: '📊',
        blocker: '🚫',
        introducer: '🤝'
      };
      
      result.buyerGroup.forEach((member, index) => {
        const roleEmoji = roleEmojis[member.buyerGroupRole] || '👤';
        const confidence = member.roleConfidence || 0;
        console.log(`${index + 1}. ${roleEmoji} ${member.name} - ${member.title}`);
        console.log(`   ${member.department} | ${member.buyerGroupRole.replace('_', ' ')} (${confidence}%)`);
        if (member.roleReasoning) {
          console.log(`   💭 ${member.roleReasoning}`);
        }
        console.log('');
      });
      
      // Display detailed justifications if available
      if (result.report && result.report.buyerGroupJustification) {
        console.log('\n📋 Detailed Member Justifications:');
        console.log('─'.repeat(40));
        result.report.buyerGroupJustification.forEach((justification, index) => {
          console.log(`${index + 1}. ${justification.name} (${justification.title})`);
          console.log(`   Role: ${justification.role} | Confidence: ${justification.confidence}`);
          console.log(`   Reasoning: ${justification.detailedReasoning}`);
          console.log('');
        });
      }
    }
    
    if (result.report) {
      console.log('\n📝 Research Report Summary:');
      console.log('─'.repeat(40));
      console.log(result.report.summary || 'No summary available');
    }
  }

  /**
   * Extract company name from LinkedIn URL or return as-is
   * @param {string} identifier - LinkedIn URL or company name
   * @returns {string} Company name
   */
  extractCompanyName(identifier) {
    // If it's a LinkedIn URL, extract company name
    if (identifier.includes('linkedin.com/company/')) {
      const match = identifier.match(/linkedin\.com\/company\/([^\/\?]+)/);
      if (match) {
        // Convert URL slug to readable company name
        return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    // Return as-is if it's already a company name
    return identifier;
  }

  async saveToDatabase(result) {
    try {
      console.log('\n💾 Saving to database...');
      
      // Create buyer group record
      const buyerGroup = await this.prisma.buyerGroups.create({
        data: {
          id: `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          companyName: this.extractCompanyName(this.targetCompany),
          website: this.targetCompany,
          industry: result.companyIntelligence?.industry || null,
          companySize: result.companyIntelligence?.size || null,
          workspaceId: this.options.workspaceId || null,
          cohesionScore: result.cohesion?.score || 0,
          overallConfidence: result.report?.qualityMetrics?.averageConfidence || 0,
          totalMembers: result.buyerGroup?.length || 0,
          processingTime: Math.round(Date.now() - this.startTime),
          metadata: result.report || {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create buyer group member records
      if (result.buyerGroup && result.buyerGroup.length > 0) {
        const memberData = result.buyerGroup.map(member => ({
          id: `bgm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          buyerGroupId: buyerGroup.id,
          name: member.name,
          title: member.title || null,
          department: member.department || null,
          role: member.buyerGroupRole,
          email: member.email || null,
          phone: member.phone || null,
          linkedin: member.linkedinUrl || null,
          confidence: member.roleConfidence || 0,
          influenceScore: member.scores?.influence || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await this.prisma.buyerGroupMembers.createMany({
          data: memberData
        });
      }

      console.log(`✅ Saved buyer group ${buyerGroup.id} with ${result.buyerGroup?.length || 0} members`);
      
    } catch (error) {
      console.error('❌ Failed to save to database:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    switch (key) {
      case 'linkedin-url':
        options.linkedinUrl = value;
        break;
      case 'deal-size':
        options.dealSize = parseInt(value);
        break;
      case 'max-pages':
        options.maxPages = parseInt(value);
        break;
      case 'workspace-id':
        options.workspaceId = value;
        break;
      case 'skip-interview':
        options.skipInterview = true;
        i--; // No value for boolean flags
        break;
      case 'export-json':
        options.exportJson = true;
        i--; // No value for boolean flags
        break;
      case 'usa-only':
        options.usaOnly = true;
        i--; // No value for boolean flags
        break;
      case 'json-output':
        options.jsonOutput = value;
        break;
      default:
        options[key] = value;
    }
  }
  
  // Validate required options
  if (!options.linkedinUrl) {
    console.error('❌ Error: --linkedin-url is required');
    console.log('\nUsage:');
    console.log('  Standard (with personalization):');
    console.log('    node production-buyer-group.js --linkedin-url "..." --workspace-id "..."');
    console.log('\n  Skip interview (use saved config):');
    console.log('    node production-buyer-group.js --linkedin-url "..." --workspace-id "..." --skip-interview');
    console.log('\n  USA-only filter:');
    console.log('    node production-buyer-group.js --linkedin-url "..." --workspace-id "..." --usa-only');
    console.log('\n  Export JSON (for TOP):');
    console.log('    node production-buyer-group.js --linkedin-url "..." --workspace-id "..." --export-json --json-output "./config.json"');
    process.exit(1);
  }
  
  // Set defaults
  options.dealSize = options.dealSize || 100000;
  options.maxPages = options.maxPages || 5;
  
  try {
    const pipeline = new ProductionBuyerGroupPipeline(options);
    await pipeline.run();
  } catch (error) {
    console.error('❌ Pipeline execution failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { ProductionBuyerGroupPipeline };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
