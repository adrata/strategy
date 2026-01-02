#!/usr/bin/env node

/**
 * Find Companies using Perplexity AI
 * 
 * Since Coresignal credits are exhausted, use Perplexity AI to research
 * companies in each vertical following Jeb Blount's Prospecting Pyramid:
 * 
 * Target: 100 companies per vertical (400 total)
 * 
 * Verticals:
 * - Insurance Claims SMB
 * - Auto Lending SMB  
 * - Estate Planning SMB
 * - Credit Unions SMB
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

// Clean the API key
const PERPLEXITY_API_KEY = (process.env.PERPLEXITY_API_KEY || '').replace(/\n/g, '').trim();

// Vertical configurations with ICP criteria
const VERTICALS = {
  insurance_claims_smb: {
    name: 'Insurance Claims',
    industry: 'Insurance Claims',
    prompt: `List 50 insurance companies in the United States that handle claims processing. 
Focus on property & casualty insurance, auto insurance, and home insurance companies with 20-1000 employees.
Include third-party administrators (TPAs) and claims management companies.
For each company provide:
- Company name
- Website domain
- Approximate employee count
- City, State
- Brief description

Format as a numbered list. Only include US-based companies.`,
    targetEmployees: { min: 20, max: 1000 }
  },
  auto_lenders_smb: {
    name: 'Auto Lending',
    industry: 'Auto Lending',
    prompt: `List 50 auto lending and vehicle financing companies in the United States.
Focus on companies with 30-500 employees including:
- Auto loan origination companies
- Buy-here-pay-here lenders
- Auto finance fintech companies
- Fleet financing companies
- Subprime auto lenders

For each company provide:
- Company name  
- Website domain
- Approximate employee count
- City, State
- Brief description

Format as a numbered list. Only include US-based companies.`,
    targetEmployees: { min: 30, max: 500 }
  },
  estate_planning_smb: {
    name: 'Estate Planning',
    industry: 'Estate Planning',
    prompt: `List 50 estate planning companies and law firms in the United States.
Focus on companies with 5-200 employees including:
- Estate planning law firms
- Trust and will services companies
- Elder law practices
- Probate and estate administration firms
- Online will/trust platforms
- Wealth planning services

For each company provide:
- Company name
- Website domain
- Approximate employee count
- City, State
- Brief description

Format as a numbered list. Only include US-based companies.`,
    targetEmployees: { min: 5, max: 200 }
  },
  credit_unions_smb: {
    name: 'Credit Union',
    industry: 'Credit Union',
    prompt: `List 50 credit unions in the United States that are mid-sized.
Focus on credit unions with 50-1000 employees including:
- Community credit unions
- Federal credit unions
- State-chartered credit unions
- Industry-specific credit unions (teachers, healthcare workers, etc.)

For each company provide:
- Credit union name
- Website domain
- Approximate employee count
- City, State
- Brief description

Format as a numbered list. Only include US-based credit unions.`,
    targetEmployees: { min: 50, max: 1000 }
  }
};

class PerplexityCompanyFinder {
  constructor() {
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
    this.mainSellerId = null;
  }

  async initialize() {
    console.log('🔍 Initializing...\n');
    
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });
    
    if (!noel) throw new Error('Noel user not found');
    
    this.mainSellerId = noel.id;
    console.log(`✅ Found Noel: ${noel.name}\n`);
  }

  async queryPerplexity(prompt) {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a business research assistant. Provide accurate company information with website domains. Focus on real companies with verifiable information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  parseCompanies(text) {
    const companies = [];
    const lines = text.split('\n');
    
    let currentCompany = null;
    
    for (const line of lines) {
      // Match numbered entries like "1. Company Name"
      const numberMatch = line.match(/^\d+\.\s*\*?\*?(.+?)\*?\*?\s*$/);
      if (numberMatch) {
        if (currentCompany && currentCompany.name) {
          companies.push(currentCompany);
        }
        currentCompany = { name: numberMatch[1].replace(/\*\*/g, '').trim() };
        continue;
      }
      
      // Match company name with bold or formatting
      const boldMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/);
      if (boldMatch) {
        if (currentCompany && currentCompany.name) {
          companies.push(currentCompany);
        }
        currentCompany = { name: boldMatch[1].trim() };
        continue;
      }
      
      if (!currentCompany) continue;
      
      // Extract website/domain
      const domainMatch = line.match(/(?:website|domain|url)[:\s]+([a-z0-9][a-z0-9-]*\.(?:com|org|net|io|ai|co|us|credit))/i);
      if (domainMatch) {
        currentCompany.domain = domainMatch[1].toLowerCase();
        continue;
      }
      
      // Alternative domain extraction
      const altDomainMatch = line.match(/(?:www\.)?([a-z0-9][a-z0-9-]*\.(?:com|org|net|io|ai|co|us|credit))/i);
      if (altDomainMatch && !currentCompany.domain) {
        currentCompany.domain = altDomainMatch[1].toLowerCase();
      }
      
      // Extract employee count
      const empMatch = line.match(/(\d{1,4})\s*(?:employees?|staff|people)/i);
      if (empMatch) {
        currentCompany.employeeCount = parseInt(empMatch[1]);
        continue;
      }
      
      // Extract location
      const locationMatch = line.match(/(?:location|headquarters|based in|city)[:\s]+([A-Za-z\s]+),\s*([A-Za-z]{2,})/i);
      if (locationMatch) {
        currentCompany.city = locationMatch[1].trim();
        currentCompany.state = locationMatch[2].trim();
      }
      
      // Simple city, state pattern
      const simpleLocMatch = line.match(/([A-Za-z\s]+),\s*([A-Z]{2})\b/);
      if (simpleLocMatch && !currentCompany.city) {
        currentCompany.city = simpleLocMatch[1].trim();
        currentCompany.state = simpleLocMatch[2];
      }
      
      // Extract description
      if (line.match(/^[-•]\s*(?:description|about)?:?\s*/i) || line.match(/provides|offers|specializes|focuses/i)) {
        if (!currentCompany.description) {
          currentCompany.description = line.replace(/^[-•]\s*(?:description|about)?:?\s*/i, '').trim();
        }
      }
    }
    
    // Add last company
    if (currentCompany && currentCompany.name) {
      companies.push(currentCompany);
    }
    
    return companies;
  }

  async companyExists(name, domain) {
    if (domain) {
      const byDomain = await prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          domain: { equals: domain, mode: 'insensitive' },
          deletedAt: null
        }
      });
      if (byDomain) return true;
    }
    
    const byName = await prisma.companies.findFirst({
      where: {
        workspaceId: this.workspaceId,
        name: { equals: name, mode: 'insensitive' },
        deletedAt: null
      }
    });
    
    return !!byName;
  }

  async addCompany(company, verticalKey, industry) {
    try {
      await prisma.companies.create({
        data: {
          workspaceId: this.workspaceId,
          name: company.name,
          domain: company.domain,
          website: company.domain ? `https://${company.domain}` : null,
          industry: industry,
          employeeCount: company.employeeCount,
          city: company.city,
          state: company.state,
          country: 'United States',
          description: company.description,
          mainSellerId: this.mainSellerId,
          status: 'ACTIVE',
          priority: 'MEDIUM',
          customFields: {
            vertical: verticalKey,
            source: 'perplexity_research',
            addedAt: new Date().toISOString()
          }
        }
      });
      return true;
    } catch (error) {
      console.log(`   ⚠️ Failed to add ${company.name}: ${error.message}`);
      return false;
    }
  }

  async getCurrentCounts() {
    const counts = {};
    
    for (const [key, config] of Object.entries(VERTICALS)) {
      const count = await prisma.companies.count({
        where: {
          workspaceId: this.workspaceId,
          mainSellerId: this.mainSellerId,
          deletedAt: null,
          OR: [
            { industry: { equals: config.industry, mode: 'insensitive' } },
            { customFields: { path: ['vertical'], equals: key } }
          ]
        }
      });
      counts[key] = count;
    }
    
    return counts;
  }

  async run() {
    console.log('\n' + '═'.repeat(70));
    console.log('   PERPLEXITY AI COMPANY FINDER');
    console.log('   For Noel\'s Verticals - Notary Everyday');
    console.log('═'.repeat(70) + '\n');

    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not set');
    }

    await this.initialize();

    // Get current counts
    const currentCounts = await this.getCurrentCounts();
    console.log('📊 Current Company Counts:');
    for (const [key, count] of Object.entries(currentCounts)) {
      const config = VERTICALS[key];
      console.log(`   ${config.name}: ${count}/100`);
    }
    console.log('');

    const results = {};

    for (const [verticalKey, config] of Object.entries(VERTICALS)) {
      const currentCount = currentCounts[verticalKey] || 0;
      const needed = 100 - currentCount;

      if (needed <= 0) {
        console.log(`✅ ${config.name}: Already at 100 companies\n`);
        continue;
      }

      console.log(`\n${'='.repeat(70)}`);
      console.log(`🔍 Researching: ${config.name}`);
      console.log(`   Current: ${currentCount}, Need: ${needed} more`);
      console.log(`${'='.repeat(70)}\n`);

      try {
        console.log('   📡 Querying Perplexity AI...');
        const response = await this.queryPerplexity(config.prompt);
        
        console.log('   📋 Parsing results...');
        const companies = this.parseCompanies(response);
        console.log(`   ✅ Found ${companies.length} companies in response\n`);

        let added = 0;
        for (const company of companies) {
          if (added >= needed) break;
          
          if (!company.name || company.name.length < 2) continue;

          const exists = await this.companyExists(company.name, company.domain);
          if (exists) {
            console.log(`   ⏭️ Already exists: ${company.name}`);
            continue;
          }

          const success = await this.addCompany(company, verticalKey, config.industry);
          if (success) {
            added++;
            console.log(`   ✅ Added (${added}/${needed}): ${company.name} ${company.domain ? `(${company.domain})` : ''}`);
          }
        }

        results[verticalKey] = {
          found: companies.length,
          added: added,
          current: currentCount + added
        };

        // Rate limit between verticals
        await new Promise(r => setTimeout(r, 2000));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results[verticalKey] = { found: 0, added: 0, current: currentCount, error: error.message };
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('   SUMMARY');
    console.log('═'.repeat(70));
    
    for (const [key, result] of Object.entries(results)) {
      const config = VERTICALS[key];
      console.log(`\n${config.name}:`);
      console.log(`   Found: ${result.found}, Added: ${result.added}`);
      console.log(`   Current total: ${result.current}/100`);
    }

    await prisma.$disconnect();
  }
}

const finder = new PerplexityCompanyFinder();
finder.run().catch(console.error);
