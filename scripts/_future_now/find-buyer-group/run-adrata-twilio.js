#!/usr/bin/env node

/**
 * Adrata → Twilio Buyer Group Discovery
 * 
 * Runs buyer group discovery for Adrata selling Sales Intelligence Platform
 * to Twilio's revenue and sales operations leadership.
 * 
 * SELLER CONTEXT (Adrata):
 * ========================
 * - AI-Powered Sales Intelligence Platform
 * - Products: Buyer Group Intelligence (BGI), Pain Intelligence, Pipeline Management,
 *   Revenue Cloud, Prophet (Forecasting), AI Sales Assistant
 * - Value Props: 40-60% shorter sales cycles, 20-35% higher win rates, 90%+ forecast accuracy
 * - Target: CRO, VP Sales, Sales Ops, Revenue Ops, Sales Enablement
 * - Counter-positions against "AI replaces humans" with "AI enables humans"
 * 
 * BUYER CONTEXT (Twilio):
 * =======================
 * - $4.46B revenue, 5,500 employees, 325K+ customers
 * - Communications/CPaaS platform (APIs for SMS, Voice, Video, Email)
 * - New CRO Thomas Wyatt (Jan 2025) - looking to make impact
 * - New VP Sales Ops John Hartingh (early 2025) - evaluating tools
 * - Post-layoff environment (3 rounds 2022-2024) - need to do more with less
 * - Profitability mandate - GAAP profitable by Q4 2025
 * - Tool consolidation opportunity after Segment acquisition
 * 
 * WHO BUYS ADRATA AT TWILIO:
 * ==========================
 * - Chief Revenue Officer (CRO) - Decision Maker
 * - VP Sales Operations - Champion/Evaluator
 * - SVP/VP Sales - Champion
 * - Director/VP Revenue Operations - Champion
 * - Sales Enablement Leadership - Champion
 * - CFO - Blocker (budget)
 * - CTO - Blocker (technical/security)
 * - CMO - Stakeholder (sales-marketing alignment)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Clean API keys
const cleanEnvKeys = () => {
  const keysToClean = [
    'CORESIGNAL_API_KEY', 'ZEROBOUNCE_API_KEY', 'MYEMAILVERIFIER_API_KEY',
    'PROSPEO_API_KEY', 'PERPLEXITY_API_KEY', 'PEOPLE_DATA_LABS_API_KEY', 
    'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'
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

class AdrataTwilioRunner {
  constructor(options = {}) {
    this.prisma = getPrismaClient();
    this.workspaceId = options.workspaceId || null;
    this.mainSellerId = options.mainSellerId || null;
    
    // Configuration for Adrata selling to Twilio
    this.config = {
      // Product/Deal Configuration
      dealSize: 250000, // $250K enterprise deal
      dealSizeRange: { min: 150000, max: 500000 },
      productCategory: 'revenue_technology',
      productName: 'Adrata Sales Intelligence Platform',
      productDescription: 'AI-powered Buyer Group Intelligence, Pain Intelligence, Pipeline Management, and Sales Forecasting',
      
      // Department Filtering - Who at Twilio would evaluate/buy Adrata
      customFiltering: {
        departments: {
          primary: [
            // Core Sales Leadership
            'sales',
            'revenue',
            'commercial',
            'go-to-market',
            'gtm',
            
            // Sales Operations & Enablement
            'sales operations',
            'revenue operations',
            'sales enablement',
            'sales strategy',
            'business operations',
            
            // Executive
            'executive',
            'c-suite',
            'office of ceo'
          ],
          secondary: [
            // Marketing (for alignment)
            'marketing',
            'demand generation',
            'field marketing',
            
            // Finance (budget approval)
            'finance',
            'fp&a',
            
            // Technology (tool evaluation)
            'it',
            'information technology',
            'enterprise applications'
          ],
          exclude: [
            // Engineering/Product (not buyers for sales tools)
            'engineering',
            'product',
            'design',
            'research',
            'data science',
            
            // Support/Success (not primary buyers)
            'customer support',
            'technical support',
            
            // HR/Admin
            'human resources',
            'recruiting',
            'talent',
            'facilities',
            'administration'
          ]
        },
        titles: {
          primary: [
            // Revenue Leadership
            'chief revenue officer',
            'cro',
            'president',
            
            // Sales Leadership
            'vp sales',
            'vice president sales',
            'svp sales',
            'head of sales',
            'sales director',
            'director of sales',
            'regional vice president',
            'rvp',
            
            // Sales/Revenue Operations
            'vp sales operations',
            'vice president sales operations',
            'vp revenue operations',
            'director sales operations',
            'director revenue operations',
            'head of sales operations',
            'head of revenue operations',
            
            // Sales Enablement
            'vp sales enablement',
            'director sales enablement',
            'head of sales enablement',
            
            // GTM Leadership
            'vp go-to-market',
            'head of gtm'
          ],
          secondary: [
            // Finance (blockers)
            'cfo',
            'chief financial officer',
            'vp finance',
            
            // Technology (blockers)
            'cto',
            'chief technology officer',
            'cio',
            'chief information officer',
            
            // Marketing (stakeholders)
            'cmo',
            'chief marketing officer',
            'vp marketing'
          ],
          exclude: [
            // Individual contributors (too junior)
            'account executive',
            'sales representative',
            'sdr',
            'bdr',
            'sales development',
            'business development representative',
            
            // Customer-facing non-buyers
            'customer success',
            'account manager',
            'solutions engineer',
            'solutions architect',
            
            // Support roles
            'analyst',
            'coordinator',
            'specialist',
            'assistant',
            
            // Engineering roles
            'software engineer',
            'developer',
            'architect'
          ]
        }
      },
      
      // Buyer Group Sizing - Enterprise deal at $250K
      buyerGroupSizing: {
        min: 6,
        max: 12,
        optimal: 8
      },
      
      // Role Priorities for Sales Intelligence Platform
      rolePriorities: {
        decision_maker: 2,  // CRO, CEO
        champion: 4,        // VP Sales Ops, VP Sales, Rev Ops
        blocker: 2,         // CFO, CTO
        stakeholder: 2      // CMO, VP Marketing
      },
      
      // USA Only filter
      usaOnly: true
    };
    
    // Target company - matching pattern from working scripts
    this.targetCompany = {
      name: 'Twilio',
      linkedinUrl: 'https://www.linkedin.com/company/twilio-inc-',
      website: 'https://www.twilio.com',
      originalIdentifier: 'https://www.linkedin.com/company/twilio-inc-'
    };
  }

  async ensureWorkspace() {
    if (this.workspaceId) return this.workspaceId;

    console.log('🔍 Finding or creating workspace...');
    
    try {
      let workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: { contains: 'Adrata', mode: 'insensitive' } },
            { name: { contains: 'adrata', mode: 'insensitive' } }
          ]
        }
      });

      if (workspace) {
        console.log(`✅ Found existing workspace: ${workspace.name}`);
        this.workspaceId = workspace.id;
        return workspace.id;
      }

      console.log('📝 Creating new workspace for Adrata...');
      workspace = await this.prisma.workspaces.create({
        data: {
          name: 'Adrata',
          slug: `adrata-${Date.now()}`,
          updatedAt: new Date(),
        }
      });

      console.log(`✅ Created workspace: ${workspace.name} (${workspace.id})`);
      this.workspaceId = workspace.id;
      return workspace.id;
    } catch (error) {
      console.error('❌ Error with workspace:', error.message);
      this.workspaceId = `temp_adrata_${Date.now()}`;
      console.log(`⚠️ Using temporary workspace ID: ${this.workspaceId}`);
      return this.workspaceId;
    }
  }

  async run() {
    console.log('🚀 Adrata → Twilio Buyer Group Discovery');
    console.log('─'.repeat(60));
    console.log(`📊 Seller: Adrata (Sales Intelligence Platform)`);
    console.log(`🎯 Target: Twilio ($4.46B revenue, 5,500 employees)`);
    console.log(`💰 Deal Size: $${this.config.dealSize.toLocaleString()}`);
    console.log(`🇺🇸 Location Filter: USA Only`);
    console.log('─'.repeat(60));
    
    await this.ensureWorkspace();
    
    try {
      // Initialize pipeline with configuration
      // Use null workspaceId to force fresh Coresignal lookup (skip database)
      const pipeline = new SmartBuyerGroupPipeline({
        prisma: this.prisma,
        workspaceId: null, // Skip database lookup, force fresh Coresignal data
        mainSellerId: this.mainSellerId,
        dealSize: this.config.dealSize,
        productCategory: this.config.productCategory,
        productName: this.config.productName,
        customFiltering: this.config.customFiltering,
        buyerGroupSizing: this.config.buyerGroupSizing,
        rolePriorities: this.config.rolePriorities,
        usaOnly: this.config.usaOnly
      });
      
      // Build company object - use website to trigger Coresignal enrich endpoint
      const company = {
        name: 'Twilio',
        linkedinUrl: 'https://www.linkedin.com/company/twilio-inc-',
        website: 'https://www.twilio.com',
        mainSellerId: this.mainSellerId,
        originalIdentifier: 'https://www.twilio.com' // Use website to trigger enrich endpoint
      };
      
      // Run the pipeline
      const result = await pipeline.run(company);
      
      if (!result) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }
      
      // Display results
      this.displayResults(result);
      
      // Export to JSON
      await this.exportResults(result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Pipeline error:', error.message);
      console.error(error.stack);
      throw error;
    } finally {
      await disconnectPrismaClient();
    }
  }
  
  displayResults(result) {
    console.log('\n' + '═'.repeat(60));
    console.log('📋 BUYER GROUP RESULTS');
    console.log('═'.repeat(60));
    
    const buyerGroup = result.buyerGroup || result.finalBuyerGroup || [];
    
    if (buyerGroup.length === 0) {
      console.log('⚠️  No buyer group members found');
      return;
    }
    
    // Group by role
    const byRole = {};
    buyerGroup.forEach(m => {
      const role = m.role || m.buyerRole || 'unknown';
      if (!byRole[role]) byRole[role] = [];
      byRole[role].push(m);
    });
    
    // Display summary
    console.log(`\n📊 Total Members: ${buyerGroup.length}`);
    Object.keys(byRole).forEach(role => {
      console.log(`   ${role}: ${byRole[role].length}`);
    });
    
    // Display each member
    console.log('\n' + '─'.repeat(60));
    buyerGroup.forEach((m, i) => {
      console.log(`\n${i + 1}. ${m.name || m.fullName}`);
      console.log(`   📌 ${m.title}`);
      console.log(`   🏷️  Role: ${m.role || m.buyerRole}`);
      console.log(`   📍 ${m.location || 'Location unknown'}`);
      if (m.linkedinUrl) console.log(`   🔗 ${m.linkedinUrl}`);
      if (m.email) console.log(`   📧 ${m.email}`);
      if (m.reasoning) console.log(`   💡 ${m.reasoning}`);
    });
    
    console.log('\n' + '═'.repeat(60));
  }
  
  async exportResults(result) {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filename = `adrata-twilio-buyergroup-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(outputDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results exported to: ${filepath}`);
  }
}

// Run if called directly
async function main() {
  const runner = new AdrataTwilioRunner();
  await runner.run();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

module.exports = { AdrataTwilioRunner };

