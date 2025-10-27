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

class ProductionBuyerGroupPipeline {
  constructor(options = {}) {
    this.prisma = options.prisma || new PrismaClient();
    this.options = options;
    this.dealSize = options.dealSize || 100000;
    this.targetCompany = options.linkedinUrl;
    this.maxPages = options.maxPages || 5;
    this.startTime = Date.now();
  }

  async run() {
    console.log('🚀 Production Buyer Group Discovery Pipeline');
    console.log(`📊 Target: ${this.targetCompany}`);
    console.log(`💰 Deal Size: $${this.dealSize.toLocaleString()}`);
    console.log(`📄 Max Pages: ${this.maxPages}`);
    console.log('─'.repeat(60));
    
    try {
      // Initialize the smart pipeline
      const pipeline = new SmartBuyerGroupPipeline({
        linkedinUrl: this.targetCompany,
        dealSize: this.dealSize,
        maxPages: this.maxPages,
        prisma: this.prisma
      });

      // Execute the 8-stage pipeline
      const result = await pipeline.run();
      
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
          companyTier: result.companyIntelligence?.companyTier || null,
          dealSize: this.dealSize || null,
          totalEmployeesFound: result.previewEmployees?.length || 0,
          totalCost: result.costs?.total || 0,
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
          roleReasoning: member.roleReasoning || null,
          connectionsCount: member.connectionsCount || 0,
          followersCount: member.followersCount || 0,
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
      default:
        options[key] = value;
    }
  }
  
  // Validate required options
  if (!options.linkedinUrl) {
    console.error('❌ Error: --linkedin-url is required');
    console.log('Usage: node production-buyer-group.js --linkedin-url "https://linkedin.com/company/example" --deal-size 150000');
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
