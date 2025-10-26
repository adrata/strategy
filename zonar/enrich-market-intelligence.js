#!/usr/bin/env node

/**
 * Market Intelligence Generator
 * 
 * This script generates market-specific intelligence for companies and people
 * based on industry, size, and other firmographic/demographic data.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class MarketIntelligenceGenerator {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      companiesProcessed: 0,
      peopleProcessed: 0,
      marketIntelligenceGenerated: 0,
      errors: 0
    };
  }

  async run() {
    try {
      console.log('📈 Starting Market Intelligence Generation for Notary Everyday workspace...\n');
      
      await this.generateCompanyMarketIntelligence();
      console.log('\n' + '='.repeat(50) + '\n');
      await this.generatePersonMarketIntelligence();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in market intelligence generation:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async generateCompanyMarketIntelligence() {
    console.log('🏢 Generating Market Intelligence for Companies...');
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { industry: { not: null } },
          { size: { not: null } },
          { employeeCount: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        size: true,
        employeeCount: true,
        customFields: true,
      }
    });

    console.log(`   📊 Found ${companies.length} companies to process`);

    const batchSize = 50;
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)} (${batch.length} companies)`);

      await Promise.all(batch.map(async (company) => {
        try {
          const marketIntelligence = this.analyzeCompanyMarket(company);
          await this.updateCompanyWithMarketIntelligence(company.id, marketIntelligence);
          this.results.marketIntelligenceGenerated++;
        } catch (error) {
          console.error(`   ❌ Error generating market intelligence for ${company.name}:`, error.message);
          this.results.errors++;
        } finally {
          this.results.companiesProcessed++;
        }
      }));
    }
  }

  analyzeCompanyMarket(company) {
    const intelligence = {
      competitorAnalysis: [],
      marketPosition: 'unknown',
      technologyAdoption: 'standard',
      buyingCycle: 'unknown',
      decisionMakingStructure: 'unknown'
    };

    // Simulate competitor analysis based on industry and size
    if (company.industry && company.size) {
      intelligence.competitorAnalysis.push(`Key competitors in ${company.industry} for ${company.size} companies.`);
      intelligence.marketPosition = 'established';
    }

    // Simulate technology adoption
    if (company.industry === 'Technology' || company.industry === 'Software') {
      intelligence.technologyAdoption = 'early adopter';
    } else if (company.industry === 'Manufacturing' || company.industry === 'Construction') {
      intelligence.technologyAdoption = 'late adopter';
    }

    // Simulate buying cycle
    if (company.employeeCount > 1000) {
      intelligence.buyingCycle = 'long (6-12 months)';
      intelligence.decisionMakingStructure = 'complex, multi-stakeholder';
    } else if (company.employeeCount > 50) {
      intelligence.buyingCycle = 'medium (3-6 months)';
      intelligence.decisionMakingStructure = 'committee-based';
    } else {
      intelligence.buyingCycle = 'short (1-3 months)';
      intelligence.decisionMakingStructure = 'owner/manager-led';
    }

    return intelligence;
  }

  async updateCompanyWithMarketIntelligence(companyId, marketIntelligence) {
    await this.prisma.companies.update({
      where: { id: companyId },
      data: {
        customFields: {
          ...(await this.getCompanyCustomFields(companyId)),
          marketIntelligence: marketIntelligence
        },
        updatedAt: new Date()
      }
    });
  }

  async generatePersonMarketIntelligence() {
    console.log('👤 Generating Market Intelligence for People...');
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { jobTitle: { not: null } },
          { companyId: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: {
            name: true,
            industry: true,
            size: true,
            employeeCount: true
          }
        }
      }
    });

    console.log(`   📊 Found ${people.length} people to process`);

    const batchSize = 50;
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      console.log(`   📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)} (${batch.length} people)`);

      await Promise.all(batch.map(async (person) => {
        try {
          const marketIntelligence = this.analyzePersonMarket(person);
          await this.updatePersonWithMarketIntelligence(person.id, marketIntelligence);
          this.results.marketIntelligenceGenerated++;
        } catch (error) {
          console.error(`   ❌ Error generating market intelligence for ${person.fullName}:`, error.message);
          this.results.errors++;
        } finally {
          this.results.peopleProcessed++;
        }
      }));
    }
  }

  analyzePersonMarket(person) {
    const intelligence = {
      peerComparison: 'unknown',
      careerAdvancementOpportunities: [],
      skillGapAnalysis: [],
      professionalDevelopmentInterests: []
    };

    if (person.jobTitle && person.company?.size) {
      intelligence.peerComparison = `Compares to peers in similar ${person.jobTitle} roles at ${person.company.size} companies.`;
    }

    if (person.jobTitle?.toLowerCase().includes('manager')) {
      intelligence.careerAdvancementOpportunities.push('Director-level roles');
      intelligence.professionalDevelopmentInterests.push('Leadership training');
    }

    // Simulate skill gap analysis
    if (person.customFields?.careerSignals?.tenure?.isNewInRole) {
      intelligence.skillGapAnalysis.push('Onboarding and role-specific skills');
    }

    return intelligence;
  }

  async updatePersonWithMarketIntelligence(personId, marketIntelligence) {
    await this.prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          ...(await this.getPersonCustomFields(personId)),
          marketIntelligence: marketIntelligence
        },
        updatedAt: new Date()
      }
    });
  }

  async getCompanyCustomFields(companyId) {
    const company = await this.prisma.companies.findUnique({
      where: { id: companyId },
      select: { customFields: true }
    });
    return company?.customFields || {};
  }

  async getPersonCustomFields(personId) {
    const person = await this.prisma.people.findUnique({
      where: { id: personId },
      select: { customFields: true }
    });
    return person?.customFields || {};
  }

  printResults() {
    console.log('\n📈 Market Intelligence Generation Results:');
    console.log('==========================================');
    console.log(`Total Companies Processed: ${this.results.companiesProcessed}`);
    console.log(`Total People Processed: ${this.results.peopleProcessed}`);
    console.log(`Market Intelligence Generated: ${this.results.marketIntelligenceGenerated}`);
    console.log(`Errors: ${this.results.errors}`);
  }
}

// Run the generator
const generator = new MarketIntelligenceGenerator();
generator.run().catch(console.error);
