#!/usr/bin/env node

/**
 * Find Companies for Noel's Verticals - Prospecting Pyramid Approach
 * 
 * Based on Jeb Blount's Prospecting Pyramid:
 * - TOP TIER (Ring 1): Highly qualified, in buying window, immediate fit
 * - MIDDLE TIER (Ring 2): Well qualified, solid data, good fit
 * - BASE TIER (Ring 3): Basic qualification, needs more research
 * 
 * Target: 100 companies per vertical (400 total)
 * 
 * Verticals:
 * - insurance_claims_smb: Insurance companies with claims operations
 * - auto_lenders_smb: Auto lending and finance companies
 * - estate_planning_smb: Estate planning law firms and services
 * - credit_unions_smb: Credit unions and member-owned financial institutions
 * 
 * ICP Criteria for Notary Everyday:
 * - Employee count: 50-1000 (SMB/Mid-market sweet spot)
 * - USA-based (state-specific notary laws)
 * - Needs document notarization in their workflow
 * 
 * Usage: node scripts/users/find-companies-for-noel-verticals.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration for each vertical
const VERTICAL_CONFIGS = {
  insurance_claims_smb: {
    name: 'Insurance Claims',
    industry: 'Insurance Claims',
    searchTerms: [
      'insurance claims',
      'claims management', 
      'property casualty insurance',
      'auto insurance',
      'home insurance',
      'insurance adjuster',
      'third party administrator',
      'claims processing'
    ],
    industries: [
      'Insurance',
      'Property & Casualty Insurance',
      'Insurance Claims',
      'Risk Management'
    ],
    targetEmployees: { min: 20, max: 1000, ideal: 200 },
    dealSizeIndicator: 45000,
    targetCount: 100
  },
  auto_lenders_smb: {
    name: 'Auto Lending',
    industry: 'Auto Lending',
    searchTerms: [
      'auto lending',
      'auto finance',
      'vehicle financing',
      'car loans',
      'automotive financing',
      'subprime auto',
      'auto loan origination'
    ],
    industries: [
      'Financial Services',
      'Auto Financing',
      'Consumer Lending',
      'Banking'
    ],
    targetEmployees: { min: 30, max: 500, ideal: 150 },
    dealSizeIndicator: 50000,
    targetCount: 100
  },
  estate_planning_smb: {
    name: 'Estate Planning',
    industry: 'Estate Planning',
    searchTerms: [
      'estate planning',
      'trust attorney',
      'will and trust',
      'probate',
      'elder law',
      'estate law',
      'wealth planning'
    ],
    industries: [
      'Legal Services',
      'Law Practice',
      'Estate Planning',
      'Trusts and Estates'
    ],
    targetEmployees: { min: 5, max: 200, ideal: 50 },
    dealSizeIndicator: 25000,
    targetCount: 100
  },
  credit_unions_smb: {
    name: 'Credit Union',
    industry: 'Credit Union',
    searchTerms: [
      'credit union',
      'federal credit union',
      'member services',
      'credit union lending',
      'community credit union'
    ],
    industries: [
      'Banking',
      'Credit Unions',
      'Financial Services',
      'Consumer Banking'
    ],
    targetEmployees: { min: 50, max: 1000, ideal: 300 },
    dealSizeIndicator: 40000,
    targetCount: 100
  }
};

// Prospecting Pyramid Tiers
const PYRAMID_TIERS = {
  TIER_1: { name: 'Top Tier (Ring 1)', score: 90, description: 'Highly qualified, immediate fit' },
  TIER_2: { name: 'Middle Tier (Ring 2)', score: 70, description: 'Well qualified, good fit' },
  TIER_3: { name: 'Base Tier (Ring 3)', score: 50, description: 'Basic qualification, needs research' }
};

class CompanyFinder {
  constructor() {
    // Clean API key (remove trailing newlines that break HTTP headers)
    this.apiKey = (process.env.CORESIGNAL_API_KEY || '').replace(/\\n/g, '').replace(/\n/g, '').trim();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday
    this.mainSellerId = null;
    
    if (!this.apiKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    this.results = {
      byVertical: {},
      totalFound: 0,
      totalAdded: 0,
      creditsUsed: 0
    };
  }

  async initialize() {
    console.log('🔍 Initializing...\n');
    
    // Find Noel
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });
    
    if (!noel) {
      throw new Error('Noel user not found!');
    }
    
    this.mainSellerId = noel.id;
    console.log(`✅ Found Noel: ${noel.name} (${noel.id})\n`);
  }

  /**
   * Calculate Prospecting Pyramid score for a company
   * Based on Jeb Blount's qualification criteria
   * Uses Coresignal field names: employees_count, hq_country, company_name
   */
  calculatePyramidScore(company, config) {
    let score = 0;
    const factors = [];
    
    // 1. Employee count fit (25 points) - Coresignal uses employees_count
    const empCount = company.employees_count || 0;
    if (empCount >= config.targetEmployees.min && empCount <= config.targetEmployees.max) {
      const idealDiff = Math.abs(empCount - config.targetEmployees.ideal);
      const maxDiff = Math.max(
        config.targetEmployees.ideal - config.targetEmployees.min,
        config.targetEmployees.max - config.targetEmployees.ideal
      );
      const empScore = 25 * (1 - (idealDiff / maxDiff));
      score += empScore;
      factors.push({ factor: 'employee_fit', score: empScore, detail: `${empCount} employees` });
    }
    
    // 2. USA-based (20 points) - Coresignal uses hq_country
    const country = (company.hq_country || '').toLowerCase();
    if (country.includes('united states') || country.includes('usa') || country === 'us' || !country) {
      score += 20;
      factors.push({ factor: 'usa_based', score: 20, detail: company.hq_country || 'USA' });
    }
    
    // 3. Website available (15 points)
    if (company.website || company.unique_domain) {
      score += 15;
      factors.push({ factor: 'website', score: 15, detail: company.website || company.unique_domain });
    }
    
    // 4. LinkedIn URL available (10 points)
    if (company.linkedin_url) {
      score += 10;
      factors.push({ factor: 'linkedin', score: 10, detail: 'LinkedIn profile' });
    }
    
    // 5. Industry match (15 points)
    const industry = (company.industry || '').toLowerCase();
    const industryMatch = config.industries.some(ind => 
      industry.includes(ind.toLowerCase())
    );
    if (industryMatch) {
      score += 15;
      factors.push({ factor: 'industry_match', score: 15, detail: company.industry });
    }
    
    // 6. Company description quality (10 points)
    const desc = company.description || company.description_enriched || '';
    if (desc.length > 100) {
      score += 10;
      factors.push({ factor: 'description', score: 10, detail: 'Has description' });
    }
    
    // 7. Revenue data available (5 points)
    if (company.revenue_annual) {
      score += 5;
      factors.push({ factor: 'revenue', score: 5, detail: company.revenue_annual });
    }
    
    // Determine tier
    let tier = PYRAMID_TIERS.TIER_3;
    if (score >= PYRAMID_TIERS.TIER_1.score) {
      tier = PYRAMID_TIERS.TIER_1;
    } else if (score >= PYRAMID_TIERS.TIER_2.score) {
      tier = PYRAMID_TIERS.TIER_2;
    }
    
    return { score: Math.round(score), tier, factors };
  }

  /**
   * Search for companies in a specific vertical using Coresignal
   */
  async searchCompaniesInVertical(verticalKey, config) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Searching for: ${config.name}`);
    console.log(`   Target: ${config.targetCount} companies`);
    console.log(`   Employee range: ${config.targetEmployees.min}-${config.targetEmployees.max}`);
    console.log(`${'='.repeat(70)}\n`);
    
    const allCompanies = [];
    const seenIds = new Set();
    
    // Search with each industry using PREVIEW endpoint (returns full data, no collect needed)
    for (const industryTerm of config.industries.slice(0, 4)) {
      if (allCompanies.length >= config.targetCount) break;
      
      console.log(`   🔍 Searching industry: "${industryTerm}"...`);
      
      try {
        // Simple industry match query with employee count filter
        const query = {
          query: {
            bool: {
              must: [
                { match: { industry: industryTerm } }
              ],
              filter: [
                { range: { employees_count: { gte: config.targetEmployees.min, lte: config.targetEmployees.max } } }
              ]
            }
          }
        };
        
        // Use PREVIEW endpoint - returns full company data, no collect needed!
        const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl/preview?items_per_page=50', {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(query)
        });
        
        this.results.creditsUsed++;
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`   ⚠️ Search failed: ${response.status} - ${errorText.substring(0, 100)}`);
          continue;
        }
        
        const companies = await response.json();
        
        if (Array.isArray(companies) && companies.length > 0) {
          console.log(`   ✅ Found ${companies.length} companies with data`);
          
          // Process companies directly (preview gives us full data)
          for (const company of companies) {
            if (!company.company_name) continue;
            if (seenIds.has(company.id)) continue;
            
            seenIds.add(company.id);
            
            // Filter by employee count and USA
            const empCount = company.employees_count || 0;
            const country = (company.hq_country || '').toLowerCase();
            const isUSA = country.includes('united states') || country === 'us' || country === 'other' || !country;
            
            if (isUSA && empCount >= config.targetEmployees.min && empCount <= config.targetEmployees.max) {
              allCompanies.push(company);
              console.log(`   📋 Found: ${company.company_name} (${empCount} employees, ${company.hq_country || 'USA'})`);
            }
          }
        } else {
          console.log(`   ⚠️ No results for "${industryTerm}"`);
        }
        
        await this.delay(500);
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Score and rank companies
    const scoredCompanies = allCompanies.map(company => {
      const pyramidResult = this.calculatePyramidScore(company, config);
      return {
        ...company,
        verticalKey,
        industry: config.industry,
        pyramidScore: pyramidResult.score,
        pyramidTier: pyramidResult.tier.name,
        qualificationFactors: pyramidResult.factors
      };
    });
    
    // Sort by pyramid score (highest first)
    scoredCompanies.sort((a, b) => b.pyramidScore - a.pyramidScore);
    
    // Remove duplicates by domain
    const uniqueCompanies = [];
    const seenDomains = new Set();
    
    for (const company of scoredCompanies) {
      const domain = this.extractDomain(company.website);
      if (domain && !seenDomains.has(domain)) {
        seenDomains.add(domain);
        uniqueCompanies.push(company);
      } else if (!domain) {
        uniqueCompanies.push(company);
      }
    }
    
    console.log(`\n📊 Found ${uniqueCompanies.length} unique companies for ${config.name}`);
    console.log(`   Tier 1: ${uniqueCompanies.filter(c => c.pyramidTier === 'Top Tier (Ring 1)').length}`);
    console.log(`   Tier 2: ${uniqueCompanies.filter(c => c.pyramidTier === 'Middle Tier (Ring 2)').length}`);
    console.log(`   Tier 3: ${uniqueCompanies.filter(c => c.pyramidTier === 'Base Tier (Ring 3)').length}`);
    
    return uniqueCompanies.slice(0, config.targetCount);
  }

  /**
   * Collect company details from Coresignal
   */
  async collectCompanyDetails(companyId) {
    try {
      const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      this.results.creditsUsed++;
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if company already exists in database
   * Uses Coresignal field names: company_name, unique_domain
   */
  async companyExists(company) {
    const domain = this.extractDomain(company.website) || company.unique_domain;
    
    if (domain) {
      const existing = await prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          domain: { equals: domain, mode: 'insensitive' },
          deletedAt: null
        }
      });
      
      if (existing) return true;
    }
    
    // Coresignal uses company_name
    const companyName = company.company_name;
    if (companyName) {
      const existing = await prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          name: { equals: companyName, mode: 'insensitive' },
          deletedAt: null
        }
      });
      
      if (existing) return true;
    }
    
    return false;
  }

  /**
   * Add company to database
   */
  async addCompanyToDatabase(company) {
    // Use Coresignal field names: website, unique_domain
    const domain = this.extractDomain(company.website) || company.unique_domain;
    
    // Parse revenue - Coresignal uses revenue_annual
    let revenue = null;
    if (company.revenue_annual) {
      const match = String(company.revenue_annual).match(/[\d.]+/);
      if (match) {
        revenue = parseFloat(match[0]);
        if (String(company.revenue_annual).toLowerCase().includes('m')) {
          revenue *= 1000000;
        } else if (String(company.revenue_annual).toLowerCase().includes('b')) {
          revenue *= 1000000000;
        }
      }
    }
    
    try {
      await prisma.companies.create({
        data: {
          workspaceId: this.workspaceId,
          name: company.company_name, // Coresignal uses company_name
          website: company.website || (domain ? `https://${domain}` : null),
          domain: domain,
          linkedinUrl: company.linkedin_url,
          industry: company.industry,
          employeeCount: company.employees_count, // Coresignal uses employees_count
          revenue: revenue,
          description: company.description || company.description_enriched,
          city: company.hq_city,
          state: company.hq_state,
          country: company.hq_country || 'United States',
          mainSellerId: this.mainSellerId,
          status: 'ACTIVE',
          priority: 'MEDIUM',
          customFields: {
            vertical: company.verticalKey,
            pyramidScore: company.pyramidScore,
            pyramidTier: company.pyramidTier,
            qualificationFactors: company.qualificationFactors,
            coresignalId: company.id,
            source: 'coresignal_company_finder',
            addedAt: new Date().toISOString()
          }
        }
      });
      
      return true;
    } catch (error) {
      console.log(`   ⚠️ Failed to add ${company.company_name}: ${error.message}`);
      return false;
    }
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run the company finder for all verticals
   */
  async run() {
    console.log('\n' + '═'.repeat(70));
    console.log('   COMPANY FINDER FOR NOEL\'S VERTICALS');
    console.log('   Based on Jeb Blount\'s Prospecting Pyramid');
    console.log('═'.repeat(70) + '\n');
    
    await this.initialize();
    
    // Get current counts
    const currentCounts = await this.getCurrentCounts();
    console.log('📊 Current Company Counts:');
    for (const [vertical, count] of Object.entries(currentCounts)) {
      const config = VERTICAL_CONFIGS[vertical];
      if (config) {
        const needed = Math.max(0, config.targetCount - count);
        console.log(`   ${config.name}: ${count}/${config.targetCount} (need ${needed} more)`);
      }
    }
    console.log('');
    
    // Process each vertical
    for (const [verticalKey, config] of Object.entries(VERTICAL_CONFIGS)) {
      const currentCount = currentCounts[verticalKey] || 0;
      const needed = config.targetCount - currentCount;
      
      if (needed <= 0) {
        console.log(`✅ ${config.name}: Already has ${currentCount} companies (target: ${config.targetCount})`);
        continue;
      }
      
      console.log(`\n🎯 ${config.name}: Need ${needed} more companies`);
      
      // Search for companies
      const companies = await this.searchCompaniesInVertical(verticalKey, config);
      
      // Add new companies
      let added = 0;
      for (const company of companies) {
        if (added >= needed) break;
        
        const exists = await this.companyExists(company);
        if (exists) {
          console.log(`   ⏭️ Already exists: ${company.name}`);
          continue;
        }
        
        const success = await this.addCompanyToDatabase(company);
        if (success) {
          added++;
          console.log(`   ✅ Added (${added}/${needed}): ${company.name} [${company.pyramidTier}]`);
        }
        
        await this.delay(100);
      }
      
      this.results.byVertical[verticalKey] = {
        found: companies.length,
        added: added,
        target: config.targetCount,
        current: currentCount + added
      };
      this.results.totalFound += companies.length;
      this.results.totalAdded += added;
    }
    
    // Print summary
    this.printSummary();
    
    await prisma.$disconnect();
  }

  async getCurrentCounts() {
    const counts = {};
    
    for (const verticalKey of Object.keys(VERTICAL_CONFIGS)) {
      const config = VERTICAL_CONFIGS[verticalKey];
      
      const count = await prisma.companies.count({
        where: {
          workspaceId: this.workspaceId,
          mainSellerId: this.mainSellerId,
          deletedAt: null,
          OR: [
            { industry: { equals: config.industry, mode: 'insensitive' } },
            { customFields: { path: ['vertical'], equals: verticalKey } }
          ]
        }
      });
      
      counts[verticalKey] = count;
    }
    
    return counts;
  }

  printSummary() {
    console.log('\n' + '═'.repeat(70));
    console.log('   SUMMARY');
    console.log('═'.repeat(70));
    
    for (const [verticalKey, result] of Object.entries(this.results.byVertical)) {
      const config = VERTICAL_CONFIGS[verticalKey];
      console.log(`\n${config.name}:`);
      console.log(`   Found: ${result.found} companies`);
      console.log(`   Added: ${result.added} companies`);
      console.log(`   Current total: ${result.current}/${result.target}`);
    }
    
    console.log(`\n📊 Overall:`);
    console.log(`   Total found: ${this.results.totalFound}`);
    console.log(`   Total added: ${this.results.totalAdded}`);
    console.log(`   Credits used: ${this.results.creditsUsed}`);
    console.log('');
  }
}

// Run
const finder = new CompanyFinder();
finder.run().catch(console.error);
