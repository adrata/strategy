#!/usr/bin/env node

/**
 * 🚀 RUN TOP WITH UNIFIED SYSTEM
 * 
 * Use TOP as the first company to test the complete unified enrichment system
 * This is the production run with the new system
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

// TOP configuration
const TOP_CONFIG = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
  userId: 'dan@adrata.com',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
};

// TOP-specific seller profile for engineering services
const TOP_SELLER_PROFILE = {
  productName: "TOP Engineering Plus",
  sellerCompanyName: "TOP Engineering Plus",
  solutionCategory: 'operations',
  targetMarket: 'enterprise',
  dealSize: 'large',
  buyingCenter: 'mixed',
  decisionLevel: 'mixed',
  rolePriorities: {
    decision: ['CEO', 'COO', 'VP Operations', 'VP Engineering', 'CTO', 'President'],
    champion: ['Director Operations', 'Engineering Manager', 'Operations Manager', 'Project Manager'],
    stakeholder: ['VP Finance', 'CFO', 'Procurement Manager', 'Quality Manager'],
    blocker: ['Legal Counsel', 'Compliance Manager', 'Risk Manager'],
    introducer: ['Board Member', 'Advisor', 'Consultant', 'Partner']
  },
  mustHaveTitles: ['CEO', 'COO', 'VP Operations', 'CTO', 'VP Engineering'],
  adjacentFunctions: ['finance', 'legal', 'procurement', 'quality'],
  disqualifiers: ['intern', 'student', 'temporary'],
  geo: ['US', 'North America'],
  primaryPainPoints: [
    'Engineering capacity constraints',
    'Technical skill gaps',
    'Project delivery delays',
    'Quality control issues',
    'Cost optimization needs'
  ],
  targetDepartments: ['engineering', 'operations', 'manufacturing', 'quality']
};

class TOPUnifiedSystemRunner {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      companiesProcessed: 0,
      buyerGroupsGenerated: 0,
      newPeopleAdded: 0,
      existingPeopleEnriched: 0,
      totalCost: 0,
      errors: []
    };
  }
  
  async runTOPWithUnifiedSystem() {
    console.log('🚀 RUNNING TOP WITH UNIFIED ENRICHMENT SYSTEM');
    console.log('=============================================');
    console.log(`📊 Workspace: ${TOP_CONFIG.workspaceId}`);
    console.log(`🎯 Using complete unified system for TOP enrichment`);
    console.log('');
    
    try {
      // Step 1: Get all TOP companies
      const topCompanies = await this.getTOPCompanies();
      console.log(`📈 Found ${topCompanies.length} TOP companies to process`);
      
      if (topCompanies.length === 0) {
        throw new Error('No TOP companies found - check workspace ID');
      }
      
      // Step 2: Process companies with unified system
      console.log('\n⚡ Processing companies with unified system...');
      await this.processCompaniesWithUnifiedSystem(topCompanies);
      
      // Step 3: Generate final report
      this.generateFinalReport();
      
      return this.stats;
      
    } catch (error) {
      console.error('💥 TOP unified system run failed:', error);
      throw error;
    }
  }
  
  async getTOPCompanies() {
    return await prisma.companies.findMany({
      where: {
        workspaceId: TOP_CONFIG.workspaceId,
        deletedAt: null
      },
      include: {
        people: true,
        buyer_groups: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 20 // Start with first 20 companies
    });
  }
  
  async processCompaniesWithUnifiedSystem(companies) {
    console.log(`⚡ Processing ${companies.length} companies with unified system...`);
    
    for (const [index, company] of companies.entries()) {
      console.log(`\n🏢 ${index + 1}/${companies.length}: ${company.name}`);
      console.log(`  📊 Current: ${company.people.length} people, ${company.buyer_groups.length} buyer groups`);
      
      try {
        const startTime = Date.now();
        
        // Use unified system for full enrichment
        const result = await this.enrichCompanyWithUnifiedSystem(company);
        
        const duration = Date.now() - startTime;
        
        if (result.success) {
          this.stats.companiesProcessed++;
          this.stats.buyerGroupsGenerated++;
          this.stats.newPeopleAdded += result.results?.newPeople || 0;
          this.stats.existingPeopleEnriched += result.results?.enrichedPeople || 0;
          this.stats.totalCost += result.metadata?.totalCost || 0;
          
          console.log(`  ✅ Success in ${Math.round(duration/1000)}s`);
          console.log(`    - Buyer group: ${result.results?.buyerGroup ? '✅' : '❌'}`);
          console.log(`    - New people: ${result.results?.newPeople || 0}`);
          console.log(`    - Enriched people: ${result.results?.enrichedPeople || 0}`);
          console.log(`    - Confidence: ${result.quality?.overallScore || 0}%`);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
        
        // Rate limiting between companies
        await this.delay(2000);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${company.name}:`, error.message);
        this.stats.errors.push({
          company: company.name,
          error: error.message
        });
      }
    }
  }
  
  async enrichCompanyWithUnifiedSystem(company) {
    const request = {
      operation: 'full_enrichment',
      target: {
        companyId: company.id,
        companyName: company.name
      },
      options: {
        depth: 'comprehensive',
        includeBuyerGroup: true,
        includeIndustryIntel: true,
        includeCompetitorAnalysis: true,
        urgencyLevel: 'batch'
      },
      sellerProfile: TOP_SELLER_PROFILE
    };
    
    return await this.callUnifiedAPI('POST', '', request);
  }
  
  async callUnifiedAPI(method, endpoint = '', body = null) {
    const url = `${TOP_CONFIG.baseUrl}/api/enrichment/unified${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    // Add workspace context
    const separator = endpoint.includes('?') ? '&' : '?';
    const contextUrl = `${url}${separator}workspaceId=${TOP_CONFIG.workspaceId}&userId=${TOP_CONFIG.userId}`;
    
    const response = await fetch(contextUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  }
  
  generateFinalReport() {
    const duration = Date.now() - this.stats.startTime;
    
    console.log('\n🎉 TOP UNIFIED SYSTEM RUN COMPLETE!');
    console.log('='.repeat(40));
    console.log(`⏱️  Total Duration: ${Math.round(duration/1000/60)} minutes`);
    console.log(`🏢 Companies Processed: ${this.stats.companiesProcessed}`);
    console.log(`🎯 Buyer Groups Generated: ${this.stats.buyerGroupsGenerated}`);
    console.log(`➕ New People Added: ${this.stats.newPeopleAdded}`);
    console.log(`🔄 Existing People Enriched: ${this.stats.existingPeopleEnriched}`);
    console.log(`💰 Total Cost: $${this.stats.totalCost.toFixed(2)}`);
    console.log(`✅ Success Rate: ${Math.round(((this.stats.companiesProcessed - this.stats.errors.length) / this.stats.companiesProcessed) * 100)}%`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️ Errors (${this.stats.errors.length}):`);
      this.stats.errors.forEach(error => {
        console.log(`  - ${error.company}: ${error.error}`);
      });
    }
    
    console.log('\n🎯 UNIFIED SYSTEM PERFORMANCE:');
    console.log(`📊 Average processing time: ${Math.round(duration / this.stats.companiesProcessed / 1000)}s per company`);
    console.log(`💰 Average cost per company: $${(this.stats.totalCost / this.stats.companiesProcessed).toFixed(2)}`);
    console.log(`👥 Average new people per company: ${Math.round(this.stats.newPeopleAdded / this.stats.companiesProcessed)}`);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Review results in database');
    console.log('2. Validate buyer group quality');
    console.log('3. Check employment verification accuracy');
    console.log('4. Scale to more companies if satisfied');
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  try {
    const runner = new TOPUnifiedSystemRunner();
    const results = await runner.runTOPWithUnifiedSystem();
    
    console.log('\n✨ TOP unified system run completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 TOP unified system run failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if development server is running');
    console.log('2. Verify database connectivity');
    console.log('3. Check API endpoint accessibility');
    console.log('4. Review error messages above');
    
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { TOPUnifiedSystemRunner, TOP_CONFIG, TOP_SELLER_PROFILE };
