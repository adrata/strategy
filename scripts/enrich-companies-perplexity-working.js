#!/usr/bin/env node

/**
 * 🔍 ENRICH COMPANIES WITH PERPLEXITY (WORKING IMPLEMENTATION)
 * 
 * Based on the working PerplexityAccuracyValidator from the codebase
 * Uses the correct API endpoint and authentication
 */

const { PrismaClient } = require('@prisma/client');

class EnrichCompaniesWithPerplexity {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    this.perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    this.coresignalApiKey = process.env.CORESIGNAL_API_KEY;
    
    // Use the correct Perplexity API endpoint from the working implementation
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    this.model = 'sonar-pro'; // Best model for real-time web data
    
    if (!this.perplexityApiKey) {
      console.log('⚠️ PERPLEXITY_API_KEY not found in environment variables');
      console.log('   Please set PERPLEXITY_API_KEY in your environment');
      console.log('   You can get an API key from: https://www.perplexity.ai/settings/api');
      throw new Error('PERPLEXITY_API_KEY environment variable is required');
    }
    
    if (!this.coresignalApiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    this.creditsUsed = { perplexity: 0, coresignal: { search: 0, collect: 0 } };
    this.maxCompaniesPerRun = 5; // Small batch for testing
    
    this.results = {
      companiesProcessed: 0,
      peopleFound: 0,
      buyerGroupsCreated: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🔍 ENRICHING COMPANIES WITH PERPLEXITY (WORKING)');
    console.log('===============================================\n');

    try {
      const companies = await this.findCompaniesWithoutPeople();
      await this.processCompanies(companies);
      this.generateReport();
    } catch (error) {
      console.error('❌ Processing failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findCompaniesWithoutPeople() {
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: { none: {} }
      },
      select: { id: true, name: true, website: true }
    });

    console.log(`📊 Found ${companies.length} companies without people`);
    return companies.slice(0, this.maxCompaniesPerRun);
  }

  async processCompanies(companies) {
    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing ${company.name}...`);
        
        // Research with Perplexity using the working API
        const researchData = await this.researchWithPerplexity(company);
        if (!researchData) continue;

        // Search employees with CoreSignal
        const employees = await this.searchEmployees(company);
        if (!employees.length) continue;

        // Create people and buyer group
        await this.createPeopleAndBuyerGroup(company, employees);
        
        this.results.companiesProcessed++;
        console.log(`✅ Successfully processed ${company.name}`);
        
        await this.delay(3000);
      } catch (error) {
        console.error(`❌ Failed ${company.name}:`, error.message);
        this.results.errors.push(`${company.name}: ${error.message}`);
      }
    }
  }

  async researchWithPerplexity(company) {
    try {
      const query = `Research the company "${company.name}" and provide:
1. Official website URL
2. Company description and industry
3. Employee count (if available)
4. Founded year (if available)
5. Location/headquarters
6. Key executives or leadership team

Please provide accurate, up-to-date information from reliable sources. Be concise and structured.`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional business research assistant. Provide accurate, up-to-date information from reliable sources. Always include confidence levels and source citations. Respect privacy and only use publicly available information.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          temperature: 0.1, // Low temperature for factual accuracy
          max_tokens: 1000,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.creditsUsed.perplexity++;
      
      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response from Perplexity API');
      }
      
      console.log(`   🔍 Researched with Perplexity (${data.usage?.total_tokens || 0} tokens)`);
      return data.choices[0].message.content;
    } catch (error) {
      console.error(`   ❌ Perplexity research failed:`, error.message);
      return null;
    }
  }

  async searchEmployees(company) {
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_name: company.name,
          limit: 20
        })
      });

      if (!response.ok) throw new Error(`CoreSignal search failed: ${response.status}`);
      
      const data = await response.json();
      this.creditsUsed.coresignal.search++;
      
      console.log(`   👥 Found ${data.data?.length || 0} employees`);
      return data.data || [];
    } catch (error) {
      console.error(`   ❌ CoreSignal search failed:`, error.message);
      return [];
    }
  }

  async createPeopleAndBuyerGroup(company, employees) {
    const peopleCreated = [];
    
    // Collect first 10 employee profiles
    const employeesToCollect = employees.slice(0, 10);
    
    for (const employee of employeesToCollect) {
      try {
        const profile = await this.collectEmployeeProfile(employee);
        if (!profile) continue;

        const role = this.determineRole(profile);
        const person = await this.prisma.people.create({
          data: {
            firstName: profile.first_name || 'Unknown',
            lastName: profile.last_name || 'Unknown',
            fullName: `${profile.first_name || 'Unknown'} ${profile.last_name || 'Unknown'}`.trim(),
            jobTitle: profile.title || 'Unknown',
            email: profile.email || null,
            linkedinUrl: profile.linkedin_url || null,
            companyId: company.id,
            workspaceId: this.workspaceId,
            buyerGroupRole: role,
            tags: ['CoreSignal', 'Perplexity', 'Buyer Group Member', role]
          }
        });
        
        peopleCreated.push(person);
        await this.delay(1500);
      } catch (error) {
        console.error(`   ❌ Failed to create person:`, error.message);
      }
    }

    if (peopleCreated.length > 0) {
      await this.createBuyerGroup(company, peopleCreated);
      this.results.peopleFound += peopleCreated.length;
      this.results.buyerGroupsCreated++;
    }
  }

  async collectEmployeeProfile(employee) {
    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v1/linkedin/employee/collect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.coresignalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: employee.id })
      });

      if (!response.ok) throw new Error(`Collect failed: ${response.status}`);
      
      const data = await response.json();
      this.creditsUsed.coresignal.collect++;
      
      return data.data;
    } catch (error) {
      console.error(`   ❌ Collect failed:`, error.message);
      return null;
    }
  }

  async createBuyerGroup(company, people) {
    const roleCounts = { 'Decision Maker': 0, 'Champion': 0, 'Blocker': 0, 'Stakeholder': 0, 'Introducer': 0 };
    people.forEach(p => roleCounts[p.buyerGroupRole]++);

    const members = people.map(p => ({
      personId: p.id,
      influence: p.buyerGroupRole === 'Decision Maker' ? 'high' : 'medium',
      isPrimary: p.buyerGroupRole === 'Decision Maker'
    }));

    await this.prisma.buyer_groups.create({
      data: {
        workspaceId: this.workspaceId,
        companyId: company.id,
        name: `${company.name} - Buyer Group`,
        description: `Buyer group for ${company.name} (${people.length} people)`,
        purpose: `Sales and marketing for ${company.name}`,
        status: 'active',
        people: { create: members },
        customFields: { roleDistribution: roleCounts }
      }
    });

    console.log(`   🎯 Created buyer group with ${people.length} people`);
  }

  determineRole(employee) {
    const title = (employee.title || '').toLowerCase();
    
    if (title.includes('ceo') || title.includes('president') || title.includes('chief') || 
        title.includes('vp') || title.includes('director') || title.includes('manager')) {
      return 'Decision Maker';
    }
    if (title.includes('engineer') || title.includes('technical') || title.includes('lead')) {
      return 'Champion';
    }
    if (title.includes('legal') || title.includes('compliance') || title.includes('security')) {
      return 'Blocker';
    }
    if (title.includes('sales') || title.includes('marketing') || title.includes('business development')) {
      return 'Introducer';
    }
    return 'Stakeholder';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    console.log('\n🎉 PERPLEXITY + CORESIGNAL REPORT');
    console.log('=================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`👥 People found: ${this.results.peopleFound}`);
    console.log(`🎯 Buyer groups created: ${this.results.buyerGroupsCreated}`);
    console.log(`💰 Perplexity credits: ${this.creditsUsed.perplexity}`);
    console.log(`💰 CoreSignal credits: ${this.creditsUsed.coresignal.search + this.creditsUsed.coresignal.collect}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }
  }
}

if (require.main === module) {
  new EnrichCompaniesWithPerplexity().execute().catch(console.error);
}

module.exports = EnrichCompaniesWithPerplexity;
