#!/usr/bin/env node

/**
 * Buyer Group Enrichment with Tags
 * 
 * Runs buyer group discovery and tags people as:
 * - inBuyerGroup: true/false
 * - buyerGroupRole: decision/champion/stakeholder/blocker/introducer
 * - buyerGroupConfidence: 0-100
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const prisma = new PrismaClient();

class BuyerGroupEnrichment {
  constructor(companyIdentifier, workspaceId, options = {}) {
    this.companyIdentifier = companyIdentifier;
    this.workspaceId = workspaceId;
    this.dealSize = options.dealSize || 150000;
    this.productCategory = options.productCategory || 'sales';
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎯 BUYER GROUP DISCOVERY WITH TAGGING`);
      console.log('='.repeat(80));
      console.log(`\n🏢 Company: ${this.companyIdentifier}`);
      console.log(`💰 Deal Size: $${this.dealSize.toLocaleString()}`);
      console.log(`📦 Product: ${this.productCategory}\n`);
      
      // Find company
      const company = await this.findCompany();
      if (!company) {
        console.error(`❌ Company not found: ${this.companyIdentifier}`);
        return;
      }
      
      console.log(`✅ Found: ${company.name} (${company.website || 'no website'})\n`);
      
      // Initialize pipeline
      console.log(`🚀 Running buyer group discovery...`);
      const pipeline = new SmartBuyerGroupPipeline({
        prisma,
        workspaceId: this.workspaceId,
        dealSize: this.dealSize,
        productCategory: this.productCategory,
        targetCompany: company.linkedinUrl || company.website,
        skipDatabase: false // Save to database
      });
      
      // Run pipeline
      const result = await pipeline.run(company);
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`✅ BUYER GROUP DISCOVERY COMPLETE`);
      console.log('='.repeat(80));
      console.log(`\n👥 Buyer Group: ${result.buyerGroup.length} members`);
      console.log(`📊 Cohesion Score: ${result.cohesion.score}%`);
      console.log(`💰 Total Cost: $${result.costs.total.toFixed(2)}`);
      console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
      
      // Now tag ALL people at this company
      console.log(`\n🏷️  TAGGING ALL PEOPLE AT ${company.name}...\n`);
      await this.tagAllPeopleAtCompany(company.id, result.buyerGroup);
      
      console.log(`\n✅ All people tagged with buyer group status`);
      console.log('='.repeat(80) + '\n');
      
      return result;
      
    } catch (error) {
      console.error(`\n❌ Buyer group enrichment failed:`, error);
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.log(`⏱️  Failed after: ${Math.floor(duration / 60)}m ${duration % 60}s\n`);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async findCompany() {
    return await prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        OR: [
          { name: { contains: this.companyIdentifier, mode: 'insensitive' } },
          { website: { contains: this.companyIdentifier, mode: 'insensitive' } },
          { linkedinUrl: { contains: this.companyIdentifier, mode: 'insensitive' } }
        ],
        deletedAt: null
      }
    });
  }

  async tagAllPeopleAtCompany(companyId, buyerGroup) {
    // Get all people at this company
    const allPeople = await prisma.people.findMany({
      where: {
        companyId: companyId,
        workspaceId: this.workspaceId,
        deletedAt: null
      }
    });

    console.log(`   Found ${allPeople.length} total people at company`);
    
    // Create a map of buyer group members
    const buyerGroupMap = new Map();
    buyerGroup.forEach(member => {
      // Match by email or LinkedIn URL
      const key = member.email || member.linkedinUrl;
      if (key) {
        buyerGroupMap.set(key, {
          role: member.buyerGroupRole,
          confidence: member.roleConfidence || member.confidence?.confidence || 0,
          reasoning: member.roleReasoning || member.confidence?.reasoning || ''
        });
      }
    });
    
    // Tag each person
    let inBuyerGroup = 0;
    let notInBuyerGroup = 0;
    
    for (const person of allPeople) {
      const matchKey = person.email || person.linkedinUrl;
      const buyerGroupInfo = matchKey ? buyerGroupMap.get(matchKey) : null;
      
      if (buyerGroupInfo) {
        // IN buyer group
        await prisma.people.update({
          where: { id: person.id },
          data: {
            isBuyerGroupMember: true,
            buyerGroupRole: buyerGroupInfo.role,
            buyerGroupOptimized: true,
            customFields: {
              ...(person.customFields || {}),
              buyerGroupInfo: {
                inBuyerGroup: true,
                role: buyerGroupInfo.role,
                confidence: buyerGroupInfo.confidence,
                reasoning: buyerGroupInfo.reasoning,
                taggedAt: new Date().toISOString()
              }
            }
          }
        });
        console.log(`   ✅ ${person.fullName || person.firstName} - IN buyer group (${buyerGroupInfo.role})`);
        inBuyerGroup++;
      } else {
        // NOT in buyer group
        await prisma.people.update({
          where: { id: person.id },
          data: {
            isBuyerGroupMember: false,
            buyerGroupRole: null,
            customFields: {
              ...(person.customFields || {}),
              buyerGroupInfo: {
                inBuyerGroup: false,
                reason: 'Not part of optimal buyer group for this opportunity',
                taggedAt: new Date().toISOString()
              }
            }
          }
        });
        notInBuyerGroup++;
      }
    }
    
    console.log(`\n   📊 Tagging Summary:`);
    console.log(`      In Buyer Group: ${inBuyerGroup}`);
    console.log(`      Not in Buyer Group: ${notInBuyerGroup}`);
    console.log(`      Total Tagged: ${allPeople.length}`);
  }

  async confirm(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(`${question} (y/n): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('\n🎯 Buyer Group Discovery with Tagging');
    console.log('='.repeat(80));
    console.log('\nUsage: node enrich-with-buyer-group-tags.js <company> <workspaceId> [dealSize] [productCategory]');
    console.log('\nExamples:');
    console.log('  node enrich-with-buyer-group-tags.js "Nike" "workspace_123" 250000 "sales"');
    console.log('  node enrich-with-buyer-group-tags.js "Salesforce" "workspace_123"\n');
    process.exit(1);
  }
  
  const [company, workspaceId, dealSize, productCategory] = args;
  
  const enrichment = new BuyerGroupEnrichment(company, workspaceId, {
    dealSize: dealSize ? parseInt(dealSize) : 150000,
    productCategory: productCategory || 'sales'
  });
  
  enrichment.run().catch(console.error);
}

module.exports = { BuyerGroupEnrichment };

